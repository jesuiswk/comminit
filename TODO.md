# Comminit - Improvements & Technical Debt

## 📊 **Current Status**
- **TypeScript**: ✅ 0 errors, 0 warnings
- **Build Status**: ✅ Ready for production
- **Core Functionality**: ✅ Auth, Posts, Comments, Notifications, Search, Profile pictures
- **Stack**: Nuxt 3 · Supabase · Pinia · Zod · Vitest

---

## 🔴 **Critical — Architecture Debt**

### 1. Duplicated Auth Logic Between Store and Composable
**Problem**: `stores/auth.ts` and `composables/useAuth.ts` both implement `signIn`, `signUp`, `signOut`, and `updateProfile` with near-identical Supabase calls. Any auth change must be made in two places.
**Files**: `stores/auth.ts`, `composables/useAuth.ts`
**Fix**: Make `useAuth.ts` delegate to the Pinia store, or eliminate the store and use only the composable with `useState` for reactivity. Pick one source of truth.
```typescript
// Option A — composable delegates to store:
export function useAuth() {
  const store = useAuthStore()
  return { signIn: store.signIn, signOut: store.signOut, ... }
}

// Option B — remove store, use composable + useState for global state:
const user = useState<User | null>('auth.user', () => null)
```

### 2. `index.vue` Bypasses the `usePosts()` Composable
**Problem**: The homepage reimplements pagination logic and direct Supabase queries inline instead of calling `usePosts().fetchPosts()`. Bugs fixed in `usePosts` won't apply to the homepage.
**File**: `pages/index.vue` (lines ~65–115)
**Fix**: Replace inline data fetching with `usePosts().fetchPosts({ page, limit })` and bind the reactive result.

### 3. `useNotifications.ts` Skips the Standardized Error Handler
**Problem**: `usePosts.ts` and `useComments.ts` use `useErrorHandling()` for consistent error shapes. `useNotifications.ts` and `useSearch.ts` hand-roll `{ data: null, error: { message: ... } }` objects inline, creating divergence.
**Files**: `composables/useNotifications.ts`, `composables/useSearch.ts`
**Fix**: Import and use `useErrorHandling()` in both — `createErrorResponse`, `createSuccessResponse`, `handleSupabaseError`.

### 4. `useSearch.ts` Returns `any` Type
**Problem**: `search()` is typed as `Promise<ApiResponse<PaginatedResponse<any>>>`. This defeats TypeScript's purpose for consumers of this function.
**File**: `composables/useSearch.ts`
**Fix**: Use a discriminated union return type:
```typescript
type SearchResult = PostWithAuthor | Profile | CommentWithAuthor
async function search(params: SearchParams): Promise<ApiResponse<PaginatedResponse<SearchResult>>>
```

---

## 🟠 **High Priority — Performance**

### 1. Search Uses Unindexed `ilike` — Add Full-Text Search
**Problem**: `useSearch.ts` queries with `.or('title.ilike.%query%,content.ilike.%query%')`. Wildcards on both sides can't use B-tree indexes, causing full-table scans that degrade with content volume.
**File**: `composables/useSearch.ts`, `supabase/schema.sql`
**Fix**: Enable Postgres full-text search with `tsvector` + GIN index:
```sql
-- In Supabase SQL editor:
ALTER TABLE posts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED;
CREATE INDEX posts_search_idx ON posts USING GIN(search_vector);
```
```typescript
// In useSearch.ts:
const { data } = await supabase
  .from('posts')
  .select('*, author:profiles(*)')
  .textSearch('search_vector', query)
```

### 2. Homepage Makes Two Sequential DB Calls for Count + Data
**Problem**: `index.vue` fires a count query then a data query sequentially. Supabase supports both in one request.
**Fix**:
```typescript
const { data, count } = await supabase
  .from('posts')
  .select('*, author:profiles(*)', { count: 'exact' })
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1)
```
Apply same pattern in `usePosts.ts` `fetchPosts()`.

### 3. Search Suggestions Fire 3 Parallel Queries Per Keystroke — Add Debounce
**Problem**: `getSuggestions()` immediately fires 3 Supabase requests on each input character. At 60 WPM that's ~18 requests/second.
**File**: `composables/useSearch.ts`, `components/SearchBar.vue`
**Fix**: Debounce the input handler (300ms) in `SearchBar.vue`. Add a request cancellation mechanism using AbortController if feasible with the Supabase JS client.

