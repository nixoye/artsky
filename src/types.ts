import type { PostView, TimelineItem } from './lib/bsky'

export type { PostView, TimelineItem }

export type FeedKind = 'timeline' | 'custom'
export interface FeedSource {
  kind: FeedKind
  label: string
  /** For custom: at://did/app.bsky.feed.generator/... */
  uri?: string
}
