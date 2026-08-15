import { useState } from 'react'

export default function Unlock({ onUnlock, onResetVault, error, busy }) {
  const [pw, setPw] = useState('')

  function submit(e) {
    e.preventDefault()
    onUnlock(pw)
  }

  return (
    <form className="stack" onSubmit={submit}>
      <div className="center">
        <div className="lock-icon">🔒</div>
        <h1 className="headline">С возвращением</h1>
        <p className="sub">Введите пароль, чтобы разблокировать кошелёк.</p>
      </div>
      <div className="field">
        <label>Пароль</label>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoFocus
        />
        {error && <span className="error">{error}</span>}
      </div>
      <button className="btn btn-primary" type="submit" disabled={!pw || busy}>
        {busy ? 'Проверка…' : 'Разблокировать'}
      </button>
      <button type="button" className="btn btn-ghost" onClick={onResetVault}>
        Забыли пароль? Восстановить по seed-фразе
      </button>
    </form>
  )
}
