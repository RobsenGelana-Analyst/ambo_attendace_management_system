# Data Dictionary — Ambo University Employee Attendance Management System

## colleges
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | unique |
| created_at / updated_at | timestamptz | |

## departments
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| college_id | uuid FK → colleges | |
| name | text | unique per college |

## positions
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| title | text | unique, e.g. "Lecturer" |

## employees
| Column | Type | Notes |
|---|---|---|
| id | uuid PK, FK → auth.users | 1-to-1 with Supabase auth user |
| employee_id_number | text | unique staff ID |
| full_name | text | |
| department_id | uuid FK → departments | |
| position_id | uuid FK → positions | nullable |
| supervisor_id | uuid FK → employees | self-referencing, nullable |
| employment_type | enum | full_time / part_time / contract |
| status | enum | active / on_leave / suspended / terminated |
| hire_date | date | |

## user_roles
| Column | Type | Notes |
|---|---|---|
| employee_id | uuid FK → employees | |
| role | enum | admin / hr / department_head / employee |

Many-to-many: an employee can hold multiple roles (e.g. department_head + employee).

## shifts / employee_shifts
Defines standard work schedules and which employee is on which shift, with an
effective date range (`effective_from` / `effective_to`) so shift changes are tracked historically.

## attendance_logs
Raw punch events (multiple per day possible — e.g. break check-out/in). Feeds into `attendance_records`.

## attendance_records
The daily summary table reports and dashboards query directly.
| Column | Type | Notes |
|---|---|---|
| employee_id | uuid FK | |
| date | date | one row per employee per day — `unique(employee_id, date)` |
| check_in_time / check_out_time | timestamptz | nullable |
| status | enum | present / absent / late / half_day / on_leave |
| method | enum | biometric / qr / manual / geo |
| marked_by | uuid FK → employees | who recorded it (accountability) |

## leave_types / leave_requests
Leave requests reference a leave type and go through a status workflow
(pending → approved/rejected/cancelled), with `approved_by` recording who acted on it.

## attendance_monthly_summary
Pre-aggregated per-employee, per-month counts (present/absent/late/on_leave days).
Intended to be refreshed by a scheduled job (e.g. Supabase `pg_cron`) rather than
computed live on every dashboard load.

---

## Security model (RLS)
- Employees can only read their own `employees`, `attendance_records`, `attendance_logs`, and `leave_requests` rows.
- `department_head` role can read records for employees in their own department.
- `hr` and `admin` roles have full read access; only `hr`/`admin` can write to `employees` and `attendance_records`.
- Employees can insert their own `leave_requests` but cannot approve them.
- Only `admin` can manage `user_roles`.
