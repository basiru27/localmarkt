# System Design Document (SDD)

## GMarkt — The Gambia's Classifieds Marketplace

**Version 1.0**

---

### 2.1 System Architecture Overview

GMarkt follows a three-tier web application architecture with strict separation between the presentation, application, and data tiers. All three tiers are independently deployable and communicate over HTTPS.

**Architecture Diagram:**

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION TIER                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Web Browser / PWA Shell              │   │
│  │  ┌──────────┐ ┌────────────┐ ┌────────────────┐  │   │
│  │  │ React 19 │ │ TanStack   │ │ Service Worker │  │   │
│  │  │ SPA      │ │ Query v5   │ │ (Workbox)      │  │   │
│  │  └──────────┘ └────────────┘ └────────────────┘  │   │
│  │  ┌──────────┐ ┌────────────┐ ┌────────────────┐  │   │
│  │  │ IndexedDB│ │ localStorage│ │ Supabase       │  │   │
│  │  │(idb-key) │ │(search hist)│ │ Client SDK     │  │   │
│  │  └──────────┘ └────────────┘ └────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│              ┌───────────┴────────────┐                  │
│              │ Vercel CDN (static)    │                  │
│              │ SPA served globally    │                  │
│              └────────────────────────┘                  │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS + JWT
                           │
┌──────────────────────────┴──────────────────────────────┐
│                    APPLICATION TIER                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Express 4 API Server (Render)             │   │
│  │                                                   │   │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────────────┐   │   │
│  │  │ Helmet  │ │  CORS    │ │ Rate Limit (1k/15)│   │   │
│  │  └─────────┘ └──────────┘ └──────────────────┘   │   │
│  │                                                   │   │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────────────┐   │   │
│  │  │ Auth    │ │ Admin    │ │ Zod Validation   │   │   │
│  │  │ Middle- │ │ Middle-  │ │ (schemas/)       │   │   │
│  │  │ ware    │ │ ware     │ │                  │   │   │
│  │  └─────────┘ └──────────┘ └──────────────────┘   │   │
│  │                                                   │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │              Route Modules                  │   │   │
│  │  │  /listings  /reviews  /admin  /saved       │   │   │
│  │  │  /sellers   /profile  /zones  /categories  │   │   │
│  │  │  /reports   /notifications                 │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                   │   │
│  │  ┌──────────────┐ ┌─────────────────────────┐     │   │
│  │  │ Services:    │ │ Utilities:              │     │   │
│  │  │ notifications│ │ adminLogs, storage,     │     │   │
│  │  │              │ │ catchAsync              │     │   │
│  │  └──────────────┘ └─────────────────────────┘     │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │
                           │ supabase-js (service role)
                           │
┌──────────────────────────┴──────────────────────────────┐
│                      DATA TIER                           │
│                                                          │
│  ┌───────────────────┐  ┌──────────────────────────┐    │
│  │  Supabase Auth    │  │  PostgreSQL Database      │    │
│  │  (JWT, sessions)  │  │  Tables: profiles,       │    │
│  └───────────────────┘  │  listings, zones, areas,  │    │
│                         │  categories, reviews,     │    │
│  ┌───────────────────┐  │  saved_listings,          │    │
│  │  Supabase Storage │  │  listing_events, reports, │    │
│  │  (images, avatars)│  │  notifications,           │    │
│  └───────────────────┘  │  admin_logs              │    │
│                         │                          │    │
│                         │  + RLS Policies          │    │
│                         │  + Triggers              │    │
│                         │  + RPC Functions         │    │
│                         └──────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Data Flow Summary:**

1. The browser loads the React SPA from Vercel's CDN edge network
2. The SPA uses TanStack Query to fetch data via `fetchApi()` calls to the Express API
3. Express middleware authenticates JWT tokens via `supabase.auth.getUser()`
4. Route handlers query or mutate the database using `supabase-js` client (service role key)
5. Listing images are uploaded directly from the browser to Supabase Storage after client-side compression
6. Service worker intercepts API GET requests and serves from cache (StaleWhileRevalidate), falling back to network
7. Offline listing data is stored in IndexedDB via `idb-keyval` and synced via `Background Sync` when connectivity returns

---

### 2.2 Technology Stack

#### 2.2.1 React 19 (v19.2.4)

- **What it is**: A declarative, component-based JavaScript library for building user interfaces, maintained by Meta.
- **Version**: 19.2.4 (from `client/package.json`)
- **Why chosen**: React's component model maps naturally to GMarkt's modular UI (cards, forms, modals, filters). The large ecosystem, extensive tooling support, and Long-Term Support guarantees make it suitable for a final-year project. React 19 introduces the `use()` hook and improved server-side rendering support, though GMarkt uses it as a pure client-side SPA.
- **Alternative considered**: Vue 3 — rejected because the developer had prior React experience, and React's ecosystem maturity (TanStack Query, React Router) was preferred for a single-developer project.

#### 2.2.2 Vite v8 (v8.0.1)

- **What it is**: A modern build tool that uses native ES modules for development and Rollup for production bundling.
- **Version**: 8.0.1 (from `client/package.json`)
- **Why chosen**: Vite provides near-instant Hot Module Replacement (HMR), which significantly accelerates development iteration. It integrates seamlessly with `vite-plugin-pwa` for service worker generation and `@tailwindcss/vite` for CSS processing. Its lean configuration model reduces boilerplate.
- **Alternative considered**: Create React App (deprecated), Webpack — rejected due to slower rebuild times and more complex configuration.

#### 2.2.3 TanStack Query v5 (v5.95.2)

- **What it is**: A data-fetching and server-state management library for React that handles caching, background refetching, pagination, and optimistic updates.
- **Version**: 5.95.2 (from `client/package.json`)
- **Why chosen**: GMarkt deals extensively with server state (listings, reviews, analytics, admin data). TanStack Query eliminates manual `useEffect`/`fetch` boilerplate, provides automatic cache invalidation on mutations, and supports `keepPreviousData` for smooth pagination transitions. Its query deduplication prevents redundant network requests — critical for low-bandwidth environments.
- **Alternative considered**: Redux Toolkit with RTK Query — rejected because TanStack Query provides a simpler API with equivalent caching capabilities, and the project did not need Redux's global state management (auth context handles the little global state that exists).

#### 2.2.4 React Router v7 (v7.13.2)

- **What it is**: A declarative routing library for React applications.
- **Version**: 7.13.2 (from `client/package.json`)
- **Why chosen**: Provides nested routing, lazy loading via `React.lazy()`, and route-level code splitting. GMarkt uses nested routes with a shared `Layout` component and lazy-loads every page for optimal initial bundle size.
- **Alternative considered**: TanStack Router — rejected because React Router was more established and the project does not need its advanced type-safe routing features.

#### 2.2.5 Tailwind CSS v4 (v4.2.2)

- **What it is**: A utility-first CSS framework that enables rapid UI development through composable class names.
- **Version**: 4.2.2 (from `client/package.json`)
- **Why chosen**: Enables mobile-first responsive design without writing custom CSS. The utility-first approach produces consistently styled interfaces with minimal files. The `@tailwindcss/vite` plugin enables on-the-fly CSS processing with no PostCSS configuration.
- **Alternative considered**: Chakra UI / Material UI — rejected because component libraries add bundle weight and impose opinionated styling that would conflict with the custom brand identity required for a Gambian marketplace.

#### 2.2.6 vite-plugin-pwa v1.3.0

- **What it is**: A Vite plugin that integrates Workbox for automatic service worker generation and PWA manifest injection.
- **Version**: 1.3.0 (from `client/package.json`)
- **Why chosen**: Automatically generates the service worker with precaching for all build assets, generates the web app manifest, and handles the complexity of Workbox configuration declaratively.
- **Alternative considered**: Manual Workbox configuration — rejected because the plugin automates asset injection and cache revisioning, which is error-prone to do manually.