### 4. No Client-Side Caching — Data Refetches on Every Navigation
**Problem**: `useAsyncData` with a static key `'posts'` works for SSR but navigating away and back triggers full refetches. Pinia already exists — use the posts store to cache fetched data.
**File**: `stores/posts.ts`, pages
**Fix**: On `fetchPosts`, check if the store already has fresh data (within a TTL), return it immediately, and refresh in the background. Or use `useFetch` with `getCachedData` option:
```typescript
const { data } = await useAsyncData('posts', fetcher, {
  getCachedData: (key) => useNuxtApp().payload.data[key]
})
```

### 5. Missing DB Indexes for Common Query Patterns
**Problem**: No indexes on `posts.user_id`, `comments.post_id`, `comments.user_id`, `notifications.user_id + read`. These are the most queried columns.
**File**: `supabase/schema.sql`
**Fix**:
```sql
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
```

---

## 🟡 **Medium Priority — Missing Features**

### 1. Likes System Is Typed But Not Implemented
**Problem**: `NotificationType` includes `'like'` and `Post` type has a `category` field, signaling planned features. The "like" UX (heart/upvote on posts and comments) is missing entirely.
**Implementation**:
1. Add `likes` table: `id, user_id, post_id (nullable), comment_id (nullable), created_at`
2. Add RLS: users can only insert/delete their own likes
3. Add `useLikes.ts` composable with `toggleLike(postId)`, `getLikeCount(postId)`, `hasLiked(postId)`
4. Add Supabase trigger to insert a `like` notification when a post is liked
5. Add like button + count to `PostCard.vue` and the post detail page

### 2. Threaded Comments Are Half-Built
**Problem**: `Comment.parent_comment_id` exists in the type and is handled in `createComment()`, but the post detail page UI is flat — no nesting, no reply button visible.
**File**: `pages/posts/[id].vue`, `composables/useComments.ts`
**Implementation**:
1. Group fetched comments into a tree structure client-side:
```typescript
function buildCommentTree(comments: CommentWithAuthor[]) {
  const map = new Map<string, CommentWithAuthor & { replies: CommentWithAuthor[] }>()
  const roots: typeof map extends Map<any, infer V> ? V[] : never = []
  comments.forEach(c => map.set(c.id, { ...c, replies: [] }))
  map.forEach(c => {
    if (c.parent_comment_id) map.get(c.parent_comment_id)?.replies.push(c)
    else roots.push(c)
  })
  return roots
}
```
2. Add "Reply" button on each comment that pre-fills `parent_comment_id`
3. Add visual indentation for replies (max 2–3 levels)

### 3. User Follow System
**Problem**: `NotificationType` includes `'follow'` but there's no follower/following relationship in the schema.
**Implementation**:
1. Add `follows` table: `follower_id, following_id, created_at` (PK on both columns)
2. RLS: users can insert/delete their own follows, can read all
3. Add `useFollow.ts` composable
4. Show follow button on user profile pages (`pages/users/[id].vue`)
5. Add "Following" feed view on the homepage (filter posts by followed users)

### 4. Post Categories/Tags
**Problem**: `Post` type already has `category?: string` but it's never set or filtered on.
**Implementation**:
1. Add `category` column to posts table in Supabase
2. Add category selector to `pages/posts/new.vue` form (dropdown: General, Technical, Meta, Announcements)
3. Add category filter tabs/pills on `pages/index.vue`
4. Index `posts.category` column

### 5. Real-Time Notifications Are Subscribed But Never Triggered
**Problem**: `useNotifications.ts` has `subscribeToNotifications()` and `NotificationBell.vue` exists, but nothing in the backend creates notifications. There are no Supabase database triggers firing on comments, likes, or follows.
**Implementation**:
```sql
-- Trigger: notify post author when someone comments
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    PERFORM create_notification(
      (SELECT user_id FROM posts WHERE id = NEW.post_id),
      'comment',
      'New comment on your post',
      LEFT(NEW.content, 100),
      jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_comment_insert
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();
```
Add similar triggers for likes and follows.

