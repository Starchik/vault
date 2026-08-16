import { useEffect, useState } from 'react'
import {
  isBiometricSupported,
  isBiometricEnrolled,
  enrollBiometric,
  removeBiometric,
} from '../lib/biometric'

export default function SettingsSheet({ mnemonic, password, onClose, onLock, onDeleteVault, showToast }) {
  const [revealed, setRevealed] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [bioSupported, setBioSupported] = useState(false)
  const [bioEnrolled, setBioEnrolled] = useState(isBiometricEnrolled())
  const [bioBusy, setBioBusy] = useState(false)

  useEffect(() => {
    isBiometricSupported().then(setBioSupported)
  }, [])

  async function handleEnableBiometric() {
    setBioBusy(true)
    try {
      await enrollBiometric(password)
      setBioEnrolled(true)
      showToast('Биометрическая разблокировка включена', 'success')
    } catch (e) {
      showToast(e.message || 'Не удалось настроить биометрию', 'error')
    } finally {
      setBioBusy(false)
    }
  }

  function handleDisableBiometric() {
    removeBiometric()
    setBioEnrolled(false)
    showToast('Биометрическая разблокировка отключена')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Настройки</h2>
        <div className="stack">
          {bioSupported && (
            <div className="card" style={{ padding: 14 }}>
              <div className="toggle-row">
                <div>
                  <div className="name">Разблокировка по биометрии</div>
                  <div className="hint">Отпечаток пальца или Face ID вместо пароля</div>
                </div>
                {bioEnrolled ? (
                  <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={handleDisableBiometric}>
                    Отключить
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ width: 'auto' }}
                    onClick={handleEnableBiometric}
                    disabled={bioBusy}
                  >
                    {bioBusy ? 'Настройка…' : 'Включить'}
                  </button>
                )}
              </div>
            </div>
          )}

          {!revealed ? (
            <button className="btn btn-secondary" onClick={() => setRevealed(true)}>
              Показать seed-фразу
            </button>
          ) : (
            <div className="seed-grid">
              {mnemonic.split(' ').map((w, i) => (
                <div className="seed-chip" key={i}>
                  <span className="n">{i + 1}</span>
                  {w}
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-secondary" onClick={onLock}>
            Заблокировать кошелёк
          </button>

          {!confirmDelete ? (
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
              Удалить кошелёк из браузера
            </button>
          ) : (
            <div className="stack">
              <div className="warn-box">
                Это удалит зашифрованный кошелёк из этого браузера. Восстановить его можно
                только с помощью seed-фразы. Средства в блокчейне не затрагиваются.
              </div>
              <button className="btn btn-danger" onClick={onDeleteVault}>
                Да, удалить
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
