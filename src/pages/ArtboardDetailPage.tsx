import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { getArtboard, removePostFromArtboard } from '../lib/artboards'
import Layout from '../components/Layout'
import styles from './ArtboardDetailPage.module.css'

export default function ArtboardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [, setTick] = useState(0)
  const board = id ? getArtboard(id) : undefined

  if (!id) {
    return (
      <Layout title="Artboard" showNav>
        <div className={styles.wrap}>
          <p className={styles.empty}>Artboard not found.</p>
        </div>
      </Layout>
    )
  }
  if (!board) {
    return (
      <Layout title="Artboard" showNav>
        <div className={styles.wrap}>
          <p className={styles.empty}>Artboard not found.</p>
        </div>
      </Layout>
    )
  }

  const boardId = board.id
  function handleRemove(postUri: string) {
    if (confirm('Remove this post from the artboard?')) {
      removePostFromArtboard(boardId, postUri)
      setTick((t) => t + 1)
    }
  }

  return (
    <Layout title={board.name} showNav>
      <div className={styles.wrap}>
        <p className={styles.count}>{board.posts.length} post{board.posts.length !== 1 ? 's' : ''}</p>
        {board.posts.length === 0 ? (
          <p className={styles.empty}>No posts saved yet. Add posts from the feed.</p>
        ) : (
          <div className={styles.grid}>
            {board.posts.map((p) => (
              <div key={p.uri} className={styles.card}>
                <Link to={`/post/${encodeURIComponent(p.uri)}`} className={styles.link}>
                  {p.thumb ? (
                    <img src={p.thumb} alt="" className={styles.thumb} />
                  ) : (
                    <div className={styles.placeholder}>📌</div>
                  )}
                  <span className={styles.handle}>@{p.authorHandle ?? 'unknown'}</span>
                  {p.text ? <p className={styles.text}>{p.text.slice(0, 60)}…</p> : null}
                </Link>
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => handleRemove(p.uri)}
                  title="Remove from artboard"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
