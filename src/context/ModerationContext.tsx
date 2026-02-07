import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'artsky-moderation-nsfw'

export type NsfwPreference = 'nsfw' | 'sfw' | 'blurred'

type ModerationContextValue = {
  nsfwPreference: NsfwPreference
  setNsfwPreference: (p: NsfwPreference) => void
  /** URIs of posts the user has chosen to unblur (blurred mode). Cleared on page refresh. */
  unblurredUris: Set<string>
  setUnblurred: (uri: string, revealed: boolean) => void
}

const ModerationContext = createContext<ModerationContextValue | null>(null)

function getStored(): NsfwPreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'nsfw' || v === 'sfw' || v === 'blurred') return v
  } catch {
    // ignore
  }
  return 'blurred'
}

export function ModerationProvider({ children }: { children: React.ReactNode }) {
  const [nsfwPreference, setNsfwPreferenceState] = useState<NsfwPreference>(getStored)
  const [unblurredUris, setUnblurredUris] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, nsfwPreference)
    } catch {
      // ignore
    }
  }, [nsfwPreference])

  const setNsfwPreference = useCallback((p: NsfwPreference) => {
    setNsfwPreferenceState(p)
  }, [])

  const setUnblurred = useCallback((uri: string, revealed: boolean) => {
    setUnblurredUris((prev) => {
      const next = new Set(prev)
      if (revealed) next.add(uri)
      else next.delete(uri)
      return next
    })
  }, [])

  const value: ModerationContextValue = {
    nsfwPreference,
    setNsfwPreference,
    unblurredUris,
    setUnblurred,
  }

  return (
    <ModerationContext.Provider value={value}>
      {children}
    </ModerationContext.Provider>
  )
}

export function useModeration() {
  const ctx = useContext(ModerationContext)
  if (!ctx) {
    return {
      nsfwPreference: 'blurred' as NsfwPreference,
      setNsfwPreference: () => {},
      unblurredUris: new Set<string>(),
      setUnblurred: () => {},
    }
  }
  return ctx
}
