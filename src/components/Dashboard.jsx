import { useEffect, useState, useCallback, useMemo } from 'react'
import { Settings, RefreshCw, Plus } from 'lucide-react'
import { EVM_CHAINS, BITCOIN_CHAIN } from '../lib/chains'
import { getEvmBalance, getBtcBalance } from '../lib/walletCore'
import { getTokenBalance, getTokenPrice } from '../lib/tokens'
import { getNativeMarketData } from '../lib/prices'
import { addCustomToken, removeCustomToken } from '../lib/storage'
import AssetDetail from './AssetDetail'
import SendSheet from './SendSheet'
import ReceiveSheet from './ReceiveSheet'
import SettingsSheet from './SettingsSheet'
import AddAssetSheet from './AddAssetSheet'
import Sparkline from './Sparkline'

function short(addr) {
  if (!addr) return ''
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

export default function Dashboard({ accounts, onLock, onDeleteVault, mnemonic, password, showToast, customTokens, setCustomTokens }) {
  const chains = [...EVM_CHAINS, BITCOIN_CHAIN]
  const [balances, setBalances] = useState({})
  const [marketData, setMarketData] = useState({}) // by coingeckoId (native)
  const [tokenPrices, setTokenPrices] = useState({}) // by asset key (token)
  const [loading, setLoading] = useState(true)
  const [detailKey, setDetailKey] = useState(null)
  const [sheet, setSheet] = useState(null) // 'send' | 'receive' | null
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [addAssetOpen, setAddAssetOpen] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  // Unified list: native coins for every chain, plus any tokens the user added.
  const assets = useMemo(() => {
    const list = chains.map((chain) => ({
      key: chain.id,
      kind: 'native',
      chain,
      symbol: chain.symbol,
      name: chain.name,
      color: chain.color,
    }))
    for (const chain of EVM_CHAINS) {
      for (const token of customTokens[chain.id] || []) {
        list.push({
          key: `${chain.id}:${token.address}`,
          kind: 'token',
          chain,
          token,
          symbol: token.symbol,
          name: `${token.name} · ${chain.name}`,
          color: chain.color,
        })
      }
    }
    return list
  }, [customTokens])

  const addressFor = useCallback(
    (asset) => (asset.chain.id === 'bitcoin' ? accounts.btc.address : accounts.evm.address),
    [accounts]
  )

  const loadBalances = useCallback(async () => {
    setLoading(true)
    const results = await Promise.all(
      assets.map(async (asset) => {
        try {
          let value
          if (asset.kind === 'token') {
            value = await getTokenBalance(asset.chain, asset.token.address, accounts.evm.address)
          } else if (asset.chain.id === 'bitcoin') {
            value = await getBtcBalance(accounts.btc.address)
          } else {
            value = await getEvmBalance(asset.chain, accounts.evm.address)
          }
          return [asset.key, { value, error: null }]
        } catch (e) {
          return [asset.key, { value: null, error: e.message }]
        }
      })
    )
    setBalances(Object.fromEntries(results))
    setLoading(false)
  }, [assets, accounts])

  useEffect(() => {
    loadBalances()

    const nativeIds = chains.map((c) => c.coingeckoId)
    getNativeMarketData(nativeIds).then(setMarketData)

    const tokenAssets = assets.filter((a) => a.kind === 'token')
    Promise.all(
      tokenAssets.map(async (a) => {
        const price = await getTokenPrice(a.chain, a.token.address).catch(() => null)
        return [a.key, price]
      })
    ).then((pairs) => setTokenPrices(Object.fromEntries(pairs.filter(([, p]) => p))))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadBalances, refreshTick, customTokens])

  function priceFor(asset) {
    if (asset.kind === 'token') return tokenPrices[asset.key] || null
    const md = marketData[asset.chain.coingeckoId]
    return md ? { usd: md.usd, change24h: md.change24h, sparkline: md.sparkline } : null
  }

  const totalUsd = assets.reduce((sum, asset) => {
    const bal = balances[asset.key]?.value
    const price = priceFor(asset)
    if (bal != null && price?.usd != null) return sum + bal * price.usd
    return sum
  }, 0)
  const haveAnyPrice = assets.some((a) => priceFor(a)?.usd != null)

  function handleAddToken(chain, token) {
    const updated = addCustomToken(chain.id, token)
    setCustomTokens(updated)
  }

  function handleRemoveToken(asset) {
    const updated = removeCustomToken(asset.chain.id, asset.token.address)
    setCustomTokens(updated)
    setDetailKey(null)
    showToast(`${asset.symbol} убран из списка`)
  }

  function closeSheet() {
    setSheet(null)
  }

  const detailAsset = assets.find((a) => a.key === detailKey)

  // --- Asset detail screen ---
  if (detailAsset) {
    const bal = balances[detailAsset.key]
    const price = priceFor(detailAsset)
    const usd = bal?.value != null && price?.usd != null ? bal.value * price.usd : null

    return (
      <>
        <AssetDetail
          asset={detailAsset}
          address={addressFor(detailAsset)}
          balance={bal?.value}
          usd={usd}
          price={price}
          loading={loading}
          onBack={() => setDetailKey(null)}
          onSend={() => setSheet('send')}
          onReceive={() => setSheet('receive')}
          onRemove={detailAsset.kind === 'token' ? () => handleRemoveToken(detailAsset) : null}
        />

        {sheet === 'send' && (
          <SendSheet
            asset={detailAsset}
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
            asset={detailAsset}
            address={addressFor(detailAsset)}
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
        <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Настройки">
          <Settings size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="balance-hero">
        <div className="label">Портфель</div>
        <div className="amount">
          {haveAnyPrice ? <>${totalUsd.toFixed(2)}</> : <small>оценка недоступна</small>}
        </div>
      </div>

      <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Активы — нажмите, чтобы открыть</span>
        <button className="link" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setAddAssetOpen(true)}>
          <Plus size={14} strokeWidth={2.5} /> Добавить
        </button>
      </div>

      <div className="ledger card" style={{ padding: 8 }}>
        {assets.map((asset) => {
          const bal = balances[asset.key]
          const price = priceFor(asset)
          const usd = bal?.value != null && price?.usd != null ? bal.value * price.usd : null
          const change = price?.change24h
          const positive = change != null ? change >= 0 : true
          return (
            <button key={asset.key} className="ledger-row" onClick={() => setDetailKey(asset.key)}>
              <div className="chip" style={{ background: asset.color }}>
                {asset.symbol.slice(0, 3)}
              </div>
              <div className="ledger-info">
                <div className="name">{asset.symbol}</div>
                <div className="addr">{asset.name}</div>
              </div>
              {price?.sparkline?.length > 1 && (
                <div style={{ width: 56, flexShrink: 0 }}>
                  <Sparkline data={price.sparkline} positive={positive} height={28} />
                </div>
              )}
              <div className="ledger-bal">
                {bal == null ? (
                  <div className="spinner" style={{ marginLeft: 'auto' }} />
                ) : bal.error ? (
                  <span style={{ color: 'var(--danger)', fontSize: 12 }}>ошибка</span>
                ) : (
                  <>
                    <div>
                      {Number(bal.value).toFixed(bal.value < 1 ? 6 : 4)} {asset.symbol}
                    </div>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', fontSize: 12 }}>
                      {usd != null && <span style={{ color: 'var(--text-low)' }}>${usd.toFixed(2)}</span>}
                      {change != null && (
                        <span style={{ color: positive ? 'var(--verdigris)' : 'var(--danger)' }}>
                          {positive ? '+' : ''}
                          {change.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <button
        className="btn btn-ghost"
        style={{ margin: '4px auto 0', display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => setRefreshTick((t) => t + 1)}
      >
        <RefreshCw size={14} strokeWidth={2} /> Обновить балансы
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

      {addAssetOpen && (
        <AddAssetSheet
          existingAddresses={Object.fromEntries(
            Object.entries(customTokens).map(([id, list]) => [id, list.map((t) => t.address)])
          )}
          onAdd={handleAddToken}
          onClose={() => setAddAssetOpen(false)}
          showToast={showToast}
        />
      )}
    </div>
  )
}
