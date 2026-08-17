# Ambo University Attendance — Frontend

Plain HTML/CSS/JavaScript client for the Ambo University attendance
management system. No framework or build step — talks directly to the
backend API via `fetch()`.

## Structure

index.html -- login page (entry point)
assets/
logo.png -- Ambo University crest
css/
style.css -- all styling (navy/gold theme, responsive sidebar)
js/
config.js -- Supabase URL/key + backend API base URL
common.js -- shared auth check, logout, apiCall() helper, mobile nav toggle
app.js -- login page logic (role selection + Supabase auth)
dashboard.js -- employee: today's check-in/out
history.js -- employee: attendance history
leave.js -- employee: submit leave request
my-requests.js -- employee: view own leave requests
admin.js -- admin: employee list, deactivate, assign dept. head
admin-department.js -- admin: department attendance view
admin-reports.js -- admin: monthly attendance report
admin-leave.js -- admin: leave request approval/rejection
admin-register.js -- admin: register new employee
head.js -- department head: scoped attendance + leave view
pages/
dashboard.html, history.html, leave.html, my-requests.html -- employee pages
admin.html, admin-department.html, admin-reports.html,
admin-leave.html, admin-register.html -- admin pages
head.html -- department head page

## Setup

1. Open `js/config.js` and confirm these values match your Supabase project
   and running backend:
```js
   const SUPABASE_URL = "https://<your-project-ref>.supabase.co";
   const SUPABASE_ANON_KEY = "<your anon key>";
   const API_BASE = "http://localhost:4000/api";
```
2. Make sure the backend server is running (`npm run dev` in the backend
   folder) before using the frontend.
3. Open `index.html` directly in a browser (no build step or dev server
   required).

## Login roles

The login page has a 3-way toggle: **Employee / Dept. Head / Admin**. On
submit, the frontend checks the logged-in user's actual roles (via
`GET /api/employees/me/roles`) against the selected option before allowing
access — selecting a role the account doesn't hold shows an error, it does
not grant access. This mirrors (but does not replace) the backend's own
role checks on every protected route.

| Toggle selection | Requires role | Lands on |
|---|---|---|
| Employee | any account | `pages/dashboard.html` |
| Dept. Head | `department_head`, `hr`, or `admin` | `pages/head.html` |
| Admin | `hr` or `admin` | `pages/admin.html` |

## Notes
- All pages under `pages/` check for a stored auth token on load
  (`js/common.js`) and redirect to the login page if missing.
- The sidebar collapses into a hamburger-triggered slide-in drawer below
  800px width.
- Status values (present/late/absent/on_leave, pending/approved/rejected)
  render as color-coded pill badges — see `.badge-*` classes in `style.css`.
  