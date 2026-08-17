async function loadDepartments() {
  const select = document.getElementById('departmentSelect');
  try {
    const departments = await apiCall('/public/departments');
    select.innerHTML = departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    if (departments.length > 0) loadDepartmentAttendance(departments[0].id);
  } catch (err) {
    select.innerHTML = `<option>Error loading departments</option>`;
  }
}

async function loadDepartmentAttendance(departmentId) {
  const table = document.getElementById('deptAttendanceTable');
  table.innerHTML = `<tr class="empty-row"><td colspan="5">Loading...</td></tr>`;
  try {
    const records = await apiCall(`/attendance/department/${departmentId}`);
    if (records.length === 0) {
      table.innerHTML = `<tr class="empty-row"><td colspan="5">No attendance records for this department</td></tr>`;
      return;
    }
    table.innerHTML = records.map(r => `
      <tr>
        <td>${r.employees?.full_name || '-'}</td>
        <td>${r.date}</td>
        <td>${r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : '-'}</td>
        <td>${r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : '-'}</td>
        <td><span class="badge badge-${r.status}">${r.status.replace('_', ' ')}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    table.innerHTML = `<tr><td colspan="5">Error: ${err.message}</td></tr>`;
  }
}

document.getElementById('departmentSelect').addEventListener('change', (e) => {
  loadDepartmentAttendance(e.target.value);
});

loadDepartments();