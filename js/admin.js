let departmentMap = {};
let positionMap = {};

async function loadFilterOptions() {
  try {
    const departments = await apiCall('/public/departments');
    departmentMap = Object.fromEntries(departments.map(d => [d.id, d.name]));
    document.getElementById('empDeptFilter').innerHTML =
      `<option value="">All departments</option>` +
      departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  } catch (err) {
    console.error('Could not load departments', err);
  }

  try {
    const positions = await apiCall('/public/positions');
    positionMap = Object.fromEntries(positions.map(p => [p.id, p.title]));
    document.getElementById('empPositionFilter').innerHTML =
      `<option value="">All positions</option>` +
      positions.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
  } catch (err) {
    console.error('Could not load positions', err);
  }
}

async function loadEmployees() {
  const departmentId = document.getElementById('empDeptFilter').value;
  const positionId = document.getElementById('empPositionFilter').value;
  const table = document.getElementById('employeeTable');

  table.innerHTML = `<tr class="empty-row"><td colspan="7">Loading...</td></tr>`;

  try {
    const params = [];
    if (departmentId) params.push(`department_id=${departmentId}`);
    if (positionId) params.push(`position_id=${positionId}`);
    const url = '/employees' + (params.length ? `?${params.join('&')}` : '');

    const employees = await apiCall(url);
    if (employees.length === 0) {
      table.innerHTML = `<tr class="empty-row"><td colspan="7">No employees found</td></tr>`;
      return;
    }
    table.innerHTML = employees.map(e => `
      <tr>
        <td>${e.employee_id_number}</td>
        <td>${e.full_name}</td>
        <td>${departmentMap[e.department_id] || '-'}</td>
        <td>${positionMap[e.position_id] || '-'}</td>
        <td>${e.employment_type}</td>
        <td><span class="badge badge-${e.status === 'active' ? 'present' : 'absent'}">${e.status}</span></td>
        <td>
          ${e.status !== 'terminated' ? `
            <button class="terminateBtn" data-id="${e.id}" data-name="${e.full_name}" style="width:auto; padding:0.4rem 0.7rem; font-size:0.78rem; background:var(--danger); margin-right:0.4rem;">Deactivate</button>
          ` : ''}
          ${positionMap[e.position_id] === 'Department Head' ? `
  <button class="headBtn" data-id="${e.id}" data-name="${e.full_name}" data-dept="${e.department_id}" style="width:auto; padding:0.4rem 0.7rem; font-size:0.78rem; background:var(--navy-light);">Make Dept. Head</button>
` : ''}
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.terminateBtn').forEach(btn => {
      btn.addEventListener('click', () => handleTerminate(btn.dataset.id, btn.dataset.name));
    });
    document.querySelectorAll('.headBtn').forEach(btn => {
      btn.addEventListener('click', () => handleAssignHead(btn.dataset.id, btn.dataset.name, btn.dataset.dept));
    });
  } catch (err) {
    table.innerHTML = `<tr><td colspan="7">Error: ${err.message}</td></tr>`;
  }
}

async function handleTerminate(id, name) {
  if (!confirm(`Deactivate ${name}? This marks them as terminated but keeps their records.`)) return;
  try {
    await apiCall(`/employees/${id}`, { method: 'DELETE' });
    loadEmployees();
  } catch (err) {
    alert(`Failed to deactivate: ${err.message}`);
  }
}

async function handleAssignHead(id, name, departmentId) {
  if (!departmentId || departmentId === 'null') {
    alert(`${name} has no department assigned — set their department first.`);
    return;
  }
  const deptName = departmentMap[departmentId] || 'their department';
  if (!confirm(`Make ${name} head of ${deptName}?`)) return;

  try {
    await apiCall(`/employees/${id}/assign-head/${departmentId}`, { method: 'PATCH' });
    alert(`${name} is now head of ${deptName}.`);
    loadEmployees();
  } catch (err) {
    alert(`Failed: ${err.message}`);
  }
}

document.getElementById('empDeptFilter').addEventListener('change', loadEmployees);
document.getElementById('empPositionFilter').addEventListener('change', loadEmployees);

loadFilterOptions().then(loadEmployees);