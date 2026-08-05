-- =============================================================
-- Migration 0004: Reference/seed data
-- (leave types, positions, sample shift — safe to run once)
-- =============================================================

insert into leave_types (name, paid) values
  ('Annual Leave', true),
  ('Sick Leave', true),
  ('Maternity Leave', true),
  ('Paternity Leave', true),
  ('Unpaid Leave', false)
on conflict (name) do nothing;

insert into positions (title) values
  ('Lecturer'),
  ('Assistant Lecturer'),
  ('Registrar Officer'),
  ('IT Support'),
  ('Administrative Assistant'),
  ('Department Head'),
  ('HR Officer')
on conflict (title) do nothing;

insert into shifts (name, start_time, end_time, days_of_week) values
  ('Standard Day Shift', '08:30', '17:30', '{1,2,3,4,5}') -- Mon-Fri
on conflict do nothing;
