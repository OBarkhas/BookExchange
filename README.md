# 📚 BookLoop — Buy, Sell & Exchange Used Books

A community marketplace where local book lovers **swap**, **sell**, and **discover** pre-loved books. Built with **Next.js 16 (App Router)**, **Prisma 7 + Neon PostgreSQL**, **Clerk Auth**, **Vercel Blob** images, and **Tailwind CSS v4** — all wrapped in a warm amber/cream design system with Framer Motion micro-interactions.

## ✨ Features

| Feature | Details |
| --- | --- |
| **User sync & auth** | Clerk users are upserted into Neon via `POST /api/auth/sync` (no webhooks/ngrok needed) |
| **Book listings** | Multi-image uploads (Vercel Blob), condition & damage tracking, swap/sell types, 30-day expiry, "Bump to top" |
| **Smart search & filters** | Full-text search + category, district, condition, listing-type filters, sort, pagination |
| **Requests & messaging** | Exchange request workflow (pending → accepted → completed) with a private polling chat per request |
| **Gamification** | Auto-awarded badges: First Listing, Librarian, First Swap, Exchange Expert, Trusted Reader, Event Host, Bookworm |
| **Reviews** | 1–5 star ratings with one review per pair (upserted atomically) |
| **Community events** | Host and RSVP to local Book Swap Meets |
| **Notifications** | In-app inbox + navbar bell with live unread badge (polling) |
| **Shelf & wishlist** | Reading tracker (reading / finished / want-to-read) plus a book wishlist |

## 🚀 Getting Started

### 1. Environment variables

```env
# Neon PostgreSQL (https://neon.tech)
DATABASE_URL="postgresql://user:password@ep-xxx.aws.neon.tech/neondb?sslmode=require"

# Clerk (https://clerk.com) — from Clerk dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Vercel Blob (https://vercel.com/docs/storage/vercel-blob) — for book image uploads
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# Optional: Clerk webhook verification (only needed if you enable webhooks)
CLERK_WEBHOOK_SECRET="whsec_..."
```

### 2. Install & migrate

```bash
npm install
npx prisma migrate deploy   # applies prisma/migrations to Neon
npx prisma generate         # generates the typed client into src/generated/prisma
```

### 3. Run

```bash
npm run dev                 # http://localhost:3000
```

Sign in with Clerk → your account is auto-created in Neon on first load.

## 🗂 Architecture

```
src/
├── app/
│   ├── page.tsx                  # Home: hero (signed out) / dashboard (signed in)
│   ├── (app)/                    # Authenticated app shell (shared navbar + auth gate)
│   │   ├── browse/               # Market with search & filters
│   │   ├── listings/[id]/        # Detail + request flow (+ edit, new)
│   │   ├── exchanges/            # Sent/received requests + status actions
│   │   ├── messages/[requestId]/ # Polling chat thread
│   │   ├── shelf/                # Bookshelf + wishlist
│   │   ├── events/               # Swap meets + RSVP
│   │   ├── notifications/        # Inbox
│   │   └── profile/[userId]/     # Public profile, badges, reviews
│   └── api/
│       ├── auth/sync/            # Clerk → Neon upsert
│       ├── upload/               # Vercel Blob image upload (FormData → put())
│       ├── listings/             # CRUD, search, bump, request
│       ├── requests/             # Status workflow + messages (chat)
│       ├── shelf/ · wishlist/    # Reading tracker CRUD
│       ├── events/               # CRUD + attend
│       ├── reviews/ · users/     # Ratings
│       └── notifications/        # Inbox + read state
├── components/
│   ├── ui/                       # Button, Modal, Input, Select, StarRating, …
│   ├── navbar/                   # Navbar + NotificationBell (polling)
│   ├── books/ · requests/ · events/ · shelf/ · profile/
└── lib/
    ├── db.ts                     # Prisma + Neon driver adapter singleton
    ├── auth.ts                   # syncUserFromClerk() / getDbUser()
    ├── badges.ts                 # checkAndAwardBadges() — auto-award logic
    ├── notify.ts                 # createNotification()
    └── utils.ts · categories.ts
```

### Key decisions

- **Auth sync without webhooks** — `src/components/auth/UserSync.tsx` (client) calls `POST /api/auth/sync` after sign-in; every protected page/route also upserts via `getDbUser()`, so the Neon row always exists.
- **30-day listing lifespan** — `expiresAt = now + 30d` on create; **Bump to top** resets `lastBumpedAt` and extends expiry another 30 days. Expired listings are excluded from all public queries.
- **Image uploads (Vercel Blob)** — the client drag-and-drops photos (`src/components/books/ImageUpload.tsx`), posts each file to `POST /api/upload`, which validates type/size and stores it via `put()` with `access: "public"`, then stores the returned URL in the listing's `images[]`.
- **Chat** — unlocked when a request is created; client polls `GET /api/requests/[id]/messages` every 3s (no external realtime service).
- **Badges** — awarded server-side from activity hooks (`checkAndAwardBadges`), deduplicated with `@@unique([userId, badgeName])`.
- **Reviews** — one per pair enforced by `@@unique([reviewerId, receiverId])` + `upsert`.

## 🔌 API surface (all under `/api`)

`POST /auth/sync` · `POST /upload` (Blob images) · `GET|POST /listings` · `GET|PATCH|DELETE /listings/[id]` · `POST /listings/[id]/request` · `GET /requests` · `GET|PATCH /requests/[id]` · `GET|POST /requests/[id]/messages` · `GET|POST /shelf` · `PATCH|DELETE /shelf/[id]` · `GET|POST /wishlist` · `DELETE /wishlist/[id]` · `GET|POST /events` · `GET|PATCH|DELETE /events/[id]` · `POST|DELETE /events/[id]/attend` · `POST /reviews` · `GET /users/[id]/reviews` · `GET|PATCH /notifications` · `PATCH|DELETE /notifications/[id]`

## 🧪 Validation

```bash
npm run lint     # 0 errors
npm run build    # typecheck + production build
```
