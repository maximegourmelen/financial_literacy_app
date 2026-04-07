# Family Savings App

A simple family savings and investing app built with Next.js and Supabase.

## Features

- Supabase Auth login for siblings and admins
- HKD checking, savings, and investments cash balances
- Immutable ledger for all cash movements
- Daily compounded savings interest
- Buy/sell flow for a starter set of ETFs, stocks, and crypto
- Admin portal for balances, recent activity, and savings-rate management

## Quick start

1. Install dependencies with `npm install`
2. Copy `.env.example` to `.env.local`
3. Create a Supabase project
4. Run the SQL in [supabase/schema.sql](/Users/maximeg/Documents/Python/savings_app/supabase/schema.sql)
5. Start the app with `npm run dev`
6. Create the parent account from `/admin/setup`
7. Create sibling accounts from `/signup`

## Environment variables

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `ADMIN_SETUP_CODE`
- `TWELVE_DATA_API_KEY`
- `NEXT_PUBLIC_APP_NAME`

## Suggested deployment

- Frontend + backend app hosting: Vercel Hobby
- Database: Supabase Free
- Daily savings interest: Vercel cron hitting `/api/cron/interest`

## Account setup

- Parent/admin: use `/admin/setup` with the secret code in `ADMIN_SETUP_CODE`
- Siblings: use `/signup` to create up to two child accounts
