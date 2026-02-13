import { useCallback, useEffect, useState } from 'react'
import { listProjects, createProject } from '../lib/collab'
import { getSession } from '../lib/bsky'
import Layout from '../components/Layout'
import type { CollabProject, ProjectType } from '../types'
import styles from './ForumPage.module.css'

const PROJECT_TYPES: { value: ProjectType; label: string; icon: string }[] = [
  { value: 'blender', label: 'Blender', icon: '🎨' },
  { value: 'godot', label: 'Godot', icon: '🎮' },
  { value: 'general', label: 'General', icon: '📁' },
]

export function CollabContent() {
  const [projects, setProjects] = useState<CollabProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filterType, setFilterType] = useState<string>('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'general' as ProjectType,
    tags: '',
    version: '0.1.0',
    externalUrl: '',
    magnetLink: '',
    previewUrl: '',
  })
  const session = getSession()

  const load = useCallback(async () => {
    if (!session?.did) {
      setLoading(false)
      return
    }
    try {
      const result = await listProjects(session.did)
      setProjects(result.projects)
    } catch {
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [session?.did])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !session?.did) return
    try {
      await createProject({
        name: form.name,
        description: form.description,
        type: form.type,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        version: form.version,
        externalUrl: form.externalUrl || undefined,
        magnetLink: form.magnetLink || undefined,
        previewUrl: form.previewUrl || undefined,
      })
      setShowCreate(false)
      setForm({ name: '', description: '', type: 'general', tags: '', version: '0.1.0', externalUrl: '', magnetLink: '', previewUrl: '' })
      const result = await listProjects(session.did)
      setProjects(result.projects)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Create failed')
    }
  }

  const filtered = projects.filter((p) => !filterType || p.type === filterType)

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h2 className={styles.title}>Collaboration</h2>
        <p className={styles.subtitle}>Blender, Godot, and general projects. Metadata on PDS, files stored externally.</p>
        {session?.did && (
          <button
            type="button"
            className={styles.tab}
            style={{ marginTop: '0.75rem' }}
            onClick={() => setShowCreate(!showCreate)}
          >
            + New Project
          </button>
        )}
      </header>

      {showCreate && session?.did && (
        <div style={{ padding: '1rem', marginBottom: '1rem', background: 'var(--surface)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Create Project</h3>
          <form onSubmit={handleCreate}>
            <input
              type="text"
              placeholder="Project name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              style={{ width: '100%', minHeight: '80px', marginBottom: '0.5rem', padding: '0.5rem' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ProjectType }))}
                style={{ flex: 1, padding: '0.5rem' }}
              >
                {PROJECT_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.icon} {pt.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Version"
                value={form.version}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                style={{ width: '100px', padding: '0.5rem' }}
              />
            </div>
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
            />
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>External storage (optional):</p>
            <input
              type="url"
              placeholder="Git LFS / Cloud URL"
              value={form.externalUrl}
              onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
              style={{ width: '100%', marginBottom: '0.25rem', padding: '0.5rem' }}
            />
            <input
              type="text"
              placeholder="Torrent magnet link"
              value={form.magnetLink}
              onChange={(e) => setForm((f) => ({ ...f, magnetLink: e.target.value }))}
              style={{ width: '100%', marginBottom: '0.25rem', padding: '0.5rem' }}
            />
            <input
              type="url"
              placeholder="Preview URL"
              value={form.previewUrl}
              onChange={(e) => setForm((f) => ({ ...f, previewUrl: e.target.value }))}
              style={{ width: '100%', marginBottom: '0.75rem', padding: '0.5rem' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className={styles.tabActive}>
                Create
              </button>
              <button type="button" className={styles.tab} onClick={() => setShowCreate(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.tabs} style={{ marginBottom: '0.75rem' }}>
        <button
          type="button"
          className={!filterType ? styles.tabActive : styles.tab}
          onClick={() => setFilterType('')}
        >
          All
        </button>
        {PROJECT_TYPES.map((pt) => (
          <button
            key={pt.value}
            type="button"
            className={filterType === pt.value ? styles.tabActive : styles.tab}
            onClick={() => setFilterType(pt.value)}
          >
            {pt.icon} {pt.label}
          </button>
        ))}
      </div>

      {!session ? (
        <div className={styles.empty}>Log in to create and view projects.</div>
      ) : loading ? (
        <div className={styles.loading}>Loading projects…</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>No projects yet. Create one to start collaborating!</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtered.map((project) => {
            const typeInfo = PROJECT_TYPES.find((pt) => pt.value === project.type)
            return (
              <div
                key={project.uri}
                style={{
                  padding: '1rem',
                  background: 'var(--surface)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{typeInfo?.icon ?? '📁'}</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{project.name}</h3>
                  <span className={styles.commentBadge} style={{ marginLeft: 'auto' }}>
                    {project.version}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                  {project.description?.slice(0, 120) || 'No description'}
                </p>
                {project.tags && project.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {project.tags.map((tag) => (
                      <span key={tag} className={styles.commentBadge} style={{ fontSize: '0.75rem' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}>
                  {project.externalUrl && (
                    <a href={project.externalUrl} target="_blank" rel="noopener noreferrer" className={styles.standardLink}>
                      Files
                    </a>
                  )}
                  {project.magnetLink && <span style={{ color: 'var(--muted)' }}>Torrent</span>}
                  {project.previewUrl && (
                    <a href={project.previewUrl} target="_blank" rel="noopener noreferrer" className={styles.standardLink}>
                      Preview
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function CollabPage() {
  return (
    <Layout title="Collaboration" showNav>
      <CollabContent />
    </Layout>
  )
}
