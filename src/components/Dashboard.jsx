import { useEffect, useState, useCallback } from 'react'
import { EVM_CHAINS, BITCOIN_CHAIN } from '../lib/chains'
import { getEvmBalance, getBtcBalance } from '../lib/walletCore'
import AssetDetail from './AssetDetail'
import SendSheet from './SendSheet'
import ReceiveSheet from './ReceiveSheet'
import SettingsSheet from './SettingsSheet'

const PRICE_IDS = {
  ETH: 'ethereum',
  BNB: 'binancecoin',
  POL: 'matic-network',
  BTC: 'bitcoin',
}

function short(addr) {
  if (!addr) return ''
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

export default function Dashboard({ accounts, onLock, onDeleteVault, mnemonic, password, showToast }) {
  const chains = [...EVM_CHAINS, BITCOIN_CHAIN]
  const [balances, setBalances] = useState({})
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)
  const [detailChain, setDetailChain] = useState(null)
  const [sheet, setSheet] = useState(null) // 'send' | 'receive' | null
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  const addressFor = useCallback(
    (chain) => (chain.id === 'bitcoin' ? accounts.btc.address : accounts.evm.address),
    [accounts]
  )

  const loadBalances = useCallback(async () => {
    setLoading(true)
    const results = await Promise.all(
      chains.map(async (chain) => {
        try {
          const value =
            chain.id === 'bitcoin'
              ? await getBtcBalance(accounts.btc.address)
              : await getEvmBalance(chain, accounts.evm.address)
          return [chain.id, { value, error: null }]
        } catch (e) {
          return [chain.id, { value: null, error: e.message }]
        }
      })
    )
    setBalances(Object.fromEntries(results))
    setLoading(false)
  }, [accounts])

  useEffect(() => {
    loadBalances()
    // best-effort USD prices, never blocks the UI
    fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${Object.values(PRICE_IDS).join(
        ','
      )}&vs_currencies=usd`
    )
      .then((r) => r.json())
      .then((data) => {
        const bySymbol = {}
        for (const [sym, id] of Object.entries(PRICE_IDS)) {
          if (data[id]) bySymbol[sym] = data[id].usd
        }
        setPrices(bySymbol)
      })
      .catch(() => {})
  }, [loadBalances, refreshTick])

  const totalUsd = chains.reduce((sum, chain) => {
    const bal = balances[chain.id]?.value
    const price = prices[chain.symbol]
    if (bal != null && price != null) return sum + bal * price
    return sum
  }, 0)
  const haveAnyPrice = Object.keys(prices).length > 0

  function openAsset(chain) {
    setDetailChain(chain)
  }

  function closeSheet() {
    setSheet(null)
  }

  // --- Asset detail screen ---
  if (detailChain) {
    const bal = balances[detailChain.id]
    const price = prices[detailChain.symbol]
    const usd = bal?.value != null && price != null ? bal.value * price : null

    return (
      <>
        <AssetDetail
          chain={detailChain}
          address={addressFor(detailChain)}
          balance={bal?.value}
          usd={usd}
          loading={loading}
          onBack={() => setDetailChain(null)}
          onSend={() => setSheet('send')}
          onReceive={() => setSheet('receive')}
        />

        {sheet === 'send' && (
          <SendSheet
            chain={detailChain}
            accounts={accounts}
            balance={bal?.value}
            onClose={closeSheet}
            onSuccess={(msg) => {
              closeSheet()
              showToast(msg, 'success')
              setRefreshTick((t) => t + 1)
            }}
            showToast={showToast}
          />
        )}

        {sheet === 'receive' && (
          <ReceiveSheet
            chain={detailChain}
            address={addressFor(detailChain)}
            onClose={closeSheet}
            showToast={showToast}
          />
        )}
      </>
    )
  }

  // --- Asset list (home) screen ---
  return (
    <div className="stack">
      <div className="topbar">
        <div className="brand" style={{ padding: 0 }}>
          <div className="seal" style={{ width: 26, height: 26, fontSize: 13 }}>
            V
          </div>
          <span className="brand-name" style={{ fontSize: 16 }}>
            Vault
          </span>
        </div>
        <button className="btn-ghost" onClick={() => setSettingsOpen(true)} aria-label="Настройки">
          ⚙
        </button>
      </div>

      <div className="balance-hero">
        <div className="label">Портфель</div>
        <div className="amount">
          {haveAnyPrice ? <>${totalUsd.toFixed(2)}</> : <small>оценка недоступна</small>}
        </div>
      </div>

      <div className="section-label">Активы — нажмите, чтобы открыть</div>
      <div className="ledger card" style={{ padding: 8 }}>
        {chains.map((chain) => {
          const bal = balances[chain.id]
          const price = prices[chain.symbol]
          const usd = bal?.value != null && price != null ? bal.value * price : null
          return (
            <button key={chain.id} className="ledger-row" onClick={() => openAsset(chain)}>
              <div className="chip" style={{ background: chain.color }}>
                {chain.symbol.slice(0, 3)}
              </div>
              <div className="ledger-info">
                <div className="name">{chain.name}</div>
                <div className="addr">{short(addressFor(chain))}</div>
              </div>
              <div className="ledger-bal">
                {loading ? (
                  <div className="spinner" style={{ marginLeft: 'auto' }} />
                ) : bal?.error ? (
                  <span style={{ color: 'var(--danger)', fontSize: 12 }}>ошибка</span>
                ) : (
                  <>
                    <div>
                      {Number(bal.value).toFixed(bal.value < 1 ? 6 : 4)} {chain.symbol}
                    </div>
                    {usd != null && (
                      <div style={{ color: 'var(--text-low)', fontSize: 12 }}>${usd.toFixed(2)}</div>
                    )}
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <button
        className="btn btn-ghost"
        style={{ margin: '4px auto 0' }}
        onClick={() => setRefreshTick((t) => t + 1)}
      >
        ↻ Обновить балансы
      </button>

      {settingsOpen && (
        <SettingsSheet
          mnemonic={mnemonic}
          password={password}
          onClose={() => setSettingsOpen(false)}
          onLock={onLock}
          onDeleteVault={onDeleteVault}
          showToast={showToast}
        />
      )}
    </div>
  )
}
