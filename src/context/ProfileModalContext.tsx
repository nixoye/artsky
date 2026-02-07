import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import ProfileModal from '../components/ProfileModal'

type ProfileModalContextValue = {
  openProfileModal: (handle: string) => void
  closeProfileModal: () => void
}

const ProfileModalContext = createContext<ProfileModalContextValue | null>(null)

export function ProfileModalProvider({ children }: { children: ReactNode }) {
  const [profileModalHandle, setProfileModalHandle] = useState<string | null>(null)

  const openProfileModal = useCallback((handle: string) => {
    setProfileModalHandle(handle)
  }, [])

  const closeProfileModal = useCallback(() => {
    setProfileModalHandle(null)
  }, [])

  return (
    <ProfileModalContext.Provider value={{ openProfileModal, closeProfileModal }}>
      {children}
      {profileModalHandle && (
        <ProfileModal
          handle={profileModalHandle}
          onClose={closeProfileModal}
        />
      )}
    </ProfileModalContext.Provider>
  )
}

export function useProfileModal() {
  const ctx = useContext(ProfileModalContext)
  if (!ctx) return { openProfileModal: () => {}, closeProfileModal: () => {} }
  return ctx
}
