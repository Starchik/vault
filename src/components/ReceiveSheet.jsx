import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function ReceiveSheet({ chain, address, onClose, showToast }) {
  const [qr, setQr] = useState('')

  useEffect(() => {
    QRCode.toDataURL(address, { margin: 1, width: 220, color: { dark: '#0b0f18' } })
      .then(setQr)
      .catch(() => setQr(''))
  }, [address])

  function copy() {
    navigator.clipboard.writeText(address)
    showToast('Адрес скопирован', 'success')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-chain-tag">
          <div className="chip" style={{ background: chain.color, width: 24, height: 24, fontSize: 10 }}>
            {chain.symbol.slice(0, 3)}
          </div>
          {chain.name}
        </div>
        <h2>Получить {chain.symbol}</h2>
        <div className="stack">
          {chain.id !== 'bitcoin' && (
            <span className="hint">Этот адрес подходит для любой EVM-сети (Ethereum, BSC, Polygon, Arbitrum…)</span>
          )}

          {qr && (
            <div className="qr-wrap">
              <img src={qr} alt="QR-код адреса" width={220} height={220} />
            </div>
          )}

          <div className="copy-row">
            <span>{address}</span>
            <button onClick={copy}>Копировать</button>
          </div>

          <div className="warn-box">
            Отправляйте на этот адрес только {chain.id === 'bitcoin' ? 'Bitcoin' : 'активы EVM-сетей'}.
            Средства, отправленные из другой экосистемы, могут быть утеряны безвозвратно.
          </div>
        </div>
      </div>
    </div>
  )
}
