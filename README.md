# Mailo — Incoming Email Web Application

Mailo is a modern, high-performance incoming-email mail system. It enables users to register, create multiple custom mailboxes (e.g. `rahim@writo.xyz`, `rahim.work@writo.xyz`), and receive real emails routed from **Cloudflare Email Routing** through a **Cloudflare Email Worker** directly into an **Async FastAPI backend** and **Next.js Dashboard**.

---

## 🏛️ System Architecture

```
Incoming Email
      ↓
Cloudflare Email Routing (DNS MX)
      ↓
Cloudflare Email Worker (email() handler)
      ↓ [message.raw MIME stream]
FastAPI Backend (POST /api/internal/email/incoming)
      ↓
Neon / PostgreSQL Database (Users, Mailboxes, Emails)
      ↓
Next.js App Router Dashboard (Inbox, Mailboxes, Settings)
```

---

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Python 3.11+, FastAPI (Async), SQLAlchemy 2.x (Async), Pydantic v2
- **Database**: PostgreSQL (Neon, Supabase, AWS RDS, Local) with `asyncpg`
- **Email Processing**: RFC822 MIME parser (text & HTML body extraction, attachments metadata)
- **Authentication**: Bcrypt password hashing, JWT tokens with HTTP-only secure cookie support

---

## 📦 Project Structure

```
mailo/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py               # Auth & DB dependencies
│   │   │   ├── internal/
│   │   │   │   └── incoming.py       # Cloudflare Worker webhook endpoint
│   │   │   └── v1/
│   │   │       ├── auth.py           # Signup, login, logout, me
│   │   │       ├── mailboxes.py      # Multi-mailbox CRUD & counters
│   │   │       ├── emails.py         # Paginated inbox & email details
│   │   │       └── router.py         # Root API router
│   │   ├── core/
│   │   │   ├── config.py             # Settings & database URL normalizer
│   │   │   └── security.py           # Bcrypt & JWT implementation
│   │   ├── db/
│   │   │   ├── base.py               # DeclarativeBase
│   │   │   └── session.py            # Async engine & sessionmaker
│   │   ├── models/                   # SQLAlchemy 2.x async models
│   │   │   ├── user.py
│   │   │   ├── mailbox.py
│   │   │   └── email.py
│   │   ├── repositories/             # Database query layer
│   │   │   ├── user_repo.py
│   │   │   ├── mailbox_repo.py
│   │   │   └── email_repo.py
│   │   ├── schemas/                  # Pydantic v2 validation models
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── mailbox.py
│   │   │   └── email.py
│   │   ├── services/                 # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── mailbox_service.py
│   │   │   ├── email_service.py
│   │   │   └── mime_service.py       # RFC822 MIME parser & storage
│   │   └── main.py                   # FastAPI application entry point
│   ├── migrations/                   # Alembic async database migrations
│   │   ├── env.py
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── inbox/page.tsx        # Responsive inbox with mailbox filtering
│   │   │   ├── mailboxes/page.tsx    # Multi-mailbox management
│   │   │   ├── settings/page.tsx     # User profile & worker settings
│   │   │   ├── layout.tsx            # Dashboard layout (desktop/mobile)
│   │   │   └── page.tsx              # Redirects to /dashboard/inbox
│   │   ├── login/page.tsx            # User login
│   │   ├── signup/page.tsx           # User registration & initial mailbox
│   │   ├── layout.tsx                # App root layout
│   │   └── page.tsx                  # Marketing landing page
│   ├── lib/
│   │   └── api.ts                    # Centralized typed API client
│   ├── types/
│   │   └── index.ts                  # Shared TypeScript interfaces
│   ├── package.json
│   └── tailwind.config.ts
├── .gitignore
└── README.md
```

---

## 🗄️ Database Configuration

Mailo uses PostgreSQL via SQLAlchemy 2.x and `asyncpg`.

### Required `DATABASE_URL` Format:
```env
DATABASE_URL=postgresql+asyncpg://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?ssl=require
```

> **Note:** If a standard `postgresql://...` URL is provided, the backend automatically normalizes it to `postgresql+asyncpg://` at runtime.

### Running Migrations:
```bash
cd backend
alembic upgrade head
```

---

## ⚙️ Running Locally

### 1. Start the Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The API is now running at `http://localhost:8000`. Swagger docs available at `http://localhost:8000/docs`.

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
The Next.js dashboard is now running at `http://localhost:3000`.

---

## ⚡ Cloudflare Worker Webhook

The backend exposes the following endpoint for the Cloudflare Email Worker:

```
POST /api/internal/email/incoming
```

- **Headers**:
  - `Content-Type: message/rfc822`
  - `X-Email-From: <sender@example.com>`
  - `X-Email-To: <recipient@yourdomain.com>`
  - `X-Request-Id: <uuid>` (optional)
- **Body**: Raw untouched MIME stream (`message.raw`).

The backend automatically:
1. Matches `recipient` against registered active mailboxes in PostgreSQL.
2. Identifies the user who owns that mailbox.
3. Parses the MIME email, extracts HTML/text content, and attachments metadata.
4. Stores the email into the user's inbox in real-time.
