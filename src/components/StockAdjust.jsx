import { useState } from 'react'
import { num } from '../utils/format'

// Record stock coming in (restock) or going out (sold/damaged) without editing the product.
export default function StockAdjust({ product, onSave, onCancel }) {
  const [mode, setMode] = useState('out') // 'in' | 'out'
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const n = Number(amount)
  const valid = Number.isInteger(n) && n > 0
  const next = valid ? product.quantity + (mode === 'in' ? n : -n) : product.quantity

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!valid) return setError('Enter a whole number greater than 0.')
    if (next < 0) return setError(`Only ${num(product.quantity)} in stock.`)
    onSave({ ...product, quantity: next })
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal narrow" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Update Stock</h2>
            <p className="muted">{product.name} · {product.id}</p>
          </div>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="Close">×</button>
        </div>

        <div className="modal-body padded">
          <div className="tabs">
            <button type="button" className={mode === 'out' ? 'tab active' : 'tab'} onClick={() => setMode('out')}>− Stock Out (Sold)</button>
            <button type="button" className={mode === 'in' ? 'tab active' : 'tab'} onClick={() => setMode('in')}>+ Stock In (Restock)</button>
          </div>
          <div className="field" style={{ marginTop: 16 }}>
            <label htmlFor="stock-amount">Quantity {mode === 'in' ? 'received' : 'sold'}</label>
            <input
              id="stock-amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError('') }}
              placeholder="e.g. 5"
              autoFocus
            />
          </div>
          <div className="stock-preview">
            <span>Current: <b>{num(product.quantity)}</b></span>
            <span>→</span>
            <span className={next < 0 ? 'error' : next <= product.minStock ? 'warn-text' : ''}>New: <b>{num(next)}</b></span>
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn primary">Update Stock</button>
        </div>
      </form>
    </div>
  )
}
