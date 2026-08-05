# Ambo University Employee Attendance Management System

Backend for the Ambo University employee attendance management system —
Node.js (Express) + PostgreSQL via Supabase.

## Team roles
- **Database design & schema** — see `supabase/migrations/`, `docs/data-dictionary.md`
- **Backend API** — see `src/routes/`, `src/controllers/`
- **Frontend** — separate repo/folder (link here once created)

## Project structure
```
supabase/migrations/     -- SQL migrations, run in order (0001, 0002, ...)
src/config/               -- Supabase client setup
src/middleware/           -- auth + role-check middleware
src/routes/               -- Express route handlers per feature
docs/                     -- data dictionary, ER diagram, notes
```

## Getting started

### 1. Clone and install
```bash
git clone <repo-url>
cd ambo-attendance-system
npm install
```

### 2. Set up Supabase
1. Create a free project at https://supabase.com
2. In the Supabase dashboard, go to **SQL Editor** and run the migration files
   in `supabase/migrations/` **in order** (0001 → 0002 → 0003 → 0004).
   (Or use the Supabase CLI: `supabase db push`.)
3. Copy `.env.example` to `.env` and fill in your project's URL and keys
   (Project Settings → API in the Supabase dashboard).

```bash
cp .env.example .env
```

### 3. Run the server
```bash
npm run dev
```
Server runs at `http://localhost:4000`. Check `GET /health` to confirm it's up.

## Database schema overview
See `docs/data-dictionary.md` for full details. Core tables:
- `colleges`, `departments`, `positions` — org structure
- `employees`, `user_roles` — staff and their access roles
- `shifts`, `employee_shifts` — work schedules
- `attendance_logs`, `attendance_records` — raw punches and daily summary
- `leave_types`, `leave_requests` — leave workflow
- `attendance_monthly_summary` — pre-aggregated reporting table

Row Level Security (RLS) is enabled — employees only see their own data,
department heads see their department, HR/admin see everything. See
`supabase/migrations/0003_rls_policies.sql`.

## Branching workflow for the group
- `main` — stable, always working
- Each member works on a feature branch: `git checkout -b feature/<name>`
- Open a Pull Request into `main` before merging — even for a class project,
  this gives you a clean commit history to show in your defense.

## API routes (in progress)
| Method | Route | Access |
|---|---|---|
| GET | /api/employees | HR/admin |
| GET | /api/employees/me | Self |
| GET | /api/attendance/me | Self |
| POST | /api/attendance/check-in | HR/admin |
| GET | /api/leave/me | Self |
| POST | /api/leave | Self |

More endpoints (check-out, approvals, reports) are marked as `TODO` in the
relevant route files — see comments in `src/routes/`.
