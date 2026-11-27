# PartyQueue — Real-Time Party Jukebox

A sleek, real-time Party Jukebox built for Mac party hosts and mobile guests. Guests scan the on-screen QR code from their phones to search YouTube or paste a YouTube/YouTube Music link, upvote tracks, and watch the live queue—while the host's Mac automatically plays everything on an Apple Music-inspired dark glassmorphic stage with native macOS Media Keys & Control Center integration.

---

## Features

- **Guest Remote (`/` or `/room/:roomId`):** Mobile-first remote with nickname onboarding, YouTube Data API v3 search, zero-quota direct link paste (`oEmbed`), live Now Playing bar, Upvote toggles, and anti-spam track limit per guest.
- **Mac Host Stage (`/host` or `/room/:roomId/host`):** 4-digit PIN lock, Video Stage vs. Ambient Blur Cover Art toggle, live QR code corner widget, Host controls (Play/Pause, Skip, Move to Top, Remove, Clear, FIFO vs. Votes sort, Lock Requests, Max Tracks/User), auto-advance on track end, and auto-skip on embed-restricted videos.
- **macOS MediaSession Integration:** Syncs artwork, title, requester/channel, and playback state to macOS Control Center / Menu Bar Now Playing and MacBook physical Play/Pause/Next keys.
- **Bilingual Thai / English (`TH | EN`):** Full bilingual UI with `Plus Jakarta Sans` + `Noto Sans Thai`.
- **Zero-Config Demo Mode:** Runs out of the box using `localStorage` + `BroadcastChannel` if Firebase `.env` keys are not set yet.

---

## 3-Minute Production Setup

### 1. Run Locally Right Away (Demo Mode)
```bash
npm install
cp .env.example .env
npm run dev
```
Open `http://localhost:5173/host` on your Mac and `http://localhost:5173` in another tab (default Host PIN: `0000`).

### 2. Firebase Firestore + Anonymous Auth (2 mins)
1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication → Sign-in method → Anonymous**.
3. Create a **Cloud Firestore** database and paste the rules from [`firestore.rules`](./firestore.rules) into **Firestore → Rules → Publish**.
4. Register a **Web App** in Project Settings and copy the config values into `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### 3. YouTube Data API v3 Key (1 min)
1. In [Google Cloud Console](https://console.cloud.google.com/), enable **YouTube Data API v3**.
2. Create an API key (optionally restrict by HTTP referrer to your domain) and set `VITE_YOUTUBE_API_KEY` in `.env`.
> Note: Direct YouTube link pasting (`youtube.com`, `youtu.be`, `music.youtube.com`) uses YouTube's public oEmbed endpoint and works **even without an API key**.

### 4. Deploy to Vercel or GitHub Pages
- **Vercel (Recommended):** Push to GitHub and import into [Vercel](https://vercel.com/). Add your `.env` variables in **Settings → Environment Variables**. `vercel.json` is already configured with SPA rewrites for `/host` and `/room/:roomId`.
- **GitHub Pages:** Set `"base"` in `vite.config.ts` if deploying to a repo subpath, run `npm run build`, and publish `dist/` (note: for static GitHub Pages subpath hosting without server rewrites, copy `dist/index.html` to `dist/404.html`).
