# Listing endpoints

## Environment setup

Copy `.env.example` to `.env` and set the required values. Generate a unique
JWT signing secret with `openssl rand -hex 32`; never commit `.env`. If a
previous signing secret was exposed, rotate it in every environment. Existing
tokens and email verification/reset codes signed with the old secret will no
longer be valid.

The budget, category, and transaction listing endpoints accept `page` and
`limit` query parameters. They default to page `1` and `10` results per page;
`limit` can be at most `100`. Listings are sorted newest-first for budgets and
transactions, and alphabetically for categories.

| Endpoint | Search | Filters |
| --- | --- | --- |
| `GET /api/budget/listing` | `search` matches period or category name | `categoryId`, `period`, `startDateFrom`, `startDateTo` |
| `GET /api/category/listing` | `search` matches category name | `type` |
| `GET /api/transaction/listing` | `search` matches description | `categoryId`, `type`, `dateFrom`, `dateTo` |

For example: `GET /api/transaction/listing?page=2&limit=5&type=expense&search=coffee`.
Date filters use ISO date values, such as `dateFrom=2026-01-01`.

Each response keeps its existing list property and adds pagination metadata:

```json
{
  "success": true,
  "Transactions": [],
  "pagination": {
    "page": 2,
    "limit": 5,
    "total": 12,
    "totalPages": 3
  }
}
```
# Dashboard API

The authenticated dashboard endpoint is `GET /api/dashboard`. It returns
income, expenses, and balance for the selected date range, the five most recent
transactions in that range, and budget status for budgets overlapping it.
Category details are included with transactions and budgets.

Without date filters, the dashboard shows the current calendar month through
today. You can optionally pass ISO dates to select a range:

```text
GET /api/dashboard?dateFrom=2026-10-01&dateTo=2026-10-29
```

`dateTo` includes the entire date when supplied as `YYYY-MM-DD`. The response
includes the effective period, a `summary`, `recentTransactions`, and
`budgetStatus`. Budget spending is measured within the selected range and the
budget's own start/end dates. Budgets without a category are compared against
all expenses.

`GET /api/dashboard/summary` returns only the period and summary totals.

# Reports API

The authenticated reports endpoint groups income and expenses into daily,
weekly, or monthly summaries:

```text
GET /api/reports/summary?period=daily
GET /api/reports/summary?period=weekly
GET /api/reports/summary?period=monthly
```

By default, daily reports cover the last 30 days, weekly reports cover the
last 12 weeks, and monthly reports cover the last 12 months. Use optional
`dateFrom` and `dateTo` ISO date parameters to select a custom range. The
response includes totals for the whole range and a summary for each period
containing transactions.

# Budget usage

Budget create, detail, update, and listing responses include calculated
`spent`, `remaining`, `percentUsed`, and `status` fields. Spending includes
expenses in the budget date range through today. A budget with a category only
counts expenses in that category; a budget without one counts all expenses.

# Profile API

Authenticated users can fetch and update their account details:

```text
GET /api/profile
PUT /api/profile
```

The update endpoint accepts any combination of `firstName`, `lastName`,
`email`, `dob`, `phoneNumber`, and `gender`. To change a password, include both
`currentPassword` and `password`. Passwords must be at least 8 characters.

# Password reset

Request a six-digit reset code by email, then submit it with the account email
and new password:

```text
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

Configure SMTP using the variables in `.env.example`. `SMTP_HOST`, `SMTP_USER`,
and `SMTP_PASS` are required. `SMTP_PORT` defaults to `587`; set
`SMTP_SECURE=true` for implicit TLS. `MAIL_FROM` is optional and defaults to
`SMTP_USER`. Reset codes expire after 5 minutes, allow up to five attempts, and
can only be used once.

# Email confirmation

Registration sends a six-digit confirmation code to the supplied email:

```text
POST /api/auth/register
POST /api/auth/verify-email
POST /api/auth/resend-verification
```

Send the same email and the code received in the verification email to
`/api/auth/verify-email`. Codes expire after 5 minutes and allow up to five
attempts. A new code can be requested once per minute, up to three times per
hour. Users must confirm their email before logging in.

New accounts receive suggested income and expense categories, including
Groceries, Transport, Bills & utilities, Salary, Freelance, and Investments.
Existing users can add any missing suggestions from the Categories page.

# Logout and budget alerts

Log out by sending the current access token to the authenticated endpoint:

```text
POST /api/auth/logout
Authorization: Bearer <token>
```

The token is revoked immediately. Revocation records expire automatically when
the token expires. Users receive an email when expenses bring an active budget
to 80% usage or exceed its limit. Budget alert emails use the SMTP settings
listed in `.env.example`.

Delete the signed-in user's account with `DELETE /api/auth/deleteAccount`.
This endpoint requires a bearer token and the current password in the request
body; it does not accept an account identifier from the request body.

# Recurring transactions

Create and manage recurring income or expense schedules through the authenticated
API:

```text
POST /api/recurring-transactions
GET /api/recurring-transactions
DELETE /api/recurring-transactions/:id
```

Create a schedule with `categoryId`, `type`, `amount`, `frequency`
(`daily`, `weekly`, `monthly`, or `yearly`), and `startDate`. The first
transaction is scheduled one frequency interval after `startDate`. `description`
and `endDate` are optional; when provided, the end date must include at least
the first scheduled transaction. The server checks for due schedules every
minute and adds each occurrence to the normal transaction history. Deleting a
schedule cancels future occurrences without deleting transactions already
recorded.

Example request:

```json
{
  "categoryId": "507f1f77bcf86cd799439011",
  "type": "expense",
  "amount": 1200,
  "description": "Monthly rent",
  "frequency": "monthly",
  "startDate": "2026-11-01T09:00:00.000Z",
  "endDate": "2027-10-01T09:00:00.000Z"
}
```