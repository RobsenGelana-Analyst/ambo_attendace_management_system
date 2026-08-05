-- =============================================================
-- Migration 0003: Row Level Security policies
-- =============================================================

-- ---------- Helper: get current employee's role(s) ----------
create or replace function has_role(check_role app_role)
returns boolean as $$
  select exists (
    select 1 from user_roles
    where employee_id = auth.uid()
    and role = check_role
  );
$$ language sql stable;

create or replace function is_own_department(target_department_id uuid)
returns boolean as $$
  select exists (
    select 1 from employees
    where id = auth.uid()
    and department_id = target_department_id
  );
$$ language sql stable;

-- ---------- Enable RLS ----------
alter table employees enable row level security;
alter table attendance_records enable row level security;
alter table attendance_logs enable row level security;
alter table leave_requests enable row level security;
alter table user_roles enable row level security;

-- ---------- employees ----------
create policy "Employees can view own record"
on employees for select
using (id = auth.uid());

create policy "Department heads can view their department"
on employees for select
using (
  has_role('department_head') and is_own_department(department_id)
);

create policy "HR and admin can view all employees"
on employees for select
using (has_role('hr') or has_role('admin'));

create policy "Only HR/admin can insert or update employees"
on employees for all
using (has_role('hr') or has_role('admin'))
with check (has_role('hr') or has_role('admin'));

-- ---------- attendance_records ----------
create policy "Employees can view own attendance"
on attendance_records for select
using (employee_id = auth.uid());

create policy "Department heads can view department attendance"
on attendance_records for select
using (
  has_role('department_head') and
  exists (
    select 1 from employees e
    where e.id = attendance_records.employee_id
    and is_own_department(e.department_id)
  )
);

create policy "HR and admin can view all attendance"
on attendance_records for select
using (has_role('hr') or has_role('admin'));

-- Only HR/admin (or an automated service role) can write attendance directly.
-- Employees should never be able to mark their own attendance via a raw update.
create policy "Only HR/admin can modify attendance"
on attendance_records for all
using (has_role('hr') or has_role('admin'))
with check (has_role('hr') or has_role('admin'));

-- ---------- attendance_logs ----------
create policy "Employees can view own logs"
on attendance_logs for select
using (employee_id = auth.uid());

create policy "HR and admin can view all logs"
on attendance_logs for select
using (has_role('hr') or has_role('admin'));

-- ---------- leave_requests ----------
create policy "Employees can view and create own leave requests"
on leave_requests for select
using (employee_id = auth.uid());

create policy "Employees can insert own leave requests"
on leave_requests for insert
with check (employee_id = auth.uid());

create policy "Department heads can view department leave requests"
on leave_requests for select
using (
  has_role('department_head') and
  exists (
    select 1 from employees e
    where e.id = leave_requests.employee_id
    and is_own_department(e.department_id)
  )
);

create policy "HR/admin manage all leave requests"
on leave_requests for all
using (has_role('hr') or has_role('admin'))
with check (has_role('hr') or has_role('admin'));

-- ---------- user_roles ----------
create policy "Users can view own roles"
on user_roles for select
using (employee_id = auth.uid());

create policy "Only admin manages roles"
on user_roles for all
using (has_role('admin'))
with check (has_role('admin'));
