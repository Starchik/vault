import { ethers } from 'ethers'
import { getEvmProvider } from './walletCore'
import { ERC20_ABI } from './tokens'

const API_BASE = 'https://apiv5.paraswap.io'
const NATIVE_PSEUDO_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

const ERC20_ABI_ALLOWANCE = [
  ...ERC20_ABI,
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
]

export function tokenAddressFor(chain, asset) {
  // asset: { kind: 'native' } or { kind: 'token', token: {address, decimals} }
  if (asset.kind === 'native') return NATIVE_PSEUDO_ADDRESS
  return asset.token.address
}

export function decimalsFor(chain, asset) {
  return asset.kind === 'native' ? 18 : asset.token.decimals
}

// Fetch a swap quote. amount is a human-readable string (e.g. "1.5").
export async function getSwapQuote(chain, fromAsset, toToken, amount, userAddress) {
  const srcToken = tokenAddressFor(chain, fromAsset)
  const srcDecimals = decimalsFor(chain, fromAsset)
  const destToken = toToken.kind === 'native' ? NATIVE_PSEUDO_ADDRESS : toToken.address
  const destDecimals = toToken.kind === 'native' ? 18 : toToken.decimals
  const srcAmount = ethers.parseUnits(String(amount), srcDecimals).toString()

  const params = new URLSearchParams({
    srcToken,
    destToken,
    srcDecimals: String(srcDecimals),
    destDecimals: String(destDecimals),
    amount: srcAmount,
    side: 'SELL',
    network: String(chain.chainId),
    userAddress,
  })

  const res = await fetch(`${API_BASE}/prices?${params.toString()}`)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Не удалось получить курс обмена (${res.status}). ${body.slice(0, 150)}`)
  }
  const data = await res.json()
  const priceRoute = data.priceRoute
  if (!priceRoute) throw new Error('Обмен для этой пары сейчас недоступен')

  const destAmount = Number(ethers.formatUnits(priceRoute.destAmount, destDecimals))
  const srcAmountNum = Number(amount)
  const rate = srcAmountNum > 0 ? destAmount / srcAmountNum : 0

  return { priceRoute, destAmount, rate, srcAmount, srcDecimals, destDecimals }
}

export async function needsApproval(chain, fromAsset, ownerAddress, amountRaw, tokenTransferProxy) {
  if (fromAsset.kind === 'native') return false
  const provider = getEvmProvider(chain)
  const contract = new ethers.Contract(fromAsset.token.address, ERC20_ABI_ALLOWANCE, provider)
  const allowance = await contract.allowance(ownerAddress, tokenTransferProxy)
  return allowance < BigInt(amountRaw)
}

export async function approveToken(chain, privateKey, tokenAddress, spender) {
  const provider = getEvmProvider(chain)
  const signer = new ethers.Wallet(privateKey, provider)
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI_ALLOWANCE, signer)
  const tx = await contract.approve(spender, ethers.MaxUint256)
  await tx.wait()
  return tx.hash
}

// Build + sign + send the actual swap transaction from a fetched priceRoute.
export async function executeSwap(chain, privateKey, fromAsset, toToken, quote, userAddress, slippageBps = 100) {
  const srcToken = tokenAddressFor(chain, fromAsset)
  const destToken = toToken.kind === 'native' ? NATIVE_PSEUDO_ADDRESS : toToken.address

  const body = {
    srcToken,
    destToken,
    srcAmount: quote.srcAmount,
    slippage: slippageBps,
    priceRoute: quote.priceRoute,
    userAddress,
    partner: 'vault-wallet',
    srcDecimals: quote.srcDecimals,
    destDecimals: quote.destDecimals,
  }

  const res = await fetch(`${API_BASE}/transactions/${chain.chainId}?ignoreChecks=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Обмен не удался (${res.status}). ${errBody.slice(0, 200)}`)
  }
  const txData = await res.json()

  const provider = getEvmProvider(chain)
  const signer = new ethers.Wallet(privateKey, provider)
  const tx = await signer.sendTransaction({
    to: txData.to,
    data: txData.data,
    value: txData.value ? BigInt(txData.value) : 0n,
  })
  return tx.hash
}

export { NATIVE_PSEUDO_ADDRESS }
