import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'

export default function SetPassword({ onSubmit, onBack }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState('')

  function handleSubmit() {
    if (pw.length < 8) {
      setError('Пароль должен быть не короче 8 символов')
      return
    }
    if (pw !== pw2) {
      setError('Пароли не совпадают')
      return
    }
    onSubmit(pw)
  }

  return (
    <div className="stack">
      <div className="topbar">
        <button className="back" onClick={onBack}>
          <ArrowLeft size={15} /> Назад
        </button>
      </div>
      <h1 className="headline">Задайте пароль</h1>
      <p className="sub">
        Этот пароль шифрует ваш кошелёк в этом браузере. Он не отправляется никуда и не может
        быть восстановлен — только seed-фраза сможет вернуть доступ.
      </p>
      <div className="field">
        <label>Пароль</label>
        <input
          type="password"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value)
            setError('')
          }}
          autoFocus
        />
      </div>
      <div className="field">
        <label>Повторите пароль</label>
        <input
          type="password"
          value={pw2}
          onChange={(e) => {
            setPw2(e.target.value)
            setError('')
          }}
        />
        {error && <span className="error">{error}</span>}
      </div>
      <button className="btn btn-primary" onClick={handleSubmit} disabled={!pw || !pw2}>
        Создать кошелёк
      </button>
    </div>
  )
}
