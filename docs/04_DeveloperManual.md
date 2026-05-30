# Developer Manual

## GMarkt — The Gambia's Classifieds Marketplace

---

### 4.1 Prerequisites

| Dependency | Required Version | Notes |
|------------|-----------------|-------|
| Node.js | >= 18.0.0 (dev uses 20+) | Check with `node --version` |
| npm | >= 9.0.0 | Comes with Node.js; check with `npm --version` |
| Supabase account | Free tier | Sign up at https://supabase.com |
| Git | >= 2.30 | For version control |

---

### 4.2 Project Structure

```
.
├── client/                         # React frontend (Vite SPA)
│   ├── public/                     # Static assets (favicon, logo)
│   ├── src/
│   │   ├── components/             # Shared UI components
│   │   │   ├── admin/              # Admin-specific components (AdminLayout)
│   │   │   └── ui/                 # Generic UI components (Pagination, ImageLightbox)
│   │   ├── context/                # React context providers
│   │   │   ├── AuthContext.jsx      # Auth state, session management
│   │   │   ├── OfflineContext.jsx   # Online/offline detection, PWA install, sync queue
│   │   │   └── ToastContext.jsx     # Toast notification system
│   │   ├── hooks/                  # Custom React hooks (TanStack Query wrappers)
│   │   │   ├── useListings.js       # Listing CRUD + analytics + bump + sold
│   │   │   ├── useReviews.js        # Review CRUD + can-review check
│   │   │   ├── useSaved.js          # Saved listing toggle with optimistic updates
│   │   │   ├── useSellers.js        # Seller profile, listings, reviews
│   │   │   ├── useAdmin.js          # Admin CRUD: users, listings, reports, logs
│   │   │   ├── useNotifications.js  # Notification polling and mutations
│   │   │   ├── useLookups.js        # Zones, areas, categories
│   │   │   ├── useShare.js          # Web Share API with clipboard fallback
│   │   │   ├── useReports.js        # Report submission
│   │   │   └── useDocumentTitle.js  # Dynamic document title
│   │   ├── lib/                    # Utility libraries
│   │   │   ├── api.js              # fetchApi helper + all API client functions
│   │   │   ├── supabase.js         # Supabase client initialisation
│   │   │   ├── imageUpload.js      # Client-side image compression + upload
│   │   │   ├── offlineStorage.js   # IndexedDB queue via idb-keyval
│   │   │   ├── searchHistory.js    # localStorage-based search history
│   │   │   └── utils.js            # Formatting, validation, WhatsApp links
│   │   ├── pages/                  # Page components (lazy-loaded)
│   │   │   └── admin/              # Admin pages (Dashboard, Users, Listings, etc.)
│   │   ├── App.jsx                 # Root component: providers + routing
│   │   ├── main.jsx                # Entry point
│   │   └── sw.js                   # Custom service worker (dev/testing)
│   ├── vite.config.js              # Vite config with PWA + Tailwind plugins
│   └── vercel.json                 # SPA rewrites for client-side routing
│
├── server/                         # Express API backend
│   ├── scripts/
│   │   └── seed.js                 # Faker-based database seeder
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT verification (authenticate, optionalAuth)
│   │   │   └── admin.js            # Role checks (requireAdmin, requireSuperAdmin)
│   │   ├── routes/                 # Route handlers (one file per resource)
│   │   │   ├── listings.js         # Listing CRUD, bump, sold, analytics, stats
│   │   │   ├── reviews.js          # Review CRUD
│   │   │   ├── admin.js            # Admin: stats, users, listings, reports, logs
│   │   │   ├── saved.js            # Saved listing CRUD
│   │   │   ├── sellers.js          # Seller profile, listings, reviews
│   │   │   ├── profile.js          # User profile CRUD + avatar delete
│   │   │   ├── notifications.js    # Notification CRUD
│   │   │   ├── reports.js          # Report submission
│   │   │   ├── zones.js            # Zone/area lookup
│   │   │   └── categories.js       # Category lookup
│   │   ├── schemas/                # Zod validation schemas
│   │   │   ├── listing.js          # Listing create/update + validateBody middleware
│   │   │   ├── review.js           # Review create/update
│   │   │   ├── report.js           # Report create + admin update
│   │   │   ├── admin.js            # Admin actions (ban, verify, moderate)
│   │   │   └── user.js             # Profile update
│   │   ├── services/
│   │   │   └── notifications.js    # createNotification(s) helpers
│   │   ├── utils/
│   │   │   ├── storage.js          # Supabase Storage image deletion
│   │   │   ├── adminLogs.js        # Admin audit log insert helper
│   │   │   └── catchAsync.js       # Async error wrapper for routes
│   │   ├── index.js                # Express app setup, middleware, route mounting
│   │   └── supabase.js             # Supabase admin client (service role key)
│   └── package.json
│
├── supabase/
│   ├── schema.sql                  # Master schema (run first)
│   └── migrations/                 # Versioned migrations (apply in order)
│
├── docs/                           # Project documentation
├── .envrc                          # Nix/direnv environment config
├── .eslintrc.js                    # ESLint configuration (workspace root)
└── .prettierrc                     # Prettier formatting rules
```

