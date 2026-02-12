/**
 * Microcosm Constellation API – Downvote counts for AT Protocol
 *
 * @see https://constellation.microcosm.blue/
 */

const CONSTELLATION_BASE = 'https://constellation.microcosm.blue'
const DOWNVOTE_COLLECTION = 'app.artsky.feed.downvote'
const DOWNVOTE_PATH = '.subject.uri'

/** Get the number of distinct users who have downvoted a post. */
export async function getDownvoteCount(postUri: string): Promise<number> {
  const params = new URLSearchParams({
    target: postUri,
    collection: DOWNVOTE_COLLECTION,
    path: DOWNVOTE_PATH,
  })
  try {
    const res = await fetch(
      `${CONSTELLATION_BASE}/links/count/distinct-dids?${params}`,
      { headers: { Accept: 'application/json' } }
    )
    if (!res.ok) return 0
    const data = (await res.json()) as { total?: number }
    return typeof data.total === 'number' ? data.total : 0
  } catch {
    return 0
  }
}

/** Get downvote counts for multiple posts in parallel. */
export async function getDownvoteCounts(postUris: string[]): Promise<Record<string, number>> {
  const unique = [...new Set(postUris)]
  const results = await Promise.all(
    unique.map(async (uri) => ({ uri, count: await getDownvoteCount(uri) }))
  )
  const out: Record<string, number> = {}
  for (const { uri, count } of results) out[uri] = count
  return out
}
