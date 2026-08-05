-- =============================================================
-- Ambo University Employee Attendance Management System
-- Migration 0001: Core schema (org structure, employees, shifts)
-- =============================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ---------- Enum types ----------
create type employment_type as enum ('full_time', 'part_time', 'contract');
create type employee_status as enum ('active', 'on_leave', 'suspended', 'terminated');
create type attendance_status as enum ('present', 'absent', 'late', 'half_day', 'on_leave');
create type attendance_method as enum ('biometric', 'qr', 'manual', 'geo');
create type leave_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type app_role as enum ('admin', 'hr', 'department_head', 'employee');

-- ---------- Helper: auto-update updated_at ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------- Org structure ----------
create table colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (college_id, name)
);

create table positions (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  created_at timestamptz not null default now()
);

-- ---------- Employees ----------
-- Extends Supabase auth.users (1-to-1). auth.users handles login/password.
create table employees (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_id_number text not null unique,
  full_name text not null,
  department_id uuid not null references departments(id) on delete restrict,
  position_id uuid references positions(id) on delete set null,
  supervisor_id uuid references employees(id) on delete set null,
  employment_type employment_type not null default 'full_time',
  status employee_status not null default 'active',
  hire_date date not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_employees_department on employees(department_id);
create index idx_employees_supervisor on employees(supervisor_id);

create trigger trg_employees_updated_at
before update on employees
for each row execute function set_updated_at();

create trigger trg_departments_updated_at
before update on departments
for each row execute function set_updated_at();

create trigger trg_colleges_updated_at
before update on colleges
for each row execute function set_updated_at();

-- ---------- Roles (many-to-many, since e.g. a dept head is also an employee) ----------
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (employee_id, role)
);

create index idx_user_roles_employee on user_roles(employee_id);

-- ---------- Shifts ----------
create table shifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_time time not null,
  end_time time not null,
  days_of_week int[] not null, -- 0=Sunday ... 6=Saturday
  created_at timestamptz not null default now()
);

create table employee_shifts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  shift_id uuid not null references shifts(id) on delete restrict,
  effective_from date not null,
  effective_to date, -- null = still active
  created_at timestamptz not null default now()
);

create index idx_employee_shifts_employee on employee_shifts(employee_id);
