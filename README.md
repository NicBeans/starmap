# StarMap

Interactive sky viewer that shows stars, planets, and satellites above your head. Point it at the sky, tap objects to identify them, and track satellite passes in real time.

## Features

- **Dual sky views** — switch between an immersive 3D sphere (React Three Fiber) and a classic 2D planisphere (Canvas)
- **120,000+ stars** from the HYG database with spectral-type coloring and magnitude-based sizing
- **Planet, Moon, and Sun tracking** — positions computed client-side via VSOP87 theory
- **Satellite tracking** — real-time positions from CelesTrak TLEs with upcoming visible pass predictions
- **Deep sky objects** — Messier catalog, notable NGC objects
- **Constellation stick figures** — 12 major constellations with togglable lines
- **Location** — GPS auto-detect or manual entry (city search + lat/long)
- **Time scrubber** — slide through ±24 hours to plan observations, with play/pause animation
- **Quality settings** — Low / Medium / High / Auto with GPU tier detection
- **Favorites** — save stars, planets, and satellites to localStorage
- **PWA** — installable, works offline (star map + planets, satellites need connectivity)
- **Mobile-friendly** — touch gestures, safe area support, 44px touch targets

## Quick Start

```bash
# Install dependencies
npm install

# Download star catalog (~14MB from HYG database)
node scripts/prepare-data.mjs

# Start dev server
npm run dev
```

Open http://localhost:3000 — allow location access or enter a location manually.

## Docker

```bash
# Generate star data first
node scripts/prepare-data.mjs

# Build and run
docker compose up --build
```

The app runs on port 3000. For production on OCI free tier, put nginx in front for SSL termination.

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| 3D Rendering | Three.js, React Three Fiber, drei |
| 2D Rendering | HTML Canvas with azimuthal equidistant projection |
| Astronomy | astronomy-engine (VSOP87 planet positions) |
| Satellites | satellite.js (SGP4/SDP4 propagation) |
| Styling | Tailwind CSS v4 |
| Testing | Vitest, Testing Library, Playwright |
| Deployment | Docker (multi-stage Alpine), GitHub Actions CI |

## Project Structure

```
src/
├── app/              # Next.js pages + API routes
│   ├── api/tle/      # CelesTrak TLE proxy (4h cache)
│   ├── api/geocode/  # Nominatim geocoding proxy
│   └── api/health/   # Health check endpoint
├── components/
│   ├── sky/          # 3D scene, 2D canvas, star field, planets, satellites
│   └── ui/           # TopBar, BottomDrawer, InfoCard, settings, search
├── hooks/            # useLocation, useTime, useFavorites, useSettings
├── lib/              # Astronomy math, catalog loader, projections, storage
└── workers/          # Web worker for satellite propagation
```

## Data Sources

- **Stars**: [HYG Database v42](https://codeberg.org/astronexus/hyg) — 120k stars, downloaded at build time
- **Planets/Moon/Sun**: [astronomy-engine](https://github.com/cosinekitty/astronomy) — computed client-side, no API
- **Satellites**: [CelesTrak](https://celestrak.org) — TLE data fetched via API route, cached 4 hours
- **Geocoding**: [Nominatim](https://nominatim.openstreetmap.org) — proxied via API route

## Testing

```bash
npm test          # unit + component tests (Vitest)
npm run test:e2e  # end-to-end tests (Playwright)
```

## License

MIT