#### 2.2.7 idb-keyval v6.2.2

- **What it is**: A tiny (1KB) promise-based wrapper around IndexedDB for simple key-value storage.
- **Version**: 6.2.2 (from `client/package.json`)
- **Why chosen**: GMarkt's offline storage needs are limited to storing pending listing data (key-value pairs). `idb-keyval` provides a minimal, well-tested API with no complex schema setup, perfect for this constrained use case.
- **Alternative considered**: Dexie.js — rejected because the full IndexedDB wrapper was unnecessary overhead for simple key-value storage needs.

#### 2.2.8 browser-image-compression v2.0.2

- **What it is**: A client-side image compression library that reduces file size before upload.
- **Version**: 2.0.2 (from `client/package.json`)
- **Why chosen**: In The Gambia, mobile data is expensive and upload speeds are slow (often sub-1Mbps on 3G). Compressing images client-side to ~300KB before upload reduces bandwidth usage by 90%+ compared to raw camera images, making listing creation viable on cellular networks.
- **Alternative considered**: Server-side compression with Sharp — rejected because uploading large uncompressed images would still consume the same expensive bandwidth. Client-side compression is architecturally superior for this target market.

#### 2.2.9 Node.js

- **What it is**: A JavaScript runtime built on Chrome's V8 engine for server-side application development.
- **Version**: >=18.0.0 (from `server/package.json` engines field; dev uses Node 20+)
- **Why chosen**: Enables JavaScript across the full stack, reducing context-switching for a single-developer project. Native `--watch` mode simplifies the development server. The npm ecosystem provides all required packages.
- **Alternative considered**: Python with FastAPI — rejected because maintaining two languages would increase cognitive load for a solo developer.

#### 2.2.10 Express v4 (v4.18.2)

- **What it is**: A minimal, unopinionated web framework for Node.js.
- **Version**: 4.18.2 (from `server/package.json`)
- **Why chosen**: Express is the most widely adopted Node.js framework with extensive middleware support. It provides exactly the right level of abstraction — enough structure for organised route handling but not so much that it gets in the way of a relatively small API surface.
- **Alternative considered**: Fastify — rejected because Express's broader middleware ecosystem and community support were more appropriate for a project emphasising reliability and familiarity.

#### 2.2.11 Zod v3 (v3.22.4)

- **What it is**: A schema declaration and validation library with TypeScript-first design, used here in plain JavaScript for runtime type safety.
- **Version**: 3.22.4 (from `server/package.json`)
- **Why chosen**: Provides declarative, composable validation schemas for API request bodies. Zod automatically generates meaningful error messages and supports complex validation patterns (refine, conditional validation, enum constraints).
- **Alternative considered**: Joi — rejected because Zod's lighter bundle, simpler API, and superior error message formatting made it the better choice.

#### 2.2.12 Supabase

- **What it is**: An open-source Firebase alternative providing PostgreSQL database, authentication, and file storage as a managed service.
- **Version**: `@supabase/supabase-js` ^2.39.0 (server), ^2.101.0 (client)
- **Why chosen**: Supabase eliminates the operational overhead of managing a PostgreSQL instance, setting up authentication flows, and configuring file storage. The Row-Level Security model provides database-level access control complementary to API-level middleware. The free tier is sufficient for development and moderate production use.
- **Alternative considered**: Firebase — rejected because Google's cloud platform is blocked in some regions and Firebase's Firestore (NoSQL) is less appropriate for the relational data model required (listings belong to users, belong to categories, belong to areas, etc.).

#### 2.2.13 PostgreSQL

- **What it is**: A powerful, open-source object-relational database system.
- **Version**: Managed by Supabase (PostgreSQL 15+)
- **Why chosen**: PostgreSQL supports advanced features critical to GMarkt: Row-Level Security (RLS), array columns (listing images), JSONB columns (notification preferences, admin log details), UUID primary keys, custom enum types, window functions, and SECURITY DEFINER functions.
- **Alternative considered**: SQLite — rejected because it lacks RLS, concurrent write support, and managed hosting options.

#### 2.2.14 Vercel

- **What it is**: A cloud platform for static site deployment with global CDN edge network.
- **Why chosen**: Vercel provides a generous free tier, automatic HTTPS, global CDN distribution, and zero-configuration deployment for Vite projects. The `vercel.json` rewrite rule ensures client-side routing works correctly by mapping all paths to `index.html`.
- **Alternative considered**: Netlify — functionally equivalent; Vercel was chosen because of tighter Vite integration and familiarity.

#### 2.2.15 Render

- **What it is**: A unified cloud platform for web services, databases, and static sites.
- **Why chosen**: Render provides a free tier for web services that is ideal for a Node.js API server. It supports Node 20, automatic HTTPS, and continuous deployment from Git. The free tier's spin-down after inactivity is an acceptable trade-off for a university project.
- **Alternative considered**: Railway, Fly.io — both offer similar services but Render's simpler configuration and clearer free tier made it the practical choice.

---

### 2.3 Database Design

#### 2.3.1 Table Specifications

**profiles**

Purpose: Extends Supabase `auth.users` with application-specific profile data. Auto-created via database trigger on user signup.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, FK → auth.users(id) ON DELETE CASCADE | Matches Supabase Auth user ID |
| display_name | TEXT | nullable | User's public display name |
| email | TEXT | nullable | User's email address |
| phone_number | TEXT | nullable | Gambian phone number (+220 format) |
| avatar_url | TEXT | nullable | URL to avatar image in Supabase Storage |
| bio | TEXT | nullable | Short user biography |
| role | TEXT | default 'user' | RBAC: 'user', 'admin', or 'super_admin' |
| is_banned | BOOLEAN | default false | Account suspension flag |
| verified_seller | BOOLEAN | default false | Seller verification badge |
| notifications | JSONB | nullable | Per-user notification preferences |
| created_at | TIMESTAMPTZ | default NOW() | Account creation timestamp |

Relationships: One profile has many listings. One profile has many reviews (as reviewer). One profile has many saved_listings.

**zones**

Purpose: Lookup table for the six major geographic zones of the Greater Banjul Area.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | SERIAL | PK | Auto-incrementing identifier |
| name | TEXT | NOT NULL, UNIQUE | Zone name (e.g., "Serrekunda") |

Relationships: One zone has many areas.

**areas**

Purpose: Lookup table for 28 neighbourhoods within the Greater Banjul Area zones.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | SERIAL | PK | Auto-incrementing identifier |
| name | TEXT | NOT NULL | Area name (e.g., "Kanifing") |
| zone_id | INTEGER | NOT NULL, FK → zones(id) ON DELETE CASCADE | Parent zone reference |

Relationships: Many areas belong to one zone. One area has many listings.

**categories**

Purpose: Lookup table for 9 listing categories.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | SERIAL | PK | Auto-incrementing identifier |
| name | TEXT | NOT NULL, UNIQUE | Category name (e.g., "Electronics & Phones") |

Relationships: One category has many listings.

**listings**

