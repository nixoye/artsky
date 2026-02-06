/**
 * Forum discovery: publication URLs that use the standard.site lexicon.
 * The app fetches /.well-known/site.standard.publication from each URL to get the AT-URI,
 * then lists site.standard.document records from that repo so the forum can show "all" posts.
 * Add more URLs to discover more blogs (e.g. from https://standard.site).
 */
export const FORUM_DISCOVERY_URLS = [
  'https://pckt.blog',
  'https://leaflet.pub',
  'https://offprint.app',
]
