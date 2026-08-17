let selectedRole = 'employee';

document.querySelectorAll('.toggle-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.toggle-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    selectedRole = btn.dataset.role;
  });
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('errorMsg');
  errorMsg.textContent = '';

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      errorMsg.textContent = data.error_description || data.msg || 'Login failed';
      return;
    }

    const token = data.access_token;

    const meRes = await fetch(`${API_BASE}/employees/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await meRes.json();

    const rolesRes = await fetch(`${API_BASE}/employees/me/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const rolesData = await rolesRes.json();
    const roles = rolesData.roles || [];

    const isDeptHeadCapable = roles.some((r) => ['department_head', 'hr', 'admin'].includes(r));
    const isAdminCapable = roles.some((r) => ['hr', 'admin'].includes(r));

    if (selectedRole === 'admin' && !isAdminCapable) {
      errorMsg.textContent = 'This account does not have admin access.';
      return;
    }
    if (selectedRole === 'department_head' && !isDeptHeadCapable) {
      errorMsg.textContent = 'This account is not a department head.';
      return;
    }

    localStorage.setItem('access_token', token);
    localStorage.setItem('employee_id', me.id);
    localStorage.setItem('full_name', me.full_name);
    localStorage.setItem('roles', JSON.stringify(roles));

    let destination = 'pages/dashboard.html';
    if (selectedRole === 'admin') destination = 'pages/admin.html';
    else if (selectedRole === 'department_head') destination = 'pages/head.html';

    window.location.href = destination;
  } catch (err) {
    errorMsg.textContent = 'Something went wrong: ' + err.message;
  }
});