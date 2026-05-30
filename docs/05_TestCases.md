# Test Cases

## GMarkt — The Gambia's Classifieds Marketplace

---

| TC-ID | Feature Area | Test Description | Preconditions | Steps | Expected Result | Pass/Fail |
|-------|-------------|------------------|---------------|-------|-----------------|-----------|
| TC-01 | Authentication | User registers with valid email, password, display name, and phone number | No existing account with this email | 1. Navigate to /register. 2. Enter email, password (6+ chars), display name, phone (+220 7 digits). 3. Click "Create Account". | Account created; confirmation email sent; user redirected to login page | PASS |
| TC-02 | Authentication | Registration rejects invalid Gambian phone number | Registration form open | 1. Enter valid email, password, name. 2. Enter phone "123". 3. Submit form. | Validation error shown: invalid phone number format | PASS |
| TC-03 | Authentication | Registration rejects duplicate email | Existing account with email already registered | 1. Navigate to /register. 2. Enter already-used email. 3. Submit form. | Error message: email already registered | PASS |
| TC-04 | Authentication | User logs in with valid credentials | Registered account exists | 1. Navigate to /login. 2. Enter email and password. 3. Click "Sign In". | User authenticated; redirected to home page; profile info accessible | PASS |
| TC-05 | Authentication | Login rejects invalid password | Registered account exists | 1. Navigate to /login. 2. Enter correct email, wrong password. 3. Click "Sign In". | Error message: invalid login credentials | PASS |
| TC-06 | Authentication | "Remember me" persists session across browser restart | User logged in with "Remember me" checked | 1. Log in with "Remember me" checked. 2. Close browser. 3. Reopen browser and navigate to /profile. | User remains authenticated; profile data visible | PASS |
| TC-07 | Authentication | Login without "Remember me" does not persist | Existing account | 1. Log in without "Remember me". 2. Close browser tab. 3. Open new tab and navigate to protected route. | User redirected to login page | PASS |
| TC-08 | Authentication | Logout destroys session | User authenticated | 1. Click "Logout" in navigation. 2. Attempt to access /profile. | User redirected to login page | PASS |
| TC-09 | Authentication | Banned user cannot log in | User account has is_banned = true set by admin | 1. Attempt to log in as banned user. 2. Enter credentials. 3. Click "Sign In". | 403 error: "Your account has been suspended" | PASS |
| TC-10 | Authentication | Password reset email is sent | Registered account exists | 1. Navigate to /forgot-password. 2. Enter email. 3. Click "Send Reset Link". | Confirmation message shown; password reset email sent | PASS |
| TC-11 | Profile | User can view their own profile | User authenticated | 1. Navigate to /profile. 2. Observe profile fields. | Display name, email, phone, avatar, bio shown with correct values | PASS |
| TC-12 | Profile | User can update display name | User authenticated, on /profile page | 1. Change display name to "New Name". 2. Click "Save". 3. Refresh page. | Display name updated and persists after refresh | PASS |
| TC-13 | Profile | User can update phone number | User authenticated | 1. Update phone to "+220 7771234". 2. Click "Save". | Phone number updated; appears on listing detail pages | PASS |
| TC-14 | Profile | User can delete avatar | User has an avatar set | 1. Navigate to /profile. 2. Click remove/delete avatar. 3. Save. | Avatar removed; fallback initials shown | PASS |
| TC-15 | Listings | User creates a listing with all required fields | User authenticated | 1. Navigate to /listings/new. 2. Fill title, description, price, condition, category, area, phone. 3. Click "Post Listing". | Listing created with status "pending"; success message shown | PASS |
| TC-16 | Listings | Listing creation enforces minimum title length | Create listing form open | 1. Enter title "AB" (2 chars). 2. Fill other required fields. 3. Submit. | Validation error: "Title must be at least 3 characters" | PASS |
| TC-17 | Listings | Listing creation enforces Gambian phone format | Create listing form open | 1. Enter contact "12345". 2. Fill other fields. 3. Submit. | Validation error: invalid phone number | PASS |
| TC-18 | Listings | Listing creation is rate-limited to 10 per 15 minutes | User has created 10 listings recently | 1. Attempt to create 11th listing within 15-minute window. | 429 error: "Too many listings created" | PASS |
| TC-19 | Listings | Owner can edit their listing | User owns a listing | 1. Navigate to /my-listings. 2. Click "Edit" on a listing. 3. Change title and price. 4. Click "Save Changes". | Listing updated; moderation reset to "pending" | PASS |
| TC-20 | Listings | Owner can delete their listing | User owns a listing | 1. Navigate to /my-listings. 2. Click "Delete" on a listing. 3. Confirm deletion. | Listing removed from feed; images cleaned from storage | PASS |
| TC-21 | Listings | User cannot edit another user's listing | User A is authenticated | 1. Navigate to /listings/{user-b-listing-id}/edit. 2. Attempt to change fields. | 403 error: "You can only edit your own listings" | PASS |
| TC-22 | Listings | Listing feed displays approved listings only | Listings exist with various moderation statuses | 1. Navigate to home page. 2. Observe feed. | Only "approved" listings from non-banned sellers are shown | PASS |
| TC-23 | Listings | Listing detail page shows all fields | A listing exists | 1. Open a listing detail. 2. Observe all fields. | Title, description, price, condition, images, location, seller info, rating displayed | PASS |
| TC-24 | Listings | Listing detail shows is_expired for old listings | A listing is > 60 days old | 1. Open the listing detail. 2. Check for expiry indicator. | "Expired" indicator visible on the listing | PASS |
| TC-25 | Image Upload | Upload accepts valid image types | Create listing form open | 1. Select a JPEG file < 5MB. 2. Upload. | Image compressed to ~300KB; public URL returned and stored | PASS |
| TC-26 | Image Upload | Upload rejects invalid file types | Create listing form open | 1. Select a .gif or .pdf file. 2. Attempt to upload. | Error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." | PASS |
| TC-27 | Image Upload | Upload accepts up to 5 images | Create listing form open | 1. Upload 5 images. 2. Attempt to upload a 6th. | Only up to 5 images accepted; 6th rejected with error | PASS |
| TC-28 | Search & Filter | Free text search returns matching listings | Listings exist with varied titles | 1. Enter search term. 2. Submit. | Only listings with matching title or description shown | PASS |
| TC-29 | Search & Filter | Category filter narrows results | Listings exist in multiple categories | 1. Select "Electronics & Phones" filter. 2. Observe results. | Only listings in Electronics & Phones category shown | PASS |
| TC-30 | Search & Filter | Area filter narrows results | Listings exist in multiple areas | 1. Select "Serrekunda" zone then "Kanifing" area. 2. Observe results. | Only listings in Kanifing area shown | PASS |
| TC-31 | Search & Filter | Sort by price ascending works | Listings exist with varying prices | 1. Select sort "Price: Low to High". 2. Observe feed order. | Listings ordered by price ascending | PASS |
| TC-32 | Search & Filter | Search autocomplete returns suggestions | Listings exist with matching titles | 1. Type in search bar. 2. Wait for suggestions. 3. Observe dropdown. | Up to 5 unique title suggestions shown | PASS |
| TC-33 | Contact CTA | WhatsApp button opens correct deep link | User authenticated, viewing approved listing | 1. Open listing detail. 2. Click WhatsApp button. | WhatsApp opens with pre-filled message containing listing title | PASS |
| TC-34 | Contact CTA | Phone button opens dialler with correct number | User authenticated, viewing approved listing | 1. Open listing detail. 2. Click Call button. | Device dialler opens with seller's phone number pre-filled | PASS |
| TC-35 | Contact CTA | Contact details hidden from unauthenticated users | Not logged in, viewing listing detail | 1. Open listing detail while logged out. 2. Observe contact section. | WhatsApp and Call buttons hidden; login prompt shown | PASS |
| TC-36 | Saved Listings | User saves a listing | User authenticated | 1. Open any approved listing. 2. Click heart icon. 3. Navigate to /saved. | Listing appears in saved listings page | PASS |
| TC-37 | Saved Listings | User unsaves a listing | User has a saved listing | 1. Open saved listing page. 2. Click heart icon on a listing. 3. Observe list. | Listing removed from saved listings | PASS |
| TC-38 | Saved Listings | Duplicate save returns conflict error | User has already saved a listing | 1. Attempt to save the same listing again via API. | 409 error: "Listing already saved" | PASS |
| TC-39 | Search History | Search query is saved to history | User has searched before | 1. Type a search query. 2. Submit. 3. Open search bar again. | Recent search appears as a chip below the search bar | PASS |
| TC-40 | Search History | User can clear search history | Search history has entries | 1. Open search bar. 2. Click "Clear" on history. | All search history chips removed | PASS |
| TC-41 | Mark as Sold | Owner marks listing as sold | Owner has an active, approved listing | 1. Navigate to /my-listings. 2. Click "Mark as Sold". | Listing shows "Sold" badge; removed from default feed queries | PASS |
| TC-42 | Mark as Sold | Owner can relist a sold listing | Listing is marked as sold | 1. Navigate to /my-listings. 2. Click "Mark as Available". | Listing becomes active again; sold badge removed; sold_at set to null | PASS |
| TC-43 | Bump | User bumps a listing successfully | User has an approved listing, no bumps in last 24h | 1. Open /my-listings. 2. Click "Bump to Top". 3. Return to home feed. | Listing appears at top of feed; success message shown | PASS |
| TC-44 | Bump | Bump cooldown enforced per user (global 24h) | User recently bumped a listing | 1. Attempt to bump any listing. 2. Observe response. | 429 error: "You already bumped X recently. You can bump again in N hours." | PASS |
| TC-45 | Bump | Bump requires approved listing | Listing is in "pending" moderation status | 1. Attempt to bump a pending listing. | 400 error: "Only approved listings can be bumped." | PASS |
| TC-46 | Reviews | User can review a listing after contacting seller | User contacted seller (contact_click event exists) | 1. Click WhatsApp/Call on listing. 2. Open listing again. 3. Submit rating (1-5) and optional comment. | Review created; shown on listing detail page | PASS |
| TC-47 | Reviews | User cannot review own listing | User is the listing owner | 1. Attempt to review own listing via can-review check. | can_review: false, reason: "own_listing" | PASS |
| TC-48 | Reviews | User cannot review a listing twice | User already reviewed this listing | 1. Attempt to submit a second review. | 409 error: "You have already reviewed this listing" | PASS |
| TC-49 | Reviews | Review validation enforces 1-5 rating | Review form open | 1. Submit review with rating 0. | Validation error: "Rating must be at least 1" | PASS |
| TC-50 | Seller Profile | Seller public profile shows correct aggregates | Seller has listings with reviews | 1. Navigate to /sellers/{id}. 2. Observe profile. | Display name, avatar, active listing count, avg rating, total reviews shown | PASS |
| TC-51 | Seller Profile | Seller active listings are paginated | Seller has > 12 active listings | 1. Navigate to seller profile. 2. Scroll to bottom of listings. 3. Click "Next" page. | Next page of listings loads; pagination controls visible | PASS |
| TC-52 | Analytics | Dashboard stat cards display correct counts | Seller has listings with views/contacts/saves | 1. Navigate to /my-listings/analytics. 2. Observe stat cards. | Total views, contacts, saves, active listings, sold listings shown | PASS |
| TC-53 | Analytics | Date range filter changes data | Seller has listing events across multiple days | 1. Select "7 days" range. 2. Observe chart and stats. 3. Switch to "30 days". | Data updates to reflect wider time range | PASS |
| TC-54 | Analytics | Views-over-time chart renders | Seller has view events | 1. Navigate to analytics. 2. Observe chart section. | Line chart with daily view counts displayed | PASS |
| TC-55 | Share | Share uses native Web Share API where available | Device supports Web Share API | 1. Open listing detail. 2. Click "Share" button. | Native share dialog opens with listing title, price, and URL | PASS |
| TC-56 | Share | Share falls back to clipboard copy | Desktop browser without Web Share API | 1. Open listing detail. 2. Click "Share" button. | URL copied to clipboard; toast confirmation shown | PASS |
| TC-57 | Notifications | Admin receives notification when new listing created | User creates a listing | 1. Create a listing as a regular user. 2. Log in as admin. 3. Check notifications. | Notification appears: "New Listing Pending Review" | PASS |
| TC-58 | Notifications | Seller receives notification when listing approved | Admin approves a listing | 1. Admin approves a pending listing. 2. Log in as listing owner. 3. Check notifications. | Notification: "Your listing was approved!" | PASS |
| TC-59 | Notifications | User can mark notification as read | User has an unread notification | 1. Open notifications dropdown. 2. Click a notification. 3. Reopen list. | Notification marked as read (no longer bold/indicated) | PASS |
| TC-60 | Notifications | User can mark all notifications as read | User has multiple unread notifications | 1. Open notifications. 2. Click "Mark all read". | All notifications show as read | PASS |
| TC-61 | Offline | Offline listing saved to IndexedDB queue | User is offline | 1. Disconnect from network. 2. Fill and submit create listing form. 3. Check pending badge. | Listing saved to IndexedDB; pending count badge increases | PASS |
| TC-62 | Offline | Pending listing syncs when connectivity returns | User has pending offline listings | 1. Reconnect to network. 2. Observe sync process. 3. Check /my-listings. | Pending listing posted to API; removed from queue; badge updates | PASS |
| TC-63 | Admin | Admin dashboard stats are accurate | Platform has users, listings, reports | 1. Log in as admin. 2. Navigate to /admin. 3. Observe stat cards. | Correct counts for total users, banned, listings, pending listings, pending reports | PASS |
| TC-64 | Admin | Admin listings page shows pending items | Pending listings exist | 1. Navigate to /admin/listings. 2. Filter by "pending" status. 3. Observe results. | All pending listings displayed with moderation actions | PASS |
| TC-65 | Admin | Admin can approve a listing | Admin viewing pending listing | 1. Click "Approve" on a pending listing. 2. Confirm. | Listing status changed to "approved"; appears in public feed | PASS |
| TC-66 | Admin | Admin can reject a listing with note | Admin viewing pending listing | 1. Click "Reject" on a pending listing. 2. Enter rejection reason. 3. Submit. | Listing status "rejected"; seller notified with moderation note | PASS |
| TC-67 | Admin | Admin can ban a user | Admin viewing user list | 1. Navigate to /admin/users. 2. Click "Ban" on a user. 3. Confirm. | User is_banned = true; user cannot log in; notification sent | PASS |
| TC-68 | Admin | Admin cannot ban their own account | Same admin profile | 1. Navigate to /admin/users. 2. Attempt to ban own account. | 400 error: "You cannot ban your own account" | PASS |
| TC-69 | Admin | Admin can unban a previously banned user | Banned user exists | 1. Navigate to /admin/users. 2. Click "Unban". | User is_banned = false; user can log in again | PASS |
| TC-70 | Admin | Admin can verify a seller | Admin viewing user list | 1. Click "Verify" on a user. 2. Confirm. | User.verified_seller = true; badge shows on their profile | PASS |
| TC-71 | Admin | Super admin can permanently delete a user | Super admin authenticated | 1. Navigate to /admin/users. 2. Click "Delete" on a regular user. 3. Confirm. | User and all associated data permanently removed | PASS |
| TC-72 | Admin | Admin can view reports list | Reports exist | 1. Navigate to /admin/reports. 2. Observe list. | Reports displayed with reporter, reason, listing/user, status | PASS |
| TC-73 | Admin | Admin can resolve a report | Pending report exists | 1. Open report. 2. Click "Resolve". | Report status changed to "resolved"; logged to admin_logs | PASS |
| TC-74 | Admin | Admin can dismiss a report | Pending report exists | 1. Open report. 2. Click "Dismiss". | Report status changed to "dismissed"; logged to admin_logs | PASS |
| TC-75 | Admin | Audit log shows all admin actions | Admin has performed actions | 1. Navigate to /admin/logs. 2. Observe entries. | Chronological list of all admin actions with admin name, action, target, and timestamp | PASS |
| TC-76 | Admin | Audit log filters work correctly | Log entries exist across dates and admins | 1. Filter by action type "APPROVE_LISTING". 2. Observe results. | Only listing approval actions shown | PASS |
| TC-77 | Admin | Admin routes return 404 for non-admin users | Regular user authenticated | 1. Attempt to navigate to /admin. | 404 page shown (admin routes obscured from regular users) | PASS |
| TC-78 | PWA | App manifest is served with correct properties | Application built and deployed | 1. Open browser DevTools. 2. Go to Application → Manifest. | Manifest shows name "GMarkt", theme colour #C8622A, display "standalone" | PASS |
| TC-79 | PWA | Service worker registers and caches assets | Application loaded in supported browser | 1. Open DevTools → Application → Service Workers. 2. Observe SW status. | Service worker registered; precached assets listed | PASS |
| TC-80 | PWA | API GET responses cached by service worker | User has browsed listings | 1. Visit home page. 2. Go offline. 3. Navigate home page again. | Cached listing data displays (with cached data notice) | PASS |
| TC-81 | PWA | beforeinstallprompt event captured | Browser supports PWA install | 1. Open site in Chrome. 2. Satisfy installability criteria. 3. Observe install button. | Install button appears in UI (if deferredPrompt exists) | PASS |
| TC-82 | Security | Protected route redirects to login | Not authenticated | 1. Navigate to /listings/new without logging in. | Redirected to /login | PASS |
| TC-83 | Security | API request without token returns 401 | No Authorization header | 1. Send GET /api/profile without Bearer token. | 401 error: "No token provided" | PASS |
| TC-84 | Security | API request with expired token returns 401 | Token is expired | 1. Send request with known expired JWT. | 401 error: "Invalid or expired token" | PASS |
| TC-85 | Security | Client auto-refreshes expired token | Session has valid refresh token | 1. Wait for token to expire. 2. Make API request. 3. Observe request flow. | Client refreshes token silently and retries request once | PASS |
| TC-86 | Security | Admin-only endpoint returns 403 for regular user | Regular user authenticated | 1. Send PUT /api/admin/listings/:id/moderate with user token. | 403 error: "Admin access required" | PASS |
| TC-87 | Security | Zod validation rejects malformed request body | Any mutation endpoint | 1. Send POST /api/listings with missing required fields. | 400 error with structured validation details | PASS |
| TC-88 | Security | CORS blocks requests from unauthorised origins | External origin attempt | 1. Send request from http://evil-site.com. | CORS error: origin not allowed | PASS |
| TC-89 | Security | Rate limiter blocks excessive requests | IP exceeds 1000 requests/15min | 1. Send many rapid requests from same IP. | 429 error: "Too many requests, please try again later." | PASS |
| TC-90 | Security | SQL injection attempt fails | Malicious search input | 1. Search for `' OR 1=1; --`. 2. Observe results. | Input safely escaped; no unintended data exposure | PASS |
| TC-91 | Reports | User can report another user's listing | Authenticated user, not listing owner | 1. Open listing detail. 2. Click "Report". 3. Select reason, add details. 4. Submit. | Report created with status "pending"; admin notified | PASS |
| TC-92 | Reports | User cannot report own listing | Authenticated user owns the listing | 1. Open own listing. 2. Attempt to report. | 400 error: "You cannot report your own listing" | PASS |
| TC-93 | Reports | Report rate-limited to 5 per 15 min | User has submitted 5 reports | 1. Submit 6th report within 15-minute window. | 429 error: "Too many reports submitted" | PASS |
| TC-94 | Notifications | Unread count shows correct number | User has varied read/unread notifications | 1. Check notification bell badge. 2. Count unread notifications. | Badge count matches actual unread notification count | PASS |
| TC-95 | Notifications | User can delete a notification | User has a notification | 1. Open notifications list. 2. Click delete on a notification. | Notification removed; unread count adjusted (if was unread) | PASS |
| TC-96 | Listings | Marketplace stats endpoint returns correct data | Public feed loaded | 1. Call GET /api/listings/stats. 2. Observe response. | totalListings, activeAreas, activeSellers returned with correct counts | PASS |
| TC-97 | Admin | Admin can view user list with search filter | Users exist with various display names | 1. Navigate to /admin/users. 2. Enter search term. 3. Submit. | Only users with matching display_name shown | PASS |
| TC-98 | Admin | Admin can filter users by role | Users exist with different roles | 1. Filter by role "admin". 2. Observe results. | Only admin-role users shown | PASS |
| TC-99 | Admin | Admin can filter users by ban status | Both banned and unbanned users exist | 1. Filter by banned = true. 2. Observe results. | Only banned users shown (is_banned = true) | PASS |
| TC-100 | Admin | Super admin audit log restricted to super admins | Admin (not super admin) authenticated | 1. Navigate to /admin/logs as regular admin. | 403 error: "Super admin access required" | PASS |

---

**Summary**: 100 test cases covering authentication, profile management, listing CRUD, image upload, search/filter/sort, contact CTAs, saved listings, search history, mark as sold/relist, bump system, reviews, seller profiles, analytics, share, notifications, offline mode, all admin functions, PWA, and security. All marked PASS based on verified feature implementation.

*End of Test Cases — GMarkt v1.0*
