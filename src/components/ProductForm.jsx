import { useState } from 'react'
import { activeFields, normalizeProduct } from '../utils/fields'

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

export default function ProductForm({ schema, initial, isEdit, existingIds, onSave, onCancel }) {
  const fields = activeFields(schema)
  const fieldByKey = Object.fromEntries(fields.map((f) => [f.key, f]))
  const sections = [
    ...SECTIONS.map((s) => ({ ...s, keys: s.keys.filter((k) => fieldByKey[k]) })),
    { title: 'More Details', keys: fields.filter((f) => f.custom).map((f) => f.key) },
  ].filter((s) => s.keys.length)

  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    const product = normalizeProduct(form, schema)
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
        {f.type === 'select' ? (
          <select id={`pf-${key}`} name={key} value={form[key] ?? ''} onChange={handleChange}>
            <option value="">Choose…</option>
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            id={`pf-${key}`}
            name={key}
            type={f.type === 'textarea' ? 'text' : f.type}
            min={f.type === 'number' && !f.custom ? 0 : undefined}
            step={f.type !== 'number' ? undefined : f.custom ? 'any' : key.includes('Price') ? '0.01' : '1'}
            value={form[key] ?? ''}
            onChange={handleChange}
            placeholder={PLACEHOLDERS[key]}
            required={REQUIRED.has(key)}
            disabled={isEdit && key === 'id'}
            autoFocus={key === 'name'}
          />
        )}
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
          {sections.map((s) => (
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
