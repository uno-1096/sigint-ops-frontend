# SIGINT Ops — Frontend

Real-time global intelligence dashboard. Live at [ops.unocloud.us](https://ops.unocloud.us).

A self-hosted open-source alternative to platforms like Monitor-the-Situation, SitDeck, and IranMonitor — built from scratch in one day.

## Features

### 3D Globe
- Cesium.js powered interactive globe with satellite imagery
- Country, city, and street labels via CartoDB overlay
- 100+ live incident pins (GDELT + USGS) color-coded by severity
- Click any pin for incident details popup
- Search bar — type any city/country and globe flies there
- Aircraft, Naval, Weather layer tabs

### Intel Feed
- Live news from 16+ sources including Reuters, AP, BBC, Al Jazeera, TASS
- Auto-tagged by category: MILITARY, CRITICAL, DISASTER, POLITICAL
- Click any feed item — globe flies to that location
- Filter by category tabs

### Cinema Panel
- HLS live streams: DW News, Al Jazeera, France 24, NASA TV, Euronews, Bloomberg
- Auto-detects offline streams
- Click to switch between feeds

### Header
- Live escalation index 0-100 with color-coded alert level
- Real-time UTC clock
- WebSocket connection status
- Active incident count

### Bottom Bar
- Escalation level and score
- Active incident count
- Sources online counter
- Polymarket prediction markets link
- IODA internet connectivity monitor link

## Stack

- React 18 + Vite
- Cesium.js (3D globe)
- HLS.js (live video streams)
- Socket.IO client (WebSocket)
- CartoDB tile layers

## Running Locally

```bash
git clone https://github.com/uno-1096/sigint-ops-frontend
cd sigint-ops-frontend
npm install
npm run dev
```

Open http://localhost:5173

## Build and Deploy

```bash
npm run build
scp -r dist user@your-server:~/sigint-ops/frontend/
```

## Architecture

## Related

- [Backend Repository](https://github.com/uno-1096/sigint-ops-backend)
- [Live Site](https://ops.unocloud.us)
- [Infrastructure Repo](https://github.com/uno-1096/terraform-vpc-project)
