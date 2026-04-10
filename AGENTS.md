# OpenCode Agent Instructions

## Architecture & Boundaries
- **Frontend (`/client`)**: React + Vite SPA. State managed by TanStack Query v5. Routing via React Router v6.
- **Backend (`/server`)**: Node.js + Express API. Validation via Zod.
- **Database/Auth/Storage**: Supabase. Schema definitions exist in `/supabase/schema.sql`.
- **Target environment**: Mobile-first, low-bandwidth optimized PWA for The Gambia. Offline-first architecture relies on background sync (`idb-keyval` and `vite-plugin-pwa`). Keep payloads minimal.

## Development Workflow
- **Client Dev Server**: `cd client && npm run dev` (Vite, port 5173)
- **API Dev Server**: `cd server && npm run dev` (Uses Node's native `--watch`, port 3000)
- **Database Seeding**: `cd server && npm run seed` generates dummy data via Faker.
- **Linting**: Run `npm run lint` in either `client` or `server`. ESLint + Prettier config is centralized at the workspace root (`.eslintrc.js`, `.prettierrc`).

## Technical Quirks & Conventions
- **No TypeScript**: This project uses plain JavaScript for both frontend and backend (no compilation step required for the server). Rely on JSDoc and Zod schemas in the server for type safety context.
- **Image handling**: Client relies on `browser-image-compression` to shrink images before uploading to Supabase Storage. Do not bypass this on new upload flows.
- **Data Fetching**: Always use TanStack Query hooks in the client for caching and offline support. Do not use plain `useEffect`/`fetch` combinations for server state.
- **Styling**: Tailwind CSS is the standard. Avoid writing custom CSS files unless necessary for PWA/animation quirks.

## Adding Features
1. Update database schema in `/supabase` if necessary.
2. Add Express routes + Zod validation in `/server`.
3. Create corresponding API fetcher and TanStack Query hook in `/client`.
4. Build responsive, Tailwind-styled React components.
