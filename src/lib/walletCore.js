import { ethers } from 'ethers'
import * as bip39 from 'bip39'
import { BIP32Factory } from 'bip32'
// asm.js build (no WASM) — avoids a WASM-instantiation bug seen with
// tiny-secp256k1 under Vite's dependency pre-bundling.
import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs'
import * as bitcoin from 'bitcoinjs-lib'
import { ECPairFactory } from 'ecpair'
import { EVM_CHAINS, BITCOIN_CHAIN, BITCOIN_TESTNET_CHAIN } from './chains'

const bip32 = BIP32Factory(ecc)
const ECPair = ECPairFactory(ecc)
bitcoin.initEccLib(ecc)

const EVM_PATH = "m/44'/60'/0'/0/0"

export function generateMnemonic() {
  return bip39.generateMnemonic(128) // 12 words
}

export function isValidMnemonic(phrase) {
  return bip39.validateMnemonic(phrase.trim().toLowerCase())
}

export function isValidEvmPrivateKey(key) {
  try {
    new ethers.Wallet(key.startsWith('0x') ? key : '0x' + key)
    return true
  } catch {
    return false
  }
}

// --- EVM ---

export function deriveEvmAccount(mnemonic) {
  const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, EVM_PATH)
  return { address: wallet.address, privateKey: wallet.privateKey }
}

export function getEvmProvider(chain) {
  return new ethers.JsonRpcProvider(chain.rpcUrl, chain.chainId)
}

export async function getEvmBalance(chain, address) {
  const provider = getEvmProvider(chain)
  const balance = await provider.getBalance(address)
  return Number(ethers.formatEther(balance))
}

export async function estimateEvmFee(chain, toAddress, amountEth) {
  const provider = getEvmProvider(chain)
  const feeData = await provider.getFeeData()
  const gasLimit = 21000n
  const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n
  const feeWei = gasPrice * gasLimit
  return { feeEth: Number(ethers.formatEther(feeWei)), gasLimit, feeData }
}

export async function sendEvmTransaction(chain, privateKey, toAddress, amountEth) {
  const provider = getEvmProvider(chain)
  const signer = new ethers.Wallet(privateKey, provider)
  const tx = await signer.sendTransaction({
    to: toAddress,
    value: ethers.parseEther(amountEth),
  })
  return tx.hash
}

export async function getEvmHistory(chain, address) {
  // Public RPCs don't expose full history without an indexer/API key.
  // We surface a link to the block explorer instead of fake data.
  return { explorerUrl: `${chain.explorer}/address/${address}` }
}

// --- Bitcoin ---

const BTC_PATH_MAINNET = "m/84'/0'/0'/0/0" // native segwit (bech32)
const BTC_PATH_TESTNET = "m/84'/1'/0'/0/0" // BIP44 testnet coin type

function btcNetworkFor(btcChain) {
  return btcChain.id === 'bitcoin-testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
}

export function deriveBtcAccount(mnemonic, btcChain = BITCOIN_CHAIN) {
  const network = btcNetworkFor(btcChain)
  const path = btcChain.id === 'bitcoin-testnet' ? BTC_PATH_TESTNET : BTC_PATH_MAINNET
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const root = bip32.fromSeed(seed, network)
  const child = root.derivePath(path)
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(child.publicKey),
    network,
  })
  return { address, privateKeyWIF: child.toWIF(network) }
}

async function btcFetch(btcChain, path) {
  const res = await fetch(`${btcChain.apiBase}${path}`)
  if (!res.ok) throw new Error(`Blockstream API: ${res.status}`)
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function getBtcBalance(address, btcChain = BITCOIN_CHAIN) {
  const info = await btcFetch(btcChain, `/address/${address}`)
  const sats =
    info.chain_stats.funded_txo_sum -
    info.chain_stats.spent_txo_sum +
    (info.mempool_stats.funded_txo_sum - info.mempool_stats.spent_txo_sum)
  return sats / 1e8
}

export async function getBtcHistory(address, btcChain = BITCOIN_CHAIN) {
  return { explorerUrl: `${btcChain.explorer}/address/${address}` }
}

async function getBtcFeeRate(btcChain) {
  const fees = await btcFetch(btcChain, '/fee-estimates')
  return Math.ceil(fees['3'] || fees['6'] || 5) // sat/vB, target ~3 blocks
}

export async function estimateBtcFee(address, amountBtc, btcChain = BITCOIN_CHAIN) {
  const utxos = await btcFetch(btcChain, `/address/${address}/utxo`)
  const feeRate = await getBtcFeeRate(btcChain)
  // rough vbytes for 1-2 inputs, 2 outputs, native segwit
  const estVbytes = utxos.length * 68 + 2 * 31 + 11
  const feeSats = Math.ceil(estVbytes * feeRate)
  return { feeSats, feeBtc: feeSats / 1e8, feeRate, utxos }
}

export async function sendBtcTransaction(privateKeyWIF, fromAddress, toAddress, amountBtc, btcChain = BITCOIN_CHAIN) {
  const network = btcNetworkFor(btcChain)
  const keyPair = ECPair.fromWIF(privateKeyWIF, network)
  const utxos = await btcFetch(btcChain, `/address/${fromAddress}/utxo`)
  if (!utxos.length) throw new Error('Нет доступных UTXO (пустой баланс)')

  const feeRate = await getBtcFeeRate(btcChain)
  const amountSats = Math.round(amountBtc * 1e8)

  const { address: p2wpkhAddress, output } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(keyPair.publicKey),
    network,
  })

  const psbt = new bitcoin.Psbt({ network })
  let inputSum = 0
  const sorted = [...utxos].sort((a, b) => b.value - a.value)
  const selected = []
  for (const utxo of sorted) {
    selected.push(utxo)
    inputSum += utxo.value
    const estVbytes = selected.length * 68 + 2 * 31 + 11
    const estFee = Math.ceil(estVbytes * feeRate)
    if (inputSum >= amountSats + estFee) break
  }

  const vbytes = selected.length * 68 + 2 * 31 + 11
  const fee = Math.ceil(vbytes * feeRate)
  if (inputSum < amountSats + fee) {
    throw new Error('Недостаточно средств с учётом комиссии сети')
  }

  for (const utxo of selected) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: { script: output, value: utxo.value },
    })
  }

  psbt.addOutput({ address: toAddress, value: amountSats })
  const change = inputSum - amountSats - fee
  if (change > 546) {
    psbt.addOutput({ address: p2wpkhAddress, value: change })
  }

  for (let i = 0; i < selected.length; i++) {
    psbt.signInput(i, keyPair)
  }
  psbt.finalizeAllInputs()

  const txHex = psbt.extractTransaction().toHex()
  const res = await fetch(`${btcChain.apiBase}/tx`, {
    method: 'POST',
    body: txHex,
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Broadcast failed: ${errText}`)
  }
  return await res.text() // txid
}

// --- Address book of all accounts derived from one mnemonic ---

export function deriveAllAccounts(mnemonic) {
  const evm = deriveEvmAccount(mnemonic)
  const btc = deriveBtcAccount(mnemonic, BITCOIN_CHAIN)
  const btcTestnet = deriveBtcAccount(mnemonic, BITCOIN_TESTNET_CHAIN)
  return { evm, btc, btcTestnet }
}

export { EVM_CHAINS, BITCOIN_CHAIN }
