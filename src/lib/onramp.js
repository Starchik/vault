// Buying crypto with a card requires a licensed on-ramp partner (MoonPay,
// Transak, etc.) — a wallet app can't process card payments itself. This
// module builds the widget URL for whichever provider the user configures;
// without a key, the Buy screen shows sign-up instructions instead of a
// broken/fake purchase flow.
//
// A note on "Signature check failed" (MoonPay): some MoonPay accounts have
// mandatory URL signing enabled — the widget URL must carry an HMAC-SHA256
// signature made with your SECRET key. That key must never appear in
// client-side code (anyone viewing the page could read it and forge
// requests), so a purely static site like this one cannot satisfy that
// requirement without adding a small backend to do the signing server-side.
// Transak's widget, by contrast, works with just the public API key — no
// signing — which is why it's the default here.

export const ONRAMP_CONFIG = {
  // Get a free "Staging" API key at https://dashboard.transak.com — no
  // business verification needed to test with it. Paste it below.
  transakApiKey: '',
  // Set to false once you switch to a "Production" key (requires Transak's
  // business verification, same as any licensed on-ramp).
  transakStaging: true,

  // Optional: MoonPay as a second option. Only usable if your MoonPay
  // account has signed URLs turned OFF (Dashboard → Developers → API keys —
  // some accounts have a toggle there; if there is none, MoonPay requires
  // server-side signing and can't be used from a static site alone).
  moonpayApiKey: 'pk_test_R9RmT7XjlnYD6i6pEIymACLJVMf74yq8',
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
  return !!(ONRAMP_CONFIG.transakApiKey || ONRAMP_CONFIG.moonpayApiKey)
}

export function activeProvider() {
  return ONRAMP_CONFIG.transakApiKey ? 'transak' : ONRAMP_CONFIG.moonpayApiKey ? 'moonpay' : null
}

export function buildMoonpayUrl({ symbol, walletAddress }) {
  const currencyCode = MOONPAY_CURRENCY_MAP[symbol] || symbol.toLowerCase()
  const isTestKey = ONRAMP_CONFIG.moonpayApiKey.startsWith('pk_test_')
  const base = isTestKey ? 'https://buy-sandbox.moonpay.com' : 'https://buy.moonpay.com'
  const params = new URLSearchParams({
    apiKey: ONRAMP_CONFIG.moonpayApiKey,
    currencyCode,
    walletAddress,
    colorCode: '#c9a227',
  })
  return `${base}?${params.toString()}`
}

export function buildTransakUrl({ symbol, chainId, walletAddress }) {
  const base = ONRAMP_CONFIG.transakStaging
    ? 'https://staging-global.transak.com'
    : 'https://global.transak.com'
  const params = new URLSearchParams({
    apiKey: ONRAMP_CONFIG.transakApiKey,
    defaultCryptoCurrency: symbol,
    network: TRANSAK_NETWORK_MAP[chainId] || 'ethereum',
    walletAddress,
    themeColor: 'c9a227',
  })
  return `${base}?${params.toString()}`
}
