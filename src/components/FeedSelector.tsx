import { useState } from 'react'
import type { FeedSource } from '../types'
import styles from './FeedSelector.module.css'

interface Props {
  value: FeedSource
  onChange: (s: FeedSource) => void
  onAddCustom: (uri: string) => void
}

const PRESETS: FeedSource[] = [
  { kind: 'timeline', label: 'Following' },
  { kind: 'custom', label: "What's Hot", uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot' },
]

export default function FeedSelector({ value, onChange, onAddCustom }: Props) {
  const [customUri, setCustomUri] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  function handleAddCustom(e: React.FormEvent) {
    e.preventDefault()
    const uri = customUri.trim()
    if (!uri) return
    onAddCustom(uri)
    setShowCustom(false)
    setCustomUri('')
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs}>
        {PRESETS.map((s) => (
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
            placeholder="Feed URI (at://...)"
            value={customUri}
            onChange={(e) => setCustomUri(e.target.value)}
            className={styles.input}
          />
          <div className={styles.customActions}>
            <button type="submit" className={styles.btn}>Add</button>
            <button type="button" className={styles.btnSecondary} onClick={() => setShowCustom(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button type="button" className={styles.addFeed} onClick={() => setShowCustom(true)}>
          + Custom feed URI
        </button>
      )}
    </div>
  )
}
