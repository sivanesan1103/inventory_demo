import { useEffect, useState } from 'react'
import FormBuilder from '../components/FormBuilder'
import FormFiller from '../components/FormFiller'
import { api } from '../utils/api'
import { exportResponses } from '../utils/fileIO'

const shareLink = (id) => `${window.location.origin}${window.location.pathname}#/f/${id}`
const formatDate = (iso) => new Date(iso).toLocaleString()
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

export default function Forms() {
  const [forms, setForms] = useState(null)
  const [error, setError] = useState('')
  const [building, setBuilding] = useState(null) // null | { form? }
  const [openId, setOpenId] = useState(null)

  const refresh = () => api.get('/api/forms').then(setForms, (err) => setError(err.message))
  useEffect(() => { refresh() }, [])

  const saveForm = async (data) => {
    if (building.form) await api.put(`/api/forms/${building.form.id}`, data)
    else await api.post('/api/forms', data)
    setBuilding(null)
    refresh()
  }

  const deleteForm = async (form) => {
    if (!window.confirm(`Delete "${form.title}" and all ${form.entryCount} responses?`)) return
    await api.del(`/api/forms/${form.id}`)
    if (openId === form.id) setOpenId(null)
    refresh()
  }

  const openForm = forms?.find((f) => f.id === openId)
  if (openForm) return <Responses form={openForm} onBack={() => { setOpenId(null); refresh() }} />

  return (
    <section>
      <div className="toolbar">
        <div className="grow">
          <h2 className="page-title">My Forms</h2>
          <p className="muted">Build a form, share its link, and collect responses.</p>
        </div>
        <button className="btn primary" onClick={() => setBuilding({})}>+ New Form</button>
      </div>

      {error && <p className="form-error">{error}</p>}
      {forms === null && !error && <p className="muted">Loading…</p>}
      {forms?.length === 0 && <p className="empty">No forms yet. Click “+ New Form” to create one.</p>}

      <div className="form-cards">
        {forms?.map((f) => (
          <div className="card form-card" key={f.id}>
            <h3>{f.title}</h3>
            {f.description && <p className="muted clamp">{f.description}</p>}
            <p className="muted small-text">{plural(f.fields.length, 'field')} · {plural(f.entryCount, 'response')}</p>
            <div className="card-actions">
              <button className="btn primary small" onClick={() => setOpenId(f.id)}>Responses</button>
              <button className="btn small" onClick={() => setBuilding({ form: f })}>Edit Form</button>
              <button className="btn small danger" onClick={() => deleteForm(f)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {building && <FormBuilder initial={building.form} onSave={saveForm} onCancel={() => setBuilding(null)} />}
    </section>
  )
}

// Collected responses: add and delete only — responses cannot be edited.
function Responses({ form, onBack }) {
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState('')
  const [filling, setFilling] = useState(false)
  const [copied, setCopied] = useState(false)

  const refresh = () => api.get(`/api/forms/${form.id}/entries`).then(setEntries, (err) => setError(err.message))
  useEffect(() => { refresh() }, [form.id])

  const addEntry = async (data) => {
    await api.post(`/api/forms/${form.id}/entries`, data)
    setFilling(false)
    refresh()
  }

  const deleteEntry = async (entry) => {
    if (!window.confirm('Delete this response? This cannot be undone.')) return
    await api.del(`/api/entries/${entry.id}`)
    setEntries(entries.filter((e) => e.id !== entry.id))
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink(form.id))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', shareLink(form.id))
    }
  }

  return (
    <section>
      <button className="btn small" onClick={onBack}>← All Forms</button>
      <div className="toolbar" style={{ marginTop: 12 }}>
        <div className="grow">
          <h2 className="page-title">{form.title}</h2>
          <p className="muted">{entries ? plural(entries.length, 'response') : 'Loading…'}</p>
        </div>
        {entries?.length > 0 && (
          <select
            className="btn export-select"
            value=""
            onChange={(e) => exportResponses(form, entries, e.target.value)}
            aria-label="Export responses"
          >
            <option value="" disabled>⬇ Export</option>
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="csv">CSV (.csv)</option>
            <option value="json">JSON (.json)</option>
          </select>
        )}
        <button className="btn" onClick={copyLink}>{copied ? '✓ Link Copied' : '🔗 Copy Share Link'}</button>
        <button className="btn primary" onClick={() => setFilling(true)}>+ Add Response</button>
      </div>

      {error && <p className="form-error">{error}</p>}
      {entries?.length === 0 && <p className="empty">No responses yet. Share the link or add one yourself.</p>}

      {entries?.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Submitted</th>
                {form.fields.map((f) => <th key={f.id}>{f.label}</th>)}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="muted">{formatDate(e.createdAt)}</td>
                  {form.fields.map((f) => <td key={f.id} className="wrap">{e.data[f.id] || '—'}</td>)}
                  <td className="actions">
                    <button className="btn small danger" onClick={() => deleteEntry(e)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filling && (
        <div className="modal-backdrop" onClick={() => setFilling(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{form.title}</h2>
                {form.description && <p className="muted">{form.description}</p>}
              </div>
              <button type="button" className="icon-btn" onClick={() => setFilling(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-body padded">
              <FormFiller form={form} onSubmit={addEntry} submitLabel="Save Response" />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
