import { useCallback, useEffect, useState } from 'react'
import { agent, getSession, getSuggestedFollows, type SuggestedFollow } from '../lib/bsky'
import {
  getRecommendationsShown,
  markRecommendationsShown,
  getRotationCutoff,
} from '../lib/recommendationStorage'
import { useProfileModal } from '../context/ProfileModalContext'
import styles from './SuggestedFollows.module.css'

const DISPLAY_COUNT = 8

export default function SuggestedFollows() {
  const { openProfileModal } = useProfileModal()
  const [suggestions, setSuggestions] = useState<SuggestedFollow[]>([])
  const [loading, setLoading] = useState(false)
  const [followLoadingDid, setFollowLoadingDid] = useState<string | null>(null)
  const [dismissedDids, setDismissedDids] = useState<Set<string>>(() => new Set())

  const load = useCallback(async () => {
    const session = getSession()
    const did = session?.did
    if (!did) return
    setLoading(true)
    try {
      const raw = await getSuggestedFollows(agent, did, { maxSuggestions: 20 })
      const shown = getRecommendationsShown()
      const cutoff = getRotationCutoff()
      const filtered = raw.filter(
        (s) => !dismissedDids.has(s.did) && (!shown[s.did] || shown[s.did] < cutoff)
      )
      const toDisplay = filtered.slice(0, DISPLAY_COUNT)
      setSuggestions(toDisplay)
      if (toDisplay.length > 0) {
        markRecommendationsShown(toDisplay.map((s) => s.did))
      }
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [dismissedDids])

  useEffect(() => {
    load()
  }, [load])

  const handleFollow = useCallback(
    async (did: string, handle: string) => {
      setFollowLoadingDid(did)
      try {
        await agent.follow(did)
        setSuggestions((prev) => prev.filter((s) => s.did !== did))
      } catch {
        // leave in list so user can retry
      } finally {
        setFollowLoadingDid(null)
      }
    },
    []
  )

  const handleDismiss = useCallback((did: string) => {
    markRecommendationsShown([did])
    setDismissedDids((prev) => new Set(prev).add(did))
    setSuggestions((prev) => prev.filter((s) => s.did !== did))
  }, [])

  if (loading && suggestions.length === 0) return null
  if (suggestions.length === 0) return null

  return (
    <section className={styles.wrap} aria-label="Suggested accounts to follow">
      <h2 className={styles.heading}>Suggested for you</h2>
      <p className={styles.subtext}>
        Accounts followed by people you follow. They’ll reappear after a week if you don’t follow.
      </p>
      <ul className={styles.list}>
        {suggestions.map((s) => (
          <li key={s.did} className={styles.item}>
            <button
              type="button"
              className={styles.profileBtn}
              onClick={() => openProfileModal(s.handle)}
              aria-label={`View @${s.handle} profile`}
            >
              {s.avatar ? (
                <img src={s.avatar} alt="" className={styles.avatar} loading="lazy" />
              ) : (
                <span className={styles.avatarPlaceholder} aria-hidden>
                  {(s.displayName ?? s.handle).slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className={styles.info}>
                <span className={styles.handle}>@{s.handle}</span>
                {s.count > 1 && (
                  <span className={styles.meta}>{s.count} follow{s.count !== 1 ? 's' : ''} them</span>
                )}
              </span>
            </button>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.followBtn}
                onClick={() => handleFollow(s.did, s.handle)}
                disabled={followLoadingDid === s.did}
              >
                {followLoadingDid === s.did ? '…' : 'Follow'}
              </button>
              <button
                type="button"
                className={styles.dismissBtn}
                onClick={() => handleDismiss(s.did)}
                aria-label="Not now"
                title="Hide for a week"
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
