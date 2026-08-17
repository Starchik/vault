import { useEffect, useState, useMemo, useRef } from 'react'
import { Search } from 'lucide-react'
import { EVM_CHAINS } from '../lib/chains'
import { POPULAR_TOKENS, fetchTokenInfo } from '../lib/tokens'
import { searchTokens } from '../lib/tokenList'

export default function AddAssetSheet({ existingAddresses, onAdd, onClose, showToast }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null) // null = show "popular", array = search results
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef(null)

  const popular = useMemo(
    () =>
      EVM_CHAINS.flatMap((chain) => (POPULAR_TOKENS[chain.id] || []).map((token) => ({ chain, token }))),
    []
  )

  useEffect(() => {
    clearTimeout(debounceRef.current)
    const q = query.trim()
    if (!q) {
      setResults(null)
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const perChain = await Promise.all(
        EVM_CHAINS.map(async (chain) => {
          const matches = await searchTokens(chain, q)
          return matches.map((token) => ({ chain, token }))
        })
      )
      setResults(perChain.flat().slice(0, 60))
      setSearching(false)
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  const isAdded = (chainId, address) =>
    (existingAddresses[chainId] || []).some((a) => a.toLowerCase() === address.toLowerCase())

  function addToken(chain, token) {
    onAdd(chain, token)
    showToast(`${token.symbol} добавлен`, 'success')
    onClose()
  }

  const shown = results ?? popular

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Добавить актив</h2>
        <div className="stack">
          <div className="search-box">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Название или тикер, например USDT"
              autoFocus
            />
          </div>

          {results === null && (
            <div className="section-label" style={{ margin: '2px 2px 0' }}>
              Популярные токены
            </div>
          )}
          {searching && (
            <div className="center" style={{ padding: '10px 0' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          )}

          {!searching && shown.length === 0 && results !== null && (
            <p className="sub" style={{ margin: '6px 2px' }}>
              Ничего не найдено. Попробуйте другой тикер или добавьте по адресу контракта ниже.
            </p>
          )}

          {!searching && shown.length > 0 && (
            <div className="ledger" style={{ gap: 2, maxHeight: 320, overflowY: 'auto' }}>
              {shown.map(({ chain, token }) => {
                const added = isAdded(chain.id, token.address)
                return (
                  <button
                    key={`${chain.id}:${token.address}`}
                    className="ledger-row"
                    disabled={added}
                    onClick={() => addToken(chain, token)}
                    style={{ opacity: added ? 0.4 : 1 }}
                  >
                    <div className="chip" style={{ background: chain.color }}>
                      {token.symbol.slice(0, 3)}
                    </div>
                    <div className="ledger-info">
                      <div className="name">{token.symbol}</div>
                      <div className="addr">
                        {token.name} · {chain.name}
                      </div>
                    </div>
                    <div className="ledger-bal">
                      {added ? <span style={{ fontSize: 12 }}>добавлен</span> : '+'}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <ManualAddressForm existingAddresses={existingAddresses} onAdd={addToken} />
        </div>
      </div>
    </div>
  )
}

function ManualAddressForm({ existingAddresses, onAdd }) {
  const [open, setOpen] = useState(false)
  const [chain, setChain] = useState(EVM_CHAINS[0])
  const [address, setAddress] = useState('')
  const [looking, setLooking] = useState(false)
  const [found, setFound] = useState(null)
  const [error, setError] = useState('')

  const already =
    found && (existingAddresses[chain.id] || []).some((a) => a.toLowerCase() === found.address.toLowerCase())

  async function lookup() {
    setError('')
    setFound(null)
    if (!address.trim()) return
    setLooking(true)
    try {
      const info = await fetchTokenInfo(chain, address.trim())
      setFound(info)
    } catch (e) {
      setError(e.message || 'Не удалось найти токен по этому адресу')
    } finally {
      setLooking(false)
    }
  }

  if (!open) {
    return (
      <button className="link center" style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }} onClick={() => setOpen(true)}>
        Не нашли токен? Добавить по адресу контракта
      </button>
    )
  }

  return (
    <div className="stack" style={{ marginTop: 6 }}>
      <div className="section-label" style={{ margin: '2px 2px 0' }}>
        Добавить по адресу контракта
      </div>
      <div className="field">
        <label>Сеть</label>
        <select
          value={chain.id}
          onChange={(e) => {
            setChain(EVM_CHAINS.find((c) => c.id === e.target.value))
            setFound(null)
            setError('')
          }}
          style={{
            background: 'var(--ink-900)',
            border: '1px solid var(--line)',
            borderRadius: 9,
            padding: '13px 14px',
            color: 'var(--text-hi)',
            fontSize: 15,
          }}
        >
          {EVM_CHAINS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <input
          value={address}
          onChange={(e) => {
            setAddress(e.target.value)
            setFound(null)
            setError('')
          }}
          placeholder="0x..."
        />
        {error && <span className="error">{error}</span>}
      </div>

      {!found ? (
        <button className="btn btn-secondary" onClick={lookup} disabled={!address.trim() || looking}>
          {looking ? 'Ищем токен…' : 'Найти токен'}
        </button>
      ) : (
        <div className="stack">
          <div className="card" style={{ padding: 14 }}>
            <div className="toggle-row">
              <div>
                <div className="name">{found.symbol}</div>
                <div className="hint">{found.name}</div>
              </div>
              <div className="chip" style={{ background: chain.color }}>
                {found.symbol.slice(0, 3)}
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => onAdd(chain, found)} disabled={already}>
            {already ? 'Уже добавлен' : 'Добавить'}
          </button>
        </div>
      )}
    </div>
  )
}
