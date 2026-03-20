# Comminit - Improvements & Technical Debt

## Current Status
- **TypeScript**: 0 errors, 0 warnings
- **Build Status**: Ready for production
- **Core Functionality**: Auth, Posts, Comments, Notifications, Search, Profile pictures, Likes
- **Stack**: Nuxt 3 · Supabase · Pinia · Zod · Vitest

---

## Progress Tracker

### Sprint 1 — Architecture Cleanup ✅
- [x] Merge `useAuth.ts` + `stores/auth.ts` duplication — `useAuth.ts` delegates to Pinia store
- [x] Fix `index.vue` to use `usePosts()` composable — using `fetchPosts()` from composable
- [x] Apply `useErrorHandling()` to `useNotifications.ts` and `useSearch.ts` — both use standardized error handling
- [x] Remove `.backup` files and `quick-fix-typescript.sh` from git — removed, added `*.backup` to `.gitignore`
- [x] Add missing DB indexes — `supabase/add_missing_indexes.sql` created

### Sprint 2 — Performance ✅
- [x] Combine count+data into single Supabase call in `index.vue` and `usePosts.ts` — using `{ count: 'exact' }`
- [x] Add full-text search SQL — `supabase/add_fulltext_search.sql` created
- [x] Update `useSearch.ts` to use `.textSearch('search_vector', query)` instead of `ilike` — done
- [x] Debounce search suggestions in `SearchBar.vue` — 300ms debounce with `lodash-es`
- [x] Wire `SearchBar.vue` into `AppHeader.vue` — done

### Sprint 3 — Features ✅ (verified)
- [x] Likes system — `useLikes.ts`, `LikeButton.vue`, `supabase/add_likes_system.sql`, integrated in `PostCard.vue`
  - ✅ **RESOLVED**: `useLikes.ts` now uses the `likes` table and calls `toggle_like`, `get_like_count` RPCs. Schema mismatch fixed.
- [x] Like notification triggers — in `add_likes_system.sql`
- [x] Threaded comments UI — `CommentItem.vue` with nested replies, integrated in `pages/posts/[id].vue`
- [x] `plugins/click-outside.ts` — `v-click-outside` directive, wired in `SearchBar.vue` and `NotificationBell.vue`
- [x] `EmptyState.vue` + `SkeletonLoader.vue` — components created and wired into pages
- [x] Wire `EmptyState.vue` and `SkeletonLoader.vue` into pages — `index.vue` and `posts/[id].vue` updated with skeleton loaders and empty states
- [x] Comment likes UI — `LikeButton` added to `CommentItem.vue` with `toggleCommentLike`, `getCommentLikeStatus` from `useLikes.ts`
- [x] Add comment notification DB trigger (post author notified on new comment) — `notify_on_comment()` function and `after_comment_insert` trigger added
- [x] User follow system (`follows` table + `useFollow.ts` + UI) — **COMPLETED**: `useFollow.ts`, `add_follows_system.sql`, follow button on `users/[id].vue`, and "Following" feed on homepage with tab switcher
- [x] Post categories/tags (DB column + form selector + filter UI)
- [x] Fix `getTrendingSearches()` — remove hardcoded array or implement real tracking
- [x] User bio / extended profile fields (`bio`, `website`, `location`) — **COMPLETED**: DB columns + types exist, `users/[id].vue` displays them, `settings.vue` now has edit form with validation
- [x] Draft saving for posts in `pages/posts/new.vue`

### Sprint 4 — Polish & Reliability
- [ ] Fix `useSearch.ts` `any` return type — use `SearchResult` discriminated union
- [ ] Soft deletes for posts/comments (`deleted_at` column + RLS filter)
- [ ] Email verification flow after sign-up
- [ ] Rate limiting on login/register forms (client-side, 2s cooldown)
- [ ] Type-safe `supabase.rpc()` calls in `useNotifications.ts`
- [ ] Wire or remove `useOptimisticUpdates.ts` — currently only used in `examples/`, not in production code
- [ ] Type barrel — re-export `Database`, `Json` from `~/types` so imports are unified
- [x] Fix `toggle_like` SQL security issue — function accepts `p_user_id` as a caller-supplied param; use `auth.uid()` internally to prevent impersonation
- [ ] E2E tests with Playwright
- [ ] GitHub Actions CI pipeline

