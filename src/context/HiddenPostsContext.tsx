import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'artsky-hidden-post-uris'

function loadHidden(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function saveHidden(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
  } catch {
    // ignore
  }
}

type HiddenPostsContextValue = {
  hiddenUris: Set<string>
  addHidden: (uri: string) => void
  isHidden: (uri: string) => boolean
}

const HiddenPostsContext = createContext<HiddenPostsContextValue | null>(null)

export function HiddenPostsProvider({ children }: { children: ReactNode }) {
  const [hiddenUris, setHiddenUris] = useState<Set<string>>(loadHidden)

  const addHidden = useCallback((uri: string) => {
    setHiddenUris((prev) => {
      const next = new Set(prev)
      next.add(uri)
      saveHidden(next)
      return next
    })
  }, [])

  const isHidden = useCallback((uri: string) => hiddenUris.has(uri), [hiddenUris])

  const value = useMemo(
    () => ({ hiddenUris, addHidden, isHidden }),
    [hiddenUris, addHidden, isHidden]
  )

  return (
    <HiddenPostsContext.Provider value={value}>
      {children}
    </HiddenPostsContext.Provider>
  )
}

export function useHiddenPosts() {
  const ctx = useContext(HiddenPostsContext)
  if (!ctx) {
    return {
      hiddenUris: new Set<string>(),
      addHidden: () => {},
      isHidden: () => false,
    }
  }
  return ctx
}