Purpose: Core table storing all classified advertisements.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, default gen_random_uuid() | Unique listing identifier |
| user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | Owner of the listing |
| title | TEXT | NOT NULL | Listing title (3–100 chars) |
| description | TEXT | nullable | Detailed description (max 2000 chars) |
| price | NUMERIC | NOT NULL, CHECK (price >= 0) | Price in Gambian Dalasi |
| condition | TEXT | NOT NULL, CHECK (IN 'new','used_like_new','used_good','used_fair') | Item condition |
| area_id | INTEGER | FK → areas(id) | Location within GBA |
| category_id | INTEGER | FK → categories(id) | Listing category |
| contact | TEXT | NOT NULL | Seller's contact phone number |
| image_url | TEXT | nullable | Primary listing image URL |
| images | TEXT[] | default ARRAY[] | Additional image URLs (max 5) |
| is_sold | BOOLEAN | default false | Sold status |
| sold_at | TIMESTAMPTZ | nullable | When the listing was marked sold (auto-set via trigger) |
| bumped_at | TIMESTAMPTZ | nullable | When the listing was last bumped (for sort order) |
| moderated_by | UUID | nullable | Admin who moderated this listing |
| moderated_at | TIMESTAMPTZ | nullable | When moderation occurred |
| moderation_note | TEXT | nullable | Admin's note on moderation decision |
| view_count | INTEGER | default 0 | Total view count (incremented via RPC) |
| contact_count | INTEGER | default 0 | Total contact click count (incremented via RPC) |
| negotiable | BOOLEAN | default false | Whether price is negotiable |
| created_at | TIMESTAMPTZ | default NOW() | Listing creation timestamp |
| updated_at | TIMESTAMPTZ | default NOW() | Last update timestamp (auto-updated via trigger) |

Relationships: Many listings belong to one user (profile). Many listings belong to one area. Many listings belong to one category. One listing has many reviews. One listing has many listing_events. One listing has many saved_listings entries.

**listing_events**

Purpose: Tracks view and contact-click events for analytics and review gating.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, default gen_random_uuid() | Unique event identifier |
| listing_id | UUID | NOT NULL, FK → listings(id) ON DELETE CASCADE | The listing that was interacted with |
| event | event_type | NOT NULL | Enum: 'view' or 'contact_click' |
| user_id | UUID | nullable, FK → auth.users(id) ON DELETE SET NULL | The user who triggered the event (nullable for unauthenticated views) |
| created_at | TIMESTAMPTZ | default NOW() | When the event occurred |

Relationships: Many events belong to one listing. Many events belong to one user (optional).

**reviews**

Purpose: Stores user-submitted ratings and comments on listings.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, default gen_random_uuid() | Unique review identifier |
| listing_id | UUID | NOT NULL, FK → listings(id) ON DELETE CASCADE | The listing being reviewed |
| reviewer_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | The user who wrote the review |
| rating | INTEGER | NOT NULL, CHECK (1–5) | Star rating |
| comment | TEXT | nullable | Optional written review (max 2000 chars) |
| created_at | TIMESTAMPTZ | default NOW() | When the review was submitted |

Constraints: UNIQUE (listing_id, reviewer_id) — one review per user per listing.

Relationships: One review belongs to one listing. One review belongs to one reviewer (profile).

**saved_listings**

Purpose: Stores user bookmark/save actions on listings.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, default gen_random_uuid() | Unique save identifier |
| user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | The user who saved the listing |
| listing_id | UUID | NOT NULL, FK → listings(id) ON DELETE CASCADE | The saved listing |
| created_at | TIMESTAMPTZ | default NOW() | When the save occurred |

Constraints: UNIQUE (user_id, listing_id) — prevents duplicate saves.

Relationships: Many saved_listings belong to one user. Many saved_listings belong to one listing.

**notifications**

Purpose: Stores in-app notifications for users.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, default gen_random_uuid() | Unique notification identifier |
| user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | Notification recipient |
| type | TEXT | NOT NULL | Notification type (e.g., 'NEW_LISTING', 'LISTING_APPROVED') |
| title | TEXT | NOT NULL | Short notification title |
| message | TEXT | NOT NULL | Notification body text |
| link | TEXT | nullable | Deep link URL for navigation |
| is_read | BOOLEAN | default false | Read status |
| created_at | TIMESTAMPTZ | default NOW() | When the notification was created |

Relationships: Many notifications belong to one user.

**reports**

Purpose: Stores user reports on listings or other users for moderation.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, default gen_random_uuid() | Unique report identifier |
| reporter_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | The user who submitted the report |
| listing_id | UUID | nullable, FK → listings(id) ON DELETE CASCADE | The reported listing (if reporting a listing) |
| reported_user_id | UUID | nullable, FK → auth.users(id) ON DELETE CASCADE | The reported user (if reporting a user) |
| reason | TEXT | NOT NULL | Report reason (3–120 chars) |
| details | TEXT | nullable | Additional context |
| status | TEXT | default 'pending' | 'pending', 'resolved', or 'dismissed' |
| handled_by | UUID | nullable, FK → auth.users(id) | Admin who handled the report |
| handled_at | TIMESTAMPTZ | nullable | When the report was handled |
| created_at | TIMESTAMPTZ | default NOW() | When the report was submitted |

Relationships: Many reports belong to one reporter. One report optionally references one listing. One report optionally references one reported user.

**admin_logs**

Purpose: Immutable audit trail for all admin actions on the platform.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID | PK, default gen_random_uuid() | Unique log entry identifier |
| admin_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | Admin who performed the action |
| action | TEXT | NOT NULL | Action code (e.g., 'APPROVE_LISTING', 'BAN_USER') |
| target_type | TEXT | NOT NULL | Type of target entity ('LISTING', 'USER', 'REPORT') |
| target_id | TEXT | NOT NULL | ID of the target entity |
| details | JSONB | default '{}' | Additional action metadata |
| created_at | TIMESTAMPTZ | default NOW() | When the action occurred |

Relationships: Many logs belong to one admin.

**orders** (REMOVED)

Purpose: Previously stored transactional order data when GMarkt was designed as a transactional marketplace (buyer purchases from seller). Removed in migration 024 when the platform shifted to a pure classifieds model. The table was dropped along with its triggers and functions. This architectural decision is explained in Section 2.8.

#### 2.3.2 Key Design Decisions

**Why RLS is used at the database level rather than only at the API level:**

The Express API server connects to Supabase using the service role key, which bypasses RLS. If a developer error or security vulnerability in the middleware allowed requests to reach the database without proper authentication checks, there would be no defence-in-depth. RLS policies on every table ensure that even if a direct database connection is somehow established (e.g., via the Supabase dashboard SQL editor, or a misconfigured client), users can only access their own data. For example, the `saved_listings` RLS policy ensures `auth.uid() = user_id` for SELECT — meaning even a direct query from the frontend's anon-key client cannot read another user's saved listings.

**Why listing_events uses an enum type for event:**

PostgreSQL enums provide database-level constraint enforcement on event types. The alternative (a VARCHAR column with application-level validation) would allow theoretically invalid event types to be inserted via direct database access or RPC. The enum guarantees that only `view` and `contact_click` values exist in the column. Adding a new event type requires a migration (`ALTER TYPE ... ADD VALUE`), which is a deliberate, version-controlled process.

**How the bump system works:**

The `listings.bumped_at` column stores the timestamp of the last bump. The default listing query sorts by `bumped_at DESC NULLS LAST, created_at DESC`, ensuring bumped listings appear first in the feed, with non-bumped listings ordered by creation date. A first-time bump sets `bumped_at` to the current timestamp. A subsequent bump is only allowed if both:
1. The user has no other listing bumped within the last 24 hours (global per-user cooldown), and
2. The specific listing has not been bumped within the last 24 hours (per-listing safety net).

**How sold_at is set automatically via trigger:**

The `trigger_set_listing_sold_at` trigger fires `BEFORE UPDATE OF is_sold` on the `listings` table. When `is_sold` changes from false to true, it sets `sold_at = NOW()`. When `is_sold` changes from true to false, it sets `sold_at = NULL`. This ensures the timestamp is always synchronised with the boolean flag, removing the possibility of application-level bugs where the flag is set but the timestamp is not.

