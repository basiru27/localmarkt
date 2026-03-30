# Gambia Marketplace (LocalMarkt)

A production-ready Progressive Web App (PWA) for a local marketplace platform tailored for The Gambia. Users can browse, post, and manage local product and service listings. The app works reliably on low-bandwidth mobile connections and is installable to Android/iOS home screens.

## Features

- Browse listings by category and region
- Post and manage your own listings
- Offline-first architecture with background sync
- PWA installable on mobile devices
- Image upload with automatic compression
- Mobile-first responsive design optimized for 3G networks

## Tech Stack

- **Frontend:** React + Vite (SPA) with Tailwind CSS
- **PWA:** vite-plugin-pwa (Workbox)
- **Server State:** TanStack Query v5
- **Routing:** React Router v6
- **Backend:** Node.js + Express + Zod
- **Auth:** Supabase Auth (email/password, JWT)
- **Database:** Supabase (PostgreSQL) with RLS
- **Storage:** Supabase Storage

## Project Structure

```
├── client/          # React + Vite PWA frontend
├── server/          # Node.js + Express API
├── supabase/        # Database schema and migrations
├── .eslintrc.js     # ESLint configuration
├── .prettierrc      # Prettier configuration
└── README.md
```

## Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- Supabase account and project

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### 2. Configure Environment Variables

Copy the example environment files and fill in your values:

```bash
# Client
cp client/.env.example client/.env

# Server
cp server/.env.example server/.env
```

### 3. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Run the SQL schema from `supabase/schema.sql` in the Supabase SQL editor
3. Create a storage bucket named `listing-images` with public read access
4. Copy your project URL, anon key, service role key, and JWT secret to the `.env` files

## Development

```bash
# Start the Express API server (port 3000)
cd server && npm run dev

# In another terminal, start the Vite dev server (port 5173)
cd client && npm run dev
```

Visit http://localhost:5173 to see the app.

## Production Build

```bash
# Build the frontend
cd client && npm run build
# Output: client/dist/

# Build the server (if using TypeScript)
cd server && npm run build
```

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repo to Vercel
2. Set the root directory to `client`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables from `client/.env`

### Backend (Railway/Render)

1. Deploy the `server/` directory
2. Set environment variables from `server/.env`
3. Ensure the `CLIENT_ORIGIN` matches your Vercel frontend URL

### Database (Supabase)

Your Supabase project handles:
- PostgreSQL database
- Authentication
- File storage
- Row-level security

## Running Lighthouse Audit

1. Build the production frontend: `cd client && npm run build`
2. Serve the built files: `npm run preview`
3. Open Chrome DevTools → Lighthouse tab
4. Select "Mobile" device and run the audit
5. Target: PWA score >= 80

## API Endpoints

| Method | Route              | Auth | Description                     |
|--------|-------------------|------|---------------------------------|
| GET    | /api/listings     | No   | List all listings (with filters)|
| GET    | /api/listings/:id | No   | Get single listing              |
| POST   | /api/listings     | Yes  | Create a new listing            |
| PUT    | /api/listings/:id | Yes  | Update own listing              |
| DELETE | /api/listings/:id | Yes  | Delete own listing              |
| GET    | /api/regions      | No   | List all regions                |
| GET    | /api/categories   | No   | List all categories             |

## Offline Capabilities

- **Cached Browsing:** Listing feed remains viewable offline using cached data
- **Background Sync:** Listings created offline are queued and synced when online
- **Visual Indicators:** Offline banner and pending sync badge inform users of status

## Security

- HTTPS enforced in production
- JWT verification on all protected routes
- Zod validation on all inputs
- Row-Level Security on database
- Image upload validation (MIME type + size)
- Contact info visible only to authenticated users

## License

MIT
