# Software Requirements Specification (SRS)

## GMarkt — The Gambia's Classifieds Marketplace

**Version 1.0**

---

### 1.1 Introduction

#### 1.1.1 Purpose of this Document

This Software Requirements Specification (SRS) provides a complete description of the functional and non-functional requirements for GMarkt, a Progressive Web Application (PWA) classifieds marketplace targeting the Greater Banjul Area (GBA) of The Gambia. The document is intended for the project development team, academic supervisors, and evaluators. It defines what the system must do, the constraints under which it must operate, and the external interfaces it relies upon.

#### 1.1.2 Project Scope

GMarkt is a standalone classifieds marketplace platform that connects buyers and sellers within the Greater Banjul Area. Unlike global platforms such as OLX or Jiji, GMarkt is specifically localised for the Gambian context: it uses Gambian Dalasi (GMD) pricing, +220 phone number validation, WhatsApp-based seller contact, and a zone/area hierarchy covering the six major zones of GBA (Banjul, Serrekunda, Bakau/Fajara, Kololi/Kotu, Sukuta/Brikama, and Brufut/Tanji). The platform operates as a pure classifieds model — it does not handle payments, shipping, or order fulfilment. Its offline-first PWA architecture is designed specifically for the low-bandwidth environment characteristic of West African mobile networks.

#### 1.1.3 Definitions and Acronyms

| Term | Definition |
|------|------------|
| PWA | Progressive Web Application — a web application that can be installed on a device and function offline using service workers |
| RLS | Row-Level Security — PostgreSQL security feature that restricts row access at the database level |
| JWT | JSON Web Token — token-based authentication standard used by Supabase Auth |
| GMD | Gambian Dalasi — the official currency of The Gambia |
| GBA | Greater Banjul Area — the urban and peri-urban region surrounding Banjul, the capital |
| RBAC | Role-Based Access Control — restricting system access based on user roles (user, admin, super_admin) |
| IndexedDB | A low-level browser API for client-side storage of structured data |
| TanStack Query | A React data-fetching library providing caching, synchronisation, and background updates |
| Zod | A TypeScript-first schema validation library for runtime data validation |
| SW | Service Worker — a browser script that runs in the background, enabling offline caching and push notifications |
| CTA | Call to Action — a user interface element prompting an immediate response |
| CDN | Content Delivery Network — a geographically distributed network of proxy servers |

#### 1.1.4 Overview of the Document

Section 1.2 provides a high-level product description, including user classes and operating environment. Section 1.3 enumerates all functional requirements derived from the implemented codebase. Section 1.4 defines non-functional requirements covering performance, security, usability, and availability. Section 1.5 describes external interface requirements.

---

### 1.2 Overall Description

#### 1.2.1 Product Perspective

GMarkt is a new, standalone web application with no dependency on any existing marketplace or e-commerce platform. It replaces the informal, scattered buying and selling currently conducted through WhatsApp groups and Facebook with a dedicated, searchable, and moderated platform. The system follows a three-tier architecture: a React frontend served via Vercel's CDN, a Node.js/Express API server running on Render, and a Supabase-managed PostgreSQL database with integrated authentication and file storage.

#### 1.2.2 Product Functions

The system enables users to browse, search, and filter classified listings for free. Registered users can create, edit, and manage listings with image uploads. Sellers can track listing performance through an analytics dashboard showing views, contacts, and saves over configurable date ranges. Buyers can contact sellers via WhatsApp or phone, save listings, leave reviews after confirmed contact, and report problematic listings. Administrators moderate listings, manage user accounts, handle reports, and access an audit log. The platform is installable as a PWA and supports offline listing creation with background synchronisation.

#### 1.2.3 User Classes and Characteristics

**Unauthenticated Visitors**: Any user accessing the platform without logging in. These users can browse the listing feed, search and filter listings, and view individual listing details and seller public profiles. They cannot create listings, contact sellers (contact details are intentionally hidden), save listings, or leave reviews.

