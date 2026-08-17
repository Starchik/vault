import Sparkline from './Sparkline'

function short(addr) {
  if (!addr) return ''
  return addr.slice(0, 10) + '…' + addr.slice(-6)
}

export default function AssetDetail({
  asset,
  address,
  balance,
  usd,
  price,
  loading,
  onBack,
  onSend,
  onReceive,
  onRemove,
}) {
  const change = price?.change24h
  const positive = change != null ? change >= 0 : true

  return (
    <div className="stack">
      <div className="topbar">
        <button className="back" onClick={onBack}>
          ← Все активы
        </button>
      </div>

      <div className="asset-hero">
        <div className="chip chip-lg" style={{ background: asset.color }}>
          {asset.symbol.slice(0, 3)}
        </div>
        <div className="asset-hero-name">{asset.name}</div>
        <div className="asset-hero-balance">
          {loading || balance == null ? (
            <div className="spinner" style={{ margin: '0 auto' }} />
          ) : (
            <>
              {Number(balance).toFixed(balance < 1 ? 6 : 4)} <small>{asset.symbol}</small>
            </>
          )}
        </div>
        {usd != null && <div className="asset-hero-usd">${usd.toFixed(2)}</div>}

        {price?.usd != null && (
          <div className="price-row">
            <span>${price.usd < 1 ? price.usd.toFixed(4) : price.usd.toFixed(2)}</span>
            {change != null && (
              <span className={positive ? 'price-up' : 'price-down'}>
                {positive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}% за 24ч
              </span>
            )}
          </div>
        )}

        {price?.sparkline?.length > 1 && (
          <div style={{ width: '100%', marginTop: 10 }}>
            <Sparkline data={price.sparkline} positive={positive} height={60} />
          </div>
        )}
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
        href={`${asset.chain.explorer}/address/${address}`}
        target="_blank"
        rel="noreferrer"
      >
        Смотреть в блокэксплорере ↗
      </a>

      {onRemove && (
        <button className="btn btn-ghost" style={{ margin: '10px auto 0', color: 'var(--danger)' }} onClick={onRemove}>
          Убрать из списка активов
        </button>
      )}
    </div>
  )
}
