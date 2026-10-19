import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { error: err } =
        mode === 'signup'
          ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() } } })
          : await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card" onSubmit={submit}>
        <h1 className="brand">SpeakDaily</h1>
        <p className="muted">Two minutes of English practice, every day.</p>
        {mode === 'signup' && (
          <label>
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
          </label>
        )}
        <label>
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="At least 6 characters"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary block" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signup' ? 'Sign up' : 'Sign in'}
        </button>
        <p className="muted center">
          {mode === 'signup' ? 'Already have an account? ' : 'New here? '}
          <button type="button" className="linkbtn" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
            {mode === 'signup' ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </form>
    </div>
  )
}
