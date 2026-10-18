# 3A DENT – sajt stomatološke ordinacije

Website for Ordinacija opšte stomatologije 3A DENT (Novi Beograd). Layout follows the analysed reference
site's structure; all content, photos, logo and colours are the client's own. Site language: Serbian (Latin).

Stack: [Astro](https://astro.build) 7 (static pages) + Node adapter for the two dynamic routes,
SQLite (better-sqlite3) for appointment requests.

## Run it

```bash
npm install
cp .env.example .env      # fill in values
npm run dev               # http://localhost:4321
npm test                  # build + acceptance checks
npm run build && npm start
```

Node 22.22+ required (Astro 7).

## Preview on GitHub Pages

Every push to `main` builds a **static preview** with `.github/workflows/pages-preview.yml`
(`PUBLIC_PREVIEW_STATIC=1`, `BASE_PATH=/<repo>`). Pages cannot run the Node server, so in the preview
the booking form is shown but disabled, `/admin` shows a notice, and every page is `noindex`.
Enable once: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
On a private repository, Pages needs a paid GitHub plan (Pro, Team or Enterprise).

To build the preview locally:

```bash
PUBLIC_PREVIEW_STATIC=1 BASE_PATH=/ortho-clinic-site npx astro build   # output in dist/
```

Internal links go through `url()` in `src/lib/url.ts` so they work under any base path.

## Audit

With the server running: `CHROME_PATH=/path/to/chrome npm run audit` checks that every sitemap
URL returns 200, then runs Lighthouse (mobile) and axe-core on key pages.

## Deploy (production)

The GitHub Pages preview cannot take bookings. Production needs a server that runs Node and keeps a
disk for SQLite. The repo ships a Docker setup that runs on any Linux VPS (e.g. a small Hetzner,
DigitalOcean or local Serbian VPS, ~5 EUR/month):

1. Point the domain's DNS A records (`example.rs` and `www.example.rs`) to the server.
2. On the server: `git clone` this repo, `cp .env.example .env`, fill in `DOMAIN`, `SITE_URL`,
   `ADMIN_USER`, `ADMIN_PASSWORD` and the `SMTP_*` / `NOTIFY_EMAIL` values.
3. `docker compose up -d --build`. Caddy gets the HTTPS certificate automatically and redirects
   the bare domain to `www`.
4. Check `https://www.<domain>/health` returns `ok`, send a test booking, open `/admin`.

**Backups:** `scripts/backup.mjs` writes a verified copy of the database to `/data/backups` and
keeps the newest `BACKUP_KEEP`. Schedule it on the host and copy the folder off the server:

```cron
0 3 * * * cd /srv/3adent && docker compose exec -T web node scripts/backup.mjs
```

**Data retention:** booked/closed requests are deleted automatically `REQUEST_RETENTION_DAYS`
(default 90) after their last change; staff can delete any request in `/admin` (right to erasure).

**Behind the proxy** Astro trusts `X-Forwarded-*` only for the `SITE_URL` host
(`security.allowedDomains`), so form origin checks see `https://` and the booking rate limit
counts real visitor IPs.

CI (`.github/workflows/docker.yml`) builds the image on every push and smoke-tests it: health,
booking, cross-site rejection, admin login and a backup.

## Where things live

| What | File |
| --- | --- |
| Name, address, phone, email, hours, special dates, service areas, insurers, payments | `src/data/practice.json` (single source of truth, validated on build) |
| Services (one Markdown file each, sub-services listed inside) | `src/content/services/*.md` |
| FAQ | `src/data/faq.json` |
| Photos, logo, video | `public/images/`, `public/video/` |
| Team | `src/content/staff/*.md` |
| Testimonials | `src/content/testimonials.json` (rendered only with `consentRecorded: true` and a `source`) |
| Design tokens | `src/styles/global.css` |
| Booking form | `src/pages/zakazivanje/index.astro` (server-rendered) |
| Request list for staff | `/admin` (HTTP Basic auth, `ADMIN_USER` / `ADMIN_PASSWORD`) |

Header, footer, contact blocks and JSON-LD all read `practice.json`, so phone, address and
hours cannot disagree. Hours are rendered at build time: **rebuild after editing them**.

## Routes

`/`, `/usluge`, `/usluge/{slug}`, `/o-nama`, `/pitanja`, `/kontakt`, `/zakazivanje`,
`/zakazivanje/hvala`, `/privatnost`, `/admin`, `/sitemap-index.xml`, `/robots.txt`.

## Booking

- Works without JavaScript; server-side validation with an error summary.
- Under-18 patients require a guardian name.
- "Imam jak bol (hitno)" flag: urgent requests sort first in `/admin` and the email subject starts with HITNO.
- Phone number is optional site-wide: with `phone: null` in practice.json all call buttons and the schema field disappear.
- Honeypot field; 5 complete submissions per IP per 10 minutes (in memory, single instance).
- Cross-site form posts are rejected by Astro's origin check, which compares against the
  request origin — set `SITE_URL` to the real production origin.
- No medical fields; the note field tells patients not to include medical details.
- Notification email (optional, `SMTP_*` + `NOTIFY_EMAIL`) contains only the request number
  and a link to `/admin`, not the patient's details.
- Status workflow in `/admin`: new → contacted → booked / closed.

## Acceptance checks (`npm run check:site`)

On every built page: exactly one `<h1>`, unique `<title>`, meta description, `alt` on every
image, every `tel:` link and the JSON-LD phone equal to `practice.json`, JSON-LD postcode and
hours count match, and none of the analysed site's strings present.

## Before launch

- [ ] Replace all placeholder content (every page marked *Placeholder*)
- [ ] Clinician approves all clinical text
- [ ] Legal review of `/privacy` (HIPAA/GDPR/local law as applicable)
- [ ] Real coordinates in `practice.json` (`geo`, `mapsUrl`, `profileUrl`)
- [ ] `public/og-default.png` and `public/favicon.svg` replaced with the client's brand
- [ ] HTTPS, `SITE_URL`, admin credentials, SMTP set; `DATA_DIR` backed up
- [ ] Rich Results Test and Lighthouse run against the deployed URL
