const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabaseClient');

// GET /api/employees - list employees (HR/admin only)
router.get('/', requireAuth, requireRole('hr', 'admin'), async (req, res) => {
  const { data, error } = await supabaseAdmin.from('employees').select('*');
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

module.exports = router;