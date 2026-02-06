import { AtpAgent, type AtpSessionData, type AtpSessionEvent } from '@atproto/api'

const BSKY_SERVICE = 'https://bsky.social'
const SESSION_KEY = 'artsky-bsky-session'

function persistSession(_evt: AtpSessionEvent, session: AtpSessionData | undefined) {
  if (session) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch {
      // ignore
    }
  } else {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      // ignore
    }
  }
}

function getStoredSession(): AtpSessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AtpSessionData
  } catch {
    return null
  }
}

export const agent = new AtpAgent({
  service: BSKY_SERVICE,
  persistSession,
})

export async function resumeSession(): Promise<boolean> {
  const session = getStoredSession()
  if (!session?.accessJwt) return false
  try {
    await agent.resumeSession(session)
    return true
  } catch {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      // ignore
    }
    return false
  }
}

export async function login(identifier: string, password: string) {
  const res = await agent.login({ identifier, password })
  return res
}

export function logout() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
  // Session is cleared from storage; agent will have no session on next use
}

export function getSession() {
  return agent.session ?? null
}

export type TimelineResponse = Awaited<ReturnType<typeof agent.getTimeline>>
export type TimelineItem = TimelineResponse['data']['feed'][number]
export type PostView = TimelineItem['post']
export type ThreadView = Awaited<ReturnType<typeof agent.getPostThread>>['data']['thread']

/** Returns the first image or video URL from a post for card display */
export function getPostMediaUrl(post: PostView): { url: string; type: 'image' | 'video' } | null {
  const embed = post.embed as
    | { $type?: string; images?: { thumb: string; fullsize: string }[]; thumbnail?: string; playlist?: string }
    | undefined
  if (!embed) return null
  if (embed.$type === 'app.bsky.embed.images#view' && embed.images?.length) {
    const img = embed.images[0]
    return { url: img.fullsize ?? img.thumb ?? '', type: 'image' as const }
  }
  if (embed.$type === 'app.bsky.embed.video#view' && embed.thumbnail) {
    return { url: embed.thumbnail, type: 'video' }
  }
  // recordWithMedia: media can be in .media
  const media = (embed as { media?: { $type?: string; images?: { fullsize?: string; thumb?: string }[]; thumbnail?: string } }).media
  if (media?.$type === 'app.bsky.embed.images#view' && media.images?.length) {
    const img = media.images[0]
    return { url: img.fullsize ?? img.thumb ?? '', type: 'image' as const }
  }
  if (media?.$type === 'app.bsky.embed.video#view' && media.thumbnail) {
    return { url: media.thumbnail, type: 'video' }
  }
  return null
}

/** Post a reply (comment) to a Bluesky post */
export async function postReply(
  parentUri: string,
  parentCid: string,
  text: string
) {
  const t = text.trim()
  if (!t) throw new Error('Comment text is required')
  return agent.post({
    text: t,
    createdAt: new Date().toISOString(),
    reply: {
      root: { uri: parentUri, cid: parentCid },
      parent: { uri: parentUri, cid: parentCid },
    },
  })
}
