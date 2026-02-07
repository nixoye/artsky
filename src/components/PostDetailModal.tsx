import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { PostDetailContent } from '../pages/PostDetailPage'
import styles from './PostDetailModal.module.css'

interface PostDetailModalProps {
  uri: string
  openReply?: boolean
  onClose: () => void
  onBack: () => void
  canGoBack: boolean
}

export default function PostDetailModal({ uri, openReply, onClose, onBack, canGoBack }: PostDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        onClose()
        return
      }
      if (e.key.toLowerCase() === 'q') {
        e.preventDefault()
        e.stopImmediatePropagation()
        onBack()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [onClose, onBack])

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
      aria-label="Post"
    >
      <div className={styles.pane}>
        <div className={styles.modalTopBar}>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close all"
          >
            ×
          </button>
          {canGoBack ? (
            <button
              type="button"
              className={styles.backBtn}
              onClick={onBack}
              aria-label="Back to previous"
            >
              ←
            </button>
          ) : null}
        </div>
        <div className={styles.scroll}>
          <PostDetailContent
            uri={uri}
            initialOpenReply={openReply}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
