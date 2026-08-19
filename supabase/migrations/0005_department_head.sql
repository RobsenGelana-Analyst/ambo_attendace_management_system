-- =============================================================
-- Migration 0005: Link departments to their head employee
-- =============================================================

alter table departments
  add column head_employee_id uuid references employees(id) on delete set null;