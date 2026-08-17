# Ambo University Employee Attendance Management System — Backend

Backend for the Ambo University employee attendance management system —
Node.js (Express) + PostgreSQL via Supabase.

## Tech stack
- **Runtime**: Node.js + Express
- **Database**: Supabase (hosted PostgreSQL)
- **Auth**: Supabase Auth (JWT-based)
- **Dev tool**: nodemon (auto-restart on file changes)

## Project structure
supabase/migrations/ -- SQL migrations, run in order (0001, 0002, ...)
src/config/ -- Supabase client setup
src/middleware/ -- auth + role-check middleware
src/routes/ -- Express route handlers per feature
frontend/ -- plain HTML/CSS/JS client (see frontend/README.md)
docs/ -- data dictionary, ER diagram, notes

## Getting started

### 1. Clone and install
```bash
git clone <repo-url>
cd ambo_attendace_management_system
npm install
```

### 2. Set up Supabase
1. Get added as a collaborator on the shared Supabase project, or create your own for local dev.
2. Copy `.env.example` to `.env` and fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPABASE_ANON_KEY` (Project Settings → API in the Supabase dashboard).
3. All migrations in `supabase/migrations/` have already been run on the shared project.
   If setting up a fresh project, run them in order via the SQL Editor.

```bash
cp .env.example .env
```

### 3. Run the server
```bash
npm run dev
```
Server runs at `http://localhost:4000`. Check `GET /health` to confirm it's up.

## Roles
Stored in `user_roles` (many-to-many — an employee can hold multiple roles):
- `employee` — default role, self-service check-in/out, own attendance/leave history
- `department_head` — everything an employee can do, plus scoped visibility into
  their own department's attendance and leave requests (enforced via
  `departments.head_employee_id`, not just the role alone)
- `hr` / `admin` — full access across all departments/employees

## API routes

### Auth / public
| Method | Route | Access |
|---|---|---|
| GET | /health | Public |
| GET | /api/public/departments | Public |
| GET | /api/public/positions | Public |
| GET | /api/public/leave-types | Public |
| POST | /api/public/register | Public (demo/testing use — see note in `public.js`) |

### Employees
| Method | Route | Access |
|---|---|---|
| GET | /api/employees | HR/admin (filters: `department_id`, `position_id`) |
| GET | /api/employees/me | Self |
| GET | /api/employees/me/roles | Self |
| POST | /api/employees | HR/admin |
| PATCH | /api/employees/:id | HR/admin |
| DELETE | /api/employees/:id | HR/admin (soft delete — sets status to `terminated`) |
| PATCH | /api/employees/:id/assign-head/:departmentId | HR/admin |
| PATCH | /api/employees/:id/unassign-head/:departmentId | HR/admin |

### Attendance
| Method | Route | Access |
|---|---|---|
| GET | /api/attendance/me | Self |
| POST | /api/attendance/check-in | Self (self-service) |
| POST | /api/attendance/check-out | Self (self-service) |
| GET | /api/attendance/department/:departmentId | HR/admin, or that department's head |
| GET | /api/attendance/reports/monthly | HR/admin (query: `year`, `month`, optional `department_id`) |

### Leave
| Method | Route | Access |
|---|---|---|
| GET | /api/leave/me | Self |
| POST | /api/leave | Self |
| GET | /api/leave | HR/admin (filters: `status`) |
| GET | /api/leave/department/:departmentId | HR/admin, or that department's head |
| PATCH | /api/leave/:id/approve | HR/admin/department_head |
| PATCH | /api/leave/:id/reject | HR/admin/department_head |

## Database schema overview
See `docs/data-dictionary.md` for full details. Core tables:
- `colleges`, `departments`, `positions` — org structure (seeded with real Ambo
  University data — see `supabase/migrations/0006_seed_org_structure.sql`)
- `employees`, `user_roles` — staff and their access roles
- `shifts`, `employee_shifts` — work schedules
- `attendance_logs`, `attendance_records` — raw punches and daily summary
- `leave_types`, `leave_requests` — leave workflow
- `attendance_monthly_summary` — pre-aggregated reporting table (not currently
  used — monthly reports are computed live from `attendance_records` instead)

Row Level Security (RLS) is enabled on the database, but the backend connects
using the Supabase **service role key**, which bypasses RLS. Access control is
enforced in application code instead (`src/middleware/auth.js` +
per-route role checks) — this is intentional: the backend is the sole point of
database access, so RLS is a secondary safety net rather than the primary
enforcement mechanism.

## Known limitations
- `attendance_monthly_summary` exists in the schema but isn't populated by a
  scheduled job — monthly reports are computed on-demand instead.
- `POST /api/public/register` is unauthenticated and intended for local
  testing/demo seeding only — production employee creation should go through
  `POST /api/employees` (HR/admin only).

## Branching workflow
- `main` — stable, always working
- Each member works on a feature branch: `git checkout -b feature/<name>`
- Open a Pull Request into `main` before merging.