const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabaseClient');

// GET /api/attendance/me - current employee's own attendance history
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('attendance_records')
    .select('*')
    .eq('employee_id', req.user.id)
    .order('date', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/attendance/check-in - log a check-in (HR/admin or trusted device integration)
router.post('/check-in', requireAuth, requireRole('hr', 'admin'), async (req, res) => {
  const { employee_id, method = 'manual' } = req.body;
  if (!employee_id) return res.status(400).json({ error: 'employee_id is required' });

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('attendance_records')
    .upsert(
      {
        employee_id,
        date: today,
        check_in_time: now,
        status: 'present',
        method,
        marked_by: req.user.id,
      },
      { onConflict: 'employee_id,date' }
    )
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/attendance/check-out - log a check-out for today's attendance record
router.post('/check-out', requireAuth, requireRole('hr', 'admin'), async (req, res) => {
  const { employee_id } = req.body;
  if (!employee_id) return res.status(400).json({ error: 'employee_id is required' });

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const { data: existing, error: findError } = await supabaseAdmin
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employee_id)
    .eq('date', today)
    .single();

  if (findError || !existing) {
    return res.status(400).json({ error: 'No check-in found for today' });
  }

  if (existing.check_out_time) {
    return res.status(400).json({ error: 'Already checked out today' });
  }

  const { data, error } = await supabaseAdmin
    .from('attendance_records')
    .update({ check_out_time: now })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/attendance/department/:departmentId - attendance for everyone in a department
router.get('/department/:departmentId', requireAuth, async (req, res) => {
  const { departmentId } = req.params;

  const { data: rolesData, error: rolesError } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('employee_id', req.user.id);

  if (rolesError) return res.status(500).json({ error: rolesError.message });

  const roles = (rolesData || []).map((r) => r.role);
  const isHrOrAdmin = roles.includes('hr') || roles.includes('admin');
  const isDepartmentHead = roles.includes('department_head');

  if (!isHrOrAdmin && !isDepartmentHead) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  // If they're only a department_head (not hr/admin), confirm it's THEIR department
  if (!isHrOrAdmin && isDepartmentHead) {
    const { data: dept, error: deptError } = await supabaseAdmin
      .from('departments')
      .select('head_employee_id')
      .eq('id', departmentId)
      .single();

    if (deptError || !dept) {
      return res.status(404).json({ error: 'Department not found' });
    }

    if (dept.head_employee_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not the head of this department' });
    }
  }

  const { data, error } = await supabaseAdmin
    .from('attendance_records')
    .select('*, employees!attendance_records_employee_id_fkey(id, full_name, department_id)')
    .eq('employees.department_id', departmentId)
    .order('date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});


// GET /api/attendance/reports/monthly?year=2026&month=8 - monthly attendance summary per employee
router.get('/reports/monthly', requireAuth, requireRole('hr', 'admin'), async (req, res) => {
  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({ error: 'year and month query params are required (e.g. ?year=2026&month=8)' });
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDateObj = new Date(year, month, 0); // day 0 of next month = last day of this month
  const endDate = endDateObj.toISOString().slice(0, 10);

  const { data: records, error } = await supabaseAdmin
    .from('attendance_records')
    .select('employee_id, status, employees!attendance_records_employee_id_fkey(full_name)')
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) return res.status(500).json({ error: error.message });

  const summary = {};

  for (const record of records) {
    const id = record.employee_id;

    if (!summary[id]) {
      summary[id] = {
        employee_id: id,
        full_name: record.employees?.full_name || 'Unknown',
        days_present: 0,
        days_absent: 0,
        days_late: 0,
        days_on_leave: 0,
      };
    }

    if (record.status === 'present') summary[id].days_present++;
    else if (record.status === 'absent') summary[id].days_absent++;
    else if (record.status === 'late') summary[id].days_late++;
    else if (record.status === 'on_leave') summary[id].days_on_leave++;
  }

  res.json({
    year: Number(year),
    month: Number(month),
    employees: Object.values(summary),
  });
});

module.exports = router;