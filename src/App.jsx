import { useEffect, useRef, useState } from 'react'
import Onboarding from './components/Onboarding'
import BackupSeed from './components/BackupSeed'
import SetPassword from './components/SetPassword'
import Unlock from './components/Unlock'
import Dashboard from './components/Dashboard'
import Toast from './components/Toast'
import { encryptSecret, decryptSecret } from './lib/crypto'
import { hasVault, saveVault, loadVault, clearVault } from './lib/storage'
import { deriveAllAccounts } from './lib/walletCore'

export default function App() {
  const [screen, setScreen] = useState(() => (hasVault() ? 'unlock' : 'onboarding'))
  const [pendingMnemonic, setPendingMnemonic] = useState(null)
  const [pendingIsImport, setPendingIsImport] = useState(false)
  const [session, setSession] = useState(null) // { mnemonic, accounts }
  const [unlockError, setUnlockError] = useState('')
  const [unlockBusy, setUnlockBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  function showToast(message, type = '') {
    setToast({ message, type })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  function startCreate(mnemonic) {
    setPendingMnemonic(mnemonic)
    setPendingIsImport(false)
    setScreen('backup')
  }

  function startImport(mnemonic) {
    setPendingMnemonic(mnemonic)
    setPendingIsImport(true)
    setScreen('set-password')
  }

  async function finishSetup(password) {
    const encrypted = await encryptSecret(pendingMnemonic, password)
    saveVault(encrypted)
    const accounts = deriveAllAccounts(pendingMnemonic)
    setSession({ mnemonic: pendingMnemonic, accounts })
    setPendingMnemonic(null)
    setScreen('dashboard')
  }

  async function handleUnlock(password) {
    setUnlockBusy(true)
    setUnlockError('')
    try {
      const vault = loadVault()
      const mnemonic = await decryptSecret(vault, password)
      const accounts = deriveAllAccounts(mnemonic)
      setSession({ mnemonic, accounts })
      setScreen('dashboard')
    } catch (e) {
      setUnlockError(e.message || 'Не удалось разблокировать')
    } finally {
      setUnlockBusy(false)
    }
  }

  function handleLock() {
    setSession(null)
    setUnlockError('')
    setScreen('unlock')
  }

  function handleDeleteVault() {
    clearVault()
    setSession(null)
    setScreen('onboarding')
  }

  return (
    <div className="app-shell">
      {screen !== 'dashboard' && (
        <div className="brand">
          <div className="seal">V</div>
          <span className="brand-name">
            <b>Vault</b>
          </span>
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: screen === 'dashboard' ? 'flex-start' : 'center',
        }}
      >
        {screen === 'onboarding' && <Onboarding onCreate={startCreate} onImport={startImport} />}

        {screen === 'backup' && pendingMnemonic && (
          <BackupSeed
            mnemonic={pendingMnemonic}
            onConfirm={() => setScreen('set-password')}
            onBack={() => setScreen('onboarding')}
          />
        )}

        {screen === 'set-password' && pendingMnemonic && (
          <SetPassword
            onSubmit={finishSetup}
            onBack={() => setScreen(pendingIsImport ? 'onboarding' : 'backup')}
          />
        )}

        {screen === 'unlock' && (
          <Unlock
            onUnlock={handleUnlock}
            onResetVault={() => {
              clearVault()
              setScreen('onboarding')
            }}
            error={unlockError}
            busy={unlockBusy}
          />
        )}

        {screen === 'dashboard' && session && (
          <Dashboard
            accounts={session.accounts}
            mnemonic={session.mnemonic}
            onLock={handleLock}
            onDeleteVault={handleDeleteVault}
            showToast={showToast}
          />
        )}
      </div>

      <Toast toast={toast} />
    </div>
  )
}
