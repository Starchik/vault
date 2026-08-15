function short(addr) {
  if (!addr) return ''
  return addr.slice(0, 10) + '…' + addr.slice(-6)
}

export default function AssetDetail({ chain, address, balance, usd, loading, onBack, onSend, onReceive }) {
  return (
    <div className="stack">
      <div className="topbar">
        <button className="back" onClick={onBack}>
          ← Все активы
        </button>
      </div>

      <div className="asset-hero">
        <div className="chip chip-lg" style={{ background: chain.color }}>
          {chain.symbol.slice(0, 3)}
        </div>
        <div className="asset-hero-name">{chain.name}</div>
        <div className="asset-hero-balance">
          {loading || balance == null ? (
            <div className="spinner" style={{ margin: '0 auto' }} />
          ) : (
            <>
              {Number(balance).toFixed(balance < 1 ? 6 : 4)} <small>{chain.symbol}</small>
            </>
          )}
        </div>
        {usd != null && <div className="asset-hero-usd">${usd.toFixed(2)}</div>}
      </div>

      <div className="action-row">
        <button className="btn btn-primary" onClick={onSend}>
          Отправить
        </button>
        <button className="btn btn-secondary" onClick={onReceive}>
          Получить
        </button>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div className="field" style={{ gap: 4 }}>
          <label>Ваш адрес</label>
          <div className="copy-row" style={{ background: 'transparent', border: 'none', padding: '4px 0' }}>
            <span>{short(address)}</span>
          </div>
        </div>
      </div>

      <a
        className="link center"
        style={{ margin: '4px auto 0' }}
        href={`${chain.explorer}/address/${address}`}
        target="_blank"
        rel="noreferrer"
      >
        Смотреть в блокэксплорере ↗
      </a>
    </div>
  )
}