**The seller aggregate function (get_seller_profile RPC):**

The `get_seller_profile(p_seller_id UUID)` function aggregates seller data across multiple tables in a single query. It returns the seller's profile information, active listing count (approved and not sold), total reviews received across all listings, and the average rating. The function is defined as `STABLE SECURITY DEFINER`, meaning it always returns consistent results within the same transaction and runs with the privileges of the function owner (bypassing RLS on the underlying tables). This RPC was created in migration 028 to avoid N+1 query patterns in the seller profile page.

#### 2.3.3 Entity-Relationship Diagram

```
┌───────────────────┐     ┌───────────────────────┐
│     profiles      │     │     auth.users         │
│───────────────────│     │ (Supabase managed)     │
│ PK id ───────────────►  │ PK id                  │
│   display_name    │     └───────────────────────┘
│   email           │
│   role            │             1
│   is_banned       │             │
│   verified_seller │             │
│   phone_number    │             │
│   avatar_url      │             │
│   bio             │             │
└────────┬──────────┘             │
         │ 1                     │
         │                       │
         │ has many              │
         ▼                       │
┌───────────────────┐            │
│    listings       │            │
│───────────────────│            │
│ PK id             │            │
│ FK user_id ────────────────►──┘
│   title           │
│   description     │
│   price           │
│   condition       │
│ FK area_id ────────┐
│ FK category_id ────┤
│   contact         │            │
│   image_url       │            │
│   images[]        │            │
│   is_sold         │            │
│   sold_at         │            │
│   bumped_at       │            │
│   moderation_status│           │
│   view_count      │            │
│   contact_count   │            │
└────────┬──────────┘            │
         │ 1                     │
         │                       │
         ├────────────────────┐  │
         │ has many           │  │
         ▼                    ▼  │
┌───────────────────┐   ┌────────┴─────────┐
│  listing_events    │   │  reviews         │
│───────────────────│   │──────────────────│
│ PK id             │   │ PK id            │
│ FK listing_id     │   │ FK listing_id    │
│   event (enum)    │   │ FK reviewer_id ───►──┘
│ FK user_id ────────►──┘   rating (1-5)   │
│   created_at      │   │   comment        │
└───────────────────┘   └──────────────────┘


┌───────────────────┐   ┌───────────────────┐
│    saved_listings  │   │   categories      │
│───────────────────│   │──────────────────│
│ PK id             │   │ PK id             │
│ FK user_id ──────────►│   name            │
│ FK listing_id ────────┤   (seeded data)   │
│   created_at      │   └──────────────────┘
└───────────────────┘

┌───────────────────┐   ┌───────────────────┐
│     zones          │   │    areas          │
│───────────────────│   │──────────────────│
│ PK id             │───│ PK id             │
│   name            │   │ FK zone_id        │
│   (seeded data)   │   │   name            │
└───────────────────┘   └──────────────────┘

┌───────────────────┐   ┌───────────────────┐
│   notifications    │   │    reports        │
│───────────────────│   │──────────────────│
│ PK id             │   │ PK id             │
│ FK user_id        │   │ FK reporter_id    │
│   type            │   │ FK listing_id     │
│   title           │   │ FK reported_user_id│
│   message         │   │   reason           │
│   link            │   │   status           │
│   is_read         │   │ FK handled_by     │
└───────────────────┘   └──────────────────┘

┌───────────────────┐
│  admin_logs       │
│──────────────────│
│ PK id             │
│ FK admin_id       │
│   action          │
│   target_type     │
│   target_id       │
│   details (JSONB) │
└──────────────────┘
```

**Relationships Notation:**

```
profiles       ||--o{ listings       : "posts"
listings       ||--o{ reviews        : "receives"
profiles       ||--o{ reviews        : "writes" (as reviewer_id)
listings       ||--o{ listing_events : "has events"
profiles       ||--o{ listing_events : "triggers" (as user_id, optional)
profiles       ||--o{ saved_listings : "saves"
listings       ||--o{ saved_listings : "saved by"
zones          ||--o{ areas          : "contains"
areas          ||--o{ listings       : "located in"
categories     ||--o{ listings       : "classifies"
profiles       ||--o{ notifications  : "receives"
profiles       ||--o{ reports        : "submits" (as reporter_id)
profiles       ||--o{ reports        : "handles" (as handled_by)
profiles       ||--o{ admin_logs     : "performs" (as admin_id)
```

Legend: `||--o{` means "one to many" (one parent has zero or more children).

---

### 2.4 API Design

#### 2.4.1 Public Endpoints (No Authentication Required)

| Method | Route | Auth | Description | Request Body / Query | Response |
|--------|-------|------|-------------|---------------------|----------|
| GET | /api/health | No | Health check | — | `{ status, timestamp }` |
| GET | /api/listings | No | List listings (paginated, filtered) | Query: `category`, `area_id`, `search`, `page`, `limit`, `sort`, `cursor`, `user_id` | `{ data[], pagination }` |
| GET | /api/listings/stats | No | Marketplace statistics | — | `{ totalListings, activeAreas, activeSellers }` |
| GET | /api/listings/search/suggestions | No | Search autocomplete | Query: `q` | `string[]` (5 unique titles) |
| GET | /api/listings/:id | Optional | Get single listing | — | Listing object with `rating_avg`, `review_count`, `is_expired`, `seller` |
| GET | /api/zones | No | List all zones | — | `[{ id, name }]` |
| GET | /api/zones/:id/areas | No | List areas in zone | — | `[{ id, name, zone_id }]` |
| GET | /api/categories | No | List all categories | — | `[{ id, name }]` |
| GET | /api/sellers/:id | No | Get seller profile | — | `{ seller: { id, display_name, avatar_url, ... } }` |
| GET | /api/sellers/:id/listings | No | Get seller's active listings | Query: `page`, `limit` | `{ listings[], total, page, pages }` |
| GET | /api/sellers/:id/reviews | No | Get seller's reviews | Query: `page`, `limit` | `{ reviews[], total, page, pages }` |

#### 2.4.2 Authenticated Endpoints (Requires JWT Bearer Token)

| Method | Route | Auth | Description | Request Body / Query | Response |
|--------|-------|------|-------------|---------------------|----------|
| GET | /api/listings/mine | Yes | Get authenticated user's listings | Query: `category`, `area_id`, `search`, `page`, `limit`, `is_sold`, `moderation_status` | `{ data[], pagination }` |
| GET | /api/listings/analytics | Yes | Analytics data for seller | Query: `range` (7\|30\|90\|all) | `{ summary, views_over_time[], listing_performance[], range }` |
| GET | /api/listings/:id/can-review | Yes | Check review eligibility | — | `{ can_review: boolean, reason: string\|null }` |
| POST | /api/listings | Yes | Create listing | `{ title, description, price, condition, area_id, category_id, contact, image_url?, images?, negotiable? }` | Created listing object (201) |
| POST | /api/listings/:id/bump | Yes | Bump listing to top | — | `{ success, message }` or 429 with retry time |
| PUT | /api/listings/:id | Yes | Update listing | Partial listing fields | Updated listing object |
| DELETE | /api/listings/:id | Yes | Delete listing | — | 204 No Content |
| PATCH | /api/listings/:id/sold | Yes | Toggle sold status | `{ is_sold: boolean }` | Updated listing object |
| GET | /api/listings/:listingId/reviews | Optional | Get reviews for listing | — | `[{ id, rating, comment, created_at, reviewer }]` |
| POST | /api/listings/:listingId/reviews | Yes | Submit review | `{ rating, comment? }` | Created review object (201) |
| PUT | /api/reviews/:reviewId | Yes | Update review | `{ rating?, comment? }` | Updated review object |
| DELETE | /api/reviews/:reviewId | Yes | Delete review | — | 204 No Content |
| POST | /api/reports | Yes | Submit report | `{ listing_id?, reported_user_id?, reason, details? }` | Created report object (201) |
| GET | /api/profile | Yes | Get own profile | — | Profile object |
| PUT | /api/profile | Yes | Update own profile | `{ display_name?, phone_number?, bio?, avatar_url?, notifications? }` | Updated profile object |
| DELETE | /api/profile/avatar | Yes | Delete avatar | — | Updated profile object |
| GET | /api/notifications | Yes | Get notifications | Query: `limit`, `unread_only` | `{ notifications[], unread_count }` |
| PATCH | /api/notifications/:id/read | Yes | Mark notification read | — | `{ success }` |
| PATCH | /api/notifications/read-all | Yes | Mark all notifications read | — | `{ success }` |
| DELETE | /api/notifications/:id | Yes | Delete notification | — | `{ success }` |
| GET | /api/saved | Yes | Get saved listings | — | `{ saved[], total }` |
| GET | /api/saved/ids | Yes | Get saved listing IDs | — | `{ ids[] }` |
| POST | /api/saved/:listingId | Yes | Save listing | — | `{ success, saved: true }` (201) |
| DELETE | /api/saved/:listingId | Yes | Unsave listing | — | `{ success, saved: false }` |

