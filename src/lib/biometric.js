// Biometric unlock using WebAuthn's platform authenticator + PRF extension.
//
// How it actually works (important for security reasoning):
// The seed phrase is, as before, encrypted with the user's password
// (AES-GCM + PBKDF2). Biometrics don't replace that. Instead, once enrolled,
// we ask the fingerprint/Face ID sensor (via a WebAuthn "platform
// authenticator") to compute a PRF (pseudo-random function) value that only
// it can compute, gated by the biometric check. We use that value as a key
// to encrypt/decrypt a *copy of the password*, stored locally. So unlocking
// with a fingerprint really does derive a hardware-backed key each time —
// the password is never stored in plaintext.
//
// If the browser/device doesn't support the PRF extension, we simply don't
// offer biometric unlock rather than fall back to something weaker.

import { encryptSecret, decryptSecret } from './crypto'

const BIOMETRIC_KEY = 'cw_biometric_v1'
const RP_NAME = 'Vault'

function bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}
function b64ToBuf(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer
}
function randomBytes(len) {
  return crypto.getRandomValues(new Uint8Array(len))
}

export async function isBiometricSupported() {
  if (!window.PublicKeyCredential) return false
  try {
    const platformOk = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    return !!platformOk
  } catch {
    return false
  }
}

export function isBiometricEnrolled() {
  return !!localStorage.getItem(BIOMETRIC_KEY)
}

export function removeBiometric() {
  localStorage.removeItem(BIOMETRIC_KEY)
}

async function derivePrfKey(assertion) {
  const results = assertion.getClientExtensionResults()
  const prfOutput = results?.prf?.results?.first
  if (!prfOutput) {
    throw new Error('Это устройство не поддерживает безопасную биометрическую разблокировку (PRF)')
  }
  return crypto.subtle.importKey('raw', prfOutput, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ])
}

// Enroll: create a platform-authenticator credential, immediately query its
// PRF output, and use it to wrap the current password.
export async function enrollBiometric(password) {
  const userId = randomBytes(16)
  const createChallenge = randomBytes(32)
  const prfSalt = randomBytes(32)

  const credential = await navigator.credentials.create({
    publicKey: {
      rp: { name: RP_NAME },
      user: { id: userId, name: 'vault-wallet', displayName: 'Vault Wallet' },
      challenge: createChallenge,
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256 fallback
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required',
      },
      extensions: { prf: {} },
      timeout: 60000,
    },
  })
  if (!credential) throw new Error('Не удалось создать биометрический ключ')

  const enabledPrf = credential.getClientExtensionResults()?.prf?.enabled
  if (!enabledPrf) {
    throw new Error('Это устройство не поддерживает безопасную биометрическую разблокировку (PRF)')
  }

  // Immediately fetch the PRF value via a get() against the credential we just made.
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      allowCredentials: [{ id: credential.rawId, type: 'public-key' }],
      userVerification: 'required',
      extensions: { prf: { eval: { first: prfSalt } } },
      timeout: 60000,
    },
  })

  const key = await derivePrfKey(assertion)
  const iv = randomBytes(12)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(password)
  )

  localStorage.setItem(
    BIOMETRIC_KEY,
    JSON.stringify({
      credentialId: bufToB64(credential.rawId),
      prfSalt: bufToB64(prfSalt),
      iv: bufToB64(iv),
      ciphertext: bufToB64(ciphertext),
    })
  )
}

// Unlock: prompt the sensor, re-derive the same PRF key, decrypt the password.
export async function unlockWithBiometric() {
  const raw = localStorage.getItem(BIOMETRIC_KEY)
  if (!raw) throw new Error('Биометрическая разблокировка не настроена')
  const stored = JSON.parse(raw)

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      allowCredentials: [{ id: b64ToBuf(stored.credentialId), type: 'public-key' }],
      userVerification: 'required',
      extensions: { prf: { eval: { first: b64ToBuf(stored.prfSalt) } } },
      timeout: 60000,
    },
  })

  const key = await derivePrfKey(assertion)
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBuf(stored.iv) },
    key,
    b64ToBuf(stored.ciphertext)
  )
  return new TextDecoder().decode(plainBuf)
}

// Re-export so callers only need this module for the full unlock chain.
export { encryptSecret, decryptSecret }
