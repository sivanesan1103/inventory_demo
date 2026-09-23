import { useState } from 'react'
import { api } from '../utils/api'

function useSubmit(action) {
  const [msg, setMsg] = useState(null) // { type: 'ok' | 'error', text }
  const [busy, setBusy] = useState(false)
  const run = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      setMsg({ type: 'ok', text: await action() })
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }
  return { msg, busy, run }
}

const Message = ({ msg }) => msg && <p className={msg.type === 'ok' ? 'form-success' : 'form-error'}>{msg.text}</p>

export default function Account({ user, onUserChange }) {
  const [email, setEmail] = useState(user.email)
  const [emailPass, setEmailPass] = useState('')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')

  const emailForm = useSubmit(async () => {
    onUserChange(await api.put('/api/account/email', { email, password: emailPass }))
    setEmailPass('')
    return 'Email saved. Use it to log in from now on.'
  })

  const passwordForm = useSubmit(async () => {
    if (next !== confirm) throw new Error('New passwords do not match.')
    await api.put('/api/account/password', { password: current, newPassword: next })
    setCurrent(''); setNext(''); setConfirm('')
    return 'Password changed. Other devices have been logged out.'
  })

  return (
    <section className="account">
      <h2 className="page-title">My Account</h2>
      <p className="muted">Signed in as <b>{user.username}</b></p>

      {!user.email && (
        <p className="form-error">Your account has no email yet. Add one below so you can log in with it.</p>
      )}

      <form className="card account-card" onSubmit={emailForm.run}>
        <h3>Email</h3>
        <div className="field">
          <label htmlFor="acc-email">Email</label>
          <input id="acc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" required />
        </div>
        <div className="field">
          <label htmlFor="acc-email-pass">Current Password</label>
          <input id="acc-email-pass" type="password" value={emailPass} onChange={(e) => setEmailPass(e.target.value)} autoComplete="current-password" required />
        </div>
        <Message msg={emailForm.msg} />
        <button className="btn primary" disabled={emailForm.busy}>Save Email</button>
      </form>

      <form className="card account-card" onSubmit={passwordForm.run}>
        <h3>Change Password</h3>
        <div className="field">
          <label htmlFor="acc-cur">Current Password</label>
          <input id="acc-cur" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
        </div>
        <div className="field">
          <label htmlFor="acc-new">New Password</label>
          <input id="acc-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={6} required />
          <small className="hint">At least 6 characters</small>
        </div>
        <div className="field">
          <label htmlFor="acc-confirm">Confirm New Password</label>
          <input id="acc-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
        </div>
        <Message msg={passwordForm.msg} />
        <button className="btn primary" disabled={passwordForm.busy}>Change Password</button>
      </form>
    </section>
  )
}
