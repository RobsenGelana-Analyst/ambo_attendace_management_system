async function loadDropdowns() {
  try {
    const departments = await apiCall('/public/departments');
    document.getElementById('department').innerHTML = departments
      .map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  } catch (err) {
    console.error('Could not load departments', err);
  }

  try {
    const positions = await apiCall('/public/positions');
    document.getElementById('position').innerHTML =
      `<option value="">None</option>` +
      positions.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
  } catch (err) {
    console.error('Could not load positions', err);
  }
}

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('registerMsg');
  msg.textContent = '';

  try {
    await apiCall('/employees', {
      method: 'POST',
      body: JSON.stringify({
        full_name: document.getElementById('fullName').value,
        employee_id_number: document.getElementById('employeeIdNumber').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        department_id: document.getElementById('department').value,
        position_id: document.getElementById('position').value || null,
        employment_type: document.getElementById('employmentType').value,
        hire_date: document.getElementById('hireDate').value,
        phone: document.getElementById('phone').value || null,
      }),
    });

    msg.textContent = 'Employee registered successfully!';
    msg.className = '';
    document.getElementById('registerForm').reset();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'error';
  }
});

loadDropdowns();