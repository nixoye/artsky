# artsky

A **PWA** (Progressive Web App) that works as an app-style view for [Bluesky](https://bsky.app) (AT Protocol). Use it on your phone or desktop: Pinterest-style feed of images and videos, artboards to save posts, and comment on posts with your Bluesky account.

## Features

- **Feed**: Home timeline and custom Bluesky feeds in a masonry (Pinterest-style) grid of images and videos.
- **Artboards**: Create boards and add posts from the feed; view and remove them later.
- **Comments**: Open any post, write a comment, and post it as a reply from your Bluesky account.
- **PWA**: Install on your phone or desktop; works offline for the UI (feed loads when online).

## Login

Use your **Bluesky handle** (or email) and an **App Password**.

1. In Bluesky go to **Settings → App passwords**.
2. Create a new app password and copy it.
3. In artsky, sign in with your handle and that app password (not your main account password).

## Deploy to GitHub Pages

1. Push this repo to GitHub (e.g. `https://github.com/YOUR_USERNAME/artsky`).

2. **Build and deploy**:
   - **Option A – GitHub Actions**  
     - Ensure the repo has **Settings → Pages → Source**: “GitHub Actions”.
   - **Option B – Manual**  
     - Run `npm run build`, then push the contents of the `dist/` folder to a branch (e.g. `gh-pages`) and set that branch as the Pages source.

3. The app will be at: **`https://YOUR_USERNAME.github.io/artsky/`**

4. On your phone, open that URL in Safari/Chrome and use “Add to Home Screen” to install the PWA.

## Local development

```bash
npm install
npm run dev
```

Open **http://localhost:5173/** (dev uses base `/`). For production-like base path locally, run `npm run build && npm run preview` and open the URL shown (e.g. with base `/artsky/`).

## Tech

- **Vite** + **React** + **TypeScript**
- **@atproto/api** for Bluesky (timeline, feeds, post, reply)
- **react-router-dom** (HashRouter for GitHub Pages)
- **vite-plugin-pwa** for manifest and service worker
- Artboards and session stored in **localStorage** (no backend)

## Repo structure

- `src/lib/bsky.ts` – Bluesky agent, session persistence, feed/reply helpers
- `src/lib/artboards.ts` – Artboard CRUD in localStorage
- `src/pages/` – Login, Feed, Artboards, Artboard detail, Post detail
- `src/components/` – Layout, FeedSelector, PostCard, etc.

## License

MIT
