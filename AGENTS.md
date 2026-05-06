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

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **localmarkt** (1824 symbols, 3561 relationships, 156 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/localmarkt/context` | Codebase overview, check index freshness |
| `gitnexus://repo/localmarkt/clusters` | All functional areas |
| `gitnexus://repo/localmarkt/processes` | All execution flows |
| `gitnexus://repo/localmarkt/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
