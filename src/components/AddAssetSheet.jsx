import { useState } from 'react'
import { EVM_CHAINS } from '../lib/chains'
import { POPULAR_TOKENS, fetchTokenInfo } from '../lib/tokens'

export default function AddAssetSheet({ existingAddresses, onAdd, onClose, showToast }) {
  const [chain, setChain] = useState(EVM_CHAINS[0])
  const [customAddress, setCustomAddress] = useState('')
  const [looking, setLooking] = useState(false)
  const [found, setFound] = useState(null)
  const [error, setError] = useState('')

  const popular = POPULAR_TOKENS[chain.id] || []
  const already = (address) =>
    (existingAddresses[chain.id] || []).some(
      (a) => a.toLowerCase() === address.toLowerCase()
    )

  function addPopular(token) {
    onAdd(chain, token)
    showToast(`${token.symbol} добавлен`, 'success')
    onClose()
  }

  async function lookupCustom() {
    setError('')
    setFound(null)
    if (!customAddress.trim()) return
    setLooking(true)
    try {
      const info = await fetchTokenInfo(chain, customAddress.trim())
      setFound(info)
    } catch (e) {
      setError(e.message || 'Не удалось найти токен по этому адресу')
    } finally {
      setLooking(false)
    }
  }

  function addCustom() {
    onAdd(chain, found)
    showToast(`${found.symbol} добавлен`, 'success')
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Добавить актив</h2>
        <div className="stack">
          <div className="field">
            <label>Сеть</label>
            <select
              value={chain.id}
              onChange={(e) => {
                setChain(EVM_CHAINS.find((c) => c.id === e.target.value))
                setFound(null)
                setError('')
                setCustomAddress('')
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

          {popular.length > 0 && (
            <>
              <div className="section-label" style={{ margin: '2px 2px 0' }}>
                Популярные токены
              </div>
              <div className="ledger" style={{ gap: 2 }}>
                {popular.map((t) => (
                  <button
                    key={t.address}
                    className="ledger-row"
                    disabled={already(t.address)}
                    onClick={() => addPopular(t)}
                    style={{ opacity: already(t.address) ? 0.4 : 1 }}
                  >
                    <div className="chip" style={{ background: chain.color }}>
                      {t.symbol.slice(0, 3)}
                    </div>
                    <div className="ledger-info">
                      <div className="name">{t.symbol}</div>
                      <div className="addr">{t.name}</div>
                    </div>
                    <div className="ledger-bal">
                      {already(t.address) ? <span style={{ fontSize: 12 }}>добавлен</span> : '+'}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="section-label" style={{ margin: '10px 2px 0' }}>
            Или по адресу контракта
          </div>
          <div className="field">
            <input
              value={customAddress}
              onChange={(e) => {
                setCustomAddress(e.target.value)
                setFound(null)
                setError('')
              }}
              placeholder="0x..."
            />
            {error && <span className="error">{error}</span>}
          </div>

          {!found ? (
            <button
              className="btn btn-secondary"
              onClick={lookupCustom}
              disabled={!customAddress.trim() || looking}
            >
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
              <button
                className="btn btn-primary"
                onClick={addCustom}
                disabled={already(found.address)}
              >
                {already(found.address) ? 'Уже добавлен' : 'Добавить'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
