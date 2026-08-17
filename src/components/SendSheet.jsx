import { useState, useEffect } from 'react'
import { estimateEvmFee, sendEvmTransaction, estimateBtcFee, sendBtcTransaction } from '../lib/walletCore'
import { estimateTokenTransferFee, sendTokenTransaction } from '../lib/tokens'
import { ethers } from 'ethers'

export default function SendSheet({ asset, accounts, balance, onClose, onSuccess, showToast }) {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [fee, setFee] = useState(null)
  const [feeError, setFeeError] = useState('')
  const [sending, setSending] = useState(false)
  const [step, setStep] = useState('form') // form | review

  const { chain, token } = asset
  const isBtc = chain.id === 'bitcoin'
  const isToken = asset.kind === 'token'

  useEffect(() => {
    setFee(null)
    setFeeError('')
  }, [asset.key])

  function validRecipient() {
    if (isBtc) return to.trim().length > 10
    try {
      return ethers.isAddress(to.trim())
    } catch {
      return false
    }
  }

  async function handleReview() {
    setFeeError('')
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    try {
      if (isBtc) {
        const est = await estimateBtcFee(accounts.btc.address, amt)
        setFee({ amount: est.feeBtc, symbol: 'BTC' })
      } else if (isToken) {
        const est = await estimateTokenTransferFee(
          chain,
          token.address,
          accounts.evm.address,
          to.trim(),
          amount,
          token.decimals
        )
        setFee({ amount: est.feeEth, symbol: chain.symbol })
      } else {
        const est = await estimateEvmFee(chain, to.trim(), amount)
        setFee({ amount: est.feeEth, symbol: chain.symbol })
      }
      setStep('review')
    } catch (e) {
      setFeeError(e.message || 'Не удалось оценить комиссию')
    }
  }

  async function handleConfirm() {
    setSending(true)
    try {
      let txId
      if (isBtc) {
        txId = await sendBtcTransaction(
          accounts.btc.privateKeyWIF,
          accounts.btc.address,
          to.trim(),
          parseFloat(amount)
        )
      } else if (isToken) {
        txId = await sendTokenTransaction(
          chain,
          accounts.evm.privateKey,
          token.address,
          to.trim(),
          amount,
          token.decimals
        )
      } else {
        txId = await sendEvmTransaction(chain, accounts.evm.privateKey, to.trim(), amount)
      }
      onSuccess(`Отправлено: ${txId.slice(0, 10)}…${txId.slice(-6)}`)
    } catch (e) {
      showToast(e.message || 'Транзакция не удалась', 'error')
      setStep('form')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-chain-tag">
          <div className="chip" style={{ background: asset.color, width: 24, height: 24, fontSize: 10 }}>
            {asset.symbol.slice(0, 3)}
          </div>
          {chain.name}
        </div>
        <h2>Отправить {asset.symbol}</h2>

        {step === 'form' && (
          <div className="stack">
            <span className="hint">
              Баланс: {balance != null ? `${Number(balance).toFixed(6)} ${asset.symbol}` : '…'}
            </span>
            <div className="field">
              <label>Адрес получателя</label>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder={isBtc ? 'bc1...' : '0x...'}
              />
              {to && !validRecipient() && <span className="error">Неверный формат адреса</span>}
            </div>
            <div className="field">
              <label>Сумма ({asset.symbol})</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                inputMode="decimal"
              />
              {balance != null && (
                <button
                  className="btn-ghost"
                  style={{ alignSelf: 'flex-start', padding: 0, fontSize: 12.5 }}
                  onClick={() => setAmount(String(balance))}
                >
                  Использовать максимум
                </button>
              )}
            </div>
            {isToken && (
              <span className="hint">Комиссия сети оплачивается в {chain.symbol}, не в {asset.symbol}.</span>
            )}
            {feeError && <span className="error">{feeError}</span>}
            <button
              className="btn btn-primary"
              disabled={!validRecipient() || !parseFloat(amount)}
              onClick={handleReview}
            >
              Продолжить
            </button>
          </div>
        )}

        {step === 'review' && (
          <div className="stack">
            <div className="fee-box">
              <span>Кому</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {to.slice(0, 8)}…{to.slice(-6)}
              </span>
            </div>
            <div className="fee-box">
              <span>Сумма</span>
              <span>
                {amount} {asset.symbol}
              </span>
            </div>
            <div className="fee-box">
              <span>Комиссия сети (примерно)</span>
              <span>
                {fee?.amount?.toFixed ? fee.amount.toFixed(8) : fee?.amount} {fee?.symbol}
              </span>
            </div>
            <div className="warn-box">Проверьте адрес получателя. Транзакции необратимы.</div>
            <button className="btn btn-primary" disabled={sending} onClick={handleConfirm}>
              {sending ? 'Отправка…' : 'Подтвердить и отправить'}
            </button>
            <button className="btn btn-secondary" disabled={sending} onClick={() => setStep('form')}>
              Назад
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
