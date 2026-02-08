import { BrowserOAuthClient } from '@atproto/oauth-client-browser'

let client: BrowserOAuthClient | null = null

/** Base URL for the app (origin + pathname to app root). Used as client_id base. */
function getAppBaseUrl(): string {
  const u = new URL(window.location.href)
  const path = u.pathname.replace(/\/index\.html$/, '').replace(/\/?$/, '') || '/'
  return `${u.origin}${path}`
}

/**
 * Load the OAuth client (cached). Client metadata must be at {appBase}/client-metadata.json.
 * Uses bsky.social for handle resolution (see Bluesky OAuth docs for privacy notes).
 */
export async function getOAuthClient(): Promise<BrowserOAuthClient> {
  if (client) return client
  const base = getAppBaseUrl()
  const clientId = `${base}/client-metadata.json`
  client = await BrowserOAuthClient.load({
    clientId,
    handleResolver: 'https://bsky.social/',
  })
  return client
}

/**
 * Initialize OAuth: restore existing session or process callback after redirect.
 * Call once on app load. Returns session if user just completed OAuth or had a stored session.
 */
export async function initOAuth(): Promise<
  | { session: import('@atproto/oauth-client').OAuthSession; state?: string | null }
  | undefined
> {
  const oauth = await getOAuthClient()
  return oauth.init()
}

/**
 * Start OAuth sign-in for the given handle. Redirects the window to Bluesky; never returns.
 */
export async function signInWithOAuthRedirect(handle: string): Promise<never> {
  const oauth = await getOAuthClient()
  return oauth.signInRedirect(handle)
}
