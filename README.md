# Education Payments

A small, mobile-first payment ledger for an education centre. It uses Fastify, SQLite, React, Tailwind, React Hook Form, Zod and TanStack Query.

## Getting started

Prerequisite: Node.js 20 or newer.

```bash
git clone <repository-url>
cd education-payments
npm install
npm run seed
npm run dev
```

The API runs at `http://localhost:3001` and the web app at `http://localhost:5173`. Run `npm test` for the API tests. For a production build use `npm run build && npm start` (the API then listens on port 3001).

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST, GET | `/students` | Create/list students (`?search=` searches name, phone, group) |
| GET, PATCH, DELETE | `/students/:id` | Read, update, delete a student |
| POST | `/payments` | Add a payment |
| GET | `/students/:id/payments` | Payment history, newest first |
| GET | `/debtors?month=YYYY-MM` | Debtors for a month |

```bash
curl -X POST http://localhost:3001/students -H "content-type: application/json" \
  -d '{"name":"Ali Valiyev","phone":"90 (123) 45-67","group":"Frontend","monthlyFee":1200000}'

curl -X POST http://localhost:3001/payments -H "content-type: application/json" \
  -d '{"studentId":1,"amount":500000,"date":"2026-10-15"}'
curl 'http://localhost:3001/debtors?month=2026-10'
```

Student responses use `group` and `monthlyFee`. A debtor item is `{ studentId, name, phone, group, monthlyFee, paid, debt }`. Errors consistently use:

```json
{"error":{"code":"VALIDATION_ERROR","message":"Ma'lumotlarni tekshiring","fields":{"amount":"Summa 0 dan katta bo'lishi kerak"}}}
```

## Debtor rules

Payments are summed only from the requested calendar month, including its first and last day. Students without payments remain in the list. A student is excluded when paid amount is equal to or higher than their monthly fee, and when their `created_at` month is later than the requested month. Results sort by greatest debt. An omitted month uses Asia/Tashkent's current month; invalid or impossible month strings return HTTP 400. Money is always integer UZS, never floating point.

## What I'd improve with one more week

- Authentication and role-based access.
- Payment editing, cancellation and audit log.
- Pagination, server-side group filtering and Excel exports.
- Telegram payment reminders and PostgreSQL/Docker deployment.
- Playwright end-to-end and accessibility tests.

## Not done / known limitations

The project intentionally has no authentication because it is outside the assignment scope. A production version would add server-side password hashing, signed HTTP-only session cookies, rate limiting, and role-based permissions.
