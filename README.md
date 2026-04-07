# Family Savings App

A simple family savings and investing app built with Next.js and Supabase.

## Features

- Username/password login for siblings and admins
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
5. Create password hashes with `npm run hash-password -- "YourPassword"`
6. Insert your family users using the template in [supabase/seed.template.sql](/Users/maximeg/Documents/Python/savings_app/supabase/seed.template.sql)
7. Start the app with `npm run dev`

## Environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`
- `CRON_SECRET`
- `TWELVE_DATA_API_KEY`
- `NEXT_PUBLIC_APP_NAME`

## Suggested deployment

- Frontend + backend app hosting: Vercel Hobby
- Database: Supabase Free
- Daily savings interest: Vercel cron hitting `/api/cron/interest`

## Default sample usernames

- `sibling-one`
- `sibling-two`
- `parents-admin`

Choose your own passwords before launch.
