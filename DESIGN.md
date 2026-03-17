# StarMap — Sky Viewer Web App

## Overview

A casual-first stargazing web app that shows the real-time sky above your head. Pan around, tap stars to learn about them, track satellites, and plan observations with a time scrubber. Works offline in the field via PWA.

## Architecture

Single Next.js monolith in a Docker container. All astronomical computation happens client-side. API routes act as thin proxies for satellite TLE data and geocoding.

```
┌─────────────────────────────────────────────┐
│              Docker Container               │
│  ┌───────────────────────────────────────┐  │
│  │           Next.js App                 │  │
│  │  Pages/Components  │  API Routes      │  │
│  │                    │  /api/tle        │  │
│  │                    │  /api/geocode    │  │
│  │                    │  /api/health     │  │
│  │─────────────────────────────────────  │  │
│  │        Client Runtime                 │  │
│  │  R3F/Canvas Views │ astronomy-engine  │  │
│  │  Star Catalog     │ satellite.js      │  │
│  └───────────────────────────────────────┘  │
│               Service Worker (PWA)          │
└─────────────────────────────────────────────┘
         │                    │
    CelesTrak API      Geocoding API
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS v4
- **3D**: Three.js, React Three Fiber, drei
- **Astronomy**: astronomy-engine (planet/moon/sun positions)
- **Satellites**: satellite.js (SGP4/SDP4 propagation)
- **Testing**: Vitest, Testing Library, Playwright
- **Deployment**: Docker (multi-stage Alpine), OCI free tier ARM instance

## Features

### Sky Viewing
- **Two swappable views**: 3D immersive sphere (R3F) and 2D projected planisphere (Canvas)
- Deep star catalog: HYG database (~120k stars) + NGC/Messier deep sky objects (~13k)
- Stars rendered with magnitude-based sizing and spectral-type coloring
- Constellation lines, coordinate grid, horizon with cardinal directions (all togglable)

### Celestial Bodies
- Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Moon, Sun
- Positions computed client-side via astronomy-engine (VSOP87)
- Distinct billboard sprites with icons

### Satellite Tracking
- TLE data from CelesTrak, cached 4 hours via API route
- ~500 brightest satellites by default with group filters (ISS, Starlink, etc.)
- Current positions + upcoming visible pass predictions
- Tap for orbital details (altitude, speed, next pass)
- Propagation runs in a web worker to keep UI smooth

### Location
- GPS via browser Geolocation API
- Manual entry: city/place name search (geocoding proxy) or raw lat/long

### Time Control
- Time scrubber: ±24 hours default, expandable to ±30 days
- Play/pause animation
- "Now" snap-back button

### User Data (localStorage)
- Favorites (saved star/object IDs)
- Last used location
- Preferences (quality, default view, theme, layer visibility)
- Recent location searches

### Performance
- Quality toggle: Low / Medium / High / Auto
- LOD system: Low (mag 4, ~500 stars), Medium (mag 6, ~9k stars), High (full catalog)
- Auto mode uses detect-gpu for device capability detection
- Zoom reveals fainter objects dynamically
- Target: 60fps mid-range phones at Medium, 30fps minimum on low-end at Low

### Offline (PWA)
- Service worker caches app shell + bundled star catalog
- Star map, planets, time scrubber all work offline
- Satellite tracking requires connectivity

## UI Layout

- **Dark theme** by default (stargazing essential)
- Full-viewport sky view as main content
- **Top bar** (floating, semi-transparent): location, time, view toggle, settings
- **Bottom drawer** (mobile pull-up): search, quick filters, favorites, satellite passes
- **Info card** (on tap): object name, type, stats, add-to-favorites, center-on-this
- **Time scrubber**: expandable bar with slider + play/pause
- Responsive: touch gestures on mobile, mouse/trackpad + hover on desktop

## Project Structure

```
antigravity_test/
├── public/
│   ├── data/
│   │   ├── hyg_catalog.bin
│   │   ├── dso_catalog.bin
│   │   └── constellations.json
│   ├── icons/
│   └── manifest.json
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   │       ├── tle/route.ts
│   │       ├── geocode/route.ts
│   │       └── health/route.ts
│   ├── components/
│   │   ├── sky/
│   │   │   ├── SkyView3D.tsx
│   │   │   ├── SkyView2D.tsx
│   │   │   ├── StarField.tsx
│   │   │   ├── Planets.tsx
│   │   │   ├── Satellites.tsx
│   │   │   ├── Constellations.tsx
│   │   │   ├── Horizon.tsx
│   │   │   └── GridOverlay.tsx
│   │   ├── ui/
│   │   │   ├── TopBar.tsx
│   │   │   ├── BottomDrawer.tsx
│   │   │   ├── InfoCard.tsx
│   │   │   ├── TimeScrubber.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   └── LocationPicker.tsx
│   │   └── common/
│   ├── lib/
│   │   ├── astronomy.ts
│   │   ├── catalog.ts
│   │   ├── satellites.ts
│   │   ├── projection.ts
│   │   ├── coordinates.ts
│   │   ├── lod.ts
│   │   └── storage.ts
│   ├── workers/
│   │   └── satellite-worker.ts
│   └── hooks/
│       ├── useLocation.ts
│       ├── useTime.ts
│       ├── useFavorites.ts
│       └── useSettings.ts
├── tests/
│   ├── unit/
│   ├── component/
│   └── e2e/
├── Dockerfile
├── docker-compose.yml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .github/
    └── workflows/
        └── ci.yml
