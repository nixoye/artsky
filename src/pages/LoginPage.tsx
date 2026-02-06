import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { login } = useSession()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(identifier.trim(), password)
      navigate('/feed', { replace: true })
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Login failed. Use your Bluesky handle (or email) and an App Password from Settings → App passwords.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>artsky</h1>
        <p className={styles.subtitle}>Bluesky feed & artboards</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Handle or email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className={styles.input}
            autoComplete="username"
            required
          />
          <input
            type="password"
            placeholder="App password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            autoComplete="current-password"
            required
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className={styles.hint}>
          Create an App Password in Bluesky: Settings → App passwords. Do not use your main password.
        </p>
      </div>
    </div>
  )
}
