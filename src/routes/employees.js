const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabaseClient');

// GET /api/employees - list employees (HR/admin only), optional filters
router.get('/', requireAuth, requireRole('hr', 'admin'), async (req, res) => {
  const { department_id, position_id } = req.query;

  let query = supabaseAdmin.from('employees').select('*');

  if (department_id) query = query.eq('department_id', department_id);
  if (position_id) query = query.eq('position_id', position_id);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/employees/me - current user's own profile
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('employees')
    .select('*')
    .eq('id', req.user.id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/employees - create employee (login + employee record), admin/hr only
router.post('/', requireAuth, requireRole('hr', 'admin'), async (req, res) => {
  const {
    email, password, full_name, employee_id_number,
    department_id, position_id, supervisor_id,
    employment_type, hire_date, phone,
  } = req.body;

  if (!email || !password || !full_name || !employee_id_number || !department_id || !hire_date) {
    return res.status(400).json({
      error: 'email, password, full_name, employee_id_number, department_id, hire_date are required',
    });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (userError) return res.status(400).json({ error: `Could not create login: ${userError.message}` });

  const newUserId = userData.user.id;

  const { data: employee, error: employeeError } = await supabaseAdmin
    .from('employees')
    .insert({
      id: newUserId,
      employee_id_number,
      full_name,
      department_id,
      position_id: position_id || null,
      supervisor_id: supervisor_id || null,
      employment_type: employment_type || 'full_time',
      hire_date,
      phone: phone || null,
    })
    .select()
    .single();

  if (employeeError) {
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    return res.status(400).json({ error: `Could not create employee record: ${employeeError.message}` });
  }

  const { error: roleError } = await supabaseAdmin
    .from('user_roles')
    .insert({ employee_id: newUserId, role: 'employee' });

  if (roleError) {
    return res.status(207).json({ warning: `Employee created but role assignment failed: ${roleError.message}`, employee });
  }

  res.status(201).json({ message: 'Employee created successfully', employee });
});

// PATCH /api/employees/:id - update employee fields, admin/hr only
router.patch('/:id', requireAuth, requireRole('hr', 'admin'), async (req, res) => {
  const { id } = req.params;
  const allowedFields = [
    'full_name', 'department_id', 'position_id', 'supervisor_id',
    'employment_type', 'status', 'phone',
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided to update' });
  }

  const { data, error } = await supabaseAdmin
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/employees/:id - soft delete (sets status to 'terminated'), admin/hr only
router.delete('/:id', requireAuth, requireRole('hr', 'admin'), async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('employees')
    .update({ status: 'terminated' })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Employee deactivated', employee: data });
});

// PATCH /api/employees/:id/assign-head/:departmentId - make this employee head of a department
router.patch('/:id/assign-head/:departmentId', requireAuth, requireRole('hr', 'admin'), async (req, res) => {
  const { id, departmentId } = req.params;

  const { data: employee, error: empError } = await supabaseAdmin
    .from('employees')
    .select('id, full_name')
    .eq('id', id)
    .single();
  if (empError || !employee) return res.status(404).json({ error: 'Employee not found' });

  const { data: dept, error: deptError } = await supabaseAdmin
    .from('departments')
    .update({ head_employee_id: id })
    .eq('id', departmentId)
    .select()
    .single();
  if (deptError) return res.status(500).json({ error: deptError.message });

  const { data: existingRole } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('employee_id', id)
    .eq('role', 'department_head')
    .single();

  if (!existingRole) {
    await supabaseAdmin.from('user_roles').insert({ employee_id: id, role: 'department_head' });
  }

  res.json({ message: `${employee.full_name} is now head of this department`, department: dept });
});

// PATCH /api/employees/:id/unassign-head/:departmentId - remove head-of-department status
router.patch('/:id/unassign-head/:departmentId', requireAuth, requireRole('hr', 'admin'), async (req, res) => {
  const { id, departmentId } = req.params;

  const { data: dept, error } = await supabaseAdmin
    .from('departments')
    .update({ head_employee_id: null })
    .eq('id', departmentId)
    .eq('head_employee_id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!dept) return res.status(404).json({ error: 'This employee is not the head of that department' });

  res.json({ message: 'Department head unassigned', department: dept });
});

// GET /api/employees/me/roles - roles assigned to the current logged-in user
router.get('/me/roles', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('employee_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ roles: (data || []).map((r) => r.role) });
});

module.exports = router;