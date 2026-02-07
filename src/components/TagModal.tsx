import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { TagContent } from '../pages/TagPage'
import styles from './PostDetailModal.module.css'

interface TagModalProps {
  tag: string
  onClose: () => void
  onBack: () => void
  canGoBack: boolean
}

export default function TagModal({ tag, onClose, onBack, canGoBack }: TagModalProps) {
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
      aria-label="Tag"
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
          <TagContent tag={tag} inModal />
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
