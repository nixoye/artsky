import { Link } from 'react-router-dom'
import styles from './PostText.module.css'

/** Matches: explicit URLs, www. URLs, bare domains, hashtags, and @mentions (not after alphanumeric, to avoid emails). */
const LINKIFY_REGEX =
  /(https?:\/\/[^\s<>"']+)|(www\.[^\s<>"'\],;:)!?]+)|(?<![@\/])((?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\/[^\s<>"']*)?)|(#[\w]+)|(?<![a-zA-Z0-9])(@[\w.-]+)/gi

function linkDisplayText(href: string, value: string, display: 'url' | 'domain'): string {
  if (display !== 'domain') return value
  try {
    const u = new URL(href)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return value
  }
}

export interface PostTextProps {
  text: string
  className?: string
  /** Truncate to this many characters (e.g. 80 for cards). No truncation if undefined. */
  maxLength?: number
  /** Stop click propagation (use inside a card that is itself a link). */
  stopPropagation?: boolean
  /** Show link as domain name only (e.g. "example.com"). Default "url" shows full URL. */
  linkDisplay?: 'url' | 'domain'
}

export default function PostText({ text, className, maxLength, stopPropagation, linkDisplay = 'url' }: PostTextProps) {
  const segments: Array<{ type: 'text' | 'url' | 'bareUrl' | 'hashtag' | 'mention'; value: string }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  const re = new RegExp(LINKIFY_REGEX.source, 'gi')
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    const value = match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5]
    if (match[1]) {
      segments.push({ type: 'url', value })
    } else if (match[2] || match[3]) {
      segments.push({ type: 'bareUrl', value })
    } else if (match[4]) {
      segments.push({ type: 'hashtag', value })
    } else if (match[5]) {
      segments.push({ type: 'mention', value })
    }
    lastIndex = re.lastIndex
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }

  let displaySegments: typeof segments
  if (maxLength != null) {
    let used = 0
    displaySegments = []
    for (const seg of segments) {
      if (seg.type === 'text') {
        if (used + seg.value.length <= maxLength) {
          displaySegments.push(seg)
          used += seg.value.length
        } else {
          const take = maxLength - used
          if (take > 0) {
            displaySegments.push({ type: 'text', value: seg.value.slice(0, take) + '…' })
          }
          break
        }
      } else {
        displaySegments.push(seg)
        /* Never truncate links/mentions/hashtags: add in full and don't count toward limit */
      }
    }
  } else {
    displaySegments = segments
  }

  const displayText = segments.length === 0 ? (maxLength != null && text.length > maxLength ? text.slice(0, maxLength) + '…' : text) : ''
  if (displaySegments.length === 0) {
    return <span className={className}>{displayText || text}</span>
  }

  const onClick = stopPropagation ? (e: React.MouseEvent) => e.stopPropagation() : undefined

  return (
    <span className={className ?? undefined}>
      {displaySegments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i}>{seg.value}</span>
        }
        if (seg.type === 'url') {
          const href = seg.value
          const display = linkDisplayText(href, href, linkDisplay)
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
              onClick={onClick}
              title={href}
            >
              {display}
            </a>
          )
        }
        if (seg.type === 'bareUrl') {
          const raw = seg.value.replace(/[.,;:)!?]+$/, '')
          const href = `https://${raw}`
          const display = linkDisplayText(href, seg.value, linkDisplay)
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
              onClick={onClick}
              title={href}
            >
              {display}
            </a>
          )
        }
        if (seg.type === 'hashtag') {
          const tagSlug = encodeURIComponent(seg.value.slice(1))
          return (
            <Link key={i} to={`/tag/${tagSlug}`} className={styles.hashtag} onClick={onClick}>
              {seg.value}
            </Link>
          )
        }
        // mention: value is e.g. "@user" -> link to /profile/user
        const handle = seg.value.slice(1)
        const profileSlug = encodeURIComponent(handle)
        return (
          <Link key={i} to={`/profile/${profileSlug}`} className={styles.mention} onClick={onClick}>
            {seg.value}
          </Link>
        )
      })}
    </span>
  )
}
