import { useNavigate, useLocation } from 'react-router-dom'
import LoginCard from '../components/LoginCard'
import type { LoginMode } from '../components/LoginCard'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationMode = (location.state as { mode?: LoginMode })?.mode

  return (
    <div className={styles.wrap}>
      <LoginCard
        initialMode={locationMode}
        onSuccess={() => navigate('/feed', { replace: true })}
      />
    </div>
  )
}