**Registered Buyers**: Authenticated users who can contact sellers via WhatsApp or phone, save listings to a personalised collection, leave reviews on listings they have contacted the seller about, report listings, and view their own profile. Buyers who also sell are promoted to the seller class.

**Registered Sellers**: Authenticated users who have created at least one listing. Sellers have all buyer capabilities plus the ability to create, edit, delete, mark as sold, relist, and bump listings. They have access to an analytics dashboard showing view counts, contact clicks, saves, and listing performance.

**Admins**: Users with the `admin` role who can moderate listings (approve/reject), manage user accounts (ban/unban, verify sellers), handle incoming reports (resolve/dismiss), and view the administration dashboard with platform-wide statistics.

**Super Admins**: Users with the `super_admin` role who possess all admin capabilities plus the ability to permanently delete user accounts and access the full audit log of all admin actions across the platform.

#### 1.2.4 Operating Environment

GMarkt runs in any modern web browser (Chrome 90+, Firefox 90+, Safari 15+, Samsung Internet) on desktop and mobile devices. The PWA is installable on Android and iOS via the browser's install prompt. The application is designed mobile-first with responsive layouts using Tailwind CSS. Offline functionality requires a service-worker-capable browser. The minimum supported network condition is 3G with latency up to 600ms.

#### 1.2.5 Assumptions and Dependencies

