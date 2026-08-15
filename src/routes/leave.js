const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabaseClient');

// GET /api/leave/me - current employee's leave requests
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('leave_requests')
    .select('*, leave_types(name)')
    .eq('employee_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/leave - leave requests (hr/admin see all; department_head sees only their own department)
router.get('/', requireAuth, requireRole('hr', 'admin', 'department_head'), async (req, res) => {
  const { status } = req.query;

  const { data: rolesData } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('employee_id', req.user.id);

  const roles = (rolesData || []).map((r) => r.role);
  const isHrOrAdmin = roles.includes('hr') || roles.includes('admin');

  let query = supabaseAdmin
    .from('leave_requests')
    .select('*, leave_types(name), employees!inner!leave_requests_employee_id_fkey(full_name, department_id)')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  if (!isHrOrAdmin) {
    // department_head only - restrict to their own department
    const { data: dept } = await supabaseAdmin
      .from('departments')
      .select('id')
      .eq('head_employee_id', req.user.id)
      .single();

    if (!dept) return res.status(403).json({ error: 'You are not assigned as a department head' });

    query = query.eq('employees.department_id', dept.id);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/leave/department/:departmentId - leave requests for one department
router.get('/department/:departmentId', requireAuth, async (req, res) => {
  const { departmentId } = req.params;

  const { data: rolesData } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('employee_id', req.user.id);

  const roles = (rolesData || []).map((r) => r.role);
  const isHrOrAdmin = roles.includes('hr') || roles.includes('admin');
  const isDepartmentHead = roles.includes('department_head');

  if (!isHrOrAdmin && !isDepartmentHead) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  if (!isHrOrAdmin) {
    const { data: dept } = await supabaseAdmin
      .from('departments')
      .select('head_employee_id')
      .eq('id', departmentId)
      .single();

    if (!dept || dept.head_employee_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not the head of this department' });
    }
  }

  const { data, error } = await supabaseAdmin
    .from('leave_requests')
    .select('*, leave_types(name), employees!inner!leave_requests_employee_id_fkey(full_name, department_id)')
    .eq('employees.department_id', departmentId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/leave - submit a new leave request
router.post('/', requireAuth, async (req, res) => {
  const { leave_type_id, start_date, end_date, reason } = req.body;
  if (!leave_type_id || !start_date || !end_date) {
    return res.status(400).json({ error: 'leave_type_id, start_date, end_date are required' });
  }

  const { data, error } = await supabaseAdmin
    .from('leave_requests')
    .insert({ employee_id: req.user.id, leave_type_id, start_date, end_date, reason })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/leave/:id/approve - approve a pending leave request
router.patch('/:id/approve', requireAuth, requireRole('department_head', 'hr', 'admin'), async (req, res) => {
  const { id } = req.params;

  const { data: existing, error: findError } = await supabaseAdmin
    .from('leave_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (findError || !existing) return res.status(404).json({ error: 'Leave request not found' });
  if (existing.status !== 'pending') {
    return res.status(400).json({ error: `Cannot approve a request with status '${existing.status}'` });
  }

  const { data, error } = await supabaseAdmin
    .from('leave_requests')
    .update({ status: 'approved', approved_by: req.user.id })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/leave/:id/reject - reject a pending leave request
router.patch('/:id/reject', requireAuth, requireRole('department_head', 'hr', 'admin'), async (req, res) => {
  const { id } = req.params;

  const { data: existing, error: findError } = await supabaseAdmin
    .from('leave_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (findError || !existing) return res.status(404).json({ error: 'Leave request not found' });
  if (existing.status !== 'pending') {
    return res.status(400).json({ error: `Cannot reject a request with status '${existing.status}'` });
  }

  const { data, error } = await supabaseAdmin
    .from('leave_requests')
    .update({ status: 'rejected', approved_by: req.user.id })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;