import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useProfileModal } from '../context/ProfileModalContext'
import { ProfileContent } from '../pages/ProfilePage'
import styles from './PostDetailModal.module.css'

interface ProfileModalProps {
  handle: string
  onClose: () => void
}

export default function ProfileModal({ handle, onClose }: ProfileModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const { openProfileModal } = useProfileModal()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'q') {
        e.preventDefault()
        e.stopImmediatePropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [onClose])

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  const modal = (
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Profile"
    >
      <div className={styles.closeWrap}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className={styles.pane}>
        <div className={styles.scroll}>
          <ProfileContent handle={handle} openProfileModal={openProfileModal} />
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