---

## Detailed Issue Reference

### 🔴 Critical — Architecture Debt

#### ~~1. Duplicated Auth Logic Between Store and Composable~~ ✅
**Files**: `stores/auth.ts`, `composables/useAuth.ts`
**Status**: RESOLVED — `useAuth.ts` now delegates to the Pinia store.

#### ~~2. `index.vue` Bypasses the `usePosts()` Composable~~ ✅
**File**: `pages/index.vue`
**Status**: RESOLVED — Now uses `fetchPosts()` from `usePosts()` composable.

#### ~~3. `useNotifications.ts` / `useSearch.ts` Skip the Standardized Error Handler~~ ✅
**Status**: RESOLVED — Both composables use `useErrorHandling()` with `createErrorResponse`, `createSuccessResponse`, `handleSupabaseError`.

#### 4. `useSearch.ts` Returns `any` Type
**File**: `composables/useSearch.ts`
**Fix**:
```typescript
type SearchResult = PostWithAuthor | Profile | CommentWithAuthor
async function search(params: SearchParams): Promise<ApiResponse<PaginatedResponse<SearchResult>>>
```

#### ~~5. `useLikes.ts` / `add_likes_system.sql` Schema Mismatch~~ ✅
**Problem**: `useLikes.ts` was written against a `reactions` table with RPCs (`toggle_post_reaction`, `get_post_reaction_count`, `has_user_reacted_to_post`, view `post_reaction_stats`). The SQL migration creates a `likes` table with functions named `toggle_like`, `get_like_count`, `has_user_liked`.
**Status**: RESOLVED — `useLikes.ts` updated to use `likes` table and new RPC functions. TypeScript types updated in `types/supabase.ts`.

---

### 🟠 High Priority — Performance

#### ~~1. Search Uses `ilike` — Full-Text Search SQL Ready, Composable Not Updated~~ ✅
**Status**: RESOLVED — `useSearch.ts` now uses `.textSearch('search_vector', query)` for posts and comments.

#### ~~2. Homepage Makes Two Sequential DB Calls~~ ✅
**Status**: RESOLVED — `usePosts.ts` combines count and data into a single query with `{ count: 'exact' }`.

#### 3. No Client-Side Caching
**File**: `stores/posts.ts`, pages
**Fix**: Check store for fresh data (TTL) before fetching; or use `getCachedData` with `useAsyncData`.

---

### 🟡 Medium Priority — Missing Features

#### ~~1. Comment Notification Trigger Missing~~ ✅
**Status**: RESOLVED — `notify_on_comment()` function and `after_comment_insert` trigger added to `add_likes_system.sql`.

#### ~~2. User Follow System — "Following" Feed Missing~~ ✅
**Status**: RESOLVED — Complete follow system implemented:
1. ✅ `follows` table created with `follower_id, following_id, created_at`
2. ✅ `useFollow.ts` composable with functions for toggling follows, getting follow stats, followers/following lists, mutual follows, user stats, suggested users, and following feed
3. ✅ Follow button on `pages/users/[id].vue` with real-time follow status and counts
4. ✅ "Following" feed on homepage (`index.vue`) with tab switcher between "Latest Discussions" and "Following" feed

#### ~~3. Post Categories/Tags~~ ✅
**Status**: RESOLVED — `category` column added to `posts` table via `supabase/add_post_categories.sql`. Category selector added to `pages/posts/new.vue` with popular categories dropdown and custom entry. Category filtering implemented on `pages/index.vue` with popular category pills and dropdown selector. Database functions created for category management: `get_post_categories`, `get_posts_by_category`, `count_posts_by_category`, `get_popular_categories`.

#### ~~4. `getTrendingSearches()` Returns Hardcoded Data~~ ✅
**Status**: RESOLVED — `search_events` table added via `add_search_tracking.sql`. Queries are logged on each search; `get_trending_searches` RPC returns top 10 in 7 days. `useSearch.ts` calls the RPC with a fallback to defaults.

