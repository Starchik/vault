import { useState, useEffect, useMemo } from 'react'
import { ArrowDown, Search, ChevronDown } from 'lucide-react'
import { EVM_CHAINS } from '../lib/chains'
import { getEvmBalance } from '../lib/walletCore'
import { getTokenBalance } from '../lib/tokens'
import { searchTokens } from '../lib/tokenList'
import { getSwapQuote, needsApproval, approveToken, executeSwap, NATIVE_PSEUDO_ADDRESS } from '../lib/swap'

export default function SwapView({ accounts, customTokens, showToast }) {
  const [chain, setChain] = useState(EVM_CHAINS[0])
  const [fromAsset, setFromAsset] = useState({ kind: 'native' })
  const [toToken, setToToken] = useState(null)
  const [pickerFor, setPickerFor] = useState(null) // 'from' | 'to' | null
  const [amount, setAmount] = useState('')
  const [fromBalance, setFromBalance] = useState(null)
  const [quote, setQuote] = useState(null)
  const [quoting, setQuoting] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [swapping, setSwapping] = useState(false)

  const ownedTokens = customTokens[chain.id] || []

  const fromOptions = useMemo(
    () => [{ kind: 'native' }, ...ownedTokens.map((token) => ({ kind: 'token', token }))],
    [ownedTokens]
  )

  useEffect(() => {
    setFromAsset({ kind: 'native' })
    setToToken(null)
    setQuote(null)
    setAmount('')
  }, [chain])

  useEffect(() => {
    let cancelled = false
    setFromBalance(null)
    async function load() {
      try {
        const val =
          fromAsset.kind === 'native'
            ? await getEvmBalance(chain, accounts.evm.address)
            : await getTokenBalance(chain, fromAsset.token.address, accounts.evm.address)
        if (!cancelled) setFromBalance(val)
      } catch {
        if (!cancelled) setFromBalance(null)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [chain, fromAsset, accounts])

  useEffect(() => {
    setQuote(null)
    setQuoteError('')
    const amt = parseFloat(amount)
    if (!amt || amt <= 0 || !toToken) return
    const handle = setTimeout(async () => {
      setQuoting(true)
      try {
        const q = await getSwapQuote(chain, fromAsset, toToken, amount, accounts.evm.address)
        setQuote(q)
      } catch (e) {
        setQuoteError(e.message || 'Не удалось получить курс')
      } finally {
        setQuoting(false)
      }
    }, 500)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, toToken, fromAsset, chain])

  const fromSymbol = fromAsset.kind === 'native' ? chain.symbol : fromAsset.token.symbol
  const toSymbol = toToken ? (toToken.kind === 'native' ? chain.symbol : toToken.symbol) : null

  async function handleSwap() {
    setSwapping(true)
    try {
      const proxy = quote.priceRoute.tokenTransferProxy
      if (fromAsset.kind === 'token' && proxy) {
        const amountRaw = quote.srcAmount
        const needs = await needsApproval(chain, fromAsset, accounts.evm.address, amountRaw, proxy)
        if (needs) {
          showToast('Разрешаем контракту использовать токен…')
          await approveToken(chain, accounts.evm.privateKey, fromAsset.token.address, proxy)
        }
      }
      const hash = await executeSwap(
        chain,
        accounts.evm.privateKey,
        fromAsset,
        toToken,
        quote,
        accounts.evm.address
      )
      showToast(`Обмен отправлен: ${hash.slice(0, 10)}…${hash.slice(-6)}`, 'success')
      setAmount('')
      setQuote(null)
    } catch (e) {
      showToast(e.message || 'Обмен не удался', 'error')
    } finally {
      setSwapping(false)
    }
  }

  return (
    <div className="stack">
      <div className="topbar">
        <div className="brand" style={{ padding: 0 }}>
          <div className="seal" style={{ width: 26, height: 26, fontSize: 13 }}>
            V
          </div>
          <span className="brand-name" style={{ fontSize: 16 }}>
            Обмен
          </span>
        </div>
      </div>

      <div className="field">
        <label>Сеть</label>
        <select
          value={chain.id}
          onChange={(e) => setChain(EVM_CHAINS.find((c) => c.id === e.target.value))}
          style={selectStyle}
        >
          {EVM_CHAINS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="swap-box">
        <div className="swap-box-head">
          <span>Отдаёте</span>
          {fromBalance != null && (
            <button className="link" style={linkBtnStyle} onClick={() => setAmount(String(fromBalance))}>
              Баланс: {fromBalance.toFixed(6)}
            </button>
          )}
        </div>
        <div className="swap-box-row">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            inputMode="decimal"
          />
          <button className="asset-pill" onClick={() => setPickerFor('from')}>
            {fromSymbol} <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="swap-arrow">
        <ArrowDown size={16} />
      </div>

      <div className="swap-box">
        <div className="swap-box-head">
          <span>Получаете</span>
        </div>
        <div className="swap-box-row">
          <div className="swap-output">
            {quoting ? <div className="spinner" /> : quote ? quote.destAmount.toFixed(6) : '0.0'}
          </div>
          <button className="asset-pill" onClick={() => setPickerFor('to')}>
            {toSymbol || 'Выбрать'} <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {quoteError && <span className="error">{quoteError}</span>}
      {quote && (
        <div className="fee-box">
          <span>Курс</span>
          <span>
            1 {fromSymbol} ≈ {quote.rate.toFixed(6)} {toSymbol}
          </span>
        </div>
      )}

      <button
        className="btn btn-primary"
        disabled={!quote || swapping}
        onClick={handleSwap}
        style={{ marginTop: 8 }}
      >
        {swapping ? 'Обмениваем…' : 'Обменять'}
      </button>

      <p className="sub" style={{ marginTop: 10, fontSize: 12.5 }}>
        Обмен выполняется через открытый агрегатор ParaSwap напрямую из вашего кошелька — курс и
        комиссия сети формируются на его стороне, Vault ничего не хранит и не удерживает.
      </p>

      {pickerFor && (
        <TokenPicker
          chain={chain}
          mode={pickerFor}
          fromOptions={pickerFor === 'from' ? fromOptions : null}
          onPick={(picked) => {
            if (pickerFor === 'from') setFromAsset(picked)
            else setToToken(picked)
            setPickerFor(null)
          }}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  )
}

const selectStyle = {
  background: 'var(--ink-900)',
  border: '1px solid var(--line)',
  borderRadius: 9,
  padding: '13px 14px',
  color: 'var(--text-hi)',
  fontSize: 15,
}
const linkBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5 }

function TokenPicker({ chain, mode, fromOptions, onPick, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (fromOptions) return // "from" uses owned assets, no search needed
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    setSearching(true)
    const handle = setTimeout(async () => {
      const matches = await searchTokens(chain, q)
      setResults(matches)
      setSearching(false)
    }, 350)
    return () => clearTimeout(handle)
  }, [query, chain, fromOptions])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2>{mode === 'from' ? 'Отдаёте' : 'Получаете'}</h2>
        <div className="stack">
          {fromOptions ? (
            <div className="ledger">
              {fromOptions.map((opt, i) => (
                <button
                  key={i}
                  className="ledger-row"
                  onClick={() => onPick(opt)}
                >
                  <div className="chip" style={{ background: chain.color }}>
                    {(opt.kind === 'native' ? chain.symbol : opt.token.symbol).slice(0, 3)}
                  </div>
                  <div className="ledger-info">
                    <div className="name">{opt.kind === 'native' ? chain.symbol : opt.token.symbol}</div>
                    <div className="addr">{opt.kind === 'native' ? chain.name : opt.token.name}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="search-box">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Название или тикер"
                  autoFocus
                />
              </div>
              <button
                className="ledger-row"
                onClick={() => onPick({ kind: 'native' })}
              >
                <div className="chip" style={{ background: chain.color }}>
                  {chain.symbol.slice(0, 3)}
                </div>
                <div className="ledger-info">
                  <div className="name">{chain.symbol}</div>
                  <div className="addr">{chain.name}</div>
                </div>
              </button>
              {searching && (
                <div className="center" style={{ padding: 10 }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
              )}
              {!searching && results.length > 0 && (
                <div className="ledger" style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {results.map((token) => (
                    <button
                      key={token.address}
                      className="ledger-row"
                      onClick={() => onPick({ kind: 'token', ...token })}
                    >
                      <div className="chip" style={{ background: chain.color }}>
                        {token.symbol.slice(0, 3)}
                      </div>
                      <div className="ledger-info">
                        <div className="name">{token.symbol}</div>
                        <div className="addr">{token.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
