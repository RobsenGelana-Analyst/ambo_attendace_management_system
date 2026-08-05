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

// TODO (owner: HR/employees module teammate):
// POST /api/employees        - create employee (admin/hr)
// PATCH /api/employees/:id   - update employee (admin/hr)
// DELETE /api/employees/:id  - deactivate employee (soft delete via status)

module.exports = router;