#### 2.4.3 Admin Endpoints (Requires Admin or Super Admin Role)

| Method | Route | Auth | Description | Request Body / Query | Response |
|--------|-------|------|-------------|---------------------|----------|
| GET | /api/admin/stats | Admin | Platform statistics | Query: `days` (default 14) | `{ users_total, users_banned, listings_total, listings_pending, reports_pending, recent_logs[], listings_chart[] }` |
| GET | /api/admin/users | Admin | List users | Query: `search`, `role`, `banned`, `page`, `limit` | `{ data[], pagination }` |
| PUT | /api/admin/users/:id/ban | Admin | Ban/unban user | `{ is_banned, reason? }` | Updated profile object |
| PUT | /api/admin/users/:id/verify | Admin | Verify/unverify seller | `{ verified_seller }` | Updated profile object |
| DELETE | /api/admin/users/:id | Super Admin | Permanently delete user | — | 204 No Content |
| GET | /api/admin/listings | Admin | List all listings | Query: `status`, `search`, `page`, `limit` | `{ data[], pagination }` |
| PUT | /api/admin/listings/:id/moderate | Admin | Approve/reject listing | `{ moderation_status, moderation_note? }` | Updated listing object |
| DELETE | /api/admin/listings/:id | Admin | Delete listing | — | 204 No Content |
| GET | /api/admin/reports | Admin | List reports | Query: `status`, `page`, `limit` | `{ data[], pagination }` |
| PUT | /api/admin/reports/:id | Admin | Update report status | `{ status }` | Updated report object |
| GET | /api/admin/logs | Super Admin | View audit logs | Query: `admin_id`, `action`, `date_from`, `date_to`, `page`, `limit` | `{ data[], pagination }` |

---

### 2.5 Frontend Architecture

#### 2.5.1 Component Hierarchy

```
App
 ├── QueryClientProvider (TanStack Query v5)
 ├── AuthProvider (Context)
 ├── ToastProvider (Context)
 ├── OfflineProvider (Context)
 ├── BrowserRouter
 │   └── ErrorBoundary
 │       └── Suspense (PageLoader fallback)
 │           └── Routes
 │               └── Layout (Header + Footer shell)
 │                   ├── Page components (lazy loaded)
 │                   │   ├── ListingFeed
 │                   │   ├── ListingDetail
 │                   │   ├── SellerProfile
 │                   │   ├── CreateListing
 │                   │   ├── EditListing
 │                   │   ├── MyListings
 │                   │   ├── SavedListings
 │                   │   ├── AnalyticsDashboard
 │                   │   ├── Profile
 │                   │   ├── Login
 │                   │   ├── Register
 │                   │   ├── ForgotPassword
 │                   │   ├── ResetPassword
 │                   │   └── NotFound
 │                   └── AdminLayout (nested under Layout)
 │                       ├── AdminDashboard
 │                       ├── AdminUsers
 │                       ├── AdminListings
 │                       ├── AdminReports
 │                       └── AdminLogs (super admin only)
 │
 ├── Shared Components
 │   ├── Header (navigation, auth status, NotificationBell)
 │   ├── Footer
 │   ├── ListingCard + ListingCardSkeleton
 │   ├── ListingForm (used by CreateListing + EditListing)
 │   ├── SearchFilters (category, zone/area, sort)
 │   ├── ReviewForm + ReviewList + StarRating
 │   ├── SaveButton
 │   ├── SafeImage / AvatarImage
 │   ├── SellerInfo
 │   ├── StatsCard + SvgSparkline
 │   ├── Modal / AlertMessage / FormField
 │   ├── OfflineBanner / PendingSyncBadge
 │   ├── Pagination
 │   ├── ImageLightbox
 │   ├── ProtectedRoute / AdminRoute
 │   └── ErrorBoundary
```

#### 2.5.2 Routing Structure

All routes are defined in `App.jsx` and wrapped in a `Layout` component that provides the common header and footer shell. Lazy loading via `React.lazy()` and `Suspense` ensures that page component JavaScript is only loaded when the user navigates to that route.

**Public routes** (no authentication required):
- `/` — ListingFeed (home page with search and filters)
- `/listings/:id` — ListingDetail
- `/sellers/:id` — SellerProfile
- `/login` — Login
- `/register` — Register
- `/forgot-password` — ForgotPassword
- `/reset-password` — ResetPassword

**Protected routes** (wrapped in `<ProtectedRoute>`):
- `/listings/new` — CreateListing
- `/listings/:id/edit` — EditListing
- `/my-listings` — MyListings
- `/saved` — SavedListings
- `/my-listings/analytics` — AnalyticsDashboard
- `/profile` — Profile

**Admin routes** (wrapped in `<AdminRoute>`, nested under `/admin`):
- `/admin` — AdminDashboard
- `/admin/users` — AdminUsers
- `/admin/listings` — AdminListings
- `/admin/reports` — AdminReports
- `/admin/logs` — AdminLogs (requires `requireSuperAdmin` prop)

The `ProtectedRoute` component checks `useAuth().isAuthenticated` and redirects to `/login` if false. The `AdminRoute` component additionally checks `useAuth().isAdmin` and can optionally require `isSuperAdmin`, returning a 404 page if the user lacks the required role — a security-through-obscurity approach that prevents non-admins from discovering admin paths.

#### 2.5.3 State Management Approach

GMarkt uses three distinct state management patterns:

**TanStack Query for server state**: All data fetched from the API is managed by TanStack Query. This includes listings, zones, categories, reviews, analytics, notifications, saved listings, seller profiles, and all admin data. TanStack Query provides:
- Automatic caching with configurable `staleTime` (5 minutes for public listings, 0 for owner-specific data)
- Background refetching with configurable intervals (30 seconds for analytics and notifications)
- Optimistic updates for saved listings (immediately toggling the heart icon before server confirmation)
- Pagination support via `placeholderData: keepPreviousData`
- Cache invalidation on mutations (`queryClient.invalidateQueries`)
- Retry logic (1 retry by default, disabled for analytics to fail fast)

