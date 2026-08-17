// Network configuration. EVM chains share one address (same private key).
// Bitcoin uses its own derivation path and address format.
//
// coingeckoId: used for native-coin price lookups (/simple/price).
// coingeckoPlatform: used for token price/lookup by contract address
// (/simple/token_price/{platform}).

export const EVM_CHAINS = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
    explorer: 'https://etherscan.io',
    color: '#627EEA',
    coingeckoId: 'ethereum',
    coingeckoPlatform: 'ethereum',
  },
  {
    id: 'bsc',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    chainId: 56,
    rpcUrl: 'https://bsc-rpc.publicnode.com',
    explorer: 'https://bscscan.com',
    color: '#F0B90B',
    coingeckoId: 'binancecoin',
    coingeckoPlatform: 'binance-smart-chain',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'POL',
    chainId: 137,
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    explorer: 'https://polygonscan.com',
    color: '#8247E5',
    coingeckoId: 'matic-network',
    coingeckoPlatform: 'polygon-pos',
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    symbol: 'ETH',
    chainId: 42161,
    rpcUrl: 'https://arbitrum-one-rpc.publicnode.com',
    explorer: 'https://arbiscan.io',
    color: '#28A0F0',
    coingeckoId: 'ethereum',
    coingeckoPlatform: 'arbitrum-one',
  },
  {
    id: 'optimism',
    name: 'Optimism',
    symbol: 'ETH',
    chainId: 10,
    rpcUrl: 'https://optimism-rpc.publicnode.com',
    explorer: 'https://optimistic.etherscan.io',
    color: '#FF0420',
    coingeckoId: 'ethereum',
    coingeckoPlatform: 'optimistic-ethereum',
  },
  {
    id: 'base',
    name: 'Base',
    symbol: 'ETH',
    chainId: 8453,
    rpcUrl: 'https://base-rpc.publicnode.com',
    explorer: 'https://basescan.org',
    color: '#0052FF',
    coingeckoId: 'ethereum',
    coingeckoPlatform: 'base',
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    symbol: 'AVAX',
    chainId: 43114,
    rpcUrl: 'https://avalanche-c-chain-rpc.publicnode.com',
    explorer: 'https://snowtrace.io',
    color: '#E84142',
    coingeckoId: 'avalanche-2',
    coingeckoPlatform: 'avalanche',
  },
]

export const BITCOIN_CHAIN = {
  id: 'bitcoin',
  name: 'Bitcoin',
  symbol: 'BTC',
  explorer: 'https://blockstream.info',
  apiBase: 'https://blockstream.info/api',
  color: '#F7931A',
  coingeckoId: 'bitcoin',
}

export const ALL_CHAINS = [...EVM_CHAINS, BITCOIN_CHAIN]

export function findChain(id) {
  return ALL_CHAINS.find((c) => c.id === id)
}
