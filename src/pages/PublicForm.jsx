import { useEffect, useState } from 'react'
import FormFiller from '../components/FormFiller'
import { api } from '../utils/api'

// Page anyone with the share link can open to submit a response (no login).
export default function PublicForm({ formId }) {
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    api.get(`/api/public/forms/${formId}`).then(setForm, (err) => setError(err.message))
  }, [formId])

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        {error && <p className="form-error">{error}</p>}
        {!form && !error && <p className="muted">Loading…</p>}
        {form && (
          <>
            <h1 className="form-title">{form.title}</h1>
            {form.description && <p className="muted">{form.description}</p>}
            {done ? (
              <div className="done">
                <p className="success">✓ Thanks! Your response was recorded.</p>
                <button className="btn" onClick={() => setDone(false)}>Submit another response</button>
              </div>
            ) : (
              <FormFiller
                form={form}
                onSubmit={async (data) => {
                  await api.post(`/api/public/forms/${formId}/entries`, data)
                  setDone(true)
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
