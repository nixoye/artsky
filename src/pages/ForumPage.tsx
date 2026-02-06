import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listStandardSiteDocumentsForForum, getSession, type StandardSiteDocumentView } from '../lib/bsky'
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

export default function ForumPage() {
  const [documents, setDocuments] = useState<StandardSiteDocumentView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const session = getSession()

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const list = await listStandardSiteDocumentsForForum()
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

  return (
    <Layout title="Forum" showNav>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <h2 className={styles.title}>Forum</h2>
          <p className={styles.subtitle}>
            Blogs using the <a href="https://standard.site" target="_blank" rel="noopener noreferrer" className={styles.standardLink}>standard.site</a> lexicon (from you and people you follow)
          </p>
        </header>
        {error && <p className={styles.error}>{error}</p>}
        {!session ? (
          <div className={styles.empty}>
            Sign in to browse standard.site blogs from your account and people you follow.
          </div>
        ) : loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : documents.length === 0 ? (
          <div className={styles.empty}>No standard.site blog posts yet from you or people you follow.</div>
        ) : (
          <ul className={styles.list}>
            {documents.map((doc) => {
              const handle = doc.authorHandle ?? doc.did
              const url = documentUrl(doc)
              const createdAt = doc.createdAt
              const title = doc.title || doc.path || 'Untitled'
              return (
                <li key={doc.uri}>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.postLink}>
                      <article className={postBlockStyles.postBlock}>
                        <div className={postBlockStyles.postBlockContent}>
                          <div className={postBlockStyles.postHead}>
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
                          <p className={postBlockStyles.postText}>{title}</p>
                        </div>
                      </article>
                    </a>
                  ) : (
                    <article className={postBlockStyles.postBlock}>
                      <div className={postBlockStyles.postBlockContent}>
                        <div className={postBlockStyles.postHead}>
                          <div className={postBlockStyles.authorRow}>
                            <Link to={`/profile/${encodeURIComponent(handle)}`} className={postBlockStyles.handleLink}>
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
                        <p className={postBlockStyles.postText}>{title}</p>
                        <p className={styles.noUrl}>No publication URL</p>
                      </div>
                    </article>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Layout>
  )
}
