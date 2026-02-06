import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { getPostMediaInfo, type TimelineItem } from '../lib/bsky'
import styles from './PostCard.module.css'

interface Props {
  item: TimelineItem
}

function VideoIcon() {
  return (
    <svg className={styles.mediaIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 10.5l-4-2.5v5l4-2.5z" />
    </svg>
  )
}

function ImagesIcon() {
  return (
    <svg className={styles.mediaIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z" />
    </svg>
  )
}

export default function PostCard({ item }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { post } = item
  const media = getPostMediaInfo(post)
  const text = (post.record as { text?: string })?.text ?? ''
  const handle = post.author.handle ?? post.author.did

  if (!media) return null

  const isVideo = media.type === 'video' && media.videoPlaylist
  const isMultipleImages = media.type === 'image' && (media.imageCount ?? 0) > 1

  function onMediaEnter() {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }

  function onMediaLeave() {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  return (
    <Link to={`/post/${encodeURIComponent(post.uri)}`} className={styles.card}>
      <div
        className={styles.mediaWrap}
        onMouseEnter={onMediaEnter}
        onMouseLeave={onMediaLeave}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            className={styles.media}
            src={media.videoPlaylist}
            poster={media.url || undefined}
            muted
            playsInline
            loop
            preload="metadata"
          />
        ) : (
          <img src={media.url} alt="" className={styles.media} loading="lazy" />
        )}
      </div>
      <div className={styles.meta}>
        <span className={styles.handleRow}>
          <span className={styles.handle}>@{handle}</span>
          {isVideo && (
            <span className={styles.mediaBadge} title="Video – hover to play">
              <VideoIcon />
            </span>
          )}
          {isMultipleImages && (
            <span className={styles.mediaBadge} title={`${media.imageCount} images`}>
              <ImagesIcon />
            </span>
          )}
        </span>
        {text ? (
          <p className={styles.text}>
            {text.slice(0, 80)}
            {text.length > 80 ? '…' : ''}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