### 6. `getTrendingSearches()` Returns Hardcoded Data
**Problem**: `useSearch.ts` returns a hardcoded array of strings. This provides zero value and could mislead users.
**File**: `composables/useSearch.ts`
**Option A (quick)**: Remove the function entirely until real tracking is built.
**Option B (proper)**: Add a `search_events` table, log search queries (anonymized), and query top 10 most searched terms in the last 7 days.

### 7. No User Bio or Extended Profile
**Problem**: `Profile` only has `id`, `username`, `avatar_url`. No bio, website, location — standard fields users expect.
**Implementation**:
1. Add columns: `bio TEXT`, `website TEXT`, `location TEXT` to `profiles`
2. Add fields to `pages/settings.vue`
3. Display on `pages/users/[id].vue`

### 8. Draft Saving for Posts
**Problem**: If a user starts writing a post and accidentally navigates away, all content is lost.
**File**: `pages/posts/new.vue`
**Fix**: Persist draft to `localStorage` on debounced input. Load draft on mount, clear on successful publish.
```typescript
const DRAFT_KEY = 'comminit:post_draft'
watch(form, (val) => localStorage.setItem(DRAFT_KEY, JSON.stringify(val)), { deep: true })
onMounted(() => {
  const saved = localStorage.getItem(DRAFT_KEY)
  if (saved) Object.assign(form, JSON.parse(saved))
})
```

---

## 🔵 **Medium Priority — Security & Correctness**

### 1. No Rate Limiting on Auth Endpoints (Client Side)
**Problem**: The login/register forms have no client-side submission throttle. Supabase applies some server-side limits, but explicit client-side feedback is missing.
**Fix**: Disable submit button for 2 seconds after each attempt. Show countdown. This also prevents accidental double-submissions on slow connections.

### 2. Missing Email Verification Flow
**Problem**: `signUp()` in `useAuth.ts` / `stores/auth.ts` doesn't handle the email confirmation case. Supabase by default requires email confirmation, but the app doesn't tell users to check their email or handle the `email_not_confirmed` error code gracefully.
**Fix**: After `signUp`, check if `data.user.email_confirmed_at` is null and show a "Check your email to confirm your account" message. Add a resend confirmation email button.

### 3. No Soft Delete — Hard Deletes Break Notification References
**Problem**: Deleting a post deletes it permanently. Any notification that references `post_id` in its `data` JSON now points to a ghost record, breaking navigation from notification to post.
**Fix**:
1. Add `deleted_at TIMESTAMPTZ` to posts and comments
2. Change `deletePost`/`deleteComment` to set `deleted_at = NOW()` instead of hard deleting
3. Add RLS/view to filter out soft-deleted records from normal queries
4. Show "This post has been deleted" placeholder for notification links to deleted posts

### 4. `supabase.rpc()` Calls Aren't Type-Safe
**Problem**: `useNotifications.ts` calls `supabase.rpc('mark_notifications_as_read', ...)` and `supabase.rpc('create_notification', ...)`. These return `unknown` — already flagged in old TODO but not fixed.
**File**: `types/supabase.ts`
**Fix**: Add RPC type definitions:
```typescript
mark_notifications_as_read: {
  Args: { p_user_id: string }
  Returns: number
}
create_notification: {
  Args: {
    p_user_id: string; p_type: string; p_title: string;
    p_content?: string; p_data?: Json
  }
  Returns: Database['public']['Tables']['notifications']['Row']
}
```

---

## 🟢 **Low Priority — Code Quality & DX**

### 1. Remove Backup Files and Cleanup Scripts from Repo
**Problem**: The repo has `.backup` files and a `quick-fix-typescript.sh` in the root that shouldn't be committed.
**Files to delete**:
- `composables/useNotifications.ts.backup`
- `middleware/auth.ts.backup`
- `nuxt.config.ts.backup`
- `pages/posts/[id].vue.backup`
- `quick-fix-typescript.sh`

**Fix**: `git rm` these files, add `*.backup` to `.gitignore`.

### 2. Type Barrel — Stop Importing From Two Type Files
**Problem**: Some files import from `~/types` and `~/types/supabase` separately. With a barrel:
```typescript
// types/index.ts — add at bottom:
export type { Database, Json } from './supabase'
```
Then all imports become `import type { Post, Database } from '~/types'`.

### 3. `useOptimisticUpdates.ts` Is Unused
**Problem**: The composable exists but it's unclear if it's wired anywhere.
**Fix**: Either wire it to `usePosts` / `useComments` mutations, or remove it.

