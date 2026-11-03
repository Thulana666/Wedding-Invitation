# Dilki & Supun — Interactive Wedding Invitation

A premium digital wedding invitation for **Dilki & Supun** (Thursday, January 21, 2027 · Saminro Grand Palace, Makola), with a complete RSVP system and a secure event dashboard.

**Guest experience:** a gatefold invitation card that opens in 3D → cinematic hero → scratch-to-reveal card → bride & groom introductions → live countdown (Asia/Colombo) → formal invitation → wedding details & directions → photo gallery with full-screen lightbox → wax-sealed letter → location & contacts → simple four-step RSVP. Background music is optional and only starts after the guest chooses it.

**Organiser dashboard (`/admin`):** live totals, charts, guest management (search, filters, sorting, pagination, add/edit/delete, status changes), personal invitation links with WhatsApp sharing, and CSV exports.

Built with Next.js 16 (App Router, JavaScript), React 19, Framer Motion, CSS Modules and PostgreSQL.

---

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. The admin login is at http://localhost:3000/admin/login — the username and password for local development are in `.env.local` (git-ignored). Copy `.env.example` to `.env.local` on a new machine and fill it in.

No database install is needed locally: without `DATABASE_URL` the app uses **PGlite**, a real Postgres engine embedded in Node, stored on disk. `npm run db:reset` wipes it (stop the dev server first).

> **OneDrive / Dropbox users:** file sync corrupts the embedded database while it is open. Set `PGLITE_DIR` in `.env.local` to a folder outside the synced folder (already done on this machine).

## Editing the wedding details

Everything — names, families, date, venue, events, contacts, RSVP options, story text, letter, music and photo paths — lives in **`src/config/wedding.js`**. Components never hard-code wedding information.

Still waiting for content (marked `PLACEHOLDER` in the config):

| What | Where |
| --- | --- |
| Pre-shoot photographs | `public/images/` — see `public/images/README.md` |
| Bride / groom / love-story text | `story` in `wedding.js` |
| Message inside the envelope | `letter` in `wedding.js` |
| RSVP deadline (optional) | `rsvp.deadline` in `wedding.js` |
| Licensed music track (optional upgrade) | `public/audio/` — see `public/audio/README.md` |
| Exact Google Maps listing | `venue.directionsUrl` / `venue.embedUrl` in `wedding.js` |

The map currently searches Google Maps for "Saminro Grand Palace, Makola, Sri Lanka" rather than guessing coordinates. Once you have the venue's exact Google Maps share link, paste it into `venue.directionsUrl`.

## Invitations and RSVP

There are two ways to invite guests:

1. **Personal links (recommended).** In `/admin/guests` choose *Add guest*, set the allowed party size, then copy the link or press *Share on WhatsApp*. The guest sees "Dear …" on the invitation card, their name is pre-filled, and the number of accompanying guests is limited to what you allowed (enforced on the server).
2. **The main link.** Anyone with `https://your-site/` can RSVP (`rsvp.allowOpenRsvp`); each open response is allowed `rsvp.defaultMaxGuests`. Set `allowOpenRsvp: false` to accept personal links only.

The RSVP asks for: name, contact number, email (optional), attending or not, accompanying guests and their names, which events they'll attend, and an optional message. After replying, guests get a personal link to update their RSVP later (also remembered on their device).

## Checking RSVPs

Sign in at `/admin/login`. *Overview* shows the totals and charts; *Guests* lists every reply (click a name for all details). Use *Export CSV* to download the complete list, confirmed, declined, awaiting-reply or event-attendance lists.

## Deploying on Vercel

1. **Import the project.** Sign in at vercel.com with GitHub → *Add New… → Project* → import `Wedding-Invitation`. Vercel detects Next.js automatically.
2. **Add environment variables** (on the import screen, or later under *Settings → Environment Variables*):

   | Variable | Value |
   | --- | --- |
   | `ADMIN_USERNAME` | Admin username, e.g. `admin` |
   | `ADMIN_PASSWORD` | A password of at least 12 characters (or `ADMIN_PASSWORD_HASH` from `node scripts/hash-password.mjs "your password"`) |
   | `AUTH_SECRET` | 32+ random characters: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |

   Then press **Deploy**.
3. **Add the database.** In the project open *Storage → Create Database → Neon (Serverless Postgres)*, choose the free plan and the **Singapore** region, and connect it to the project. This adds `DATABASE_URL` automatically. Tables are created on the first request.
4. **Redeploy** (*Deployments → ⋯ → Redeploy*) so the new database variable is used.
5. Open the site, send a test RSVP, and sign in at `/admin/login`.

The site runs in Vercel's Singapore region (`vercel.json`), close to guests in Sri Lanka. Links and the WhatsApp preview use the Vercel address automatically. If you add a custom domain (*Settings → Domains*), also set `NEXT_PUBLIC_SITE_URL` to it (e.g. `https://dilkiandsupun.com`) and redeploy.

Every push to `main` on GitHub redeploys the site automatically.

## Security

- Admin pages and APIs are protected twice: `src/proxy.js` and a server-side session check in every route.
- Sessions are signed JWTs in an `httpOnly`, `SameSite=Strict` cookie (12 h). Admin changes from another origin are rejected.
- Login is rate-limited; credentials come only from environment variables; passwords can be stored as scrypt hashes.
- The guest database is never public. A guest can only read or change their own RSVP using their unguessable invitation code. RSVP submissions are validated on the server, rate-limited and protected with a honeypot.
- CSV exports are protected against spreadsheet formula injection.

## Project structure

```
src/
  config/wedding.js        all wedding content and options
  app/                     routes: /, /invite/[code], /admin/*, /api/*
  app/api/rsvp             public RSVP API
  app/api/admin            protected admin APIs (guests, stats, export, auth)
  proxy.js                 admin route protection
  components/              public site sections, opening, music, RSVP, gallery, envelope…
  components/admin/        dashboard UI and charts
  lib/rsvp.js              RSVP validation shared by browser and server
  lib/server/              database, guest data access, auth, sessions, rate limiting, CSV
public/images/             photographs (see README inside)
public/audio/              background music (see README inside)
scripts/                   password hashing, local database reset
```

## Accessibility & performance

Respects `prefers-reduced-motion`, keyboard-accessible dialogs and lightbox, semantic headings and labelled form fields, visible focus states, images optimised to AVIF/WebP and lazy-loaded, the map only loads when requested, ambient particles pause off-screen.
