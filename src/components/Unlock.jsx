import { useEffect, useState } from 'react'

export default function Unlock({
  onUnlock,
  onBiometricUnlock,
  biometricEnrolled,
  onResetVault,
  error,
  busy,
}) {
  const [pw, setPw] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(!biometricEnrolled)
  const [triedAuto, setTriedAuto] = useState(false)

  useEffect(() => {
    if (biometricEnrolled && !triedAuto) {
      setTriedAuto(true)
      onBiometricUnlock()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function submit(e) {
    e.preventDefault()
    onUnlock(pw)
  }

  if (!showPasswordForm) {
    return (
      <div className="stack">
        <div className="center">
          <div className="lock-icon" style={{ fontSize: 22 }}>
            👆
          </div>
          <h1 className="headline">С возвращением</h1>
          <p className="sub">
            {busy ? 'Ждём подтверждение…' : 'Разблокируйте кошелёк отпечатком или Face ID.'}
          </p>
          {error && <span className="error">{error}</span>}
        </div>
        <button className="btn btn-primary" onClick={onBiometricUnlock} disabled={busy}>
          {busy ? 'Проверка…' : 'Разблокировать по биометрии'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setShowPasswordForm(true)}
          disabled={busy}
        >
          Ввести пароль вместо этого
        </button>
      </div>
    )
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
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        {error && <span className="error">{error}</span>}
      </div>
      <button className="btn btn-primary" type="submit" disabled={!pw || busy}>
        {busy ? 'Проверка…' : 'Разблокировать'}
      </button>
      {biometricEnrolled && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowPasswordForm(false)}
          disabled={busy}
        >
          Разблокировать по биометрии
        </button>
      )}
      <button type="button" className="btn btn-ghost" onClick={onResetVault}>
        Забыли пароль? Восстановить по seed-фразе
      </button>
    </form>
  )
}
