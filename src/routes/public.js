const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabaseClient');

// GET /api/public/departments - list departments for the registration form dropdown
router.get('/departments', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('departments')
    .select('id, name, colleges(name)')
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/public/positions - list positions for the registration form dropdown
router.get('/positions', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('positions').select('id, title').order('title');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/public/leave-types - list leave types for the leave request form dropdown
router.get('/leave-types', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('leave_types').select('id, name').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/public/register - create a login user + employee record in one step
// NOTE: this is for local testing/demo purposes (seeding test data via a form).
// In a real deployment, employee creation should be restricted to HR/admin (see src/routes/employees.js).
router.post('/register', async (req, res) => {
  const {
    email,
    password,
    full_name,
    employee_id_number,
    department_id,
    position_id,
    hire_date,
    phone,
  } = req.body;

  if (!email || !password || !full_name || !employee_id_number || !department_id || !hire_date) {
    return res.status(400).json({
      error: 'email, password, full_name, employee_id_number, department_id, hire_date are required',
    });
  }

  // 1. Create the auth user (this is what they'll log in with)
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError) {
    return res.status(400).json({ error: `Could not create login: ${userError.message}` });
  }

  const newUserId = userData.user.id;

  // 2. Create the employee record linked to that auth user
  const { data: employee, error: employeeError } = await supabaseAdmin
    .from('employees')
    .insert({
      id: newUserId,
      employee_id_number,
      full_name,
      department_id,
      position_id: position_id || null,
      hire_date,
      phone: phone || null,
    })
    .select()
    .single();

  if (employeeError) {
    // Roll back the auth user so we don't leave an orphaned login with no employee record
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    return res.status(400).json({ error: `Could not create employee record: ${employeeError.message}` });
  }

  // 3. Assign the default 'employee' role
  const { error: roleError } = await supabaseAdmin
    .from('user_roles')
    .insert({ employee_id: newUserId, role: 'employee' });

  if (roleError) {
    return res.status(207).json({
      warning: `Employee created but role assignment failed: ${roleError.message}`,
      employee,
    });
  }

  res.status(201).json({ message: 'Employee registered successfully', employee });
});

module.exports = router;