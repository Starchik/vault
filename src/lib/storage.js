const VAULT_KEY = 'cw_vault_v1'

export function hasVault() {
  return !!localStorage.getItem(VAULT_KEY)
}

export function saveVault(encryptedPayload) {
  localStorage.setItem(VAULT_KEY, JSON.stringify(encryptedPayload))
}

export function loadVault() {
  const raw = localStorage.getItem(VAULT_KEY)
  return raw ? JSON.parse(raw) : null
}

export function clearVault() {
  localStorage.removeItem(VAULT_KEY)
}

const TOKENS_KEY = 'cw_custom_tokens_v1'

// { [chainId]: [{ address, symbol, name, decimals }] }
export function loadCustomTokens() {
  try {
    const raw = localStorage.getItem(TOKENS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveCustomTokens(tokensByChain) {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokensByChain))
}

export function addCustomToken(chainId, token) {
  const all = loadCustomTokens()
  const list = all[chainId] || []
  if (list.some((t) => t.address.toLowerCase() === token.address.toLowerCase())) {
    return all // already added
  }
  all[chainId] = [...list, token]
  saveCustomTokens(all)
  return all
}

export function removeCustomToken(chainId, address) {
  const all = loadCustomTokens()
  const list = all[chainId] || []
  all[chainId] = list.filter((t) => t.address.toLowerCase() !== address.toLowerCase())
  saveCustomTokens(all)
  return all
}

const TESTNET_MODE_KEY = 'cw_testnet_mode_v1'

export function isTestnetMode() {
  return localStorage.getItem(TESTNET_MODE_KEY) === '1'
}

export function setTestnetMode(on) {
  if (on) localStorage.setItem(TESTNET_MODE_KEY, '1')
  else localStorage.removeItem(TESTNET_MODE_KEY)
}
