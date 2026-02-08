import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from '../context/SessionContext'
import * as bsky from '../lib/bsky'
import * as oauth from '../lib/oauth'
import type { AppBskyActorDefs } from '@atproto/api'
import styles from '../pages/LoginPage.module.css'

const BLUESKY_SIGNIN_URL = 'https://account.bsky.app/signin'
const BLUESKY_SIGNUP_URL = 'https://bsky.app'
const DEBOUNCE_MS = 250

export type LoginMode = 'signin' | 'create'

export interface LoginCardProps {
  /** Initial tab (signin vs create). Updates when prop changes. */
  initialMode?: LoginMode
  /** Called after successful login or account creation. */
  onSuccess?: () => void
}

export default function LoginCard({ initialMode = 'signin', onSuccess }: LoginCardProps) {
  const { login, refreshSession } = useSession()
  const [mode, setMode] = useState<LoginMode>(initialMode)
  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [suggestions, setSuggestions] = useState<AppBskyActorDefs.ProfileViewBasic[]>([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [email, setEmail] = useState('')
  const [handle, setHandle] = useState('')
  const [createPassword, setCreatePassword] = useState('')

  const fetchSuggestions = useCallback(async (q: string) => {
    const term = q.trim().replace(/^@/, '')
    if (!term || term.length < 2) {
      setSuggestions([])
      return
    }
    setSuggestionsLoading(true)
    try {
      const res = await bsky.searchActorsTypeahead(term, 8)
      setSuggestions(res.actors ?? [])
      setActiveIndex(0)
    } catch {
      setSuggestions([])
    } finally {
      setSuggestionsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (identifier.trim().replace(/^@/, '').length < 2) {
      setSuggestions([])
      setSuggestionsOpen(false)
      return
    }
    const t = setTimeout(() => fetchSuggestions(identifier), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [identifier, fetchSuggestions])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const id = identifier.trim().replace(/^@/, '')
    if (!id) return

    if (password.trim()) {
      setLoading(true)
      try {
        await login(id, password)
        onSuccess?.()
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : 'Log in failed. Use your Bluesky handle (or email) and an App Password from Settings → App passwords.'
        setError(message)
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    setError('')
    try {
      await oauth.signInWithOAuthRedirect(id)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Could not start sign-in. Check your handle and try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await bsky.createAccount({
        email: email.trim(),
        password: createPassword,
        handle: handle.trim().toLowerCase().replace(/^@/, ''),
      })
      refreshSession()
      onSuccess?.()
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Could not create account. Check that the handle is available.'
      const isVerificationRequired =
        typeof message === 'string' &&
        (message.toLowerCase().includes('verification') || message.toLowerCase().includes('latest version'))
      setError(
        isVerificationRequired
          ? 'Account creation now requires verification on Bluesky. Please create your account on the Bluesky website or app, then log in here with an App Password.'
          : message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>ArtSky</h1>
      <p className={styles.subtitle}>Bluesky feed & artboards</p>

      <div className={styles.tabs} role="tablist" aria-label="Log in or create account">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signin'}
          aria-controls="signin-panel"
          id="tab-signin"
          className={mode === 'signin' ? styles.tabActive : styles.tab}
          onClick={() => {
            setMode('signin')
            setError('')
          }}
        >
          Log in
        </button>
        <a
          href="https://bsky.app"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.tab}
          id="tab-create"
        >
          Create Account
        </a>
      </div>

      {mode === 'signin' ? (
        <form id="signin-panel" onSubmit={handleSignIn} className={styles.form} aria-label="Log in" role="tabpanel" aria-labelledby="tab-signin">
          <div ref={wrapperRef} className={styles.inputWrap}>
            <label htmlFor="login-identifier" className={styles.srOnly}>
              Handle or email
            </label>
            <input
              id="login-identifier"
              type="text"
              placeholder="Handle or email"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value)
                setSuggestionsOpen(true)
              }}
              onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)}
              onKeyDown={(e) => {
                if (!suggestionsOpen || suggestions.length === 0) return
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActiveIndex((i) => (i + 1) % suggestions.length)
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
                } else if (e.key === 'Enter' && suggestions[activeIndex]) {
                  e.preventDefault()
                  const h = suggestions[activeIndex].handle
                  setIdentifier(h ?? '')
                  setSuggestionsOpen(false)
                } else if (e.key === 'Escape') {
                  setSuggestionsOpen(false)
                }
              }}
              className={styles.input}
              autoComplete="username"
              required
              aria-describedby={error ? 'login-error' : undefined}
            />
            {suggestionsOpen && (suggestions.length > 0 || suggestionsLoading) && (
              <ul className={styles.suggestions} role="listbox">
                {suggestionsLoading && suggestions.length === 0 ? (
                  <li className={styles.suggestion} role="option" aria-disabled>
                    <span className={styles.suggestionsLoading}>Searching…</span>
                  </li>
                ) : (
                  suggestions.map((actor, i) => (
                    <li
                      key={actor.did}
                      role="option"
                      aria-selected={i === activeIndex}
                      className={i === activeIndex ? styles.suggestionActive : styles.suggestion}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setIdentifier(actor.handle ?? '')
                        setSuggestionsOpen(false)
                      }}
                    >
                      {actor.avatar && (
                        <img src={actor.avatar} alt="" className={styles.suggestionAvatar} loading="lazy" />
                      )}
                      <span className={styles.suggestionHandle}>@{actor.handle}</span>
                      {actor.displayName && (
                        <span className={styles.suggestionName}>{actor.displayName}</span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          <label htmlFor="login-password" className={styles.srOnly}>
            App password (optional)
          </label>
          <input
            id="login-password"
            type="password"
            placeholder="App password (optional — leave blank to log in with Bluesky)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            autoComplete="current-password"
            aria-describedby={error ? 'login-error' : undefined}
          />
          {error && <p id="login-error" className={styles.error} role="alert">{error}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {password.trim() ? (loading ? 'Logging in…' : 'Log in') : 'Log in with Bluesky'}
          </button>
          <p className={styles.hint}>
            Create an App Password in Bluesky: Settings → App passwords, then enter it above.
          </p>
          <a
            href={BLUESKY_SIGNIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.signupLink}
          >
            Log in on Bluesky →
          </a>
        </form>
      ) : (
        <form id="create-panel" onSubmit={handleCreateAccount} className={styles.form} aria-label="Create account" role="tabpanel" aria-labelledby="tab-create">
          <label htmlFor="create-email" className={styles.srOnly}>Email</label>
          <input
            id="create-email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            autoComplete="email"
            required
          />
          <label htmlFor="create-handle" className={styles.srOnly}>Handle (e.g. you.bsky.social)</label>
          <input
            id="create-handle"
            type="text"
            placeholder="Handle (e.g. you.bsky.social)"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className={styles.input}
            autoComplete="username"
            required
          />
          <label htmlFor="create-password" className={styles.srOnly}>Password</label>
          <input
            id="create-password"
            type="password"
            placeholder="Password"
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
            className={styles.input}
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby={error ? 'create-error' : undefined}
          />
          {error && <p id="create-error" className={styles.error} role="alert">{error}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
          <p className={styles.hint}>
            Bluesky now requires verification to create accounts. Create your account on the Bluesky website or app,
            then return here to log in with an App Password.
          </p>
          <a
            href={BLUESKY_SIGNUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.signupLink}
          >
            Create account on Bluesky →
          </a>
        </form>
      )}
    </div>
  )
}
