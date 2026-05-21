<div align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express" alt="Express 4" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-339933?style=flat-square&logo=node.js" alt="Node >=18" />
  <br />
  <img src="https://img.shields.io/badge/supabase-js-3FCF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/PWA-ready-5A0FC8?style=flat-square" alt="PWA Ready" />
  <img src="https://img.shields.io/badge/i18n-Gambian%20Dalasi-C8622A?style=flat-square" alt="GMD" />
</div>

<h1 align="center">GMarkt — The Gambia's Marketplace</h1>

<p align="center">
  A mobile-first, offline-capable progressive web application connecting buyers and sellers across the Greater Banjul Area.<br />
  Built for low-bandwidth environments with background sync, image compression, and a rich marketplace transaction workflow.
</p>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Set Up Environment Variables](#2-set-up-environment-variables)
  - [3. Run the Database Schema](#3-run-the-database-schema)
  - [4. Install Dependencies](#4-install-dependencies)
  - [5. Start the Development Servers](#5-start-the-development-servers)
  - [6. Seed the Database (Optional)](#6-seed-the-database-optional)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
  - [Client (Frontend)](#client-frontend)
  - [Server (Backend)](#server-backend)
- [API Documentation](#api-documentation)
  - [Public Endpoints](#public-endpoints)
  - [Authenticated Endpoints](#authenticated-endpoints)
  - [Admin Endpoints](#admin-endpoints)
  - [Notifications](#notifications)
- [Folder Structure](#folder-structure)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### For Buyers

- **Browse & Search** — Filter listings by category, area (zone/neighbourhood), price, and condition. Full-text search with autocomplete suggestions.
- **Listing Detail** — View seller information, rating stats, review history, and multiple images per listing.
- **Order Workflow** — Initiate purchases with a state-machine-managed order flow: `pending → buyer_paid → delivered → completed`.
- **Reviews & Ratings** — Leave 1–5 star reviews with comments after completing a purchase.
- **WhatsApp Contact** — One-tap WhatsApp messaging for every listing.
- **Report Listings** — Flag suspicious or inappropriate listings and users.

### For Sellers

- **Create & Manage Listings** — Post new listings with title, description, price, condition, location, and up to 5 images.
- **Image Upload** — Automatic compression via `browser-image-compression` (resized to 800px, ~300KB) before uploading to Supabase Storage.
- **Sales Dashboard** — Track incoming orders and update status (mark as delivered, complete sales).
- **Analytics** — View listing view counts and sales performance.
- **Edit / Delete Listings** — Full CRUD on your own listings.

### Admin Features

- **Dashboard** — Platform-wide stats: total users, banned users, listings, pending moderation, reports, disputes, and a listings-over-time chart.
- **User Management** — Ban/unban users, grant/remove verified seller badges, hard-delete accounts (super admin only).
- **Listing Moderation** — Approve or reject listings submitted for review.
- **Report Handling** — Review and resolve/dismiss user and listing reports.
- **Dispute Resolution** — View and resolve transaction disputes between buyers and sellers.
- **Audit Logging** — Full trail of admin actions (super admin only).

### Platform Features

- **Offline-First PWA** — Service worker with `vite-plugin-pwa`. Listings created offline are queued in IndexedDB (`idb-keyval`) and synced when connectivity returns using background sync.
- **Mobile-First Design** — Tailwind CSS responsive layout optimized for mobile browsers in The Gambia.
- **Gambian Localisation** — Pricing in Gambian Dalasi (GMD), phone validation for `+220` numbers, location data for Greater Banjul Area zones and neighbourhoods.
- **Rate Limiting** — Global 1,000 req/15 min per IP on the API; per-endpoint limits for listing creation (10/15 min) and reviews (5/15 min).
- **Security** — Helmet headers, CORS whitelist, JWT authentication via Supabase, Row-Level Security on all database tables, input validation via Zod.

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 19 + Vite 8 | Fast HMR, minimal config, ESM-native |
| **State & Data** | TanStack Query v5 | Built-in caching, background refetch, offline support via `keepPreviousData` |
| **Routing** | React Router v7 | Declarative routing with lazy loading |
| **Styling** | Tailwind CSS v4 + Custom CSS | Utility-first, PWA-compatible, custom design tokens |
| **PWA** | vite-plugin-pwa + Workbox | Service worker generation, offline caching, install prompt |
| **Backend** | Node.js + Express 4 | Simple, untyped (JSDoc + Zod for safety), fast iteration |
| **Validation** | Zod 3 | Schema-based request validation on all endpoints |
| **Database** | Supabase (PostgreSQL) | Managed Postgres with built-in Auth, Storage, and RLS |
| **Auth** | Supabase Auth | JWT-based, email/password signup, refresh token rotation |
| **Storage** | Supabase Storage | Image hosting with `listing-images` public bucket (5MB limit, JPEG/PNG/WebP) |
| **Icons** | Lucide React | Consistent, tree-shakeable icon set |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    Browser (PWA)                       │
│  ┌────────────────────────────────────────────────┐   │
│  │  React SPA (Vite, port 5173)                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │   │
│  │  │ TanStack  │  │  React   │  │   Service    │  │   │
│  │  │  Query    │  │  Router  │  │   Worker     │  │   │
│  │  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │   │
│  │       │              │               │          │   │
│  │  ┌────▼──────────────▼───────────────▼────────┐  │   │
│  │  │        Custom API Client (api.js)          │  │   │
│  │  │  - Retry with exponential backoff          │  │   │
│  │  │  - Auto token refresh on 401               │  │   │
│  │  └────────────────────┬───────────────────────┘  │   │
│  └───────────────────────┼───────────────────────────┘   │
└──────────────────────────┼───────────────────────────────┘
                           │ HTTP (proxied in dev)
                           ▼
┌──────────────────────────────────────────────────────┐
│             Express API (server, port 3000)           │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │  Helmet  │  │   CORS   │  │  Rate Limit (1K/15m)│  │
│  └──────────┘  └──────────┘  └────────────────────┘  │
│                                                       │
│  ┌────────────────────────────────────────────────┐   │
│  │  Routes                                        │   │
│  │  /api/listings   /api/zones/areas              │   │
│  │  /api/categories /api/orders                   │   │
│  │  /api/reviews    /api/reports                  │   │
│  │  /api/profile    /api/notifications            │   │
│  │  /api/admin/*                                  │   │
│  └──────────────────────┬─────────────────────────┘   │
│                         │                              │
│  ┌──────────────────────▼─────────────────────────┐   │
│  │  Middleware                                    │   │
│  │  - authenticate (JWT via Supabase)             │   │
│  │  - optionalAuth                                │   │
│  │  - requireAdmin / requireSuperAdmin            │   │
│  │  - validateBody (Zod schemas)                  │   │
│  └──────────────────────┬─────────────────────────┘   │
└──────────────────────────┼───────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────────┐
         │                 │                      │
         ▼                 ▼                      ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Supabase Auth    │ │  Supabase DB      │ │  Supabase Storage │
│  - JWT tokens     │ │  - PostgreSQL     │ │  - listing-images  │
│  - Email/password │ │  - RLS policies   │ │  - avatars         │
│  - Session mgmt   │ │  - Triggers       │ │                   │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

### Data Flow (Key Processes)

1. **Listing Creation**: Client uploads compressed image to Supabase Storage → posts listing data to Express API → API validates with Zod, inserts into Supabase with `moderation_status: 'pending'` → notifies admins.
2. **Order Transaction**: Buyer creates order → state machine tracks `pending → buyer_paid → delivered → completed` with role-based transitions → notifications at each step.
3. **Offline Sync**: Offline listing saved to IndexedDB (`idb-keyval`) → on reconnect, `OfflineContext` processes queue → background sync fallback via Service Worker.

---

## Prerequisites

| Dependency | Version | Notes |
|---|---|---|
| **Node.js** | `>= 18.0.0` | Required by Express server (native `--watch`) |
| **npm** | `>= 9` | Ships with Node |
| **Supabase Account** | Free tier | Project with Auth, Database, and Storage enabled |
| **Git** | `>= 2.30` | For version control |

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/<your-org>/localmarkt.git
cd localmarkt
```

### 2. Set Up Environment Variables

The project uses two `.env` files — one for the server and one for the client.

**Server** (`server/.env`):

```bash
cp server/.env.example server/.env
```

**Client** (`client/.env`):

```bash
cp client/.env.example client/.env
```

Populate both files with your Supabase project credentials. See the [Environment Variables](#environment-variables) table below for details.

### 3. Run the Database Schema

Open your Supabase project's SQL Editor and run the contents of `supabase/schema.sql`. This creates all tables, indexes, Row-Level Security policies, triggers, and storage bucket configuration. The schema is idempotent — the `DROP POLICY IF EXISTS` / `INSERT ... ON CONFLICT DO NOTHING` patterns allow re-running safely.

> **Migration files** are also available in `supabase/migrations/` in order of application. You can optionally run these sequentially instead of the combined schema file.

### 4. Install Dependencies

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 5. Start the Development Servers

Start the API server (terminal 1):

```bash
cd server
npm run dev
```

The server runs on `http://localhost:3000` with Node's native `--watch` file watcher.

Start the client dev server (terminal 2):

```bash
cd client
npm run dev
```

Vite starts on `http://localhost:5173` and proxies `/api` requests to the Express server.

### 6. Seed the Database (Optional)

Generate realistic Gambian marketplace data for development:

```bash
cd server
npm run seed
```

This creates 50+ listings across 6 categories (Electronics, Clothing, Food & Groceries, Home & Furniture, Vehicles, Services, Other), plus reviews. Requires at least one user to exist in the `profiles` table first (register via the UI).

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description | Required | Example |
|---|---|---|---|
| `SUPABASE_URL` | Supabase project URL | Yes | `https://jksqjhugzskeaptsotfs.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret, server-only) | Yes | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_JWT_SECRET` | JWT secret for verifying tokens | Yes | From Supabase dashboard → Settings → API |
| `PORT` | Express listen port | No (default: `3000`) | `3000` |
| `CLIENT_ORIGIN` | Allowed CORS origin | No (default: `http://localhost:5173`) | `http://localhost:5173` |

### Client (`client/.env`)

| Variable | Description | Required | Example |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (public) | Yes | `https://jksqjhugzskeaptsotfs.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (public) | Yes | `eyJhbGciOiJIUzI1NiIs...` |
| `VITE_API_BASE_URL` | API base URL (empty string for same-origin proxying) | No | `http://localhost:3000` |

> **Security note**: The service role key has full admin access to your Supabase database. Never expose it to the client. The anon key is safe for client-side use when RLS policies are properly configured (as they are in `schema.sql`).

---

## Available Scripts

### Client (Frontend)

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (port 5173) with HMR |
| `npm run build` | Production build to `client/dist` |
| `npm run preview` | Preview production build locally (port 4173) |
| `npm run lint` | Run ESLint on the client source |

### Server (Backend)

| Command | Description |
|---|---|
| `npm run dev` | Start Express server with `--watch` for auto-restart (port 3000) |
| `npm start` | Start Express server in production mode |
| `npm run lint` | Run ESLint on the server source |
| `npm run seed` | Seed the database with realistic Gambian dummy data |

---

## API Documentation

### Public Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check, returns `{ status: 'ok', timestamp: '...' }` |
| `GET` | `/api/listings` | List approved listings. Query params: `category`, `area_id`, `search`, `page`, `limit`, `sort` (`newest`, `oldest`, `price_asc`, `price_desc`, `views`), `user_id`, `cursor` |
| `GET` | `/api/listings/stats` | Marketplace statistics (total listings, active areas, active sellers) |
| `GET` | `/api/listings/search/suggestions` | Autocomplete suggestions. Query: `q` (min 2 chars) |
| `GET` | `/api/listings/:id` | Single listing with seller info and aggregated rating stats |
| `GET` | `/api/zones` | List all Greater Banjul Area zones |
| `GET` | `/api/zones/:id/areas` | List neighbourhoods within a zone |
| `GET` | `/api/categories` | List all product categories |

### Authenticated Endpoints

Requires `Authorization: Bearer <JWT>` header.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/listings/mine` | Current user's listings (all moderation statuses) |
| `POST` | `/api/listings` | Create a new listing (max 10 per 15 min). Body validated against Zod schema |
| `PUT` | `/api/listings/:id` | Edit own listing |
| `DELETE` | `/api/listings/:id` | Delete own listing |
| `GET` | `/api/listings/:id/reviews` | Reviews for a listing (optional auth) |
| `POST` | `/api/listings/:id/reviews` | Create review (max 5 per 15 min) |
| `PUT` | `/api/reviews/:id` | Update own review |
| `DELETE` | `/api/reviews/:id` | Delete own review |
| `POST` | `/api/reports` | Submit a report (listing or user, max 5 per 15 min) |
| `POST` | `/api/orders` | Create an order (purchase intent with 48h expiry) |
| `GET` | `/api/orders/purchases` | Current user's purchases |
| `GET` | `/api/orders/sales` | Current user's sales (as seller) |
| `PUT` | `/api/orders/:id/status` | Update order status (state-machine enforced) |
| `GET` | `/api/profile` | Current user's profile |
| `PUT` | `/api/profile` | Update profile fields |
| `DELETE` | `/api/profile/avatar` | Delete avatar |

### Admin Endpoints

Requires `Authorization: Bearer <JWT>` with admin or super_admin role.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | Platform dashboard stats (`?days=14`) |
| `GET` | `/api/admin/users` | User list with search/filter. Params: `search`, `role`, `banned` |
| `PUT` | `/api/admin/users/:id/ban` | Ban or unban a user |
| `PUT` | `/api/admin/users/:id/verify` | Toggle verified seller status |
| `DELETE` | `/api/admin/users/:id` | Permanently delete user (super admin only) |
| `GET` | `/api/admin/listings` | All listings with moderation status filter |
| `PUT` | `/api/admin/listings/:id/moderate` | Approve or reject a listing |
| `DELETE` | `/api/admin/listings/:id` | Admin listing deletion (with storage cleanup) |
| `GET` | `/api/admin/reports` | Reports list with status filter |
| `PUT` | `/api/admin/reports/:id` | Update report status (resolved/dismissed/reopen) |
| `GET` | `/api/admin/disputes` | All disputed orders |
| `GET` | `/api/admin/logs` | Admin audit log (super admin only) |

### Notifications

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/notifications` | List notifications. Params: `limit`, `unread_only` |
| `PATCH` | `/api/notifications/:id/read` | Mark single notification as read |
| `PATCH` | `/api/notifications/read-all` | Mark all as read |
| `DELETE` | `/api/notifications/:id` | Delete a notification |

---

## Folder Structure

```
localmarkt/
├── client/                          # React + Vite frontend
│   ├── public/                      # Static assets (favicon.svg, logo.svg)
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── admin/               # Admin-specific components
│   │   │   ├── AdminRoute.jsx       # Admin guard wrapper
│   │   │   ├── ProtectedRoute.jsx   # Auth guard wrapper
│   │   │   ├── Layout.jsx           # App shell (Header + Outlet + Footer)
│   │   │   ├── ListingCard.jsx      # Feed listing card
│   │   │   ├── ListingForm.jsx      # Shared create/edit form
│   │   │   ├── SearchFilters.jsx    # Category/area/sort filters
│   │   │   ├── CheckoutModal.jsx    # Order creation flow
│   │   │   ├── Pagination.jsx       # Paginated navigation
│   │   │   ├── StarRating.jsx       # Star rating display/input
│   │   │   └── ...
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Supabase auth + profile state
│   │   │   ├── OfflineContext.jsx   # Online/offline detection, sync queue
│   │   │   └── ToastContext.jsx     # Toast notification system
│   │   ├── hooks/                   # TanStack Query hooks
│   │   │   ├── useListings.js       # Listing CRUD + stats queries
│   │   │   ├── useLookups.js        # Zones, areas, categories
│   │   │   ├── useReviews.js        # Review CRUD
│   │   │   ├── useOrders.js         # (via api.js)
│   │   │   ├── useNotifications.js  # Notification queries
│   │   │   ├── useAdmin.js          # All admin queries/mutations
│   │   │   └── useReports.js        # Report submission
│   │   ├── lib/
│   │   │   ├── api.js               # Centralised API client with retry + token refresh
│   │   │   ├── supabase.js          # Supabase client (anon key)
│   │   │   ├── imageUpload.js       # Image compression + storage upload
│   │   │   ├── offlineStorage.js    # IndexedDB (idb-keyval) offline queue
│   │   │   └── utils.js             # Formatting (GMD, dates, phone, WhatsApp)
│   │   ├── pages/                   # Route-level page components
│   │   │   ├── admin/               # Admin panel pages
│   │   │   ├── ListingFeed.jsx      # Main marketplace feed
│   │   │   ├── ListingDetail.jsx    # Single listing view
│   │   │   ├── CreateListing.jsx    # New listing form
│   │   │   ├── MyListings.jsx       # Seller's listings + sales tab
│   │   │   ├── MyPurchases.jsx      # Buyer's purchases
│   │   │   ├── Profile.jsx          # User profile settings
│   │   │   ├── Login.jsx            # Sign in
│   │   │   ├── Register.jsx         # Sign up
│   │   │   └── ...
│   │   ├── App.jsx                  # Root component with routing + providers
│   │   ├── main.jsx                 # Entry point (SW registration)
│   │   └── index.css                # Global styles + design system + Tailwind
│   ├── index.html                   # SPA shell
│   ├── vite.config.js               # Vite config (React, Tailwind, PWA, proxy)
│   ├── eslint.config.js             # ESLint flat config
│   └── vercel.json                  # SPA rewrite rules
│
├── server/                          # Express API backend
│   ├── src/
│   │   ├── index.js                 # Express app setup (middleware, routes, error handling)
│   │   ├── supabase.js              # Supabase admin client (service role key)
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT verification (authenticate + optionalAuth)
│   │   │   └── admin.js             # Role checks (requireAdmin, requireSuperAdmin)
│   │   ├── routes/
│   │   │   ├── listings.js          # Listing CRUD + stats + suggestions
│   │   │   ├── zones.js             # Zone + area lookups
│   │   │   ├── categories.js        # Category list
│   │   │   ├── orders.js            # Order CRUD + state machine
│   │   │   ├── reviews.js           # Review CRUD
│   │   │   ├── reports.js           # Report submission
│   │   │   ├── profile.js           # User profile get/update/avatar
│   │   │   ├── admin.js             # Admin dashboard, users, listings, reports, disputes, logs
│   │   │   └── notifications.js     # Notification list/read/delete
│   │   ├── schemas/                 # Zod validation schemas
│   │   │   ├── listing.js           # Create/update listing + validateBody middleware
│   │   │   ├── order.js             # Create order + status update
│   │   │   ├── review.js            # Create/update review
│   │   │   ├── report.js            # Create report + status update
│   │   │   ├── admin.js             # Ban, verify, moderate schemas
│   │   │   └── user.js              # Profile update schema
│   │   ├── services/
│   │   │   └── notifications.js     # Notification creation helpers
│   │   └── utils/
│   │       ├── catchAsync.js        # Async error wrapper
│   │       ├── storage.js           # Supabase Storage image deletion
│   │       └── adminLogs.js         # Admin audit log insertion
│   ├── scripts/
│   │   └── seed.js                  # Database seeder (Faker-based dummy data)
│   ├── .env.example                 # Server env template
│   └── package.json
│
├── supabase/
│   ├── schema.sql                   # Full database schema (idempotent, run in SQL Editor)
│   └── migrations/                  # Incremental SQL migrations (23 files)
│       ├── 001_payments_analytics.sql
│       ├── 002_sold_listings_trigger.sql
│       ├── 003_replica_identity.sql
│       ├── ...
│       └── remove_broad_storage_select.sql
│
├── .eslintrc.js                     # Root ESLint config (shared)
├── .prettierrc                      # Prettier config (semi, singleQuote, trailingCommas)
└── .gitignore
```

---

## Database Schema

The PostgreSQL schema (in `supabase/schema.sql`) defines:

- **`profiles`** — User profiles linked to `auth.users` via foreign key. Auto-created on signup via trigger. Fields include `display_name`, `email`, `phone_number`, `avatar_url`, `bio`, `role`, `is_banned`, `verified_seller`, `notifications` (JSON preferences).
- **`zones`** — Greater Banjul Area zones (Banjul, Serrekunda, Bakau/Fajara, Kololi/Kotu, Sukuta/Brikama, Brufut/Tanji).
- **`areas`** — Neighbourhoods within zones (26 areas total).
- **`categories`** — Marketplace categories (9 categories: Electronics & Phones, Clothing & Apparel, Home & Furniture, Beauty & Health, Food & Groceries, Baby & Kids, Vehicles, Services, Other).
- **`listings`** — Core listings table with `title`, `description`, `price`, `condition` (enum), `category_id`, `area_id`, `contact`, `image_url`, `images[]`, `moderation_status`, `view_count`, `is_sold`, `negotiable`. Row-Level Security ensures owners can CRUD their own.
- **`reviews`** — 1–5 star ratings with optional comments, linked to listings and reviewers.
- **`orders`** — Transaction records with state machine status (`pending → buyer_paid → delivered → completed / cancelled / disputed`), price snapshot at purchase, and 48-hour expiry.
- **`reports`** — User and listing reports with `reason`, `details`, and handling status.
- **`notifications`** — In-app notifications with type, title, message, link, and read status.
- **`admin_logs`** — Immutable audit trail for all admin actions.

---

## Contributing

### Branch Naming Convention

```
feature/<short-description>    # New features
fix/<short-description>        # Bug fixes
refactor/<short-description>   # Code restructuring
chore/<short-description>      # Tooling, deps, config
```

### Commit Conventions

This project follows a lightweight conventional commits style:

```
<type>: <description>

feat: add listing image upload
fix: correct order status transition validation
refactor: extract sanitizeListingForResponse helper
chore: update dependencies
```

### PR Process

1. Run `npm run lint` in both `client/` and `server/` to ensure no lint errors.
2. Update or add tests if applicable (no test runner is configured yet — manual QA or add vitest).
3. Create a PR with a clear description of the change and any migration steps.
4. Ensure all pre-existing database migrations are backward-compatible.

### Code Style

- **No TypeScript** — This project uses plain JavaScript. Use JSDoc comments for function signatures and Zod schemas for runtime validation.
- **ESM only** — All modules use `import`/`export` syntax (`"type": "module"` in both `package.json` files).
- **Formatting** — Prettier with single quotes, trailing commas, and 100-char print width.
- **Linting** — ESLint with `no-unused-vars` (warn), `no-console` (warn, allow warn/error), `prefer-const`, `no-var`.

---

## License

[MIT](LICENSE) — See the [LICENSE](LICENSE) file for details.
