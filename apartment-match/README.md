# Apartment Match

A tool for ranking Toronto apartment listings (rentals and resale) against the things that
actually matter to you — cost, transit, walkability, safety, commute, and more — with a real
interactive map (OpenStreetMap/Leaflet, no API key needed) and shared data storage (Supabase),
built to run as its own website instead of inside Claude.

This doc walks through getting it live at a real URL. No coding required past copy-pasting —
skip any step for a service you already have set up.

## What you're deploying

- **Next.js** — the web app itself (React + TypeScript), hosted on **Vercel** (free tier is plenty for this).
- **Supabase** — a free hosted Postgres database that stores your listings, so they persist and sync across your devices/browsers.
- **GitHub** — holds the code; Vercel deploys straight from it, and every `git push` auto-redeploys.
- **Leaflet + OpenStreetMap** — the real, pannable/zoomable map with actual streets and place names. Free, no signup, no API key.

Total cost: **$0/month** at this scale (a personal apartment-hunting tool is nowhere near either service's free-tier limits).

## 1. Create a Supabase project (skip if you already have one you want to use)

1. Go to [supabase.com](https://supabase.com), sign up (GitHub login is easiest), and click **New project**.
2. Pick any name/region and a database password (you won't need the password day-to-day — Supabase generates the API keys you'll actually use).
3. Once the project finishes provisioning, open **SQL Editor** in the left sidebar → **New query**.
4. Paste in the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) from this repo and click **Run**. This creates the `listings` table with the right columns and permissions.
5. Go to **Project Settings → API**. You'll need two values from this page in step 3 below:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (a long string under "Project API keys")

## 2. Push this code to GitHub (skip if you're handling this yourself)

From a terminal, inside this project folder:

```bash
git add -A
git commit -m "Initial Apartment Match app"
gh repo create apartment-match --private --source=. --remote=origin --push
```

If you don't have the `gh` CLI, create an empty repo at [github.com/new](https://github.com/new) instead (don't
initialize it with a README), then:

```bash
git remote add origin https://github.com/<your-username>/apartment-match.git
git branch -M main
git push -u origin main
```

## 3. Deploy to Vercel (skip if you're handling this yourself)

1. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub, and **Import** the `apartment-match` repo.
2. Vercel auto-detects Next.js — you don't need to change any build settings.
3. Before clicking Deploy, open **Environment Variables** and add the two values from Supabase step 5:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon public key
4. Click **Deploy**. In about a minute you'll have a live URL like `apartment-match-yourname.vercel.app`.

From now on, every `git push` to `main` automatically redeploys the site.

## Running it locally (optional, for making changes)

```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase URL + anon key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without a `.env.local` set up, the app still
runs — it just falls back to browser-only storage (listings won't persist across reloads or
sync anywhere) and shows a small banner saying so.

## Project structure

```
src/
  app/
    layout.tsx      fonts, page metadata
    page.tsx         main page — state, layout, wiring
    globals.css      design tokens + component styles (ported from the original artifact)
  components/
    WeightSliders.tsx, WorkPanel.tsx, CheatSheet.tsx, FilterBar.tsx
    SummaryCard.tsx, DetailCard.tsx   listing card (collapsed) and full form (expanded)
    MapView.tsx                       the Leaflet map (client-only, dynamically imported)
  lib/
    types.ts          TypeScript types for Listing, Neighbourhood, etc.
    neighbourhoods.ts  the 26 built-in Toronto neighbourhood profiles + approximate lat/lng
    scoring.ts         all scoring/flag/legal-check logic (pure functions, unit-testable)
    supabaseClient.ts, listingsApi.ts   database wiring
    exampleListings.ts the 4 sample listings shown by default
supabase/
  schema.sql          run this once in your Supabase project
```

## Notes on accuracy / things worth knowing

- **Neighbourhood coordinates are approximate centroids**, hand-placed from general geographic
  knowledge — good enough for a city-wide comparison map, not surveyed precision. If you want
  exact boundaries, look at Toronto's Open Data neighbourhood shapefiles and swap in real
  polygons/centroids.
- **Rent/price benchmarks, land-transfer-tax brackets, and the transit-status notes** (Eglinton
  Crosstown, Scarborough subway extension, etc.) reflect what was true as of September 2026.
  These drift — update `src/lib/scoring.ts` and `src/lib/neighbourhoods.ts` periodically, or ask
  Claude to refresh them for you (unlike the sandboxed artifact version, this deployed app has no
  restriction on you or a script fetching live data if you want to automate that later).
- **No login system.** The database's row-level-security policy (in `schema.sql`) allows anyone
  with your Supabase anon key — which is embedded in the deployed site's public JavaScript — to
  read and write listings. That's fine for a personal/household tool with an unlisted URL, but
  don't share the link publicly without adding real authentication (Supabase Auth handles this
  well if you want it later).
- **The map** now uses real OpenStreetMap tiles via Leaflet, so actual streets, transit lines
  drawn on the base map, parks, and landmarks are all there natively — no more schematic overlay
  needed like the sandboxed version had to use.

## Ideas for next steps

- Add Supabase Auth so only you (and whoever you invite) can see/edit listings.
- Pull live listing data automatically (a scraper or the realtor.ca/rentals.ca pages) instead of
  pasting details in by hand.
- Draw TTC subway/streetcar routes as line overlays on the map (GeoJSON) for extra visual context.
- Add a second map layer toggle for satellite imagery (Esri World Imagery tiles are free and work
  the same way as the OpenStreetMap layer already wired up).
