import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'artsky-hide-reposts-from'

type HideRepostsContextValue = {
  /** DIDs of accounts whose reposts are hidden from the homepage feed. */
  hideRepostsFromDids: string[]
  addHideRepostsFrom: (did: string) => void
  removeHideRepostsFrom: (did: string) => void
  toggleHideRepostsFrom: (did: string) => void
  isHidingRepostsFrom: (did: string) => boolean
}

const HideRepostsContext = createContext<HideRepostsContextValue | null>(null)

function getStored(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function save(dids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dids))
  } catch {
    // ignore
  }
}

export function HideRepostsProvider({ children }: { children: React.ReactNode }) {
  const [hideRepostsFromDids, setHideRepostsFromDids] = useState<string[]>(getStored)

  useEffect(() => {
    save(hideRepostsFromDids)
  }, [hideRepostsFromDids])

  const addHideRepostsFrom = useCallback((did: string) => {
    setHideRepostsFromDids((prev) => (prev.includes(did) ? prev : [...prev, did]))
  }, [])

  const removeHideRepostsFrom = useCallback((did: string) => {
    setHideRepostsFromDids((prev) => prev.filter((d) => d !== did))
  }, [])

  const toggleHideRepostsFrom = useCallback((did: string) => {
    setHideRepostsFromDids((prev) =>
      prev.includes(did) ? prev.filter((d) => d !== did) : [...prev, did]
    )
  }, [])

  const isHidingRepostsFrom = useCallback(
    (did: string) => hideRepostsFromDids.includes(did),
    [hideRepostsFromDids]
  )

  const value: HideRepostsContextValue = {
    hideRepostsFromDids,
    addHideRepostsFrom,
    removeHideRepostsFrom,
    toggleHideRepostsFrom,
    isHidingRepostsFrom,
  }

  return (
    <HideRepostsContext.Provider value={value}>
      {children}
    </HideRepostsContext.Provider>
  )
}

export function useHideReposts(): HideRepostsContextValue | null {
  return useContext(HideRepostsContext)
}