- Supabase (PostgreSQL, Auth, Storage) remains available and operational
- WhatsApp is the dominant messaging platform in The Gambia (assumed present on users' devices)
- Users have access to a smartphone with a modern web browser
- Internet connectivity, while potentially slow or intermittent, is available at least periodically
- The Gambian phone numbering system (+220 followed by 7 digits) remains stable
- Render free-tier web services may spin down after inactivity (cold start delay of 30–60 seconds)

---

### 1.3 Functional Requirements

#### 1.3.1 User Registration and Authentication

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-01 | The system shall allow a user to register with email, password, display name, and phone number | High | All authenticated users |
| FR-02 | The system shall send a confirmation email upon registration via Supabase Auth | High | All authenticated users |
| FR-03 | The system shall allow a user to log in with email and password | High | All authenticated users |
| FR-04 | The system shall issue a JWT session token upon successful authentication | High | All authenticated users |
| FR-05 | The system shall automatically refresh expired JWT tokens | High | All authenticated users |
| FR-06 | The system shall allow users to log out, destroying the session | High | All authenticated users |
| FR-07 | The system shall support "remember me" — sessions that persist across browser restarts | Medium | All authenticated users |
| FR-08 | The system shall allow password reset via email link | Medium | All authenticated users |
| FR-09 | The system shall auto-create a profile record via database trigger when a user signs up | High | System |
| FR-10 | The system shall deny login to banned accounts and return a suspension message | High | All authenticated users |

#### 1.3.2 Profile Management

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-11 | The system shall allow a user to view their own profile (display name, email, phone, avatar, bio) | High | Registered users |
| FR-12 | The system shall allow a user to update their display name, phone number, bio, and notification preferences | High | Registered users |
| FR-13 | The system shall allow a user to upload and update an avatar image | Medium | Registered users |
| FR-14 | The system shall allow a user to delete their avatar | Low | Registered users |

#### 1.3.3 Listing Management

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-15 | The system shall allow an authenticated user to create a listing with title, description, price, condition, category, area, contact phone, and images | High | Sellers |
| FR-16 | The system shall set a new listing's moderation status to "pending" upon creation | High | Sellers |
| FR-17 | The system shall detect duplicate submissions within 30 seconds to prevent accidental double-posting | Medium | Sellers |
| FR-18 | The system shall allow the listing owner to edit their listing | High | Sellers |
| FR-19 | The system shall reset a listing to "pending" moderation status when edited | High | Sellers |
| FR-20 | The system shall allow the listing owner to delete their listing | High | Sellers |
| FR-21 | The system shall allow the listing owner to mark a listing as sold | High | Sellers |
| FR-22 | The system shall automatically set `sold_at` timestamp when a listing is marked as sold via database trigger | Medium | System |
| FR-23 | The system shall allow a seller to relist a sold listing (mark as not sold) | High | Sellers |
| FR-24 | The system shall rate-limit listing creation to 10 per 15-minute window | Medium | Sellers |
| FR-25 | The system shall accept up to 5 images per listing | Medium | Sellers |
| FR-26 | The system shall compute an `is_expired` flag at the API layer for listings older than 60 days | Low | Sellers |

#### 1.3.4 Image Upload and Processing

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-27 | The system shall validate uploaded images for type (JPEG, PNG, WebP) and size (max 5MB) | High | Sellers |
| FR-28 | The system shall compress images client-side to a maximum of 300KB before upload | High | Sellers |
| FR-29 | The system shall resize images to a maximum width of 800px during compression | High | Sellers |
| FR-30 | The system shall store images in Supabase Storage under a user-ID-prefixed path | High | Sellers |
| FR-31 | The system shall clean up old images from storage when a listing is updated or deleted | Medium | System |

#### 1.3.5 Browse, Search, and Filter Listings

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-32 | The system shall display a paginated feed of approved, non-banned-seller listings | High | All users |
| FR-33 | The system shall sort listings by bump status first, then by creation date (newest first) by default | High | All users |
| FR-34 | The system shall support sorting by price (ascending/descending), view count, and oldest first | Medium | All users |
| FR-35 | The system shall filter listings by category | High | All users |
| FR-36 | The system shall filter listings by area | High | All users |
| FR-37 | The system shall support text search across listing titles and descriptions (case-insensitive ILIKE) | High | All users |
| FR-38 | The system shall provide search autocomplete suggestions with deduplication | Low | All users |
| FR-39 | The system shall display marketplace statistics (total listings, active areas, active sellers) | Low | All users |

#### 1.3.6 Location-Based Filtering (Greater Banjul Area)

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-40 | The system shall organise locations in a two-level hierarchy of zones and areas | High | All users |
| FR-41 | The system shall pre-seed 6 zones and 28 areas covering the Greater Banjul Area | High | System |
| FR-42 | The system shall expose a public API to list all zones and their areas | High | All users |

#### 1.3.7 Category Filtering

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-43 | The system shall pre-seed 9 categories covering common marketplace categories | High | System |
| FR-44 | The system shall expose a public API to list all categories | High | All users |

#### 1.3.8 Contact CTAs (WhatsApp and Phone)

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-45 | The system shall display a WhatsApp contact button on approved listing detail pages | High | Buyers |
| FR-46 | The system shall generate WhatsApp deep links with a pre-filled interest message | High | Buyers |
| FR-47 | The system shall display a phone call button with the seller's phone number | High | Buyers |
| FR-48 | The system shall hide seller contact details from unauthenticated users | High | Buyers |
| FR-49 | The system shall record a `contact_click` event when a user clicks the WhatsApp or phone button | Medium | System |

#### 1.3.9 Contact Event Tracking

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-50 | The system shall record listing view events, incrementing a view counter | High | System |
| FR-51 | The system shall record contact click events, incrementing a contact counter | High | System |
| FR-52 | The system shall store events with the user's ID when authenticated | High | System |
| FR-53 | The system shall use a SECURITY DEFINER PostgreSQL function `record_listing_event` to record events and ensure RLS bypass where needed | High | System |

#### 1.3.10 Saved Listings (Bookmarks)

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-54 | The system shall allow authenticated users to save an approved listing | High | Buyers |
| FR-55 | The system shall allow authenticated users to unsave a previously saved listing | High | Buyers |
| FR-56 | The system shall display a list of all saved listings for the authenticated user | High | Buyers |
| FR-57 | The system shall show a unique constraint preventing duplicate saves | High | System |

#### 1.3.11 Search History

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-58 | The system shall store recent search queries in localStorage (up to 10 entries) | Low | All users |
| FR-59 | The system shall display search history entries as clickable chips | Low | All users |
| FR-60 | The system shall allow users to remove individual search history entries | Low | All users |
| FR-61 | The system shall allow users to clear all search history | Low | All users |

#### 1.3.12 Mark as Sold / Relist

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-62 | The system shall allow the listing owner to toggle the `is_sold` status via PATCH endpoint | High | Sellers |
| FR-63 | The system shall automatically populate or clear `sold_at` timestamp via database trigger | High | System |
| FR-64 | The system shall exclude sold listings from default listing queries | High | All users |
| FR-65 | The system shall allow sold listings to be viewable on the seller's profile | Medium | Buyers |

#### 1.3.13 Listing Bump

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-66 | The system shall allow a seller to bump an approved listing to the top of the feed | High | Sellers |
| FR-67 | The system shall enforce a per-user global 24-hour cooldown on bumps | High | Sellers |
| FR-68 | The system shall also enforce a per-listing 24-hour cooldown as a safety net | Medium | Sellers |
| FR-69 | The system shall sort bumped listings first in the default feed order, ordered by `bumped_at` descending | High | All users |
| FR-70 | The system shall require the listing to be in "approved" moderation status to be bumped | High | Sellers |
| FR-71 | The system shall return a clear error message indicating which listing was last bumped and time remaining | Medium | Sellers |

#### 1.3.14 Listing Expiry Indicator

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-72 | The system shall compute an `is_expired` field at the API layer, marking listings older than 60 days as expired | Low | All users |
| FR-73 | The system shall display an expiry indicator on expired listings in the UI | Low | All users |

#### 1.3.15 Reviews

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-74 | The system shall allow authenticated users to leave a 1–5 star rating and optional comment on a listing | High | Buyers |
| FR-75 | The system shall enforce a soft gate: the reviewer must have recorded a `contact_click` event on the listing | High | Buyers |
| FR-76 | The system shall prevent users from reviewing their own listing | High | Buyers |
| FR-77 | The system shall limit reviews to one per user per listing | High | Buyers |
| FR-78 | The system shall rate-limit review creation to 5 per 15-minute window | Medium | Buyers |
| FR-79 | The system shall allow a reviewer to edit or delete their own review | Medium | Buyers |
| FR-80 | The system shall expose a `can-review` endpoint that checks the soft gate conditions | High | Buyers |

#### 1.3.16 Seller Public Profile Page

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-81 | The system shall expose a seller profile page at `/sellers/:id` | High | All users |
| FR-82 | The system shall display seller information (display name, avatar, member since date, verified status) | High | All users |
| FR-83 | The system shall show aggregate review data (average rating, total reviews) for the seller | High | All users |
| FR-84 | The system shall show active listing count for the seller | High | All users |
| FR-85 | The system shall paginate the seller's active listings | High | All users |
| FR-86 | The system shall paginate the seller's reviews across all listings | High | All users |
| FR-87 | The system shall use the `get_seller_profile` RPC function to efficiently aggregate seller data | High | System |

#### 1.3.17 Seller Analytics Dashboard

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-88 | The system shall provide a seller analytics dashboard at `/my-listings/analytics` | High | Sellers |
| FR-89 | The system shall display summary stat cards: total views, total contacts, total saves, active listings, sold listings | High | Sellers |
| FR-90 | The system shall support date range selection (7 days, 30 days, 90 days, all time) | High | Sellers |
| FR-91 | The system shall display a views-over-time chart | High | Sellers |
| FR-92 | The system shall display a listing performance table with per-listing views, contacts, and saves | High | Sellers |
| FR-93 | The system shall sort the analytics response by creation date (newest first) | High | Sellers |

#### 1.3.18 Notifications System

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-94 | The system shall create in-app notifications for specified system events | High | All authenticated users |
| FR-95 | The system shall notify admins when a new listing is created and requires moderation | High | Admins |
| FR-96 | The system shall notify a seller when their listing is approved | High | Sellers |
| FR-97 | The system shall notify a seller when their listing is rejected | High | Sellers |
| FR-98 | The system shall notify a user when their account is banned | High | All authenticated users |
| FR-99 | The system shall notify a user when their account is unbanned | Medium | All authenticated users |
| FR-100 | The system shall notify a user when they are verified as a seller | Medium | Sellers |
| FR-101 | The system shall allow users to view their notifications list | High | All authenticated users |
| FR-102 | The system shall allow users to mark individual notifications as read | High | All authenticated users |
| FR-103 | The system shall mark all notifications of the same type as read when one is clicked (for bulk actions) | Medium | All authenticated users |
| FR-104 | The system shall allow users to mark all notifications as read | High | All authenticated users |
| FR-105 | The system shall allow users to delete individual notifications | Low | All authenticated users |
| FR-106 | The system shall poll for new notifications every 30 seconds | Medium | System |

#### 1.3.19 Share Listing

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-107 | The system shall provide a share button on listing detail pages | Medium | All users |
| FR-108 | The system shall use the native Web Share API where available (mobile browsers) | Medium | All users |
| FR-109 | The system shall fall back to clipboard copy when native share is unavailable | Low | All users |
| FR-110 | The system shall include the listing title, price, and location in the shared content | Low | All users |

#### 1.3.20 Offline Listing Creation

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-111 | The system shall detect when the user is offline and store listing data in IndexedDB | High | Sellers |
| FR-112 | The system shall display a pending sync badge showing the count of offline items | High | Sellers |
| FR-113 | The system shall attempt to upload stored listing data when connectivity is restored | High | Sellers |
| FR-114 | The system shall register a Background Sync event for service-worker-level synchronisation | High | Sellers |
| FR-115 | The system shall attempt to upload offline images when connectivity returns | High | Sellers |
| FR-116 | The system shall display a success or partial-failure toast after syncing | Medium | Sellers |

#### 1.3.21 PWA Installability

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-117 | The system shall register a service worker that precaches application shell assets | High | All users |
| FR-118 | The system shall cache API GET responses using StaleWhileRevalidate strategy with 24-hour expiry | High | All users |
| FR-119 | The system shall cache Supabase storage images using CacheFirst strategy with 7-day expiry | High | All users |
| FR-120 | The system shall provide a web app manifest with app name, icons, theme colour, and standalone display mode | High | All users |
| FR-121 | The system shall listen for the `beforeinstallprompt` event and expose an install method | High | All users |
| FR-122 | The system shall show an informational banner if the browser does not support service workers | Low | All users |

#### 1.3.22 Admin: Listing Moderation

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-123 | The system shall allow admins to view all listings with moderation status filters | High | Admins |
| FR-124 | The system shall allow admins to approve a listing, setting its status to "approved" | High | Admins |
| FR-125 | The system shall allow admins to reject a listing with an optional moderation note | High | Admins |
| FR-126 | The system shall use a transactional RPC `moderate_listing_transaction` for moderation operations | High | System |
| FR-127 | The system shall allow admins to delete a listing, cleaning up associated storage images | High | Admins |
| FR-128 | The system shall log all moderation actions to `admin_logs` | High | System |

#### 1.3.23 Admin: User Management

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-129 | The system shall allow admins to view a paginated list of users with search, role, and ban-status filters | High | Admins |
| FR-130 | The system shall allow admins to ban a user, which also suspends their Supabase Auth account | High | Admins |
| FR-131 | The system shall prevent an admin from banning their own account | High | Admins |
| FR-132 | The system shall allow admins to unban a user | High | Admins |
| FR-133 | The system shall allow admins to mark a user as a verified seller | Medium | Admins |
| FR-134 | The system shall allow super admins to permanently delete a user account | High | Super Admins |
| FR-135 | The system shall prevent super admins from deleting another super admin's account via the API | High | System |
| FR-136 | The system shall log all user management actions to `admin_logs` | High | System |

#### 1.3.24 Admin: Reports Handling

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-137 | The system shall allow authenticated users to report a listing or user with a reason and optional details | High | All authenticated users |
| FR-138 | The system shall rate-limit report submission to 5 per 15-minute window | Medium | All authenticated users |
| FR-139 | The system shall prevent users from reporting their own listing or account | High | All authenticated users |
| FR-140 | The system shall allow admins to view a paginated list of reports with status filters | High | Admins |
| FR-141 | The system shall allow admins to resolve a report | High | Admins |
| FR-142 | The system shall allow admins to dismiss a report | High | Admins |
| FR-143 | The system shall log all report actions to `admin_logs` | High | System |

#### 1.3.25 Admin: Audit Logs

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-144 | The system shall record all admin actions in the `admin_logs` table with admin ID, action type, target, and details | High | System |
| FR-145 | The system shall allow super admins to view paginated audit logs with filters by admin, action, and date range | High | Super Admins |

#### 1.3.26 Admin: Platform Statistics Dashboard

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-146 | The system shall display an admin dashboard with total users, banned users, total listings, pending listings, and pending reports | High | Admins |
| FR-147 | The system shall display a listings-over-time chart for a configurable date range | High | Admins |
| FR-148 | The system shall display recent admin actions on the dashboard | High | Admins |

#### 1.3.27 RBAC

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-149 | The system shall support three roles: `user`, `admin`, and `super_admin` | High | System |
| FR-150 | The system shall enforce role checks in both API middleware (`requireAdmin`, `requireSuperAdmin`) and database RLS policies | High | System |
| FR-151 | The system shall synchronise the user's role from the profiles table to the JWT claims on sign-in | High | System |

#### 1.3.28 Rate Limiting

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-152 | The system shall apply a global API rate limit of 1000 requests per 15 minutes per IP | High | System |
| FR-153 | The system shall apply a specific rate limit of 10 listing creations per 15 minutes | Medium | System |
| FR-154 | The system shall apply a specific rate limit of 5 reviews per 15 minutes | Medium | System |
| FR-155 | The system shall apply a specific rate limit of 5 reports per 15 minutes | Medium | System |

---

### 1.4 Non-Functional Requirements

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| NFR-01 | Pages shall load within 4 seconds on a 3G mobile connection for the initial page visit | High | All users |
| NFR-02 | Subsequent page loads shall be instant (cached by service worker) | High | All users |
| NFR-03 | API responses shall be cached using StaleWhileRevalidate strategy with 24-hour expiry for GET endpoints | High | All users |
| NFR-04 | Images shall be compressed client-side to a maximum of 300KB to reduce upload bandwidth usage | High | Sellers |
| NFR-05 | Offline listing creation shall be queued in IndexedDB and automatically synced when connectivity returns | High | Sellers |
| NFR-06 | The system shall display cached data with a notice when offline | High | All users |
| NFR-07 | All authenticated API requests shall require a valid JWT token in the Authorization header | High | System |
| NFR-08 | The server shall verify JWT tokens with Supabase Auth on every authenticated request | High | System |
| NFR-09 | The server shall reject expired or invalid tokens with a 401 status | High | System |
| NFR-10 | The frontend shall attempt automatic token refresh when a 401 is received before concluding expiry | High | System |
| NFR-11 | The `profiles` table shall have Row-Level Security policies preventing unauthorised writes to other users' profiles | High | System |
| NFR-12 | The `listings` table shall have RLS policies preventing unauthorised modifications | High | System |
| NFR-13 | The `saved_listings` table shall have RLS policies ensuring users can only see their own saves | High | System |
| NFR-14 | Helmet security headers shall be applied to all HTTP responses | High | System |
| NFR-15 | CORS policies shall restrict API access to the configured frontend origins | High | System |
| NFR-16 | Request bodies on POST/PUT/PATCH endpoints shall be validated using Zod schemas | High | System |
| NFR-17 | Rate limiting shall be applied at multiple levels (global, per-endpoint) | Medium | System |
| NFR-18 | The UI shall be mobile-first responsive, built with Tailwind CSS | High | All users |
| NFR-19 | The UI shall be optimised for touch-based interaction (large buttons, adequate spacing) | Medium | All users |
| NFR-20 | The system shall display Gambian Dalasi (GMD) currency formatting throughout | High | All users |
| NFR-21 | The system shall validate Gambian phone numbers (+220 followed by 7 digits, starting with 2–9) | High | All users |
| NFR-22 | The system shall use Greater Banjul Area zones and areas for location classification | High | All users |
| NFR-23 | The Express API server shall be stateless, allowing horizontal scaling | Medium | System |
| NFR-24 | The PostgreSQL database shall be managed by Supabase, providing automatic backups and scaling | Medium | System |
| NFR-25 | The service worker shall cache all application shell assets for offline access | High | All users |
| NFR-26 | The system shall implement retry logic with exponential backoff for API requests (max 3 retries) | Medium | System |

---

### 1.5 External Interface Requirements

#### 1.5.1 User Interfaces

The primary user interface is a web browser (Chrome 90+, Firefox 90+, Safari 15+). The application is designed mobile-first and renders as a SPA with client-side routing. When installed as a PWA on Android or iOS, it displays as a standalone application with no browser chrome, using the configured theme colour (#C8622A) and app icons. The interface uses Tailwind CSS with a neutral/earthy colour palette and the Inter font family for consistent rendering across platforms.

#### 1.5.2 Hardware Interfaces

- **Camera**: The image upload feature uses the device camera via the standard file input element, triggered on mobile browsers. Images are compressed client-side using `browser-image-compression` before transmission.
- **GPS/Location**: Not directly used. Location is manually selected from a predefined hierarchy of zones and areas specific to the Greater Banjul Area.

#### 1.5.3 Software Interfaces

- **Supabase Auth**: The system integrates with Supabase Auth for user registration, sign-in, session management, and password reset. The frontend uses the `@supabase/supabase-js` client library. The server verifies tokens by calling `supabase.auth.getUser(token)`.
- **Supabase PostgreSQL**: All persistent data is stored in a Supabase-managed PostgreSQL database. The server interacts with the database using the Supabase JavaScript client with the service role key, bypassing RLS for server-side operations.
- **Supabase Storage**: Listing images and user avatars are stored in Supabase Storage. The `listing-images` bucket is configured as public with a 5MB file size limit and restricted MIME types. Storage RLS policies enforce user-scoped access by path prefix.
- **WhatsApp Deep Links**: The system generates `https://wa.me/` URLs with pre-filled messages for one-click seller contact. This relies on WhatsApp being installed on the user's device.
- **Web Share API**: The share feature uses the browser's native Web Share API where available, falling back to clipboard copy using `navigator.clipboard.writeText()`.
- **Background Sync API**: The system registers a `sync-pending-listings` event tag with the `SyncManager` API for service-worker-level synchronisation of offline-created listings.

#### 1.5.4 Communication Interfaces

- **HTTPS**: All client-server communication occurs over HTTPS in production.
- **REST API**: The frontend communicates with the backend through a JSON REST API at the `/api/*` path prefix. The development server proxies `/api` requests to the Express server.
- **Supabase Realtime**: While not explicitly used for real-time subscriptions in the current implementation, the Supabase client has the capability for PostgreSQL Realtime channels (used indirectly for notification polling via 30-second intervals).

---

*End of Software Requirements Specification — GMarkt v1.0*
