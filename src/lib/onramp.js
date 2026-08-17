// Buying crypto with a card requires a licensed on-ramp partner (MoonPay,
// Transak, etc.) — a wallet app can't process card payments itself. This
// module builds the widget URL for whichever provider the user configures;
// without a key, the Buy screen shows sign-up instructions instead of a
// broken/fake purchase flow.

export const ONRAMP_CONFIG = {
  // Get a free publishable key at https://dashboard.moonpay.com (sign up as
  // a business — no cost to obtain the key itself). Paste it below.
  moonpayApiKey: '',
  // Or use Transak instead: https://dashboard.transak.com
  transakApiKey: '',
}

const MOONPAY_CURRENCY_MAP = {
  ETH: 'eth',
  BNB: 'bnb_bsc',
  POL: 'polygon',
  AVAX: 'avax_cchain',
  BTC: 'btc',
  USDT: 'usdt',
  USDC: 'usdc',
}

const TRANSAK_NETWORK_MAP = {
  ethereum: 'ethereum',
  bsc: 'bsc',
  polygon: 'polygon',
  arbitrum: 'arbitrum',
  optimism: 'optimism',
  base: 'base',
  avalanche: 'avaxcchain',
  bitcoin: 'mainnet',
}

export function isOnrampConfigured() {
  return !!(ONRAMP_CONFIG.moonpayApiKey || ONRAMP_CONFIG.transakApiKey)
}

export function buildMoonpayUrl({ symbol, walletAddress }) {
  const currencyCode = MOONPAY_CURRENCY_MAP[symbol] || symbol.toLowerCase()
  const params = new URLSearchParams({
    apiKey: ONRAMP_CONFIG.moonpayApiKey,
    currencyCode,
    walletAddress,
    colorCode: '#c9a227',
  })
  return `https://buy.moonpay.com?${params.toString()}`
}

export function buildTransakUrl({ symbol, chainId, walletAddress }) {
  const params = new URLSearchParams({
    apiKey: ONRAMP_CONFIG.transakApiKey,
    defaultCryptoCurrency: symbol,
    network: TRANSAK_NETWORK_MAP[chainId] || 'ethereum',
    walletAddress,
    themeColor: 'c9a227',
  })
  return `https://global.transak.com?${params.toString()}`
}
