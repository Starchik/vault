import { useState } from 'react'

export default function SettingsSheet({ mnemonic, onClose, onLock, onDeleteVault }) {
  const [revealed, setRevealed] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Настройки</h2>
        <div className="stack">
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
