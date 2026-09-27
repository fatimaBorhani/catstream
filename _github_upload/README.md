# StreamHub

![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-dev%20db-07405e?logo=sqlite&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white)
![License](https://img.shields.io/badge/license-All%20rights%20reserved-lightgrey)

A full-stack, Twitch-style streaming platform built as a learning/demo project. Real accounts, real video uploads, real-time chat, likes, follows, clips, and more — all backed by an actual database, not mock data.

> **Note:** StreamHub is a VOD (video-on-demand) platform, not a live-streaming service. There is no RTMP/HLS ingest or media server — "going live" toggles a flag and streamers/viewers interact around uploaded videos and real-time chat. True live broadcasting would require a paid service (Cloudflare Stream, Mux, AWS IVS) or a dedicated media server, which is intentionally out of scope for this project.

There's no hosted demo — the project runs entirely on your own machine (local SQLite database, local file storage). See **[Getting started](#getting-started)** below to have it running in your browser in a couple of minutes.

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables-serverenv)
- [Scripts](#scripts)
- [API overview](#api-overview)
- [Known limitations](#known-limitations)
- [License](#license)

## Features

- **Authentication** — real signup/login with hashed passwords (bcrypt) and JWT stored in an httpOnly cookie
- **Channels** — create a channel from your account, edit stream title/description/category, social links, and a follower goal with a live progress bar
- **Video upload & playback** — upload real video files, watch them on a dedicated watch page, automatic view counting
- **Likes** — like/unlike videos, persisted per user
- **Clips** — bookmark a timestamp on any video, share a direct link that jumps to that moment
- **Comments** — comment threads on channel pages
- **Follows** — follow/unfollow channels, a "Following" feed, live follower counts
- **Notifications** — an activity feed derived from existing data (new videos, comments, live status) with an unread indicator
- **Real-time chat** — per-channel chat rooms over Socket.IO, message history persisted in the database, rate-limited, reconnect handling
- **Browse & search** — categories, tags, sorting/filtering, and a global search across channels and videos
- **Playlists** — group videos into playlists per channel

## Tech stack

**Frontend** (`stream web/`)
- React 19 + React Router 7
- Vite 8
- Tailwind CSS 4
- Socket.IO client

**Backend** (`server/`)
- Node.js + Express
- Prisma ORM + SQLite (swappable for PostgreSQL for real deployment)
- Socket.IO (real-time chat)
- JWT auth in an httpOnly cookie, bcrypt password hashing
- Multer for video file uploads

## Project structure

```
stream/
├─ server/                   Backend (Express API + Socket.IO)
│  ├─ prisma/
│  │  ├─ schema.prisma       Database models (User, Streamer, Video, Clip, Follow, Like, Comment, ChatMessage, ...)
│  │  └─ seed.js             Demo data seeding
│  ├─ src/
│  │  ├─ app.js              Express app setup (middleware, routes, static uploads)
│  │  ├─ index.js            HTTP server entry point (Express + Socket.IO on one port)
│  │  ├─ lib/                Prisma client, JWT helpers, chat/socket logic
│  │  ├─ middleware/         Auth middleware
│  │  └─ routes/             auth, users, streamers, videos, clips, comments, follows, playlists, categories, notifications
│  └─ uploads/                Uploaded video files (gitignored)
│
└─ stream web/                Frontend (React + Vite)
   └─ src/
      ├─ components/          UI components (auth, dashboard, channel, chat, player, layout, cards, common)
      ├─ context/             Auth, Data, and Toast providers
      ├─ pages/                Home, Browse, Category, Channel, Following, Profile, Dashboard, Watch, ...
      └─ hooks/
```

## Prerequisites

- Node.js 18+
- npm

## Getting started

Run the backend and frontend in two separate terminals.

### 1. Backend

```bash
cd server
cp .env.example .env
```

Open `.env` and set `JWT_SECRET` to any random string. The default `DATABASE_URL` (a local SQLite file) can be left as-is for development.

```bash
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

The API starts on `http://localhost:4000`. Check `http://localhost:4000/health` for `{"status":"ok"}`.

### 2. Frontend

```bash
cd "stream web"
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

> **Windows note:** if `http://localhost:5173` shows `ERR_CONNECTION_REFUSED` even though Vite says it's `ready`, try `http://127.0.0.1:5173` instead — except for testing chat, which needs `localhost` specifically (cookies are scoped to `localhost`, so `CLIENT_ORIGIN` and the login cookie won't match `127.0.0.1`).

### What you'll see

The seed step above (`npx prisma db seed`) fills the database with demo categories, channels and videos, so `http://localhost:5173` shows a populated Browse page immediately — no need to create anything first. Sign up for an account to try the interactive parts: create your own channel, upload a video, like/comment/follow, make a clip, and chat in real time (open the same channel in two browser tabs with two different accounts to see chat sync live).

## Environment variables (`server/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Database connection string. Defaults to a local SQLite file (`file:./dev.db`); swap for a PostgreSQL URL for real deployment |
| `PORT` | Port the Express server listens on (default `4000`) |
| `CLIENT_ORIGIN` | Frontend URL, used for CORS (default `http://localhost:5173`) |
| `JWT_SECRET` | Secret used to sign login JWTs — set this to a random string and never commit it |

## Scripts

**Backend** (`server/`)

| Command | Description |
|---|---|
| `npm run dev` | Start the API with auto-reload (nodemon) |
| `npm start` | Start the API |
| `npm run prisma:generate` | Regenerate the Prisma client after a schema change |
| `npm run prisma:seed` | Re-seed the database with demo data |

**Frontend** (`stream web/`)

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint with oxlint |
| `npm run preview` | Preview the production build locally |

## API overview

All routes are mounted under `/api`.

| Route | Purpose |
|---|---|
| `/api/auth` | Signup, login, logout, current user |
| `/api/users` | User-level actions |
| `/api/streamers` | Channels — create/update a channel, look up by username |
| `/api/videos` | Upload, list, delete videos; likes; view counts |
| `/api/clips` | Create/list/delete timestamp clips |
| `/api/comments` | Channel comments |
| `/api/follows` | Follow/unfollow, followed channels |
| `/api/playlists` | Channel playlists |
| `/api/categories` | Browse categories |
| `/api/notifications` | Activity feed |

Real-time chat runs over Socket.IO on the same HTTP server/port as the REST API, authenticated via the same login cookie.

## Known limitations

- No real live streaming (RTMP/HLS ingest) — "clips" are timestamp bookmarks on uploaded videos, not cut files
- SQLite is used for local development; a real deployment should switch the Prisma provider to PostgreSQL
- Uploaded videos are stored on local disk, not in object storage

## License

All rights reserved. See [`LICENSE`](./LICENSE) — this code may not be copied, modified, or redistributed without permission.
