import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useModeration, type NsfwPreference } from '../context/ModerationContext'
import styles from './ModerationPage.module.css'

const OPTIONS: { value: NsfwPreference; label: string; description: string }[] = [
  { value: 'nsfw', label: 'NSFW', description: 'Show all content, including adult, unblurred' },
  { value: 'sfw', label: 'SFW', description: 'Hide all adult/NSFW content' },
  { value: 'blurred', label: 'Blurred', description: 'Show NSFW content blurred; tap to reveal' },
]

export default function ModerationPage() {
  const { nsfwPreference, setNsfwPreference } = useModeration()

  return (
    <Layout title="Moderation" showNav>
      <div className={styles.wrap}>
        <p className={styles.back}>
          <Link to="/feed" className={styles.backLink}>
            ← Back to feed
          </Link>
        </p>
        <h1 className={styles.title}>Moderation</h1>
        <p className={styles.intro}>
          Control how adult or sensitive content (NSFW) is shown in Artsky.
        </p>

        <section className={styles.section} aria-labelledby="nsfw-heading">
          <h2 id="nsfw-heading" className={styles.sectionTitle}>
            Adult content (NSFW)
          </h2>
          <div className={styles.toggleGroup} role="group" aria-label="NSFW content preference">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={nsfwPreference === opt.value ? styles.toggleBtnActive : styles.toggleBtn}
                onClick={() => setNsfwPreference(opt.value)}
                aria-pressed={nsfwPreference === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className={styles.hint}>
            {OPTIONS.find((o) => o.value === nsfwPreference)?.description}
          </p>
        </section>
      </div>
    </Layout>
  )
}
