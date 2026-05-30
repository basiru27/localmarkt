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
  A mobile-first, offline-capable classifieds progressive web application connecting buyers and sellers across the Greater Banjul Area.<br />
  Built for low-bandwidth environments with background sync, image compression, and WhatsApp-native seller contact.
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
- **Reviews & Ratings** — Leave 1–5 star reviews with comments after clicking the WhatsApp contact button (contact-event gating prevents review bombing).
- **WhatsApp Contact** — One-tap WhatsApp messaging for every listing.
- **Save Listings** — Bookmark listings to revisit later.
- **Report Listings** — Flag suspicious or inappropriate listings and users.

### For Sellers

- **Create & Manage Listings** — Post new listings with title, description, price, condition, location, and up to 5 images.
- **Image Upload** — Automatic compression via `browser-image-compression` (resized to 800px, ~300KB) before uploading to Supabase Storage.
- **Bump Listings** — Boost a listing to the top of the feed (24h cooldown per user).
- **Analytics** — View listing view counts and performance metrics on the seller dashboard.
- **Edit / Delete Listings** — Full CRUD on your own listings.

### Admin Features

- **Dashboard** — Platform-wide stats: total users, banned users, listings, pending moderation, reports, and a listings-over-time chart.
- **User Management** — Ban/unban users, grant/remove verified seller badges, hard-delete accounts (super admin only).
- **Listing Moderation** — Approve or reject listings submitted for review.
- **Report Handling** — Review and resolve/dismiss user and listing reports.
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
| **Routing** | React Router v6 | Declarative routing with lazy loading |
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
│  │  Routes                                        │   │
│  │  /api/listings   /api/zones/areas              │   │
│  │  /api/categories /api/sellers                  │   │
│  │  /api/reviews    /api/reports                  │   │
│  │  /api/profile    /api/notifications            │   │
│  │  /api/saved      /api/admin/*                  │   │
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
2. **Listing Bump**: Seller bumps listing → API checks per-user 24h cooldown → updates `bumped_at` timestamp → listing rises to feed top.
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
|---|---|---|---|
| `GET` | `/api/listings/mine` | Current user's listings (all moderation statuses) |
| `POST` | `/api/listings` | Create a new listing (max 10 per 15 min). Body validated against Zod schema |
| `PUT` | `/api/listings/:id` | Edit own listing |
| `DELETE` | `/api/listings/:id` | Delete own listing |
| `POST` | `/api/listings/:id/bump` | Bump listing to top of feed (24h cooldown) |
| `GET` | `/api/listings/:id/reviews` | Reviews for a listing (optional auth) |
| `POST` | `/api/listings/:id/reviews` | Create review (requires prior contact event) |
| `PUT` | `/api/reviews/:id` | Update own review |
| `DELETE` | `/api/reviews/:id` | Delete own review |
| `POST` | `/api/reports` | Submit a report (listing or user, max 5 per 15 min) |
| `GET` | `/api/profile` | Current user's profile |
| `PUT` | `/api/profile` | Update profile fields |
| `DELETE` | `/api/profile/avatar` | Delete avatar |
| `GET` | `/api/sellers/:id/listings` | Seller's public listings |
| `GET` | `/api/sellers/:id/reviews` | Seller's reviews as reviewer |
| `GET` | `/api/sellers/:id/stats` | Seller's aggregate stats (total listings, avg rating, etc.) |
| `GET` | `/api/saved` | Current user's saved listings |
| `POST` | `/api/saved` | Save a listing |
| `DELETE` | `/api/saved/:id` | Remove saved listing |

### Admin Endpoints

Requires `Authorization: Bearer <JWT>` with admin or super_admin role.

| Method | Path | Description |
|---|---|---|---|
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
├── client/                              # React + Vite frontend
│   ├── public/                          # Static assets (favicon.svg, manifest icons)
│   ├── src/
│   │   ├── components/                  # Reusable UI components
│   │   │   ├── admin/
│   │   │   │   └── AdminLayout.jsx      # Admin panel shell (sidebar + header)
│   │   │   ├── ui/
│   │   │   │   ├── ImageLightbox.jsx    # Full-screen image viewer
│   │   │   │   └── Pagination.jsx       # Paginated navigation
│   │   │   ├── AdminRoute.jsx           # Admin role guard wrapper
│   │   │   ├── AlertMessage.jsx         # Alert banner (success/error/info)
│   │   │   ├── AvatarImage.jsx          # User avatar with fallback
│   │   │   ├── ErrorBoundary.jsx        # React error boundary
│   │   │   ├── Footer.jsx               # App footer
│   │   │   ├── FormField.jsx            # Reusable form input wrapper
│   │   │   ├── Header.jsx               # App header with nav + search
│   │   │   ├── Layout.jsx               # App shell (Header + Outlet + Footer)
│   │   │   ├── ListingCard.jsx          # Feed listing card
│   │   │   ├── ListingCardSkeleton.jsx  # Loading skeleton card
│   │   │   ├── ListingForm.jsx          # Shared create/edit listing form
│   │   │   ├── Modal.jsx                # Reusable modal dialog
│   │   │   ├── NotificationBell.jsx     # Header notification indicator
│   │   │   ├── OfflineBanner.jsx        # Offline connectivity banner
│   │   │   ├── PendingSyncBadge.jsx     # Pending offline sync count
│   │   │   ├── ProtectedRoute.jsx       # Auth guard wrapper
│   │   │   ├── ReviewForm.jsx           # Review create/edit form
│   │   │   ├── ReviewList.jsx           # Review display list
│   │   │   ├── SafeImage.jsx            # Image with fallback + lazy load
│   │   │   ├── SaveButton.jsx           # Save/unsave listing toggle
│   │   │   ├── SearchFilters.jsx        # Category/area/sort/price filters
│   │   │   ├── SellerInfo.jsx           # Seller profile sidebar card
│   │   │   ├── StarRating.jsx           # Star rating display/input
│   │   │   ├── StatsCard.jsx            # Dashboard stat card
│   │   │   └── SvgSparkline.jsx         # Mini sparkline chart (admin dashboard)
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # Supabase auth + profile state
│   │   │   ├── OfflineContext.jsx       # Online/offline detection, sync queue
│   │   │   └── ToastContext.jsx         # Toast notification system
│   │   ├── hooks/                       # TanStack Query hooks
│   │   │   ├── useAdmin.js              # All admin queries/mutations
│   │   │   ├── useDocumentTitle.js      # Dynamic document title
│   │   │   ├── useListings.js           # Listing CRUD + stats + bump
│   │   │   ├── useLookups.js            # Zones, areas, categories
│   │   │   ├── useNotifications.js      # Notification queries/mutations
│   │   │   ├── useReports.js            # Report submission
│   │   │   ├── useReviews.js            # Review CRUD
│   │   │   ├── useSaved.js              # Saved list CRUD
│   │   │   ├── useSellers.js            # Seller profile + stats
│   │   │   └── useShare.js              # Web Share API wrapper
│   │   ├── lib/
│   │   │   ├── api.js                   # Centralised API client with retry + refresh
│   │   │   ├── imageUpload.js           # Image compression (browser-image-compression)
│   │   │   ├── offlineStorage.js        # IndexedDB queue via idb-keyval
│   │   │   ├── searchHistory.js         # Recent search persistence
│   │   │   ├── supabase.js              # Supabase anon client
│   │   │   └── utils.js                 # Formatting (GMD, dates, phone, WhatsApp)
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx   # Platform stats overview
│   │   │   │   ├── AdminListings.jsx    # Listing moderation queue
│   │   │   │   ├── AdminLogs.jsx        # Admin audit trail
│   │   │   │   ├── AdminReports.jsx     # Report handling
│   │   │   │   └── AdminUsers.jsx       # User management
│   │   │   ├── AnalyticsDashboard.jsx   # Seller analytics (views, bumps)
│   │   │   ├── CreateListing.jsx        # New listing form
│   │   │   ├── EditListing.jsx          # Edit existing listing
│   │   │   ├── ForgotPassword.jsx       # Password reset request
│   │   │   ├── ListingDetail.jsx        # Single listing view
│   │   │   ├── ListingFeed.jsx          # Main marketplace feed
│   │   │   ├── Login.jsx                # Sign in
│   │   │   ├── MyListings.jsx           # Seller's listing management
│   │   │   ├── NotFound.jsx             # 404 page
│   │   │   ├── Profile.jsx              # User profile settings
│   │   │   ├── Register.jsx             # Sign up
│   │   │   ├── ResetPassword.jsx        # New password form
│   │   │   ├── SavedListings.jsx        # Bookmarked listings
│   │   │   └── SellerProfile.jsx        # Public seller page
│   │   ├── App.jsx                      # Root with routing + providers
│   │   ├── index.css                    # Global styles + Tailwind
│   │   ├── main.jsx                     # Entry (SW registration)
│   │   └── sw.js                        # Service worker custom logic
│   ├── index.html                       # SPA shell
│   ├── vite.config.js                   # Vite (React, Tailwind, PWA, proxy)
│   ├── eslint.config.mjs                # ESLint flat config
│   └── vercel.json                      # SPA rewrite rules
│
├── server/                              # Express API backend
│   ├── src/
│   │   ├── index.js                     # Express app setup + error handling
│   │   ├── supabase.js                  # Supabase admin client (service role key)
│   │   ├── middleware/
│   │   │   ├── auth.js                  # JWT verify (authenticate + optionalAuth)
│   │   │   └── admin.js                 # Role check (requireAdmin, requireSuperAdmin)
│   │   ├── routes/
│   │   │   ├── admin.js                 # Dashboard, users, listings, reports, logs
│   │   │   ├── categories.js            # Category list
│   │   │   ├── listings.js              # CRUD, stats, suggestions, bump, contact events
│   │   │   ├── notifications.js         # List, read, delete
│   │   │   ├── profile.js               # Get/update profile + avatar
│   │   │   ├── reports.js               # Submit report
│   │   │   ├── reviews.js               # Review CRUD
│   │   │   ├── saved.js                 # Save/unsave listings
│   │   │   ├── sellers.js               # Seller profile, listings, reviews, stats
│   │   │   └── zones.js                 # Zone + area lookups
│   │   ├── schemas/                     # Zod validation schemas
│   │   │   ├── admin.js                 # Ban, verify, moderate schemas
│   │   │   ├── listing.js               # Create/update listing + validateBody
│   │   │   ├── report.js                # Create report
│   │   │   ├── review.js                # Create/update review
│   │   │   └── user.js                  # Profile update schema
│   │   ├── services/
│   │   │   └── notifications.js         # Notification insertion helpers
│   │   └── utils/
│   │       ├── adminLogs.js             # Admin audit log insertion
│   │       ├── catchAsync.js            # Async error wrapper
│   │       └── storage.js               # Supabase Storage image deletion
│   ├── scripts/
│   │   └── seed.js                      # Faker-based dummy data seeder
│   ├── .env.example
│   └── package.json
│
├── supabase/
│   ├── schema.sql                       # Full DB schema (run first in SQL Editor)
│   └── migrations/                      # 31 incremental migrations
│       ├── 001_payments_analytics.sql
│       └── ...
│
├── docs/                                # Project documentation
│   ├── 01_SRS.md                        # Software Requirements Specification
│   ├── 02_SDD.md                        # System Design Document
│   ├── 03_UserManual.md                 # User Manual
│   ├── 04_DeveloperManual.md            # Developer Manual
│   ├── 05_TestCases.md                  # Test Cases (100 tests)
│   └── 06_ProjectReport.md              # Academic Project Report
│
├── .eslintrc.json                       # Root ESLint config (shared)
├── .prettierrc                          # Prettier settings
├── AGENTS.md                            # OpenCode agent instructions
└── .gitignore
```

---

## Database Schema

The PostgreSQL schema (in `supabase/schema.sql`) defines 11 tables:

- **`profiles`** — User profiles linked to `auth.users` via foreign key. Auto-created on signup via trigger. Fields include `display_name`, `email`, `phone_number`, `avatar_url`, `bio`, `role` (`user`/`admin`/`super_admin`), `is_banned`, `verified_seller`, `notifications` (JSON preferences), `last_bump_at` (cooldown tracking).
- **`zones`** — Greater Banjul Area zones (Banjul, Serrekunda, Bakau/Fajara, Kololi/Kotu, Sukuta/Brikama, Brufut/Tanji).
- **`areas`** — Neighbourhoods within zones (26 areas total).
- **`categories`** — Marketplace categories (9 categories: Electronics & Phones, Clothing & Apparel, Home & Furniture, Beauty & Health, Food & Groceries, Baby & Kids, Vehicles, Services, Other).
- **`listings`** — Core listings table with `title`, `description`, `price`, `condition` (enum: `new`, `like_new`, `good`, `fair`), `category_id`, `area_id`, `contact` (phone), `image_url`, `images[]`, `moderation_status` (`pending`/`approved`/`rejected`), `view_count`, `is_sold`, `negotiable`, `bumped_at`. Row-Level Security ensures owners can CRUD their own.
- **`listing_events`** — Tracks contact events (WhatsApp clicks, call clicks) for review gating — a user must contact the seller before reviewing.
- **`reviews`** — 1–5 star ratings with optional comments, linked to listings and reviewers via `listing_events`. Prevents duplicate reviews.
- **`saved_listings`** — User bookmarking of listings (many-to-many).
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
fix: correct listing bump cooldown validation
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
