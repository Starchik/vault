import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'

export default function BackupSeed({ mnemonic, onConfirm, onBack }) {
  const [confirmed, setConfirmed] = useState(false)
  const words = mnemonic.split(' ')

  return (
    <div className="stack">
      <div className="topbar">
        <button className="back" onClick={onBack}>
          <ArrowLeft size={15} /> Назад
        </button>
      </div>
      <h1 className="headline">Сохраните seed-фразу</h1>
      <p className="sub">
        Это единственный способ восстановить кошелёк. Запишите слова по порядку и храните в
        надёжном офлайн-месте. Никому её не сообщайте.
      </p>

      <div className="seed-grid">
        {words.map((w, i) => (
          <div className="seed-chip" key={i}>
            <span className="n">{i + 1}</span>
            {w}
          </div>
        ))}
      </div>

      <div className="warn-box">
        Любой человек с этой фразой получит полный доступ к вашим средствам. Vault не хранит
        её на серверах и не сможет восстановить её за вас.
      </div>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        Я сохранил(а) seed-фразу в надёжном месте
      </label>

      <button className="btn btn-primary" disabled={!confirmed} onClick={onConfirm}>
        Продолжить
      </button>
    </div>
  )
}
