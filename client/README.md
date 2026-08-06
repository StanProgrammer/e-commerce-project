# Client — Wiles and Rues Storefront

React 19 + Vite frontend for the Wiles and Rues e-commerce application.

> See the [root README](../README.md) for setup, environment variables, scripts, and deployment instructions.

## Quick Start

```bash
npm install
npm run dev        # Start the Vite dev server (http://localhost:5173)
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build the production bundle |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest + React Testing Library tests |

## Environment Variables

Copy `.env.example` to `.env.development` for local development:

```env
VITE_API_BACKEND_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

`VITE_API_BACKEND_URL` is optional in production — the app falls back to the current origin when it's unset.

## Structure

```text
src/
├── components/   # Shared UI components (Navbar, Footer, CartModal, ...)
├── pages/        # Route pages (Home, Shop, Blog, Contact, dashboards)
├── routers/      # Route definitions + protected routes
├── store/        # Redux Toolkit slices & RTK Query APIs
├── utils/        # Helpers (baseUrl, error messages, formatting)
├── data/         # Static content (categories, default policy)
└── test/         # Vitest setup
```
