# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # Production build to dist/
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test suite is configured.

## Architecture

Real-time global intelligence dashboard: incidents, escalation scores, live news, aircraft tracking, AI-generated SITREPs. All live data comes from `https://ops.unocloud.us` (hardcoded backend).

### Data flow

**App.jsx** is the single source of truth. On mount it fetches `/api/score`, `/api/feed`, `/api/incidents`, `/api/earthquakes`, `/api/aircraft`, and `/api/brief`, then opens a Socket.IO connection to `https://ops.unocloud.us`. `state_update` events push incremental updates for all of these. Child components receive data as props; they communicate back via callbacks (`onFlyTo`, `onSave`, `onSatellite`). No state management library — everything is `useState`/`useRef` in App.jsx.

**TimelinePanel** and **PredictionPanel** each manage their own polling (`/api/history` and `/api/prediction` every 30 s) via `useEffect`.

### Panels and their roles

| Component | Purpose |
|---|---|
| `OpsMap.jsx` | Cesium 3D globe — incident pins, aircraft tracking, weather layer, heatmap. Accepts `flyTo` prop to navigate camera |
| `IntelFeed.jsx` | Tagged news feed (CRITICAL/MILITARY/DISASTER/POLITICAL), search/filter, links items to incidents. Accepts `compact` prop for mobile layout |
| `CinemaPanel.jsx` | Multi-stream HLS video grid (DW, Al Jazeera, France 24, NASA TV, Bloomberg, EarthCam, LiveATC) |
| `Header.jsx` | UTC clock, connection indicator, alert level, escalation sparkline |
| `BottomBar.jsx` | Scrolling news ticker, escalation metrics, PDF export |
| `BriefPanel.jsx` | Renders AI-generated SITREP from `/api/brief` |
| `PredictionPanel.jsx` | Claude AI 24-hour threat forecast from `/api/prediction` |
| `SatellitePanel.jsx` | On-demand satellite imagery for a selected incident |
| `AlertSystem.jsx` | Keyword-based alerts with custom RSS feed support |
| `MobileMap.jsx` | Leaflet 2D map used on mobile instead of Cesium |
| `TimelinePanel.jsx` | Historical escalation score chart, polls `/api/history` every 30 s |
| `CountryProfile.jsx` | Country-level threat dossier, derived from feed items and incidents |
| `WatchList.jsx` | Saved feed items from `sigint-watchlist` localStorage |
| `ThemeToggle.jsx` | Dark/light toggle; applies `body.light` class and persists to `sigint-theme` |

### Responsive layout

- **Desktop (>1024 px):** Three-column CSS grid (`240px 1fr 215px`) — CinemaPanel left, globe center, IntelFeed right — with collapsible panels (`BriefPanel`, `PredictionPanel`, `AlertSystem`, `TimelinePanel`, `CountryProfile`, `WatchList`) overlaid above the grid as `collapse-row` strips.
- **Mobile (≤1024 px):** Tab-based navigation (Globe, Feed, Brief, Cinema) with a bottom tab bar; MobileMap replaces OpsMap. Mobile detection uses both viewport width (`<1024`) and UA string.

### Styling

All CSS custom properties are defined in `App.css` (`:root` block) — there are no CSS modules or Tailwind classes. Components reference these variables via inline React `style` props (e.g. `color: 'var(--text-primary)'`). Shared structural classes (`panel`, `collapse-row`, `collapse-header`, `collapse-body`, `feed-card`, `btn`, `tab-pill`, `chip`, `tag`, `metric-card`) are defined in `App.css` and applied via `className`.

Light mode is implemented as a `body.light` class override block at the bottom of `App.css`.

### Persistence (localStorage)

| Key | Contents |
|---|---|
| `sigint-watchlist` | Saved feed items (max 50) |
| `sigint-keywords` | Custom alert keywords |
| `sigint-custom-rss` | User-added RSS feed URLs |
| `sigint-theme` | `'light'` or `'dark'` (default dark) |

### Tech stack

- **React 19** + **Vite 8** (ESM, no Babel transpiler)
- **Cesium.js 1.140** via `vite-plugin-cesium` — `CESIUM_BASE_URL` set to `/cesium` at build time; chunk size warning threshold raised to 10 000 KB because Cesium is large
- **HLS.js** for in-browser HLS playback in CinemaPanel
- **Leaflet / react-leaflet** for the mobile map fallback
- **Socket.IO client** for real-time updates
- ESLint flat config (v9); `no-unused-vars` allows uppercase-only identifiers (Cesium constants)
