import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import PostDetailModal from '../components/PostDetailModal'
import ProfileModal from '../components/ProfileModal'

type ModalItem =
  | { type: 'post'; uri: string; openReply?: boolean }
  | { type: 'profile'; handle: string }

type ProfileModalContextValue = {
  openProfileModal: (handle: string) => void
  closeProfileModal: () => void
  openPostModal: (uri: string, openReply?: boolean) => void
  closePostModal: () => void
  /** Go back to previous modal (Q) or close if only one open. */
  closeModal: () => void
  /** True if any modal (post or profile) is open. */
  isModalOpen: boolean
}

const ProfileModalContext = createContext<ProfileModalContextValue | null>(null)

export function ProfileModalProvider({ children }: { children: ReactNode }) {
  const [modalStack, setModalStack] = useState<ModalItem[]>([])

  const openProfileModal = useCallback((handle: string) => {
    setModalStack((prev) => [...prev, { type: 'profile', handle }])
  }, [])


  const openPostModal = useCallback((uri: string, openReply?: boolean) => {
    setModalStack((prev) => [...prev, { type: 'post', uri, openReply }])
  }, [])

  /** Q / Escape / close button: go back to previous popup or close if none. */
  const closeModal = useCallback(() => {
    setModalStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : []))
  }, [])

  const isModalOpen = modalStack.length > 0
  const currentModal = modalStack[modalStack.length - 1] ?? null

  const value: ProfileModalContextValue = {
    openProfileModal,
    closeProfileModal: closeModal,
    closePostModal: closeModal,
    openPostModal,
    closeModal,
    isModalOpen,
  }

  return (
    <ProfileModalContext.Provider value={value}>
      {children}
      {currentModal?.type === 'post' && (
        <PostDetailModal
          uri={currentModal.uri}
          openReply={currentModal.openReply}
          onClose={closeModal}
        />
      )}
      {currentModal?.type === 'profile' && (
        <ProfileModal
          handle={currentModal.handle}
          onClose={closeModal}
        />
      )}
    </ProfileModalContext.Provider>
  )
}

export function useProfileModal() {
  const ctx = useContext(ProfileModalContext)
  if (!ctx) {
    return {
      openProfileModal: () => {},
      closeProfileModal: () => {},
      openPostModal: () => {},
      closePostModal: () => {},
      closeModal: () => {},
      isModalOpen: false,
    }
  }
  return ctx
}
