# SpendWise frontend

Responsive React + Vite frontend for the existing Express/MongoDB API. The
frontend uses the backend for authentication and persistent data; it does not
create a second Supabase data store.

## Run locally

1. Start the backend from `../backend` and make sure its MongoDB, JWT and email
   configuration is set. The API must be reachable at `/api`.
2. From this directory, install dependencies and start Vite:

   ```sh
   npm install
   cp .env.example .env
   npm run dev
   ```

3. If the backend does not listen on `http://localhost:5000`, update
   `VITE_BACKEND_URL` in `.env` to the backend origin. Vite proxies `/api`
   requests during development.
4. Open the local URL printed by Vite. New accounts must be confirmed using
   the code sent to their email before signing in.

For production, serve the frontend and reverse-proxy `/api` to the backend on
the same origin, or configure the hosting platform to provide an equivalent
API proxy. The Express backend does not currently configure cross-origin
requests.

## Features

- Protected routes with backend JWT authentication and persisted sign-in.
- Registration, email confirmation, sign-in, password reset and profile updates.
- Dashboard totals, recent activity, budget status and Recharts visualizations.
- Transaction create/read/update/delete, search, filters, sorting and CSV export.
- Recurring income and expense schedules with frequency, optional start/end dates, next-run status, and cancellation.
- Theme-aware date pickers used consistently across forms, filters, and profile settings.
- Budget and category management with validation and confirmation prompts.
- Suggested income and expense categories for new accounts, with a way for existing users to add them.
- Analytics date ranges, daily/weekly/monthly reports and a downloadable PDF.
- Persistent dark/light mode and responsive navigation.

The backend transaction schema currently supports category, type, amount,
description and date. Payment method and separate notes are not shown because
the API does not persist those fields. Category icons and accent colors are
selected locally from category names; the API currently stores category name
and type only. Analytics category totals are based on up to the latest 100
matching transactions, as limited by the API listing endpoint.

## Project layout

```text
src/
  components/  Shared layout, route guard and UI states
  context/     Authentication and theme state
  hooks/       Reusable async data hook
  lib/         API client, formatting and alerts
  pages/       Dashboard, transactions, budgets, categories, analytics, settings
  pages/auth/  Login, registration and account recovery
```

Routes are lazy-loaded, and the PDF generator is loaded only when exporting.
