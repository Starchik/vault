import { useState } from 'react'
import { ExternalLink, CreditCard } from 'lucide-react'
import { EVM_CHAINS, BITCOIN_CHAIN } from '../lib/chains'
import { ONRAMP_CONFIG, isOnrampConfigured, buildMoonpayUrl, buildTransakUrl } from '../lib/onramp'

const BUY_ASSETS = [
  ...EVM_CHAINS.map((c) => ({ symbol: c.symbol, chainId: c.id, name: c.name, color: c.color })),
  { symbol: BITCOIN_CHAIN.symbol, chainId: BITCOIN_CHAIN.id, name: BITCOIN_CHAIN.name, color: BITCOIN_CHAIN.color },
]

export default function BuyView({ accounts, testnet }) {
  const [selected, setSelected] = useState(BUY_ASSETS[0])
  const configured = isOnrampConfigured()
  const isTestKey = ONRAMP_CONFIG.moonpayApiKey.startsWith('pk_test_')

  function addressFor(chainId) {
    return chainId === 'bitcoin' ? accounts.btc.address : accounts.evm.address
  }

  function openOnramp() {
    const walletAddress = addressFor(selected.chainId)
    const url = ONRAMP_CONFIG.moonpayApiKey
      ? buildMoonpayUrl({ symbol: selected.symbol, walletAddress })
      : buildTransakUrl({ symbol: selected.symbol, chainId: selected.chainId, walletAddress })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (testnet) {
    return (
      <div className="stack">
        <div className="topbar">
          <div className="brand" style={{ padding: 0 }}>
            <div className="seal" style={{ width: 26, height: 26, fontSize: 13 }}>
              V
            </div>
            <span className="brand-name" style={{ fontSize: 16 }}>
              Купить
            </span>
          </div>
        </div>
        <div className="warn-box" style={{ marginTop: 20 }}>
          Покупка за карту недоступна в тестовой сети — переключитесь на основную сеть в
          Настройках. Тестовые монеты можно получить бесплатно через кран на карточке актива.
        </div>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="topbar">
        <div className="brand" style={{ padding: 0 }}>
          <div className="seal" style={{ width: 26, height: 26, fontSize: 13 }}>
            V
          </div>
          <span className="brand-name" style={{ fontSize: 16 }}>
            Купить
          </span>
        </div>
      </div>

      <div className="center" style={{ padding: '14px 0 6px' }}>
        <div className="lock-icon">
          <CreditCard size={20} />
        </div>
        <h1 className="headline" style={{ fontSize: 22 }}>
          Купить криптовалюту
        </h1>
        <p className="sub">Оплата картой через партнёра — средства поступят прямо на ваш адрес.</p>
      </div>

      {configured && isTestKey && (
        <div className="testnet-banner">Тестовый режим MoonPay — реальные деньги не списываются</div>
      )}

      <div className="section-label">Выберите актив</div>
      <div className="ledger card" style={{ padding: 8 }}>
        {BUY_ASSETS.map((a) => (
          <button
            key={a.chainId}
            className="ledger-row"
            onClick={() => setSelected(a)}
            style={{ background: selected.chainId === a.chainId ? 'var(--ink-700)' : 'none', borderRadius: 8 }}
          >
            <div className="chip" style={{ background: a.color }}>
              {a.symbol.slice(0, 3)}
            </div>
            <div className="ledger-info">
              <div className="name">{a.symbol}</div>
              <div className="addr">{a.name}</div>
            </div>
          </button>
        ))}
      </div>

      {configured ? (
        <button
          className="btn btn-primary"
          style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={openOnramp}
        >
          Купить {selected.symbol} <ExternalLink size={15} />
        </button>
      ) : (
        <div className="warn-box" style={{ marginTop: 8 }}>
          Покупка за карту работает через лицензированного партнёра (MoonPay или Transak) —
          кошелёк сам платежи не обрабатывает. Чтобы включить эту кнопку, зарегистрируйтесь как
          бизнес на{' '}
          <a className="link" href="https://dashboard.moonpay.com" target="_blank" rel="noreferrer">
            dashboard.moonpay.com
          </a>{' '}
          (бесплатно) и вставьте свой публичный ключ в <code>src/lib/onramp.js</code>.
        </div>
      )}
    </div>
  )
}
