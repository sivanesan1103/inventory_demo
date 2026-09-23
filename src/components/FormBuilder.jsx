import { useState } from 'react'

const TYPES = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
]

// crypto.randomUUID needs HTTPS, and the Pi serves plain HTTP.
const newFieldId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
const blankField = () => ({ id: newFieldId(), label: '', type: 'text', required: false, options: [] })

// Create or edit a form's title, description and fields.
export default function FormBuilder({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [fields, setFields] = useState(initial?.fields?.length ? initial.fields : [blankField()])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const update = (i, patch) => setFields(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)))
  const remove = (i) => setFields(fields.filter((_, j) => j !== i))
  const move = (i, dir) => {
    const next = [...fields]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    setFields(next)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const clean = fields.filter((f) => f.label.trim())
    if (!clean.length) return setError('Add at least one field with a label.')
    const badSelect = clean.find((f) => f.type === 'select' && !f.options.filter(Boolean).length)
    if (badSelect) return setError(`Add choices for "${badSelect.label}".`)
    setBusy(true)
    setError('')
    try {
      await onSave({ title, description, fields: clean })
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
            <h2>{initial ? 'Edit Form' : 'New Form'}</h2>
            <p className="muted">Add the questions people will fill in.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          <fieldset className="form-section">
            <legend>Form Details</legend>
            <div className="field">
              <label htmlFor="fb-title">Title<span className="req">*</span></label>
              <input id="fb-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Customer Order Request" required autoFocus />
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="fb-desc">Description</label>
              <textarea id="fb-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional note shown at the top of the form" />
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Fields</legend>
            <div className="builder-list">
              {fields.map((f, i) => (
                <div className="builder-row" key={f.id}>
                  <div className="builder-main">
                    <div className="field grow">
                      <label htmlFor={`fl-${f.id}`}>Question {i + 1}</label>
                      <input id={`fl-${f.id}`} value={f.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="e.g. Customer Name" />
                    </div>
                    <div className="field">
                      <label htmlFor={`ft-${f.id}`}>Type</label>
                      <select id={`ft-${f.id}`} value={f.type} onChange={(e) => update(i, { type: e.target.value })}>
                        {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {f.type === 'select' && (
                    <div className="field">
                      <label htmlFor={`fo-${f.id}`}>Choices (comma separated)</label>
                      <input
                        id={`fo-${f.id}`}
                        value={f.options.join(', ')}
                        onChange={(e) => update(i, { options: e.target.value.split(',').map((s) => s.trimStart()) })}
                        placeholder="e.g. Small, Medium, Large"
                      />
                    </div>
                  )}
                  <div className="builder-tools">
                    <label className="checkbox">
                      <input type="checkbox" checked={f.required} onChange={(e) => update(i, { required: e.target.checked })} />
                      Required
                    </label>
                    <div className="actions">
                      <button type="button" className="btn small" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                      <button type="button" className="btn small" disabled={i === fields.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                      <button type="button" className="btn small danger" disabled={fields.length === 1} onClick={() => remove(i)}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="btn add-field" onClick={() => setFields([...fields, blankField()])}>+ Add Field</button>
          </fieldset>

          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn primary" disabled={busy}>{initial ? 'Save Changes' : 'Create Form'}</button>
        </div>
      </form>
    </div>
  )
}