---

### 4.3 Environment Variables

#### 4.3.1 `server/.env`

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `SUPABASE_URL` | Supabase project URL (e.g., `https://your-project.supabase.co`) | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret! bypasses RLS) | Supabase Dashboard → Project Settings → API → `service_role` key |
| `SUPABASE_JWT_SECRET` | JWT secret for verifying tokens | Supabase Dashboard → Project Settings → API → JWT Secret |
| `PORT` | Server port (default: 3000) | Optional — defaults to 3000 in code |
| `CLIENT_ORIGIN` | Frontend URL for CORS (e.g., `http://localhost:5173`) | Your frontend deployment URL |

**Security notes**: Never commit the service role key or JWT secret to version control. The server uses the service role key to bypass RLS for server-side operations; this should never be exposed to the client. The `.env` file is listed in `.gitignore` and must be created manually.

#### 4.3.2 `client/.env`

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `VITE_SUPABASE_URL` | Supabase project URL (same as server) | Supabase Dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key (safe for client) | Supabase Dashboard → Project Settings → API → `anon` public key |
| `VITE_API_BASE_URL` | API server URL (e.g., `http://localhost:3000`) | Your API deployment URL; empty string for production if same origin |

**Note**: In development, the Vite dev server proxies `/api` requests to `http://localhost:3000` (configured in `vite.config.js`), so you can leave `VITE_API_BASE_URL` empty for local development.

---

### 4.4 Database Setup

#### 4.4.1 Create a Supabase Project

1. Go to https://supabase.com and sign in (or create an account).
2. Click **"New project"**.
3. Enter a project name (e.g., `localmarkt`).
4. Set a secure database password.
5. Choose a region close to your target users (e.g., Europe West or US East — Supabase does not yet have an African data centre).
6. Click **"Create new project"** and wait for provisioning (2–5 minutes).

#### 4.4.2 Run the Schema

1. In the Supabase Dashboard, go to **SQL Editor**.
2. Open `supabase/schema.sql` and copy the entire contents.
3. Paste into the SQL Editor and click **"Run"**.
4. Verify the output — you should see no errors.

The schema.sql file creates all tables (profiles, zones, areas, categories, listings, listing_events, saved_listings), sets up RLS policies, creates triggers (updated_at, sold_at, auto-profile on signup), seeds lookup data (6 zones, 28 areas, 9 categories), configures the listing-images storage bucket, and creates the `get_seller_profile` and `record_listing_event` functions.

#### 4.4.3 Run Migrations

After running the base schema, apply migrations in the following order. Each adds a specific feature or fixes an issue. Run each file's SQL in the Supabase SQL Editor:

| Order | File | Purpose |
|-------|------|---------|
| 1 | `001_payments_analytics.sql` | Create `event_type` enum, `order_status` enum, `orders` table, `listing_events` table, `view_count`/`contact_count` columns, `record_listing_event` RPC, `get_seller_daily_views` RPC, `verified_seller` column |
| 2 | `002_sold_listings_trigger.sql` | Add `is_sold` column, trigger to mark listing sold when order completes |
| 3 | `003_replica_identity.sql` | Set REPLICA IDENTITY FULL on listings, orders, profiles for Realtime |
| 4 | `004_negotiable_field.sql` | Add `negotiable` boolean column to listings |
| 5 | `005_delivered_status.sql` | Add `delivered` value to order_status enum |
| 6 | `006_notification_prefs.sql` | Add `notifications` JSONB column to profiles |
| 7 | `013_lockdown_lookups.sql` | Add RLS write policies for zones, areas, categories (admin-only writes) |
| 8 | `014_zones_areas.sql` | Replace regions with zones+areas hierarchy, seed GBA data |
| 9 | `015_update_categories.sql` | Rename and reorganise categories |
| 10 | `016_notifications.sql` | Create notifications table with RLS policies |
| 11 | `024_classifieds_migration.sql` | Drop orders table, remove order references from reviews, add sold_at, migrate to classifieds model |
| 12 | `026_sold_at_trigger.sql` | Add auto-set/clear trigger for `sold_at` on `is_sold` change |
| 13 | `027_listing_events_user_id.sql` | Add `user_id` column to listing_events for review gating |
| 14 | `027_saved_listings.sql` | Create saved_listings table with indexes and RLS |
| 15 | `028_seller_aggregate.sql` | Create `get_seller_profile` aggregate function |
| 16 | `029_remove_viewer_id.sql` | Remove duplicate `viewer_id` column from listing_events |
| 17 | `030_fix_record_listing_event.sql` | Fix `record_listing_event` to use `user_id` parameter |
| 18 | `add_condition_column.sql` | Add `condition` column to listings (recreates table) |
| 19 | `add_admin_moderation_features.sql` | Add role/is_banned/verified_seller to profiles, moderation columns to listings, create reports and admin_logs tables, set up RLS |
| 20 | `add_email_to_profiles.sql` | Add `email` column to profiles, update auto-create trigger |
| 21 | `add_fts_to_listings.sql` | Add full-text search tsvector column with GIN index |
| 22 | `add_listing_bump_column.sql` | Add `bumped_at` column with index |
| 23 | `add_moderation_rpc.sql` | Create `moderate_listing_transaction` transactional RPC |
| 24 | `add_profile_management_fields.sql` | Add phone_number, avatar_url, bio to profiles; create avatars bucket |
| 25 | `add_rls_protections.sql` | Add trigger to prevent users from modifying moderation fields |
| 26 | `add_restricted_storage_select.sql` | Add restricted SELECT policies for storage (user-scoped) |
| 27 | `remove_broad_storage_select.sql` | Remove overly permissive public storage SELECT policies |
| 28 | `fix_avatars_bucket_public.sql` | Fix avatars bucket — ensure public, update policies |
| 29 | `fix_storage_rls.sql` | Fix listing-images storage RLS policies |
| 30 | `sync_claims_to_jwt.sql` | Sync profile role/is_banned to auth.users app_metadata for JWT inclusion |

#### 4.4.4 Enable RLS on All Tables

RLS is enabled in the individual migration files, but verify by going to **Supabase Dashboard → Database → Tables** and confirming a lock icon appears next to each table name. Tables should have RLS enabled: profiles, listings, listing_events, saved_listings, reviews, notifications, reports, admin_logs.

#### 4.4.5 Configure Storage Buckets

The schema.sql creates the `listing-images` bucket automatically. The `fix_avatars_bucket_public.sql` migration configures the `avatars` bucket. Verify in **Supabase Dashboard → Storage** that both buckets exist and are set to public.

#### 4.4.6 Promote Your First Admin

After running all migrations, promote a user to admin by running in SQL Editor:

```sql
UPDATE public.profiles
SET role = 'super_admin'
WHERE id = '<your-user-uuid>';
```

Replace `<your-user-uuid>` with the user ID from Supabase Auth (found in **Authentication → Users**). The `sync_claims_to_jwt.sql` trigger ensures the role propagates to the JWT on next sign-in.

