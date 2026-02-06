/**
 * Relative time string (e.g. "2h", "3d", "Mar 5") and exact datetime for tooltips.
 */
export function formatRelativeTime(isoDate: string): string {
  const d = new Date(isoDate)
  const now = new Date()
  const sec = (now.getTime() - d.getTime()) / 1000
  if (sec < 60) return 'now'
  if (sec < 3600) return `${Math.floor(sec / 60)}m`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`
  if (sec < 2592000) return `${Math.floor(sec / 86400)}d`
  if (sec < 31536000) return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatExactDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
