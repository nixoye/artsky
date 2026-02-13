import { useCallback, useEffect, useState } from 'react'
import { agent, getSession, publicAgent } from '../lib/bsky'
import { analyzeConsensus } from '../lib/wasm-bridge'
import Layout from '../components/Layout'
import PostText from '../components/PostText'
import type { ConsensusResult } from '../types'
import styles from './ForumPage.module.css'

const STATEMENT_COLLECTION = 'app.artsky.forum.post'
const VOTE_COLLECTION = 'app.artsky.consensus.vote'

type StatementItem = {
  id: string
  uri: string
  text: string
  myVote: -1 | 0 | 1 | null
}

export function ConsensusContent() {
  const [statements, setStatements] = useState<StatementItem[]>([])
  const [newStatement, setNewStatement] = useState('')
  const [result, setResult] = useState<ConsensusResult | null>(null)
  const [loading, setLoading] = useState(true)
  const session = getSession()

  const load = useCallback(async () => {
    try {
      const client = session ? agent : publicAgent
      const didsToCheck: string[] = session?.did ? [session.did] : []
      const loaded: StatementItem[] = []
      const seenUris = new Set<string>()

      for (const did of didsToCheck) {
        try {
          const res = await client.com.atproto.repo.listRecords({
            repo: did,
            collection: STATEMENT_COLLECTION,
            limit: 100,
          })
          for (const r of res.data.records ?? []) {
            if (seenUris.has(r.uri)) continue
            const v = r.value as { title?: string; body?: string; tags?: string[] }
            if (!v.tags?.includes('consensus')) continue
            seenUris.add(r.uri)
            loaded.push({
              id: r.uri.split('/').pop() ?? r.uri,
              uri: r.uri,
              text: v.title || v.body || '',
              myVote: null,
            })
          }
        } catch {
          /* ignore */
        }
      }

      if (session?.did) {
        try {
          const voteRes = await client.com.atproto.repo.listRecords({
            repo: session.did,
            collection: VOTE_COLLECTION,
            limit: 100,
          })
          for (const r of voteRes.data.records ?? []) {
            const v = r.value as { statement?: string; value?: number }
            if (v.statement) {
              const stmt = loaded.find((s) => s.uri === v.statement)
              if (stmt) stmt.myVote = (v.value ?? null) as -1 | 0 | 1 | null
            }
          }
        } catch {
          /* ignore */
        }
      }

      if (loaded.length === 0) {
        const examples = [
          'Forums should support markdown formatting',
          'Real-time collaboration is more important than async tools',
          'The app should prioritize mobile over desktop',
          'Blender and Godot workflows need dedicated UI sections',
        ]
        examples.forEach((text, i) => {
          loaded.push({ id: `seed-${i}`, uri: '', text, myVote: null })
        })
      }

      setStatements([...loaded])
    } catch {
      setStatements([])
    } finally {
      setLoading(false)
    }
  }, [session?.did])

  useEffect(() => {
    load()
  }, [load])

  const analyze = useCallback(async () => {
    const votes = statements
      .filter((s) => s.myVote !== null)
      .map((s) => ({
        user_id: session?.did ?? 'anonymous',
        statement_id: s.id,
        value: s.myVote as number,
      }))
    if (votes.length > 0) {
      try {
        const r = await analyzeConsensus(votes)
        setResult(r)
      } catch {
        setResult(null)
      }
    } else {
      setResult(null)
    }
  }, [statements, session?.did])

  async function vote(statementId: string, value: -1 | 0 | 1) {
    const stmt = statements.find((s) => s.id === statementId)
    if (!stmt) return
    const newVote = stmt.myVote === value ? null : value
    setStatements((prev) =>
      prev.map((s) => (s.id === statementId ? { ...s, myVote: newVote } : s))
    )

    if (stmt.uri && session?.did) {
      try {
        const rkey = `vote-${stmt.id.replace(/[^a-zA-Z0-9-]/g, '')}`
        if (newVote !== null) {
          await agent.com.atproto.repo.putRecord({
            repo: session.did,
            collection: VOTE_COLLECTION,
            rkey,
            record: {
              $type: VOTE_COLLECTION,
              statement: stmt.uri,
              value: newVote,
              createdAt: new Date().toISOString(),
            },
            validate: false,
          })
        } else {
          try {
            await agent.com.atproto.repo.deleteRecord({
              repo: session.did,
              collection: VOTE_COLLECTION,
              rkey,
            })
          } catch {
            /* may not exist */
          }
        }
      } catch (err) {
        console.error('Failed to persist vote:', err)
      }
    }

    setTimeout(analyze, 0)
  }

  async function addStatement() {
    if (!newStatement.trim()) return
    const text = newStatement.trim()
    let uri = ''
    if (session?.did) {
      try {
        const rkey = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
        const res = await agent.com.atproto.repo.putRecord({
          repo: session.did,
          collection: STATEMENT_COLLECTION,
          rkey,
          record: {
            $type: STATEMENT_COLLECTION,
            title: text,
            body: text,
            tags: ['consensus'],
            createdAt: new Date().toISOString(),
          },
          validate: false,
        })
        uri = res.data.uri
      } catch (err) {
        console.error('Failed to persist statement:', err)
      }
    }
    setStatements((prev) => [
      ...prev,
      { id: uri ? uri.split('/').pop()! : `${Date.now()}`, uri, text, myVote: null },
    ])
    setNewStatement('')
  }

  function getStatementResult(id: string) {
    return result?.statements.find((s) => s.statementId === id)
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h2 className={styles.title}>Consensus</h2>
        <p className={styles.subtitle}>Vote on statements to find where the community agrees. Polis-like collaborative decision making.</p>
      </header>

      {loading && <div className={styles.loading}>Loading…</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {statements.map((stmt) => {
          const sr = getStatementResult(stmt.id)
          return (
            <div
              key={stmt.id}
              style={{
                padding: '1rem',
                background: 'var(--surface)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
              }}
            >
              <p style={{ marginBottom: '0.75rem', lineHeight: 1.5 }}>
                <PostText text={stmt.text} />
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: sr ? '0.5rem' : 0 }}>
                <button
                  type="button"
                  className={stmt.myVote === 1 ? styles.tabActive : styles.tab}
                  style={{ fontSize: '0.9rem', padding: '6px 16px' }}
                  onClick={() => vote(stmt.id, 1)}
                >
                  Agree
                </button>
                <button
                  type="button"
                  className={stmt.myVote === -1 ? styles.tabActive : styles.tab}
                  style={{
                    fontSize: '0.9rem',
                    padding: '6px 16px',
                    background: stmt.myVote === -1 ? 'var(--error)' : undefined,
                    color: stmt.myVote === -1 ? '#fff' : undefined,
                  }}
                  onClick={() => vote(stmt.id, -1)}
                >
                  Disagree
                </button>
                <button
                  type="button"
                  className={stmt.myVote === 0 ? styles.tabActive : styles.tab}
                  style={{ fontSize: '0.9rem', padding: '6px 16px' }}
                  onClick={() => vote(stmt.id, 0)}
                >
                  Pass
                </button>
              </div>
              {sr && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '4px' }}>
                    <span>{Math.round(sr.agreementRatio * 100)}% agree</span>
                    <span>Divisiveness: {Math.round(sr.divisiveness * 100)}%</span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: 'var(--border)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${sr.agreementRatio * 100}%`,
                        background:
                          sr.agreementRatio > 0.66
                            ? 'var(--success, green)'
                            : sr.agreementRatio > 0.33
                              ? 'var(--warning, orange)'
                              : 'var(--error, red)',
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {session?.did && (
        <div
          style={{
            padding: '1rem',
            background: 'var(--surface)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
            marginBottom: '1.5rem',
          }}
        >
          <h3 style={{ marginBottom: '0.5rem' }}>Add a Statement</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="What should the community decide on?"
              value={newStatement}
              onChange={(e) => setNewStatement(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addStatement()}
              style={{ flex: 1, padding: '0.5rem' }}
            />
            <button type="button" className={styles.tabActive} onClick={addStatement}>
              Add
            </button>
          </div>
        </div>
      )}

      {!session && <div className={styles.empty}>Log in to vote and add statements.</div>}

      {result && result.clusterCount > 0 && (
        <div
          style={{
            padding: '1rem',
            background: 'var(--surface)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
          }}
        >
          <h3 style={{ marginBottom: '0.5rem' }}>Opinion Clusters</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
            {result.totalParticipants} participant{result.totalParticipants !== 1 ? 's' : ''} · {result.clusterCount} opinion group
            {result.clusterCount !== 1 ? 's' : ''}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {result.clusters.map((cluster) => (
              <div
                key={cluster.id}
                style={{
                  padding: '0.75rem',
                  flex: '1 1 200px',
                  background: 'var(--bg)',
                  borderRadius: '0.5rem',
                }}
              >
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>Group {cluster.id + 1}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  {cluster.memberCount} member{cluster.memberCount !== 1 ? 's' : ''} · Avg agreement:{' '}
                  {Math.round(cluster.avgAgreement * 100)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ConsensusPage() {
  return (
    <Layout title="Consensus" showNav>
      <ConsensusContent />
    </Layout>
  )
}
