import { Link } from 'react-router-dom'
import { useProfileModal } from '../context/ProfileModalContext'

interface TagLinkProps {
  tag: string
  className?: string
  onClick?: (e: React.MouseEvent) => void
  children: React.ReactNode
}

/** Link that opens tag in the modal lightbox instead of navigating. */
export default function TagLink({ tag, className, onClick, children }: TagLinkProps) {
  const { openTagModal } = useProfileModal()
  const tagSlug = encodeURIComponent(tag.replace(/^#/, ''))
  return (
    <Link
      to={`/tag/${tagSlug}`}
      className={className}
      onClick={(e) => {
        e.preventDefault()
        openTagModal(tag.replace(/^#/, ''))
        onClick?.(e)
      }}
    >
      {children}
    </Link>
  )
}
