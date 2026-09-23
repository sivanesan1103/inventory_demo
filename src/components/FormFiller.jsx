import { useState } from 'react'

// Renders a user-built form and returns the answers keyed by field id.
export default function FormFiller({ form, onSubmit, submitLabel = 'Submit' }) {
  const [values, setValues] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (id, v) => setValues({ ...values, [id]: v })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSubmit(values)
      setValues({})
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="filler" onSubmit={handleSubmit}>
      {form.fields.map((f) => {
        const common = {
          id: `ff-${f.id}`,
          value: values[f.id] ?? '',
          onChange: (e) => set(f.id, e.target.value),
          required: f.required,
        }
        return (
          <div className="field" key={f.id}>
            <label htmlFor={common.id}>
              {f.label}
              {f.required && <span className="req">*</span>}
            </label>
            {f.type === 'textarea' ? (
              <textarea rows={3} {...common} />
            ) : f.type === 'select' ? (
              <select {...common}>
                <option value="">Choose…</option>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type={f.type} step={f.type === 'number' ? 'any' : undefined} {...common} />
            )}
          </div>
        )
      })}
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
    </form>
  )
}
