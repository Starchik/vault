import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { EVM_CHAINS, BITCOIN_CHAIN } from '../lib/chains'
import { ONRAMP_CONFIG, isOnrampConfigured, activeProvider, buildMoonpayUrl, buildTransakUrl } from '../lib/onramp'

const BUY_ASSETS = [
  ...EVM_CHAINS.map((c) => ({ symbol: c.symbol, chainId: c.id, name: c.name, color: c.color })),
  { symbol: BITCOIN_CHAIN.symbol, chainId: BITCOIN_CHAIN.id, name: BITCOIN_CHAIN.name, color: BITCOIN_CHAIN.color },
]

// General homepages / public buy pages only — no API keys, no partner
// integration, no signup on our side. The user buys as an ordinary customer
// and then sends (or manually enters) the crypto to their own address, same
// as a transfer from any other wallet.
//
// The "card" group are direct-purchase consumer sites (MoonPay, Transak's
// own site) — usually no persistent account needed, just a card and the
// address you paste in yourself. The "exchange" group needs a regular
// trading-account signup first, but tends to have lower fees for larger
// amounts.
const CARD_ONRAMPS = [
  { name: 'MoonPay', url: 'https://www.moonpay.com/buy' },
  { name: 'Transak', url: 'https://transak.com' },
]

const EXCHANGES = [
  { name: 'Binance', url: 'https://www.binance.com' },
  { name: 'Coinbase', url: 'https://www.coinbase.com' },
  { name: 'Kraken', url: 'https://www.kraken.com' },
]

export default function BuyView({ accounts, testnet, showToast }) {
  const [selected, setSelected] = useState(BUY_ASSETS[0])
  const [qr, setQr] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const configured = isOnrampConfigured()
  const provider = activeProvider()
  const isMoonpayTestKey = ONRAMP_CONFIG.moonpayApiKey.startsWith('pk_test_')

  function addressFor(chainId) {
    return chainId === 'bitcoin' ? accounts.btc.address : accounts.evm.address
  }
  const address = addressFor(selected.chainId)

  useEffect(() => {
    QRCode.toDataURL(address, { margin: 1, width: 200, color: { dark: '#0b0f18' } })
      .then(setQr)
      .catch(() => setQr(''))
  }, [address])

  function copyAddress() {
    navigator.clipboard.writeText(address)
    showToast('Адрес скопирован', 'success')
  }

  function openOnramp() {
    const url =
      provider === 'transak'
        ? buildTransakUrl({ symbol: selected.symbol, chainId: selected.chainId, walletAddress: address })
        : buildMoonpayUrl({ symbol: selected.symbol, walletAddress: address })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (testnet) {
    return (
      <div className="stack">
        <Header />
        <div className="warn-box" style={{ marginTop: 20 }}>
          Покупка недоступна в тестовой сети — переключитесь на основную сеть в Настройках.
          Тестовые монеты можно получить бесплатно через кран на карточке актива.
        </div>
      </div>
    )
  }

  return (
    <div className="stack">
      <Header />

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

      <div className="card" style={{ padding: 18, marginTop: 4 }}>
        <p className="sub" style={{ margin: '0 0 12px' }}>
          Купите {selected.symbol} где угодно и выведите на адрес ниже. Это обычный перевод,
          без какого-либо партнёрства с нашей стороны — скопируйте адрес перед покупкой.
        </p>

        {qr && (
          <div className="qr-wrap">
            <img src={qr} alt="QR-код адреса" width={200} height={200} />
          </div>
        )}
        <div className="copy-row">
          <span>{address}</span>
          <button onClick={copyAddress}>Копировать</button>
        </div>
      </div>

      <div className="section-label">Быстрая покупка картой (без аккаунта)</div>
      <div className="ledger card" style={{ padding: 8 }}>
        {CARD_ONRAMPS.map((ex) => (
          <a
            key={ex.name}
            className="ledger-row"
            href={ex.url}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <div className="chip" style={{ background: 'var(--ink-700)', color: 'var(--brass-hi)' }}>
              {ex.name.slice(0, 1)}
            </div>
            <div className="ledger-info">
              <div className="name">{ex.name}</div>
              <div className="addr">Введёте адрес вручную на их сайте</div>
            </div>
            <ExternalLink size={15} style={{ color: 'var(--text-low)' }} />
          </a>
        ))}
      </div>

      <div className="section-label">Если уже есть аккаунт на бирже</div>
      <div className="ledger card" style={{ padding: 8 }}>
        {EXCHANGES.map((ex) => (
          <a
            key={ex.name}
            className="ledger-row"
            href={ex.url}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <div className="chip" style={{ background: 'var(--ink-700)', color: 'var(--brass-hi)' }}>
              {ex.name.slice(0, 1)}
            </div>
            <div className="ledger-info">
              <div className="name">{ex.name}</div>
            </div>
            <ExternalLink size={15} style={{ color: 'var(--text-low)' }} />
          </a>
        ))}
      </div>

      <button
        className="btn btn-ghost"
        style={{ margin: '10px auto 0', display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => setAdvancedOpen((v) => !v)}
      >
        С автоматической доставкой на адрес (нужна ваша регистрация у провайдера)
        {advancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {advancedOpen && (
        <div className="stack" style={{ marginTop: 4 }}>
          {provider === 'transak' && ONRAMP_CONFIG.transakStaging && (
            <div className="testnet-banner">Тестовый режим Transak (staging) — реальные деньги не списываются</div>
          )}
          {provider === 'moonpay' && isMoonpayTestKey && (
            <div className="testnet-banner">Тестовый режим MoonPay — реальные деньги не списываются</div>
          )}
          {provider === 'moonpay' && (
            <div className="warn-box">
              Если аккаунт MoonPay требует подпись ссылки («Signature check failed»), эта кнопка
              не сработает без отдельного сервера для подписи.
            </div>
          )}
          {configured ? (
            <button
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={openOnramp}
            >
              Купить {selected.symbol} с доставкой на адрес <ExternalLink size={15} />
            </button>
          ) : (
            <div className="warn-box">
              Этот вариант доставляет купленную крипту прямо на ваш адрес без ручного перевода —
              но провайдер (Transak/MoonPay) требует регистрации партнёра, пусть и бесплатной для
              теста. Ключ добавляется в <code>src/lib/onramp.js</code>.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Header() {
  return (
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
  )
}