### 4. `SearchBar.vue` Is Not in the Layout
**Problem**: `SearchBar.vue` is a component but doesn't appear to be used in `layouts/default.vue` or `AppHeader.vue`.
**Fix**: Integrate it into `AppHeader.vue` — add a search icon button that expands an input inline (like GitHub's header search).

### 5. `Post.category` Field Has No DB Column
**Problem**: `types/index.ts` declares `category?: string` on `Post` but the database schema doesn't have this column (it was never migrated).
**Fix**: Either migrate the column (see Feature #4 above) or remove the field from the type until it's implemented.

---

## 🧪 **Testing**

### 1. Missing Composable Tests
**Current coverage**: Only `usePosts.test.ts` exists for composables.
**Add**:
- `tests/composables/useComments.test.ts` — createComment, deleteComment, canEditComment
- `tests/composables/useAuth.test.ts` — signIn error paths, signOut, updateProfile
- `tests/composables/useNotifications.test.ts` — fetchUnreadCount, markAllAsRead
- `tests/composables/useSearch.test.ts` — empty query returns empty result, type routing

### 2. Add E2E Tests with Playwright
**Why Playwright over Cypress**: Better Nuxt 3 SSR support, faster, built-in request interception.
```bash
npm install -D @playwright/test @nuxt/test-utils
```
**Critical flows to cover**:
- Register → verify welcome state → create post → view post
- Login → add comment → see notification
- Search for a post → navigate to result

### 3. Add CI Pipeline (GitHub Actions)
**File to create**: `.github/workflows/ci.yml`
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

## 📦 **Build & Deployment**

### 1. Validate Environment Variables at Startup
**File**: `nuxt.config.ts`
```typescript
// Add before defineNuxtConfig:
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY']
requiredEnvVars.forEach(key => {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`)
})
```

### 2. Add `robots.txt` and `sitemap.xml` Dynamic Routes
**Problem**: `@nuxtjs/seo` is installed but sitemap only covers static routes. Post pages are dynamic.
**Fix**: Add dynamic sitemap routes:
```typescript
// nuxt.config.ts
sitemap: {
  sources: ['/api/__sitemap__/urls'],
},
```
Create `server/api/__sitemap__/urls.ts` that queries Supabase for all public post IDs.

### 3. Bundle Analysis
**Run**: `npx nuxt build && npx nuxt-bundle-analyzer`
**Target**: < 500KB gzipped JS. Check if `lodash-es` is being tree-shaken properly.

---

## 📊 **Success Metrics**

| Metric | Current | Target |
|---|---|---|
| Lighthouse Performance | Unknown | > 90 |
| First Contentful Paint | Unknown | < 1.5s |
| Test coverage | < 20% | > 70% |
| TypeScript strict errors | 0 | 0 (maintain) |
| Critical security vulns | 0 | 0 (maintain) |
| DB query count per page | 2+ | 1 |

---

## 🗓️ **Suggested Execution Order**

### Sprint 1 (this week) — Architecture cleanup
1. [ ] Merge `useAuth.ts` + `stores/auth.ts` duplication
2. [ ] Fix `index.vue` to use `usePosts()` composable
3. [ ] Apply `useErrorHandling()` to `useNotifications.ts` and `useSearch.ts`
4. [ ] Remove `.backup` files and `quick-fix-typescript.sh` from git
5. [ ] Add missing DB indexes to `schema.sql`

### Sprint 2 — Performance
6. [ ] Combine count+data into single Supabase call everywhere
7. [ ] Add full-text search with `tsvector`
8. [ ] Debounce search suggestions in `SearchBar.vue`
9. [ ] Wire `SearchBar.vue` into `AppHeader.vue`

### Sprint 3 — Features
10. [ ] Implement likes system (table + composable + UI)
11. [ ] Add DB triggers for notifications (comment, like events)
12. [ ] Add user bio fields to profile
13. [ ] Draft saving in post creation form
14. [ ] Fix `getTrendingSearches()` (remove or implement)

### Sprint 4 — Polish & Reliability
15. [ ] Threaded comments UI
16. [ ] Soft deletes for posts/comments
17. [ ] Email verification flow
18. [ ] E2E tests with Playwright
19. [ ] GitHub Actions CI pipeline

---

**Last Updated**: March 19, 2026
**Next Review**: April 2, 2026
