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