```

## Testing Strategy

- **Unit (Vitest)**: coordinate math, projection functions, catalog indexing, pass prediction
- **Component (Vitest + Testing Library)**: UI components render correctly, interactions work
- **E2E (Playwright)**: app loads, location change updates view, tap shows info, view toggle, time scrubber
- 3D rendering mocked in unit/component tests — test data pipeline, not WebGL

## Deployment

- **Docker**: multi-stage Alpine build, ~150-200MB final image, non-root user
- **OCI free tier**: ARM Ampere A1 instance
- **Nginx** reverse proxy with Let's Encrypt SSL
- **Manual deploys**: SSH → pull → restart
- **CI (GitHub Actions)**: lint + test + build image → push to ghcr.io

## Data Sources

- **Stars**: HYG Database (bundled, ~8-10MB compressed binary)
- **Deep sky**: NGC/Messier catalog (bundled)
- **Constellations**: IAU constellation lines (bundled JSON)
- **Planets/Moon/Sun**: astronomy-engine (computed, no API)
- **Satellites**: CelesTrak TLE API (live, cached 4h)
- **Geocoding**: Nominatim/OpenStreetMap (proxied)

## Decision Log

| # | Decision | Alternatives | Rationale |
|---|----------|-------------|-----------|
| 1 | Casual-first stargazing app | Pure educational, pure hobbyist | Broadest appeal |
| 2 | Dual view (2D + 3D swappable) | Single view | User requested |
| 3 | Deep star catalog (~120k + 13k DSOs) | Major/moderate only | User wants full depth |
| 4 | Satellite passes + tap-for-details | Dots only, full orbital | Clean UI with depth on demand |
| 5 | Bundled catalog + live APIs for satellites | All API, all bundled | Reliable offline core |
| 6 | Next.js + R3F + Tailwind v4 | Other stacks | Best fit for 3D interactive app |
| 7 | City search + lat/long | One or the other | Flexibility |
| 8 | Time scrubber ±24h (expandable ±30d) | Real-time only | Enables planning |
| 9 | localStorage, no auth | User accounts | Simplicity |
| 10 | Quality toggle (Low/Med/High/Auto) | Fixed quality | User control |
| 11 | PWA offline support | Online-only | Essential for field use |
| 12 | OCI free tier ARM instance | Other clouds | User's existing infra |
| 13 | Next.js monolith | SPA + microservice, fully static | Simplest architecture |
| 14 | Compressed binary catalog format | Raw JSON | Size efficiency |
| 15 | astronomy-engine client-side | Server ephemeris, API | Zero API dependency |
| 16 | satellite.js in web worker | Main thread | Keeps UI responsive |
| 17 | Vitest + Testing Library + Playwright | Jest, Cypress | Modern, fast, native ESM |
| 18 | Multi-stage Alpine Docker image | Full node image | Small for OCI free tier |
| 19 | Manual deploys | Full CI/CD to OCI | Simplicity for now |
