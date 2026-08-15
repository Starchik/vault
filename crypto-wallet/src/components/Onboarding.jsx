import { useState } from 'react'
import { generateMnemonic, isValidMnemonic } from '../lib/walletCore'

export default function Onboarding({ onCreate, onImport }) {
  const [mode, setMode] = useState('start') // start | import
  const [phrase, setPhrase] = useState('')
  const [error, setError] = useState('')

  function handleCreate() {
    const mnemonic = generateMnemonic()
    onCreate(mnemonic)
  }

  function handleImport() {
    const cleaned = phrase.trim().toLowerCase().replace(/\s+/g, ' ')
    if (!isValidMnemonic(cleaned)) {
      setError('Неверная seed-фраза. Проверьте слова и их порядок (12 или 24 слова).')
      return
    }
    onImport(cleaned)
  }

  if (mode === 'import') {
    return (
      <div className="stack">
        <div className="topbar">
          <button className="back" onClick={() => setMode('start')}>
            ← Назад
          </button>
        </div>
        <h1 className="headline">Импорт кошелька</h1>
        <p className="sub">
          Введите вашу seed-фразу (12 или 24 слова через пробел). Она будет зашифрована
          паролем и сохранена только в этом браузере.
        </p>
        <div className="field">
          <label>Seed-фраза</label>
          <textarea
            rows={4}
            value={phrase}
            onChange={(e) => {
              setPhrase(e.target.value)
              setError('')
            }}
            placeholder="word1 word2 word3 ..."
            autoFocus
          />
          {error && <span className="error">{error}</span>}
        </div>
        <button className="btn btn-primary" onClick={handleImport} disabled={!phrase.trim()}>
          Продолжить
        </button>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="center" style={{ padding: '10px 0 6px' }}>
        <div className="seal" style={{ margin: '0 auto 14px' }}>
          V
        </div>
        <h1 className="headline">Ваш кошелёк.
          <br />
          Ваши ключи.</h1>
        <p className="sub">
          Vault хранит приватные ключи и seed-фразу локально, в зашифрованном виде, в этом
          браузере. Мы никогда не получаем доступ к вашим средствам.
        </p>
      </div>
      <button className="btn btn-primary" onClick={handleCreate}>
        Создать новый кошелёк
      </button>
      <button className="btn btn-secondary" onClick={() => setMode('import')}>
        У меня уже есть seed-фраза
      </button>
    </div>
  )
}
