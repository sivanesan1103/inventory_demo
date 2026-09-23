import { useState } from 'react'
import { FIELDS, normalizeProduct } from '../utils/fields'

const REQUIRED = new Set(['id', 'name'])

const PLACEHOLDERS = {
  id: 'e.g. P-1001',
  name: 'e.g. Wireless Mouse',
  category: 'e.g. Electronics',
  sku: 'e.g. WM-BLK-01',
  supplier: 'e.g. Acme Supplies',
}

const HINTS = {
  minStock: 'Alert when quantity drops to this level',
}

const SECTIONS = [
  { title: 'Basic Details', keys: ['id', 'name', 'category', 'sku'] },
  { title: 'Pricing', keys: ['purchasePrice', 'sellingPrice'] },
  { title: 'Stock & Supplier', keys: ['quantity', 'minStock', 'supplier'] },
]

const fieldByKey = Object.fromEntries(FIELDS.map((f) => [f.key, f]))

export default function ProductForm({ initial, isEdit, existingIds, onSave, onCancel }) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    const product = normalizeProduct(form)
    if (!product.id || !product.name) return setError('Product ID and Product Name are required.')
    if (!isEdit && existingIds.has(product.id)) return setError(`Product ID "${product.id}" already exists.`)
    onSave(product)
  }

  const renderField = (key) => {
    const f = fieldByKey[key]
    return (
      <div className="field" key={key}>
        <label htmlFor={`pf-${key}`}>
          {f.label}
          {REQUIRED.has(key) && <span className="req">*</span>}
        </label>
        <input
          id={`pf-${key}`}
          name={key}
          type={f.type}
          min={f.type === 'number' ? 0 : undefined}
          step={key.includes('Price') ? '0.01' : '1'}
          value={form[key]}
          onChange={handleChange}
          placeholder={PLACEHOLDERS[key]}
          required={REQUIRED.has(key)}
          disabled={isEdit && key === 'id'}
          autoFocus={key === 'name'}
        />
        {HINTS[key] && <small className="hint">{HINTS[key]}</small>}
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{isEdit ? 'Edit Product' : 'Add Product'}</h2>
            <p className="muted">Fields marked <span className="req">*</span> are required.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          {SECTIONS.map((s) => (
            <fieldset key={s.title} className="form-section">
              <legend>{s.title}</legend>
              <div className="form-grid">{s.keys.map(renderField)}</div>
            </fieldset>
          ))}
          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn primary">{isEdit ? 'Save Changes' : 'Add Product'}</button>
        </div>
      </form>
    </div>
  )
}
