-- =============================================================
-- Migration 0002: Attendance records, raw logs, leave management
-- =============================================================

-- ---------- Raw punch logs (optional but recommended) ----------
-- Every individual check-in/check-out event, e.g. from a biometric device.
create table attendance_logs (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  punch_time timestamptz not null default now(),
  punch_type text not null check (punch_type in ('check_in', 'check_out')),
  method attendance_method not null default 'manual',
  device_id text,
  created_at timestamptz not null default now()
);

create index idx_attendance_logs_employee_time on attendance_logs(employee_id, punch_time);

-- ---------- Daily attendance summary (what reports/dashboards query) ----------
create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  date date not null,
  check_in_time timestamptz,
  check_out_time timestamptz,
  status attendance_status not null default 'absent',
  method attendance_method not null default 'manual',
  marked_by uuid references employees(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, date)
);

create index idx_attendance_records_employee_date on attendance_records(employee_id, date);
create index idx_attendance_records_date on attendance_records(date);

create trigger trg_attendance_records_updated_at
before update on attendance_records
for each row execute function set_updated_at();

-- ---------- Leave management ----------
create table leave_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  paid boolean not null default true
);

create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  leave_type_id uuid not null references leave_types(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  reason text,
  status leave_status not null default 'pending',
  approved_by uuid references employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index idx_leave_requests_employee on leave_requests(employee_id, status);

create trigger trg_leave_requests_updated_at
before update on leave_requests
for each row execute function set_updated_at();

-- ---------- Monthly summary (refreshed via scheduled job / pg_cron) ----------
create table attendance_monthly_summary (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  days_present int not null default 0,
  days_absent int not null default 0,
  days_late int not null default 0,
  days_on_leave int not null default 0,
  updated_at timestamptz not null default now(),
  unique (employee_id, year, month)
);
