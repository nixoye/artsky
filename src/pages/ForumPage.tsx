import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listStandardSiteDocumentsAll, type StandardSiteDocumentView } from '../lib/bsky'
import { FORUM_DISCOVERY_URLS } from '../config/forumDiscovery'
import { formatRelativeTime, formatExactDateTime } from '../lib/date'
import Layout from '../components/Layout'
import styles from './ForumPage.module.css'
import postBlockStyles from './PostDetailPage.module.css'

function documentUrl(doc: StandardSiteDocumentView): string | null {
  if (!doc.baseUrl) return null
  const base = doc.baseUrl.replace(/\/$/, '')
  const path = (doc.path ?? '').replace(/^\//, '')
  return path ? `${base}/${path}` : base
}

function matchesSearch(doc: StandardSiteDocumentView, q: string): boolean {
  if (!q.trim()) return true
  const lower = q.toLowerCase().trim()
  const title = (doc.title ?? '').toLowerCase()
  const handle = (doc.authorHandle ?? '').toLowerCase()
  const path = (doc.path ?? '').toLowerCase()
  return title.includes(lower) || handle.includes(lower) || path.includes(lower)
}

export default function ForumPage() {
  const [documents, setDocuments] = useState<StandardSiteDocumentView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const list = await listStandardSiteDocumentsAll(FORUM_DISCOVERY_URLS)
      setDocuments(list)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load forum')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setDocuments([])
    load()
  }, [load])

  const filteredDocuments = useMemo(
    () => documents.filter((doc) => matchesSearch(doc, searchQuery)),
    [documents, searchQuery]
  )

  return (
    <Layout title="Forum" showNav>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <h2 className={styles.title}>Forum</h2>
          <p className={styles.subtitle}>
            Posts from the ATmosphere using the <a href="https://standard.site" target="_blank" rel="noopener noreferrer" className={styles.standardLink}>standard.site</a> lexicon
          </p>
          <div className={styles.searchRow}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search posts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search forum posts"
            />
          </div>
        </header>
        {error && <p className={styles.error}>{error}</p>}
        {loading ? (
          <div className={styles.loading}>Loading discovered posts…</div>
        ) : filteredDocuments.length === 0 ? (
          <div className={styles.empty}>
            {documents.length === 0
              ? 'No standard.site posts discovered yet. Add more publication URLs in forum discovery config.'
              : 'No posts match your search.'}
          </div>
        ) : (
          <ul className={styles.list}>
            {filteredDocuments.map((doc) => {
              const handle = doc.authorHandle ?? doc.did
              const url = documentUrl(doc)
              const createdAt = doc.createdAt
              const title = doc.title || doc.path || 'Untitled'
              const forumPostUrl = `/forum/post/${encodeURIComponent(doc.uri)}`
              const head = (
                <div className={postBlockStyles.postHead}>
                  {doc.authorAvatar ? (
                    <img src={doc.authorAvatar} alt="" className={postBlockStyles.avatar} />
                  ) : (
                    <span className={styles.avatarPlaceholder} aria-hidden>{(handle || doc.did).slice(0, 1).toUpperCase()}</span>
                  )}
                  <div className={postBlockStyles.authorRow}>
                    <Link
                      to={`/profile/${encodeURIComponent(handle)}`}
                      className={postBlockStyles.handleLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      @{handle}
                    </Link>
                    {createdAt && (
                      <span
                        className={postBlockStyles.postTimestamp}
                        title={formatExactDateTime(createdAt)}
                      >
                        {formatRelativeTime(createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              )
              return (
                <li key={doc.uri}>
                  <Link to={forumPostUrl} className={styles.postLink}>
                    <article className={postBlockStyles.postBlock}>
                      <div className={postBlockStyles.postBlockContent}>
                        {head}
                        <p className={postBlockStyles.postText}>{title}</p>
                        {!url && <p className={styles.noUrl}>No publication URL</p>}
                      </div>
                    </article>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Layout>
  )
}