**React Context for cross-cutting application state**:
- `AuthContext` (`client/src/context/AuthContext.jsx`): Manages user, session, and profile state. Provides `signUp`, `signIn`, `signOut`, `getAuthHeader` helper, and role-checking booleans (`isAdmin`, `isSuperAdmin`). Listens for `auth:expired` custom events dispatched from the API layer and provides automatic token refresh.
- `OfflineContext` (`client/src/context/OfflineContext.jsx`): Tracks online/offline status, pending sync count, service-worker support, and the `beforeinstallprompt` state. Provides `processOfflineQueue()`, `refreshPendingCount()`, `installApp()`, and `dismissUnsupportedBanner()`.
- `ToastContext` (`client/src/context/ToastContext.jsx`): Provides success/error/info toast notification functions.

**useState for local UI state**: Individual components use `useState` for purely local concerns: form input values, modal open/close, dropdown visibility, filter selection state.

#### 2.5.4 Custom Hooks and Responsibilities

| Hook | File | Responsibility |
|------|------|----------------|
| `useListings` | `hooks/useListings.js` | Fetches paginated listing lists (public feed or user's own). Manages query keys with filter serialisation. |
| `useListing` | `hooks/useListings.js` | Fetches a single listing by ID with optional auth header. |
| `useCreateListing` | `hooks/useListings.js` | Creates a listing — posts to API if online, saves to IndexedDB if offline. Invalidates listing lists on success. |
| `useUpdateListing` | `hooks/useListings.js` | Updates a listing. Updates both detail cache and list cache optimistically. |
| `useDeleteListing` | `hooks/useListings.js` | Deletes a listing and invalidates all listing queries. |
| `useMarkAsSold` | `hooks/useListings.js` | Toggles the sold status of a listing. |
| `useBumpListing` | `hooks/useListings.js` | Bumps a listing with error handling for 429 cooldown response. |
| `useAnalytics` | `hooks/useListings.js` | Fetches analytics data for a given date range. Polls every 30 seconds. |
| `useListingStats` | `hooks/useListings.js` | Fetches marketplace-level statistics. |
| `useReviews` | `hooks/useReviews.js` | Fetches reviews for a listing with optional auth. |
| `useCreateReview` | `hooks/useReviews.js` | Creates a review and invalidates review + listing caches. |
| `useCanReview` | `hooks/useReviews.js` | Checks if the current user can review a given listing (soft gate check). |
| `useSaved` | `hooks/useSaved.js` | Fetches the user's saved listings. |
| `useSavedIds` | `hooks/useSaved.js` | Fetches just the listing IDs the user has saved (for heart icon state). |
| `useToggleSave` | `hooks/useSaved.js` | Optimistically toggles save/unsave with rollback on error. |
| `useSellerProfile` | `hooks/useSellers.js` | Fetches seller profile data via `get_seller_profile` RPC. |
| `useSellerListings` | `hooks/useSellers.js` | Fetches paginated listings for a seller. |
| `useSellerReviews` | `hooks/useSellers.js` | Fetches paginated reviews for a seller's listings. |
| `useAdminStats` | `hooks/useAdmin.js` | Fetches admin dashboard statistics. Polls every 30 seconds. |
| `useAdminUsers` | `hooks/useAdmin.js` | Fetches paginated user list for admin. |
| `useAdminListings` | `hooks/useAdmin.js` | Fetches paginated listing list for admin moderation. |
| `useAdminReports` | `hooks/useAdmin.js` | Fetches paginated reports list for admin. |
| `useAdminLogs` | `hooks/useAdmin.js` | Fetches paginated audit logs (super admin only). |
| `useUpdateUserBanStatus` | `hooks/useAdmin.js` | Optimistically bans/unbans a user with rollback. |
| `useUpdateUserVerifyStatus` | `hooks/useAdmin.js` | Optimistically verifies/unverifies a seller. |
| `useModerateListing` | `hooks/useAdmin.js` | Optimistically approves/rejects a listing. |
| `useNotifications` | `hooks/useNotifications.js` | Fetches notifications with unread count. Polls every 30 seconds. |
| `useShareListing` | `hooks/useShare.js` | Provides a `share()` function using Web Share API with clipboard fallback. |
| `useZones` | `hooks/useLookups.js` | Fetches zones with 24-hour cache. |
| `useAreas` | `hooks/useLookups.js` | Fetches areas for a zone with 24-hour cache. |
| `useCategories` | `hooks/useLookups.js` | Fetches categories with 24-hour cache. |
| `useCreateReport` | `hooks/useReports.js` | Submits a report. |

---

### 2.6 Security Design

#### 2.6.1 Authentication Flow

The authentication flow uses Supabase Auth as the identity provider with JWT token verification on every authenticated API request:

1. **Registration**: User submits email, password, display name, and phone number via `AuthContext.signUp()`. Supabase Auth creates a new `auth.users` entry and sends a confirmation email. A database trigger (`on_auth_user_created`) automatically creates a corresponding `profiles` row.

2. **Sign-in**: User submits email and password via `AuthContext.signIn()`. Supabase Auth validates credentials and returns a session containing an access token (JWT, 1-hour expiry) and a refresh token. The "remember me" option controls whether the session persists across browser restarts via a `gmarkt_no_persist` localStorage flag that clears Supabase's persisted session on next load.

3. **JWT Verification on Server**: The `authenticate` middleware extracts the Bearer token from the `Authorization` header and calls `supabase.auth.getUser(token)`. This verifies the JWT signature with Supabase Auth and returns the user object. The middleware extracts role and ban status from `user.app_metadata` and attaches `req.user` with `id`, `email`, `role`, `isAdmin`, and `isSuperAdmin` properties. Banned users receive a 403 response.

4. **Token Refresh on Client**: When an API request receives a 401, the `fetchApi()` helper attempts to refresh the session via `supabase.auth.refreshSession()`. If successful, it retries the original request once with the new token. If refresh fails, it dispatches a custom `auth:expired` event that triggers an automatic sign-out and redirect to the login page.

5. **Optional Auth**: The `optionalAuth` middleware attaches `req.user` if a valid token is present but does not block unauthenticated requests. This is used by endpoints like `GET /listings/:id` where authentication is beneficial (e.g., showing hidden data to the listing owner) but not required for public access.

#### 2.6.2 Row-Level Security

RLS policies are applied to every table in the database, providing defence-in-depth. The Express server uses the Supabase service role key (which bypasses RLS), but the policies ensure that even if a client-side query or a direct database connection attempts unauthorised access, it is blocked:

| Table | Policy Type | Rule |
|-------|-------------|------|
| profiles | SELECT | Public — anyone can view profiles |
| profiles | INSERT | Authenticated — user can only insert their own profile (`auth.uid() = id`) |
| profiles | UPDATE | Authenticated — user can only update their own profile |
| listings | SELECT | Public — anyone can view all listings |
| listings | INSERT | Authenticated — must set `user_id = auth.uid()` |
| listings | UPDATE | Authenticated — only the owning user can update |
| listings | DELETE | Authenticated — only the owning user can delete |
| saved_listings | SELECT | Authenticated — users can only see their own saved listings |
| saved_listings | INSERT | Authenticated — must set `user_id = auth.uid()` |
| saved_listings | DELETE | Authenticated — can only delete their own saved listings |
| Storage (objects) | SELECT | Authenticated — users can only view files under their own user-ID prefix |
| Storage (objects) | INSERT | Authenticated — users can only upload files under their own user-ID prefix |
| Storage (objects) | UPDATE | Authenticated — users can only update files under their own user-ID prefix |
| Storage (objects) | DELETE | Authenticated — users can only delete files under their own user-ID prefix |

#### 2.6.3 RBAC

Role-based access control is implemented at three layers:

1. **Database layer**: The `profiles.role` column stores the user's role (`user`, `admin`, or `super_admin`). A database trigger and the `sync_claims_to_jwt` migration ensure roles are synchronised to `auth.users.app_metadata` on sign-in.

2. **API middleware layer**: Two middleware functions enforce role-based access:
   - `requireAdmin(req, res, next)`: Returns 403 if `req.user.isAdmin` is false.
   - `requireSuperAdmin(req, res, next)`: Returns 403 if `req.user.isSuperAdmin` is false.
   
   All admin routes are mounted under `router.use('/admin', authenticate, requireAdmin)`, ensuring both authentication and admin role check are applied. The audit logs endpoint additionally wraps individual handlers with `requireSuperAdmin`.

3. **Frontend layer**: The `<AdminRoute>` component conditionally renders its children only if the authenticated user has the `admin` or `super_admin` role. The `requireSuperAdmin` prop on `<AdminRoute>` additionally checks for super admin. Non-admin users are shown a 404 page (obscuring the existence of admin routes).

#### 2.6.4 Input Validation

All POST, PUT, and PATCH endpoints use Zod schema validation applied via `validateBody(schema)` middleware:

- **Listings**: `createListingSchema` validates title (3–100 chars), description (max 2000), price (positive, max 999999999), condition (enum), area_id, category_id, contact (+220 phone regex), images (max 5, valid URLs), negotiable (boolean). `updateListingSchema` mirrors the create schema with all fields optional.
- **Reviews**: `createReviewSchema` validates rating (integer 1–5) and comment (max 2000 chars).
- **Reports**: `createReportSchema` validates listing_id or reported_user_id (at least one required), reason (3–120 chars), details (max 2000).
- **Admin actions**: `updateBanStatusSchema` validates is_banned (boolean) and reason (max 500). `updateVerifyStatusSchema` validates verified_seller (boolean). `moderateListingSchema` validates moderation_status (approved|rejected) and moderation_note (max 1000).
- **Profile**: `updateProfileSchema` validates display_name (2–50 chars), phone_number (+220 regex), bio (max 500), avatar_url (valid URL), notifications (record of booleans).

Zod validation errors return a 400 status with structured error details including the field path and human-readable message.

#### 2.6.5 Rate Limiting

Rate limiting is implemented using `express-rate-limit` at multiple granularities:

| Scope | Window | Max Requests | RateLimit-* Headers |
|-------|--------|--------------|-------------------|
| Global (all `/api/*` routes) | 15 minutes | 1000 | Standard |
| Listing creation (`POST /api/listings`) | 15 minutes | 10 | Standard |
| Review submission (`POST /api/listings/:id/reviews`) | 15 minutes | 5 | Standard |
| Report submission (`POST /api/reports`) | 15 minutes | 5 | Standard |

The global rate limiter uses `standardHeaders: true` (returning `RateLimit-*` headers per the IETF RateLimit specification) and `legacyHeaders: false` (suppressing deprecated `X-RateLimit-*` headers). Health check requests (`/api/health`) are excluded from rate limiting. The `'trust proxy'` setting is enabled because the server runs behind Render's reverse proxy.

#### 2.6.6 Security Headers

The `helmet()` middleware applies security-related HTTP headers to all responses:

- `Content-Security-Policy`: Restricts script sources, style sources, and other resource types
- `X-Content-Type-Options: nosniff`: Prevents MIME type sniffing
- `X-Frame-Options: SAMEORIGIN`: Prevents clickjacking attacks
- `X-XSS-Protection: 0`: Disables the deprecated XSS filter in favour of CSP
- `Strict-Transport-Security`: Enforces HTTPS connections
- `Referrer-Policy`: Controls referrer header information

#### 2.6.7 CORS

CORS is configured to accept requests only from specific origins:

```javascript
// Production:
['https://gmarkt.tech', 'https://www.gmarkt.tech', process.env.CLIENT_ORIGIN]

// Development:
['http://localhost:5173', 'http://localhost:4173', process.env.CLIENT_ORIGIN]
```

Credentials are allowed (`credentials: true`) to support cookie-based authentication if needed in future, and `optionsSuccessStatus: 200` ensures compatibility with legacy browsers.

#### 2.6.8 Image Security

Image validation occurs before upload at the client level:

- **Type validation**: Only `image/jpeg`, `image/png`, and `image/webp` MIME types are accepted, enforced both in the client-side JavaScript validation and in the Supabase Storage bucket configuration via `allowed_mime_types`.
- **Size limit**: Maximum file size is 5MB, enforced client-side and via `file_size_limit` on the storage bucket.
- **Client-side compression**: Images are compressed to a maximum of 300KB and 800px width before upload, reducing the attack surface by processing known-safe image formats through a well-tested library (`browser-image-compression`).
- **Storage path isolation**: Images are stored under a path prefixed with the user's UUID (e.g., `images/{userId}/{timestamp}.jpg`), and Storage RLS policies ensure users can only access files under their own prefix.
- **Server-side cleanup**: When a listing is updated or deleted, the server cleans up associated storage images by extracting the file path from the URL and calling `storage.remove()`.

---

### 2.7 PWA Architecture

#### 2.7.1 Service Worker

The service worker is generated by `vite-plugin-pwa` using the `generateSW` strategy, which means Workbox analyses the build output and generates a service worker script automatically. The custom `client/src/sw.js` file is not used in production (the plugin generates its own); it exists for development testing. The generated service worker implements:

**Precaching**: All application shell assets (HTML, JavaScript, CSS, favicon) are precached during the service worker installation phase via `precacheAndRoute(self.__WB_MANIFEST)`. This ensures the app loads instantly on repeat visits, even with no network connection.

**Navigation fallback**: All navigation requests are routed to `/index.html` via a `NavigationRoute` handler. This enables the SPA's client-side routing to work offline — the React app loads from cache and handles routing internally.

**API caching with StaleWhileRevalidate**: GET requests to `/api/listings`, `/api/zones`, and `/api/categories` are served via `StaleWhileRevalidate` strategy with 24-hour max age and 100-entry limit. This means:
1. The cached response is returned immediately (instant UX)
2. A network request is made in the background to refresh the cache
3. If the network request fails, the cached response is used

**Image caching with CacheFirst**: Images from `*.supabase.co/storage/*` are served via `CacheFirst` strategy with 7-day max age and 50-entry limit. Images are cached on first request and served from cache thereafter, critical for performance on slow networks.

#### 2.7.2 Offline Listing Creation

The offline creation flow works as follows:

1. User fills out the listing creation form while offline
2. The `useCreateListing` mutation detects `isOnline === false` from `OfflineContext`
3. Listing data (including any image data URL) is saved to IndexedDB via `savePendingListing()` using `idb-keyval`
4. A Background Sync event is registered via `navigator.serviceWorker.ready.then(reg => reg.sync.register('sync-pending-listings'))`
5. The pending count badge updates via `refreshPendingCount()`

When connectivity returns:

1. The `OfflineContext`'s `handleOnline` listener fires
2. `processOfflineQueue()` is called, which retrieves all pending listings from IndexedDB
3. For each pending listing:
   a. If an offline image was stored as a data URL, it converts it to a Blob and uploads via `uploadImage()`
   b. The listing data is posted to the API via `listingsApi.create()`
   c. On success, the pending entry is removed from IndexedDB
4. A success toast is shown with the count of synced items
5. Partial failures are reported with a warning toast; failed items remain in the queue

The service worker also has a `sync` event listener that calls `syncPendingListings()`, handling the case where the page is not open when connectivity returns (e.g., the user closed the tab while offline and reopened it later online).

#### 2.7.3 OfflineContext

The `OfflineContext` (`client/src/context/OfflineContext.jsx`) manages PWA-related state:

- **isOnline**: Tracks `navigator.onLine` state using `online`/`offline` event listeners
- **pendingCount**: Number of unsynchronised listings in IndexedDB
- **isSyncing**: Boolean flag to prevent concurrent sync operations
- **showCachedDataNotice**: Flag shown when the app transitions from offline to online, indicating cached data may be stale
- **isSwSupported**: Whether `serviceWorker` is available in `navigator` (used to show a banner on unsupported browsers)
- **deferredPrompt**: Stores the `beforeinstallprompt` event for later use by `installApp()`
- **showUnsupportedBanner**: Controls a dismissible banner shown to users on browsers without service worker support

#### 2.7.4 App Manifest

The PWA manifest is configured in `vite.config.js` via the `VitePWA` plugin:

- **Name**: "GMarkt"
- **Short name**: "GMarkt"
- **Description**: "The Gambia's Marketplace"
- **Theme colour**: `#C8622A` (orange-brown)
- **Background colour**: `#FAFAF8` (off-white)
- **Display**: `standalone` (full-screen PWA experience without browser chrome)
- **Start URL**: `/`
- **Icons**: A single SVG icon (`logo.svg`) used for both standard and maskable purposes, sized at 512×512

#### 2.7.5 Install Prompt

The `beforeinstallprompt` event listener is registered in `OfflineContext`. When the event fires (browser determines the PWA is installable), the event is `preventDefault()`ed to suppress the automatic browser install banner, and stored in `deferredPrompt`. The UI checks `canInstall` (derived from `!!deferredPrompt`) to conditionally show an install button. When the user clicks install, `installApp()` calls `deferredPrompt.prompt()` to show the native install dialog.

---

### 2.8 Key Architectural Decisions and Tradeoffs

#### 2.8.1 Classifieds Model vs Transactional Marketplace

Initially, GMarkt included an `orders` table with a full transactional flow (order creation, payment, delivery tracking, dispute resolution). This was deliberately removed in migration 024 for several reasons:
- **Cash economy**: The Gambia operates predominantly as a cash-based economy. Online payment adoption is very low, and integrating mobile money (Wave, QMoney) requires partnerships and regulatory compliance that were infeasible for a university project.
- **WhatsApp culture**: Gambians typically use WhatsApp to negotiate and arrange meetups for transactions. Forcing a transactional model would create friction against established behaviour patterns.
- **Platform liability**: A transactional marketplace would require handling disputes, refunds, and delivery verification — responsibilities that significantly increase operational complexity and legal risk.

The classifieds model (listing + contact) is simpler, more aligned with existing user behaviour, and avoids the regulatory burdens of financial intermediation.

#### 2.8.2 Express Middleware Layer vs Direct Supabase Client Calls from Frontend

All database operations go through the Express API server rather than using the Supabase client directly from the frontend. This adds a hop but provides:
- **Server-side validation**: Zod validation runs on the server, ensuring data integrity even if the client is compromised or an alternative client is used
- **Centralised business logic**: Complex operations like bump cooldown enforcement, analytics aggregation, and admin moderation transactional RPCs run in one place
- **Storage cleanup**: The server handles cleanup of uploaded images when listings are updated or deleted, using the service role key to bypass Storage RLS
- **Notification orchestration**: The server creates notifications as side effects of certain operations (new listing needs moderation, listing was approved/rejected)

The tradeoff is increased latency (one extra network hop) and additional server-side code. For a classifieds application where most operations are not latency-sensitive, this is an acceptable tradeoff.

#### 2.8.3 Plain JavaScript vs TypeScript

The project uses plain JavaScript with JSDoc annotations and Zod schemas for type safety, rather than TypeScript. This decision was driven by:
- **Faster prototyping**: A single-developer project benefits from the reduced setup overhead (no `tsconfig.json`, no type definitions for every third-party library)
- **Node.js native watch mode**: The server uses `node --watch` for hot reloading; TypeScript would require an additional compilation step
- **Zod as runtime validation**: Zod schemas provide runtime type safety for API data without requiring compile-time type enforcement

The tradeoff is that type errors that TypeScript would catch at compile time may surface as runtime errors. The addition of Zod in the API layer provides runtime type safety for the most critical data — the API contract — while keeping the development workflow lean.

#### 2.8.4 Client-Side Image Compression vs Server-Side

Images are compressed client-side using `browser-image-compression` before upload, rather than uploading full-resolution images and compressing on the server. This decision is specific to the target market:
- **Bandwidth cost**: Mobile data in The Gambia costs approximately $1–2 per GB, a significant expense when median daily income is $5–10. A 12MP smartphone photo (~3–5MB) compressed to 300KB client-side saves 90%+ of upload bandwidth.
- **Upload speed**: 3G upload speeds in GBA typically range from 100–500 kbps. A 3MB image takes 50–240 seconds to upload; a 300KB image takes 5–24 seconds — a dramatic improvement in user experience.
- **Server resources**: Server-side compression would require additional processing time and memory on the Render free-tier instance.

The tradeoff is reduced image quality from client-side compression and the dependency on the `browser-image-compression` library's Web Worker implementation for performance. For a classifieds marketplace where images serve as visual references rather than high-fidelity product photography, the quality reduction is acceptable.

#### 2.8.5 Contact Event Gate for Reviews vs Free Reviews

The review system has a soft gate: users must have recorded a `contact_click` event on the listing before they can leave a review. This decision replaces the original transactional gate (which tied reviews to orders) after the classifieds migration:
- **Why not free reviews**: Without a gate, there is no evidence the reviewer has had any interaction with the seller. This would enable review bombing and reduce the trust signal for legitimate buyers.
- **Why contact click**: The contact click event (WhatsApp or phone call) demonstrates genuine interest in the listing and is the closest proxy for "transaction" in a classifieds model. It is a low-friction action that still provides a meaningful barrier to abuse.
- **How it works**: The `GET /api/listings/:id/can-review` endpoint checks (a) the listing is approved, (b) the reviewer is not the seller, (c) no review already exists, and (d) a `contact_click` event with the user's ID exists in `listing_events`. The client enables the review form only when `can_review` is true.

The tradeoff is that some legitimate buyers who contacted the seller via other means (e.g., SMS, direct call) cannot leave a review. This is acceptable because the primary contact method promoted on the platform is WhatsApp, which generates the required event.

#### 2.8.6 Bump Rate Limiting: Per-User-Global vs Per-Listing

The bump system enforces both a per-user-global cooldown and a per-listing cooldown safety net. The primary cooldown is per-user-global: a user can bump only one listing in any 24-hour window, regardless of which listing was bumped. The per-listing check is a secondary safety measure.
- **Why per-user-global**: If the cooldown were per-listing only, a user with 10 listings could bump one listing every 2.4 hours, effectively monopolising the top of the feed. The global cooldown ensures fair rotation of bumped listings across all sellers.
- **User experience**: When the user attempts to bump while another listing is on cooldown, the error message tells them which listing was recently bumped and how many hours remain, helping them understand the constraint.

#### 2.8.7 is_expired Computed at API Layer vs Stored Column

The `is_expired` flag is computed at the API layer when listing data is requested (`addComputedFields` function in `listings.js`), rather than stored as a database column.
- **Why computed**: Expiry is a function of creation date and current date. If stored as a column, a cron job or trigger would be needed to update it daily. Computing it on read ensures it is always accurate without background maintenance.
- **Performance impact**: The computation is a simple date comparison (`created_at < now - 60 days`), which is negligible per listing. With a maximum of 50 listings per page, this adds no measurable latency.
- **The tradeoff**: This is slightly more expensive on high-traffic listing pages (computed every read vs read from a column). GMarkt's current scale makes this irrelevant. A future optimisation could cache the computed value or use a materialised view.

---

*End of System Design Document — GMarkt v1.0*
