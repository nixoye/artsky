/**
 * Microcosm Constellation API – backlink index for AT Proto.
 * @see https://www.microcosm.blue/ https://constellation.microcosm.blue/
 * Used to get downvote (and optional upvote) counts for posts so we can sort and display.
 */

const CONSTELLATION_BASE = 'https://constellation.microcosm.blue'

/** ArtSky downvote collection: records reference a post via subject.uri */
const DOWNVOTE_COLLECTION = 'app.artsky.feed.downvote'
const DOWNVOTE_PATH = '.subject.uri'

/**
 * Get the number of distinct DIDs that have downvoted a post (records in app.artsky.feed.downvote targeting this post).
 * Constellation indexes records from the firehose, so new downvotes may take a short time to appear.
 */
export async function getDownvoteCount(postUri: string): Promise<number> {
  const params = new URLSearchParams({
    target: postUri,
    collection: DOWNVOTE_COLLECTION,
    path: DOWNVOTE_PATH,
  })
  const res = await fetch(`${CONSTELLATION_BASE}/links/count/distinct-dids?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return 0
  const data = (await res.json()) as { total?: number }
  return typeof data.total === 'number' ? data.total : 0
}

/**
 * Get downvote counts for multiple post URIs in one batch (parallel requests).
 * Returns a map of post URI -> count.
 */
export async function getDownvoteCounts(postUris: string[]): Promise<Record<string, number>> {
  const unique = [...new Set(postUris)]
  const results = await Promise.all(
    unique.map(async (uri) => {
      const count = await getDownvoteCount(uri)
      return { uri, count }
    })
  )
  const out: Record<string, number> = {}
  for (const { uri, count } of results) out[uri] = count
  return out
}
