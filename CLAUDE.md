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
| `IntelFeed.jsx` | Tagged news feed (CRITICAL/MILITARY/DISASTER/POLITICAL), search/filter, links items to incidents |
| `CinemaPanel.jsx` | Multi-stream HLS video grid (DW, Al Jazeera, France 24, NASA TV, Bloomberg, EarthCam, LiveATC) |
| `Header.jsx` | UTC clock, connection indicator, alert level, escalation sparkline |
| `BottomBar.jsx` | Scrolling news ticker, escalation metrics, PDF export |
| `BriefPanel.jsx` | Renders AI-generated SITREP from `/api/brief` |
| `PredictionPanel.jsx` | Claude AI 24-hour threat forecast from `/api/prediction` |
| `SatellitePanel.jsx` | On-demand satellite imagery for a selected incident |
| `AlertSystem.jsx` | Keyword-based alerts with custom RSS feed support |
| `MobileMap.jsx` | Leaflet 2D map used on mobile instead of Cesium |

### Responsive layout

- **Desktop (>1024 px):** Three-column CSS grid — CinemaPanel left, globe center, IntelFeed right — with panels overlaid on the globe.
- **Mobile (≤1024 px):** Tab-based navigation (Globe, Feed, Brief, Cinema) with a bottom tab bar; MobileMap replaces OpsMap.

### Persistence (localStorage)

| Key | Contents |
|---|---|
| `sigint-watchlist` | Saved feed items (max 50) |
| `sigint-keywords` | Custom alert keywords |
| `sigint-custom-rss` | User-added RSS feed URLs |

### Tech stack

- **React 19** + **Vite 8** (ESM, no Babel transpiler)
- **Cesium.js 1.140** via `vite-plugin-cesium` — `CESIUM_BASE_URL` set to `/cesium` at build time; chunk size warning threshold raised to 10 000 KB because Cesium is large
- **HLS.js** for in-browser HLS playback in CinemaPanel
- **Leaflet / react-leaflet** for the mobile map fallback
- **Socket.IO client** for real-time updates
- ESLint flat config (v9); `no-unused-vars` allows uppercase-only identifiers (Cesium constants)
