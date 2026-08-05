const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
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

// TODO (owner: leave module teammate):
// PATCH /api/leave/:id/approve  (department_head/hr/admin only)
// PATCH /api/leave/:id/reject

module.exports = router;
