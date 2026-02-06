import { Link } from 'react-router-dom'
import { getPostMediaUrl, type TimelineItem } from '../lib/bsky'
import styles from './PostCard.module.css'

interface Props {
  item: TimelineItem
}

export default function PostCard({ item }: Props) {
  const { post } = item
  const media = getPostMediaUrl(post)
  const text = (post.record as { text?: string })?.text ?? ''
  const handle = post.author.handle ?? post.author.did

  if (!media) return null

  return (
    <Link to={`/post/${encodeURIComponent(post.uri)}`} className={styles.card}>
      <div className={styles.mediaWrap}>
        {media.type === 'image' ? (
          <img src={media.url} alt="" className={styles.media} loading="lazy" />
        ) : (
          <img src={media.url} alt="" className={styles.media} loading="lazy" />
        )}
      </div>
      <div className={styles.meta}>
        <span className={styles.handle}>@{handle}</span>
        {text ? <p className={styles.text}>{text.slice(0, 80)}{text.length > 80 ? '…' : ''}</p> : null}
      </div>
    </Link>
  )
}
