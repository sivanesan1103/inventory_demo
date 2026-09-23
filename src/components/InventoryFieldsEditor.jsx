import { useState } from 'react'
import { OPTIONAL_FIELDS } from '../utils/fields'

const TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
]

// crypto.randomUUID needs HTTPS, and the Pi serves plain HTTP.
const newFieldId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

// Choose which optional product fields show, and add/remove your own.
export default function InventoryFieldsEditor({ schema, onSave, onCancel }) {
  const [hidden, setHidden] = useState(schema.hidden)
  const [custom, setCustom] = useState(schema.custom)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const toggle = (key) => setHidden(hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key])
  const update = (i, patch) => setCustom(custom.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  const move = (i, dir) => {
    const next = [...custom]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    setCustom(next)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const clean = custom.filter((c) => c.label.trim())
    const badSelect = clean.find((c) => c.type === 'select' && !c.options.filter(Boolean).length)
    if (badSelect) return setError(`Add choices for "${badSelect.label}".`)
    setBusy(true)
    setError('')
    try {
      await onSave({ hidden, custom: clean })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal wide" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Customize Product Fields</h2>
            <p className="muted">ID, Name, prices and stock are always shown — the Dashboard uses them.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          <fieldset className="form-section">
            <legend>Optional Fields</legend>
            <div className="toggle-list">
              {OPTIONAL_FIELDS.map((f) => (
                <label className="checkbox" key={f.key}>
                  <input type="checkbox" checked={!hidden.includes(f.key)} onChange={() => toggle(f.key)} />
                  Show {f.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>My Fields</legend>
            {custom.length === 0 && <p className="muted">No custom fields yet — e.g. Brand, Expiry Date, Shelf Location.</p>}
            <div className="builder-list">
              {custom.map((c, i) => (
                <div className="builder-row" key={c.id}>
                  <div className="builder-main">
                    <div className="field grow">
                      <label htmlFor={`cl-${c.id}`}>Field Name</label>
                      <input id={`cl-${c.id}`} value={c.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="e.g. Brand" autoFocus={!c.label} />
                    </div>
                    <div className="field">
                      <label htmlFor={`ct-${c.id}`}>Type</label>
                      <select id={`ct-${c.id}`} value={c.type} onChange={(e) => update(i, { type: e.target.value })}>
                        {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {c.type === 'select' && (
                    <div className="field">
                      <label htmlFor={`co-${c.id}`}>Choices (comma separated)</label>
                      <input
                        id={`co-${c.id}`}
                        value={c.options.join(', ')}
                        onChange={(e) => update(i, { options: e.target.value.split(',').map((s) => s.trimStart()) })}
                        placeholder="e.g. Shelf A, Shelf B, Back Room"
                      />
                    </div>
                  )}
                  <div className="builder-tools">
                    <span />
                    <div className="actions">
                      <button type="button" className="btn small" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                      <button type="button" className="btn small" disabled={i === custom.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                      <button type="button" className="btn small danger" onClick={() => setCustom(custom.filter((_, j) => j !== i))}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn add-field"
              onClick={() => setCustom([...custom, { id: newFieldId(), label: '', type: 'text', options: [] }])}
            >
              + Add Field
            </button>
          </fieldset>

          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn primary" disabled={busy}>Save Fields</button>
        </div>
      </form>
    </div>
  )
}
