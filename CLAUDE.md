# Joe in the Studio — joeinthestudio.com

Official website for **Joe in the Studio**, the artist stage name of Yusif Aliyev. Deployed to GitHub Pages via CNAME `joeinthestudio.com`.

## Stack

- **Static site** — no build step, no bundler, no npm install required
- HTML + vanilla JS (ESM modules) + CSS
- Bootstrap 5.3 + Bootstrap Icons 1.11
- Fonts: Playfair Display, Source Sans 3 (Google Fonts)
- Hosted on GitHub Pages (`main` branch → `joeinthestudio.com`)

## File layout

```
index.html          — Home page
css/styles.css      — All custom styles
js/main.js          — Main JS (ESM module, type="module")
data/data.json      — Artist info, social links, YouTube IDs, Instagram posts
data/releases.json  — Discography: title, year, type, cover, streaming URLs, lyrics
lyrics/index.html   — Lyrics hub + single song view
lyrics/script.js    — Lyrics page JS
links/index.html    — "All Links" page (linktree-style)
links/script.js     — Links page JS
redirect/           — URL redirect page
Assets/             — favicon.png, logo.jpg, album-covers/rel_XXX.jpg, media/img-XX.jpg
scripts/generate-seo.js  — Node script: regenerates JSON-LD + noscript blocks in both HTMLs
.github/workflows/generate-seo.yml  — CI: runs generate-seo.js on push
```

## Data-driven content — how to update

### Add a new release
1. Add an object to `data/releases.json`. Fields:
   - `id`: `"rel_NNN"` (increment from last)
   - `title`, `type` (e.g. `"Single"`), `year`
   - `cover`: `"Assets/album-covers/rel_NNN.jpg"` (add image too)
   - `spotify_url`, `apple_music_url`
   - `lyrics`: full lyrics string with `[Section]` markers
2. Run `node scripts/generate-seo.js` to regenerate JSON-LD and noscript fallbacks in both HTML files.

### Update YouTube videos
Edit `youtube_videos` array in `data/data.json` (YouTube video IDs, not full URLs).

### Update Instagram posts
Edit `instagram_posts` array in `data/data.json` (full Instagram post URLs).

### Add/change artist info, bio, highlights, social links
Edit `data/data.json` — `artist`, `contacts`, `socials` objects.

## SEO system

HTML files contain marker comments that `generate-seo.js` rewrites:

```html
<!-- GEN:JSONLD:START --> ... <!-- GEN:JSONLD:END -->
<!-- GEN:NOSCRIPT:START --> ... <!-- GEN:NOSCRIPT:END -->
```

**Always run `node scripts/generate-seo.js` after editing `releases.json`.** The CI workflow also runs it automatically on push.

## JS patterns

- `js/main.js` uses ESM imports from JSON files: `import * as json from '../data/data.json' with {type: 'json'}`
- All rendering is done at boot in an IIFE.
- Custom carousel: `.carousel-shell > .carousel-window > .carousel-track` with prev/next buttons. Set up via `setupCarousel(trackId)`.
- No framework, no TypeScript. Plain DOM manipulation with `$()` / `el()` helpers.

## Deployment

Push to `main` → GitHub Pages auto-deploys. No build step needed. SEO script runs in CI.