#### ~~5. User Bio / Extended Profile — Edit Form Missing~~ ✅
**Status**: RESOLVED — "Bio & Links" section added to `settings.vue` with inputs for `bio` (textarea with 500 character limit), `website` (URL input with validation), and `location` (text input). Form includes validation, success/error messages, and updates the profile via Supabase. Users can now edit their bio, website, and location from the settings page.

#### ~~6. Draft Saving for Posts~~ ✅
**Status**: RESOLVED — "Save as Draft" button added to `pages/posts/new.vue`. Drafts are saved to DB via `saveDraft` in `usePosts` (backed by `add_draft_support.sql`). Includes validation before saving.

---

### 🔵 Medium Priority — Security & Correctness

#### 1. No Rate Limiting on Auth Endpoints (Client Side)
**Fix**: Disable submit button 2s after each attempt with countdown.

#### 2. Missing Email Verification Flow
**Fix**: After `signUp`, check `data.user.email_confirmed_at === null` and show "Check your email" with a resend button.

#### 3. No Soft Delete — Hard Deletes Break Notification References
**Fix**: Add `deleted_at TIMESTAMPTZ` to posts/comments. Change delete operations to set `deleted_at`. Add RLS filter.

#### 4. `supabase.rpc()` Calls Not Type-Safe
**File**: `types/supabase.ts`
**Fix**: Add RPC definitions for `mark_notifications_as_read` and `create_notification`.

#### ~~5. `toggle_like` SQL Function Accepts Arbitrary `p_user_id`~~ ✅
**File**: `supabase/add_likes_system.sql`
**Problem**: `toggle_like(p_user_id, ...)` is called with a user-supplied UUID. Any authenticated user could pass a different user's ID and like on their behalf.
**Status**: RESOLVED — Removed `p_user_id` parameter and updated function to use `auth.uid()` internally.

---

### 🟢 Low Priority — Code Quality & DX

#### ~~1. Remove Backup Files and Cleanup Scripts~~ ✅
**Status**: RESOLVED — All backup files and `quick-fix-typescript.sh` removed. Added `*.backup` to `.gitignore`.

#### 2. Type Barrel — Unify Import Source
```typescript
// types/index.ts — add at bottom:
export type { Database, Json } from './supabase'
```

#### 3. `useOptimisticUpdates.ts` Is Unused in Production
**Status**: Only referenced in `examples/OptimisticUpdatesExample.vue`.
**Fix**: Wire it to `usePosts`/`useComments` mutations, or remove it.

#### 4. `Post.category` Field Has No DB Column
**Fix**: Either migrate the column (see Feature above) or remove from the type.

---

### 🧪 Testing

#### 1. Missing Composable Tests
**Add**:
- `tests/composables/useComments.test.ts`
- `tests/composables/useAuth.test.ts`
- `tests/composables/useNotifications.test.ts`
- `tests/composables/useSearch.test.ts`
- `tests/composables/useLikes.test.ts`

#### 2. Add E2E Tests with Playwright
```bash
npm install -D @playwright/test @nuxt/test-utils
```
**Critical flows**: register → create post → view post, login → comment → notification, search → navigate.

#### 3. Add CI Pipeline (GitHub Actions)
**File**: `.github/workflows/ci.yml`
```yaml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run test:run
      - run: npm run build
```

---

### 📦 Build & Deployment

#### 1. Validate Environment Variables at Startup
```typescript
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY']
requiredEnvVars.forEach(key => {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`)
})
```

#### 2. Add Dynamic Sitemap Routes
```typescript
sitemap: { sources: ['/api/__sitemap__/urls'] }
```
Create `server/api/__sitemap__/urls.ts` querying all public post IDs.

#### 3. Bundle Analysis
Run: `npx nuxt build && npx nuxt-bundle-analyzer`
Target: < 500KB gzipped JS.

---

## Success Metrics

| Metric | Current | Target |
|---|---|---|
| Lighthouse Performance | Unknown | > 90 |
| First Contentful Paint | Unknown | < 1.5s |
| Test coverage | < 20% | > 70% |
| TypeScript strict errors | 0 | 0 (maintain) |
| Critical security vulns | 0 | 0 (maintain) |
| DB query count per page | 1 | 1 (maintain) |

---

**Last Updated**: March 19, 2026 (rev 3)
**Next Review**: April 2, 2026
