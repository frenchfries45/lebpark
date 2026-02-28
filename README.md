# PARKleb — Parking Subscription Manager

A clean, self-hosted parking subscription management app built with React + TypeScript + Supabase. **No Lovable dependency.**

## Features

- Subscriber management (add, edit, delete)
- Payment tracking with history and edits
- Automatic paid/pending/overdue status
- Monthly stats with historical month selector
- 7-day activity log
- WhatsApp & SMS bulk/individual reminders
- Full Arabic (RTL) + English support
- Admin/employee roles (create users, reset passwords)
- PWA installable on mobile

## Tech Stack

React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Supabase · TanStack Query · i18next

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure Supabase

Copy `.env.example` to `.env` and fill in your project credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 3. Run DB migrations

In Supabase SQL editor, run the `.sql` files in `supabase/migrations/` in chronological order.

### 4. Deploy Edge Functions

```bash
supabase functions deploy send-sms
supabase functions deploy create-user
supabase functions deploy reset-password
```

### 5. Run locally

```bash
npm run dev
```

### 6. Build & Deploy

```bash
npm run build   # outputs to dist/
```

Deploy `dist/` to Vercel, Netlify, or Cloudflare Pages.

## Project Structure

```
src/
├── components/          # UI components + dialogs
├── hooks/               # Data fetching hooks (Supabase)
├── integrations/        # Supabase client + DB types
├── locales/             # en.json + ar.json translations
├── pages/               # Index, Auth, Install
└── types/               # TypeScript types

supabase/
├── migrations/          # DB schema SQL files
└── functions/           # Edge functions (SMS, user management)
```
