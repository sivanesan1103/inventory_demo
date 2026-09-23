import { useState } from 'react'
import { api } from '../utils/api'

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isRegister = mode === 'register'

  const switchMode = (m) => {
    setMode(m)
    setError('')
    setConfirm('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isRegister && password !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    setError('')
    try {
      onLogin(await api.post(isRegister ? '/api/register' : '/api/login', isRegister ? { username, email, password } : { email, password }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="brand">📦 Shop Inventory</h1>
        <p className="muted">{isRegister ? 'Create your account' : 'Log in to your account'}</p>

        <div className="tabs">
          <button type="button" className={!isRegister ? 'tab active' : 'tab'} onClick={() => switchMode('login')}>Log in</button>
          <button type="button" className={isRegister ? 'tab active' : 'tab'} onClick={() => switchMode('register')}>Register</button>
        </div>

        {isRegister && (
          <div className="field">
            <label htmlFor="auth-user">Username</label>
            <input id="auth-user" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. siva" autoComplete="nickname" required />
            <small className="hint">Shown in the app. Letters, numbers, . _ or -</small>
          </div>
        )}
        <div className="field">
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type={isRegister ? 'email' : 'text'}
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com"
            autoComplete="email"
            autoFocus
            required
          />
        </div>
        <div className="field">
          <label htmlFor="auth-pass">Password</label>
          <input
            id="auth-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={isRegister ? 6 : undefined}
            required
          />
          {isRegister && <small className="hint">At least 6 characters</small>}
        </div>
        {isRegister && (
          <div className="field">
            <label htmlFor="auth-confirm">Confirm Password</label>
            <input id="auth-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn primary block" disabled={busy}>
          {busy ? 'Please wait…' : isRegister ? 'Create Account' : 'Log In'}
        </button>
      </form>
    </div>
  )
}
