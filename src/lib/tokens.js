import { ethers } from 'ethers'
import { getEvmProvider } from './walletCore'

export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
]

// A small curated set of well-known tokens per chain, so "add asset" has a
// one-tap list before falling back to "enter a contract address manually".
export const POPULAR_TOKENS = {
  ethereum: [
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
  ],
  bsc: [
    { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether USD', decimals: 18 },
    { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18 },
  ],
  polygon: [
    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  ],
  arbitrum: [
    { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  ],
  optimism: [
    { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  ],
  base: [
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  ],
  avalanche: [
    { address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  ],
}

export async function fetchTokenInfo(chain, address) {
  if (!ethers.isAddress(address)) throw new Error('Неверный адрес контракта')
  const provider = getEvmProvider(chain)
  const contract = new ethers.Contract(address, ERC20_ABI, provider)
  const [name, symbol, decimals] = await Promise.all([
    contract.name().catch(() => 'Unknown Token'),
    contract.symbol().catch(() => '???'),
    contract.decimals().catch(() => 18),
  ])
  return { address: ethers.getAddress(address), name, symbol, decimals: Number(decimals) }
}

export async function getTokenBalance(chain, tokenAddress, walletAddress) {
  const provider = getEvmProvider(chain)
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
  const [raw, decimals] = await Promise.all([
    contract.balanceOf(walletAddress),
    contract.decimals(),
  ])
  return Number(ethers.formatUnits(raw, decimals))
}

export async function estimateTokenTransferFee(chain, tokenAddress, fromAddress, toAddress, amount, decimals) {
  const provider = getEvmProvider(chain)
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
  const amountRaw = ethers.parseUnits(String(amount), decimals)
  const [gasLimit, feeData] = await Promise.all([
    contract.transfer.estimateGas(toAddress, amountRaw, { from: fromAddress }),
    provider.getFeeData(),
  ])
  const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n
  const feeWei = gasPrice * gasLimit
  return { feeEth: ethers.formatEther(feeWei) }
}

export async function sendTokenTransaction(chain, privateKey, tokenAddress, toAddress, amount, decimals) {
  const provider = getEvmProvider(chain)
  const signer = new ethers.Wallet(privateKey, provider)
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)
  const amountRaw = ethers.parseUnits(String(amount), decimals)
  const tx = await contract.transfer(toAddress, amountRaw)
  return tx.hash
}

// Best-effort USD price + 24h change for a token, by contract address.
export async function getTokenPrice(chain, tokenAddress) {
  if (!chain.coingeckoPlatform) return null
  const url = `https://api.coingecko.com/api/v3/simple/token_price/${chain.coingeckoPlatform}?contract_addresses=${tokenAddress}&vs_currencies=usd&include_24hr_change=true`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const entry = data[tokenAddress.toLowerCase()]
  if (!entry) return null
  return { usd: entry.usd, change24h: entry.usd_24h_change }
}