---

### 4.5 Installation and Running

#### 4.5.1 Clone the Repository

```bash
git clone <repository-url>
cd localmarkt
```

#### 4.5.2 Install Server Dependencies

```bash
cd server
npm install
```

#### 4.5.3 Install Client Dependencies

```bash
cd ../client
npm install
```

#### 4.5.4 Configure Environment

Create `server/.env`:

```bash
cd ../server
cp .env.example .env 2>/dev/null || touch .env
```

Edit `server/.env` with your Supabase project values (see Section 4.3.1).

Create `client/.env`:

```bash
cd ../client
cp .env.example .env 2>/dev/null || touch .env
```

Edit `client/.env` with your Supabase project values (see Section 4.3.2).

#### 4.5.5 Start Development Servers

**Terminal 1 — API Server:**

```bash
cd server
npm run dev
```

This starts the Express server on port 3000 with `node --watch` for hot reload on file changes.

**Terminal 2 — Client Dev Server:**

```bash
cd client
npm run dev
```

This starts the Vite dev server on port 5173 with HMR. API requests to `/api/*` are proxied to `http://localhost:3000` (configured in `vite.config.js`).

#### 4.5.6 Seed the Database (Optional)

```bash
cd server
npm run seed
```

This populates the database with realistic dummy data using Faker: profiles, categories, zones, areas, listings with images, reviews, listing events, and saved listings. Useful for development and testing.

#### 4.5.7 Verify Everything Works

1. Open `http://localhost:5173` in your browser.
2. You should see the GMarkt listing feed.
3. Register a new account and verify the confirmation email arrives.
4. Create a test listing and verify it appears in the feed after admin approval.
5. Check the browser console for errors.

---

### 4.6 Deployment

#### 4.6.1 Backend — Render Web Service

1. Create an account at https://render.com.
2. Click **"New +" → "Web Service"**.
3. Connect your GitHub repository.
4. Configure:

| Setting | Value |
|---------|-------|
| Name | `gmarkt-api` |
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `node src/index.js` |
| Environment | Node 20 |

5. Add environment variables in the Render dashboard (same as `server/.env`):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `CLIENT_ORIGIN` — set to `https://gmarkt.tech` (or your frontend URL)
   - Set `NODE_ENV` to `production`

6. Click **"Create Web Service"**.

**Note**: Render's free tier spins down after 15 minutes of inactivity. The frontend wakes the backend on initial load by calling `/api/health`.

#### 4.6.2 Frontend — Vercel

1. Create an account at https://vercel.com.
2. Click **"Add New → Project"**.
3. Import your GitHub repository.
4. Configure:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Root Directory | `client` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

5. Add environment variables:
   - `VITE_SUPABASE_URL` — same as in `client/.env`
   - `VITE_SUPABASE_ANON_KEY` — same as in `client/.env`
   - `VITE_API_BASE_URL` — set to your Render API URL (e.g., `https://gmarkt-api.onrender.com`)

6. Click **"Deploy"**.

The `vercel.json` file ensures all routes are rewritten to `index.html` for client-side routing, so URLs like `/listings/abc-123` work correctly even though Vercel serves only a single HTML file.

---

### 4.7 Database Migrations Reference

See Section 4.4.3 for the full ordered migration list with descriptions. All migration files are located in `supabase/migrations/` and should be applied in the order shown in the table. The master `supabase/schema.sql` is the canonical schema definition; migrations represent the incremental history of schema changes.

**Important notes on migration ordering:**
- Migrations with inconsistent numbering (gaps between 006 and 013, jump from 016 to 024) reflect the project's development history where some migrations were consolidated or removed.
- Apply all unnumbered migrations (`add_*.sql`, `fix_*.sql`, `sync_*.sql`, `remove_*.sql`) after all numbered migrations.
- The `add_condition_column.sql` migration drops and recreates the `listings` table — ensure all earlier migrations that affect `listings` have been applied first.

---

*End of Developer Manual — GMarkt v1.0*
