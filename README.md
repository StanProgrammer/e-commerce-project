# Wiles and Rues — E-commerce Project

[![CI](https://github.com/StanProgrammer/e-commerce-project/actions/workflows/ci.yml/badge.svg)](https://github.com/StanProgrammer/e-commerce-project/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-%3E%3D20.19-green)
![License](https://img.shields.io/badge/license-ISC-blue)

A full-stack **MERN** e-commerce application with a React storefront, user & admin dashboards, Stripe payments, Redis caching, blog & policy management, reviews, contact handling, and Cloudinary image uploads.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Create an Admin Account](#4-create-an-admin-account)
- [Running Locally](#running-locally)
- [Testing](#testing)
- [API Documentation (Swagger & Postman)](#api-documentation-swagger--postman)
- [API Overview](#api-overview)
- [Redis Caching](#redis-caching)
- [Stripe Webhook Setup](#stripe-webhook-setup)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

**Storefront**

- Product browsing with category, color, price filters and pagination
- Search across the catalog, category pages, and product detail pages with related products
- Trending products, deals, and promo sections on the home page
- Shopping cart (Redux-persisted) and full checkout flow

**Accounts & Payments**

- Authentication with JWT stored in an httpOnly cookie, plus Google OAuth login
- Password reset via email (Nodemailer + Gmail SMTP)
- Stripe checkout with server-side stock validation and webhook-confirmed orders
- Reviews — only verified purchasers of a product can review it

**Dashboards**

- User dashboard: orders, payments, reviews, profile management, and personal stats
- Admin dashboard: products, users, orders, blogs, policies, feedback, and chart-based statistics

**Content & Communication**

- Blog posts and store policy pages, fully managed by admins
- Contact form delivered to the store inbox via Resend
- In-app feedback widget for bug/feature reports (anonymous or attributed)

**Infrastructure & Hardening**

- MongoDB persistence with Mongoose, optional Redis caching with health reporting and automatic cache invalidation
- Cloudinary image uploads (products, blogs, avatars)
- Helmet security headers, CORS origin allow-listing, rate limiting, and Joi validation
- Interactive Swagger/OpenAPI docs, a generated Postman collection, and CI/CD via GitHub Actions

## Tech Stack

**Client** (`client/`)

| Technology | Purpose |
| --- | --- |
| React 19 + Vite 7 | UI framework and build tooling |
| React Router 7 | Routing and protected routes |
| Redux Toolkit + RTK Query | State management and API layer |
| Redux Persist | Persist the cart across reloads |
| Tailwind CSS 4 | Styling |
| Chart.js + react-chartjs-2 | Dashboard statistics charts |
| Motion | Animations |
| Stripe.js | Checkout redirect |
| Vitest + React Testing Library | Unit and component tests |

**Server** (`server/`)

| Technology | Purpose |
| --- | --- |
| Node.js + Express 5 | REST API |
| MongoDB + Mongoose 9 | Data persistence |
| Redis (node-redis) | Response caching |
| JWT (`jsonwebtoken`) | Session auth (httpOnly cookie) |
| Joi | Request validation |
| Multer + Cloudinary | Image uploads |
| Stripe | Checkout sessions and webhooks |
| Nodemailer + Resend | Transactional and contact emails |
| Helmet, cors, cookie-parser, rate limiting | Security hardening |
| Jest + Supertest | Server integration tests |
| Swagger UI Express | Interactive API docs |

## Project Structure

```text
.
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── components/          # Shared UI (Navbar, Footer, CartModal, ...)
│   │   ├── pages/               # Route pages (Home, Shop, Blog, Contact, dashboards)
│   │   ├── routers/             # Route definitions + protected routes
│   │   ├── store/               # Redux Toolkit slices & RTK Query APIs
│   │   ├── utils/               # Helpers (baseUrl, error messages, formatting)
│   │   ├── data/                # Static content (categories, default policy)
│   │   └── test/                # Vitest setup
│   └── package.json
├── server/                      # Express API backend
│   ├── config/                  # Env, database & Redis configuration
│   ├── controllers/             # Request handlers
│   ├── middlewares/             # Auth, rate limiting, error handling
│   ├── models/                  # Mongoose schemas
│   ├── routes/                  # Express routers
│   ├── utils/                   # Cache, email, uploads, helpers
│   ├── validation/              # Joi schemas
│   ├── scripts/                 # seedAdmin, generatePostman
│   ├── tests/                   # Jest + Supertest integration tests
│   ├── swagger.js               # OpenAPI spec (source of truth for docs)
│   └── server.js                # App entry point
├── .github/workflows/ci.yml     # CI pipeline (lint, test, build)
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js 20.19+** and **npm** (required by Vite 7; the CI pipeline uses Node 22)
- **MongoDB** (local, Docker, or Atlas)
- **Redis** (optional — the app runs without it, caching is just disabled)
- **Stripe** account for checkout payments
- **Cloudinary** account for image uploads
- **Google Cloud** OAuth credentials for Google login (optional)
- **Resend** and/or **Gmail app password** for emails (optional, only for contact/reset features)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Install Dependencies

From the repository root (installs both apps):

```bash
npm run install:all
```

Or install each app individually:

```bash
cd client
npm install

cd ../server
npm install
```

### 3. Configure Environment Variables

#### Server

The server loads `server/.env` first, then applies environment-specific overrides from `server/.env.local` (development) or `server/.env.production` (production). Copy the template and fill in real values:

```bash
cd server
cp .env.example .env        # base configuration
cp .env.example .env.local  # optional local overrides
```

<details>
<summary>Full server environment variables</summary>

```env
NODE_ENV=development
PORT=5000
DB_URL=your_mongodb_connection_string
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES=7d

CLIENT_URL=http://localhost:5173
CLIENT_URLS=http://localhost:5173,http://127.0.0.1:5173
CORS_ORIGINS=
PASSWORD_RESET_CLIENT_URL=http://localhost:5173
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
COOKIE_DOMAIN=

STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me

CLOUDINARY_CLOUD_NAME=replace_me
CLOUDINARY_API_KEY=replace_me
CLOUDINARY_API_SECRET=replace_me

GOOGLE_CLIENT_ID=replace_me.apps.googleusercontent.com

RESEND_API_KEY=re_replace_me
CONTACT_TO_EMAIL=you@example.com
CONTACT_FROM_EMAIL=verified-sender@example.com

GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=replace_me
SMTP_TIMEOUT_MS=20000

REDIS_ENABLED=false
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=wiles-rues:
REDIS_CONNECT_TIMEOUT_MS=10000
REDIS_PING_TIMEOUT_MS=3000
CACHE_PRODUCTS_LIST_TTL_SECONDS=120
CACHE_PRODUCT_DETAIL_TTL_SECONDS=300
CACHE_RELATED_PRODUCTS_TTL_SECONDS=180
CACHE_BLOGS_LIST_TTL_SECONDS=180
CACHE_BLOG_DETAIL_TTL_SECONDS=600
CACHE_POLICY_TTL_SECONDS=900

SEED_DEFAULT_BLOGS=true
MONGOOSE_MAX_POOL_SIZE=10
```

</details>

#### Client

Copy `client/.env.example` to `client/.env.development` (loaded by Vite in dev mode):

```bash
cd ../client
cp .env.example .env.development
```

```env
VITE_API_BACKEND_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

> **Note:** `VITE_API_BACKEND_URL` is optional in production — when it's unset, the client falls back to `window.location.origin` (useful when the API is served from the same domain).

### 4. Create an Admin Account

An admin user is **not** created automatically. Seed one directly in MongoDB:

```bash
cd server
node scripts/seedAdmin.js
```

The script prints the test credentials (defaults: `admin@willowrue.com` / `Admin@1234`). Override them per-run with env vars:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='StrongPass!123' node scripts/seedAdmin.js
```

> **Important:** the committed defaults are only intended for local/testing. Always override with strong credentials in any shared environment.

On server startup, `SEED_DEFAULT_BLOGS=true` (the default) also inserts starter blog posts for any slugs that don't already exist (keyed by slug, so it's safe to leave enabled).

## Running Locally

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in a second terminal:

```bash
cd client
npm run dev
```

Or run both from the repository root:

```bash
npm run dev:server   # terminal 1
npm run dev:client   # terminal 2
```

| App | URL |
| --- | --- |
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:5000 |
| Swagger API docs | http://localhost:5000/api-docs |
| Health check | http://localhost:5000/api/health |

The health endpoint reports server status, environment, DB connection state, and Redis health:

```json
{
  "status": "ok",
  "environment": "development",
  "dbState": 1,
  "redis": { "enabled": true, "status": "ok", "latencyMs": 1 }
}
```

## Testing

Tests need no external services — the database and Redis are mocked.

**Server** (Jest + Supertest — auth, orders, products):

```bash
cd server
npm test
```

**Client** (Vitest + React Testing Library — components, cart slice):

```bash
cd client
npm test
```

**Lint the client:**

```bash
npm run lint
```

Every push to `main` (and every pull request) runs the full CI pipeline in `.github/workflows/ci.yml`: server tests, client lint, client tests, and a production build.

## API Documentation (Swagger & Postman)

The API is fully documented with an OpenAPI 3.0.3 spec kept in `server/swagger.js` — the single source of truth for the UI, the raw spec, and the Postman collection.

| Resource | URL |
| --- | --- |
| Interactive Swagger UI | `http://localhost:5000/api-docs` |
| Raw OpenAPI spec | `http://localhost:5000/api-docs.json` |
| Postman collection | `server/postman/collection.json` |

Regenerate the Postman collection after changing the spec:

```bash
cd server
npm run docs:postman
```

**Authentication in the docs:** log in via `POST /api/auth/login` and the server sets an httpOnly cookie named `token`. Protected endpoints also accept `Authorization: Bearer <token>`. Admin-only routes return `403` for non-admin users.

## API Overview

All routes are prefixed with `/api`:

| Group | Description |
| --- | --- |
| `/api/auth` | Register, login (email/Google), password reset, session |
| `/api/user` | User profiles and account management |
| `/api/admin` | Admin user management (role change, soft-delete) |
| `/api/products` | Catalog CRUD (admin writes, public reads) |
| `/api/reviews` | Product reviews (verified purchasers only) |
| `/api/orders` | Stripe checkout, confirm payment, webhook, order management |
| `/api/stats` | User and admin dashboard statistics |
| `/api/contact` | Contact form emails |
| `/api/blogs` | Blog posts (admin writes, public reads) |
| `/api/policy` | Store terms & conditions |
| `/api/feedback` | Bug/feature feedback reports |
| `/api/health` | Health check |
| `/api/upload-image` | Cloudinary image upload (admin) |

## Redis Caching

Redis is optional and can be toggled with `REDIS_ENABLED`. If Redis is unreachable, the server logs the error and continues serving requests without caching — no downtime.

```env
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
```

On Windows, run Redis locally through Docker:

```bash
docker run --name wiles-rues-redis -p 6379:6379 -d redis:7-alpine
```

For production, use a managed instance. Use a TLS URL when the provider requires it, e.g. `rediss://default:password@host:6379`.

How caching behaves:

- Cached responses include an `X-Cache` header (`HIT`, `MISS`, `SKIP`, or `BYPASS`)
- Server logs cache hits, misses, writes, Redis errors, and invalidation counts with a `[cache]` prefix
- Product, blog, review, and policy **writes invalidate** the affected cached read paths immediately
- TTLs are configurable per endpoint (`CACHE_*_TTL_SECONDS` in the env template)

## Stripe Webhook Setup

Orders are recorded when a checkout session is paid. To guarantee orders are saved even if the browser redirect back to the store fails (e.g. the page closes right after payment), configure Stripe to deliver webhook events to the server:

```text
POST /api/orders/webhook
```

1. Open the **Stripe Dashboard → Developers → Webhooks** and add an endpoint pointing to `https://<your-server-domain>/api/orders/webhook`.
2. Subscribe it to **`checkout.session.completed`** (and optionally `payment_intent.payment_failed`, which cancels orders).
3. Copy the generated signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET` in the server environment.

For local development, use the Stripe CLI to forward events:

```bash
stripe listen --forward-to localhost:5000/api/orders/webhook
```

The CLI prints a `whsec_...` secret; put it in `STRIPE_WEBHOOK_SECRET` in `server/.env` and test by triggering a checkout. The handler verifies the `Stripe-Signature` header against the secret and records the order **idempotently**, so it is safe for Stripe's automatic retries and duplicate deliveries. The webhook body must be sent raw (unparsed) for signature verification.

## Available Scripts

**Client** (`client/`)

```bash
npm run dev      # Start Vite dev server
npm run build    # Build production frontend
npm run preview  # Preview the production build
npm run lint     # Run ESLint
npm run test     # Run Vitest tests
```

**Server** (`server/`)

```bash
npm run dev          # Start backend with nodemon
npm start            # Start backend with node
npm test             # Run Jest + Supertest tests
npm run docs:postman # Regenerate the Postman collection from the OpenAPI spec
```

**Root**

```bash
npm run install:all  # Install client and server dependencies
npm run dev:server   # Start the backend
npm run dev:client   # Start the frontend
npm run build        # Build the client
npm run lint         # Lint the client
npm start            # Start the server
```

## Deployment

Both `client/` and `server/` include Vercel configuration files, and the server is also compatible with traditional hosts (e.g. Render — see the production server URL in `swagger.js`). Deployment to Vercel is handled by its native GitHub integration; the CI pipeline covers lint, tests, and builds.

**Never commit `.env` files** — configure production variables in your hosting dashboard instead.

<details>
<summary>Production server environment</summary>

```text
NODE_ENV=production
DB_URL
JWT_SECRET
JWT_EXPIRES=7d
CLIENT_URL=https://your-client-domain
CLIENT_URLS=https://your-client-domain
PASSWORD_RESET_CLIENT_URL=https://your-client-domain
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
GOOGLE_CLIENT_ID
RESEND_API_KEY
CONTACT_TO_EMAIL
CONTACT_FROM_EMAIL
GMAIL_USER
GMAIL_APP_PASSWORD
SMTP_TIMEOUT_MS=45000
CORS_ORIGINS=
COOKIE_DOMAIN=
SEED_DEFAULT_BLOGS=true
MONGOOSE_MAX_POOL_SIZE=10
REDIS_ENABLED=true
REDIS_URL
REDIS_KEY_PREFIX=wiles-rues:
REDIS_CONNECT_TIMEOUT_MS=10000
REDIS_PING_TIMEOUT_MS=3000
CACHE_PRODUCTS_LIST_TTL_SECONDS=120
CACHE_PRODUCT_DETAIL_TTL_SECONDS=300
CACHE_RELATED_PRODUCTS_TTL_SECONDS=180
CACHE_BLOGS_LIST_TTL_SECONDS=180
CACHE_BLOG_DETAIL_TTL_SECONDS=600
CACHE_POLICY_TTL_SECONDS=900
```

</details>

<details>
<summary>Production client environment</summary>

```text
VITE_API_BACKEND_URL=https://your-server-domain
VITE_STRIPE_PUBLISHABLE_KEY
VITE_GOOGLE_CLIENT_ID
```

</details>

Notes for production:

- **Password reset emails** use Nodemailer with Gmail SMTP. `GMAIL_USER` must be the Gmail address and `GMAIL_APP_PASSWORD` must be a 16-character Google **app password**, not the regular login password. Set `PASSWORD_RESET_CLIENT_URL` to the deployed client URL so emailed links don't point to localhost.
- **Cross-site cookies:** authentication uses an HTTP-only cookie. Both domains must be HTTPS, and a separate client/server deployment requires `COOKIE_SAME_SITE=none` with `COOKIE_SECURE=true`. Same-site deployments (same domain) can keep `lax`.
- **CORS:** the server accepts local Vite origins by default and preview origins matching `e-commerce-project-*.vercel.app`. For other domains, add them to `CLIENT_URLS` (comma-separated) or `CORS_ORIGINS`.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `EADDRINUSE` when starting the server | Change `PORT` in `server/.env` |
| CORS / "Request origin is not allowed" | Add the frontend origin to `CLIENT_URLS` or `CORS_ORIGINS` |
| Redis connection errors in the logs | Harmless — the app runs without the cache. Check `REDIS_URL` if you want caching enabled |
| Webhook returns 400 | Verify `STRIPE_WEBHOOK_SECRET` and that the event is sent with the raw body to `/api/orders/webhook` |
| Reset emails not delivered | Use a Gmail **app password** (not the account password) and confirm `SMTP_TIMEOUT_MS` is generous enough |
| Contact form fails with 500 | `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and `CONTACT_FROM_EMAIL` must be configured and the sender verified |
| Logged-in user sees `403` on admin pages | Log in with an admin account — see [Create an Admin Account](#4-create-an-admin-account) |

## License

This project is licensed under the [ISC License](https://opensource.org/license/isc-license-txt).
