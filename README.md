# Biyo Dhawr — Web Dashboard

The government/NGO dashboard of **Biyo Dhawr**, a water-source monitoring and drought early-warning platform for the Awdal region of Somaliland. Staff use it to see every water point on a satellite map, triage community reports coming from the USSD line, run drought-risk predictions per village, and export data.

Part of the [biyo-dhawr](https://github.com/biyo-dhawr) organisation together with [`backend`](https://github.com/biyo-dhawr/backend) (API + risk service) and [`mobile`](https://github.com/biyo-dhawr/mobile) (USSD simulator).

## Features

- **Live map** (Leaflet, satellite/street tiles) with colour-coded markers: Working (green), Needs Repair (amber), Broken (pulsing red), Dry (blue); popups show water level, last maintenance and a link to the source report.
- **Dashboard KPIs**: total sources, pending reports, critical drought zones, active alerts, weekly report chart, live report feed.
- **AI Intelligence Center**: run drought predictions for all villages or one village, see risk distribution and confidence rings; priority maintenance queue with estimated days to failure per source.
- **Field reports** triage: approve (with action taken), reject or delete reports; severity badges.
- **Water sources admin**: search, filter by region/district/status, add/edit/delete, bulk status update, CSV export.
- **Analytics**: status donut, critical villages (click-through to the filtered table), source types, trend area chart, CSV export.
- **Village leaders** management (create accounts scoped to a district).
- **Real-time** refresh through Socket.IO (`water_source_updated`, `prediction_updated`) with SWR polling fallback.
- **Landing page** explaining the USSD → verification → repair flow.

## Tech stack

Next.js 14 (pages router) · React 18 · TypeScript · Tailwind CSS 3 · react-leaflet · Recharts · SWR · socket.io-client · framer-motion · lucide-react.

## Roles

| Role | Sees |
|---|---|
| `GOVERNMENT WORKER` | Dashboard, Water Sources, Analytics, Field Reports, Village Leaders, Settings |
| `VILLAGE LEADER` | Field Reports, Settings (redirected to `/reports` after login) |
| `COMMUNITY MEMBER` | Settings only (reports are submitted via the mobile/USSD channel) |

Accounts are created by a government worker (Village Leaders page) or seeded in the backend; there is no public sign-up.

## Pages

| Route | Purpose |
|---|---|
| `/` | Public landing page |
| `/auth/login` | Sign in (JWT stored in `localStorage`) |
| `/dashboard` | KPIs, weekly chart, filterable map, live reports, AI Intelligence Center |
| `/admin/water-sources` | Water source table, CRUD, bulk actions, CSV export |
| `/water-sources/[id]` | AI-generated source report (map, summary, concerns, actions) |
| `/reports` | Field reports triage |
| `/analytics` | Charts and analytics export |
| `/admin/village-leaders` | Manage village leader accounts |
| `/settings` | Profile |

## Project layout

```
src/
├── pages/            # routes (see table above), _app.tsx wraps everything in Layout
├── components/
│   ├── Layout.tsx            # sidebar + header, role-filtered nav, alert bell (30 s poll)
│   ├── AuthGuard.tsx         # client-side role guard (requireStaff / requireAdmin)
│   ├── DashboardMap.tsx      # react-leaflet map, markers, legend, tile toggle
│   ├── IntelligencePanel.tsx # drought predictions + water-source intel, Socket.IO client
│   └── AddWaterSourceModal.tsx
├── lib/
│   ├── api.ts        # fetch wrapper: base URL, Bearer token, 401 handling
│   ├── types.ts      # API types
│   └── export.ts     # CSV export helper
└── styles/globals.css
```

## Running locally

Prerequisites: Node 18+, and the [backend](https://github.com/biyo-dhawr/backend) running on port 4000 (plus its Python service on 8000 for the AI panel).

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm run dev                    # http://localhost:3000
```

The dev server must run on port **3000**: the backend's CORS and Socket.IO origin are fixed to `http://localhost:3000`.

Other scripts: `npm run build`, `npm start`, `npm run lint`.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | Backend base URL. The Socket.IO origin is derived from it by stripping `/api`. |

## API usage

All calls go through `src/lib/api.ts` (`api.get/post/put/patch/delete`). Main endpoints: `/auth/login`, `/dashboard/stats`, `/water-sources` (+ `/intelligence`, `/:id/report`, `/bulk-status`), `/reports` (+ `/:id/verify`, `/:id/reject`, `/trend/weekly`), `/predictions/drought`, `/analytics`, `/alerts?active=true`, `/regions`, `/districts`, `/villages`, `/users/village-leaders`. See the backend [API reference](https://github.com/biyo-dhawr/backend/blob/main/docs/API.md).

## Known limitations

- Dashboard trend badge (`+2.4%`) and the analytics trend chart use placeholder values from the API.
- District IDs for the dashboard village filter are hard-coded (`Borama 34, Zeylac 35, Baki 36, Lughaye 37`) and must match the seeded database.
- `pages/api/image.ts` and `copy-images.js` were one-off helpers used to copy the landing images into `public/images`; they can be ignored.
- UI text is English; Somali is used in the USSD channel.

## Team

Built by the Biyo Dhawr team for the Amoud University competition (1st place):
[@Ibrahim-Abdirashid](https://github.com/Ibrahim-Abdirashid), [@AyoubKilwe](https://github.com/AyoubKilwe), [@abdilahi-fullstack-dev](https://github.com/abdilahi-fullstack-dev), [@Abdulahia-39](https://github.com/Abdulahia-39).

## License

MIT — see [LICENSE](LICENSE).
