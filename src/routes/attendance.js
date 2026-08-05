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

// TODO (owner: attendance module teammate):
// POST /api/attendance/check-out
// GET  /api/attendance/department/:departmentId  (for department heads)
// GET  /api/attendance/reports/monthly           (summary reports)

module.exports = router;
