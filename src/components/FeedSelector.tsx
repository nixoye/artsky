import { useState } from 'react'
import type { FeedSource } from '../types'
import styles from './FeedSelector.module.css'

interface Props {
  sources: FeedSource[]
  value: FeedSource
  onChange: (s: FeedSource) => void
  onAddCustom: (input: string) => void | Promise<void>
}

export default function FeedSelector({ sources, value, onChange, onAddCustom }: Props) {
  const [customInput, setCustomInput] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [adding, setAdding] = useState(false)

  async function handleAddCustom(e: React.FormEvent) {
    e.preventDefault()
    const input = customInput.trim()
    if (!input) return
    setAdding(true)
    try {
      await onAddCustom(input)
      setShowCustom(false)
      setCustomInput('')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs}>
        {sources.map((s) => (
          <button
            key={s.uri ?? s.label}
            type="button"
            className={value.label === s.label && value.uri === s.uri ? styles.active : ''}
            onClick={() => onChange(s)}
          >
            {s.label}
          </button>
        ))}
      </div>
      {showCustom ? (
        <form onSubmit={handleAddCustom} className={styles.customForm}>
          <input
            type="text"
            placeholder="https://bsky.app/profile/handle.bsky.social/feed/feed-name"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            className={styles.input}
            disabled={adding}
          />
          <div className={styles.customActions}>
            <button type="submit" className={styles.btn} disabled={adding}>
              {adding ? 'Adding…' : 'Add'}
            </button>
            <button type="button" className={styles.btnSecondary} onClick={() => setShowCustom(false)} disabled={adding}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className={styles.addFeed} onClick={() => setShowCustom(true)}>
          + Add custom feed
        </button>
      )}
    </div>
  )
}
