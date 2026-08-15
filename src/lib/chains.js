// Network configuration. EVM chains share one address (same private key).
// Bitcoin uses its own derivation path and address format.

export const EVM_CHAINS = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
    explorer: 'https://etherscan.io',
    color: '#627EEA',
  },
  {
    id: 'bsc',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    chainId: 56,
    rpcUrl: 'https://bsc-rpc.publicnode.com',
    explorer: 'https://bscscan.com',
    color: '#F0B90B',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'POL',
    chainId: 137,
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    explorer: 'https://polygonscan.com',
    color: '#8247E5',
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    symbol: 'ETH',
    chainId: 42161,
    rpcUrl: 'https://arbitrum-one-rpc.publicnode.com',
    explorer: 'https://arbiscan.io',
    color: '#28A0F0',
  },
]

export const BITCOIN_CHAIN = {
  id: 'bitcoin',
  name: 'Bitcoin',
  symbol: 'BTC',
  explorer: 'https://blockstream.info',
  apiBase: 'https://blockstream.info/api',
  color: '#F7931A',
}

export const ALL_CHAINS = [...EVM_CHAINS, BITCOIN_CHAIN]
