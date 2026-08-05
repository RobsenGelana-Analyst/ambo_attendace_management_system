const { supabaseAdmin } = require('../config/supabaseClient');

/**
 * Verifies the Supabase JWT sent from the frontend (Authorization: Bearer <token>)
 * and attaches the authenticated user to req.user.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization token' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = data.user;
  next();
}

/**
 * Restricts access to specific roles. Usage: requireRole('admin', 'hr')
 * Assumes req.user is already set by requireAuth.
 */
function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('employee_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: 'Could not verify role' });
    }

    const roles = (data || []).map((r) => r.role);
    const allowed = roles.some((r) => allowedRoles.includes(r));

    if (!allowed) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

module.exports = { requireAuth, requireRole };
