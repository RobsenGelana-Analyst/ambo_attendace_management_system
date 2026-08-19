async function loadDepartmentOptions() {
  const select = document.getElementById('reportDepartment');
  try {
    const departments = await apiCall('/public/departments');
    select.innerHTML =
      `<option value="">All departments</option>` +
      departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  } catch (err) {
    console.error('Could not load departments', err);
  }
}

async function loadReport() {
  const year = document.getElementById('reportYear').value;
  const month = document.getElementById('reportMonth').value;
  const departmentId = document.getElementById('reportDepartment').value;
  const table = document.getElementById('reportTable');

  table.innerHTML = `<tr class="empty-row"><td colspan="5">Loading...</td></tr>`;

  try {
    let url = `/attendance/reports/monthly?year=${year}&month=${month}`;
    if (departmentId) url += `&department_id=${departmentId}`;

    const report = await apiCall(url);
    if (report.employees.length === 0) {
      table.innerHTML = `<tr class="empty-row"><td colspan="5">No attendance data for this period</td></tr>`;
      return;
    }
    table.innerHTML = report.employees.map(e => `
      <tr>
        <td>${e.full_name}</td>
        <td><span class="badge badge-present">${e.days_present}</span></td>
        <td><span class="badge badge-late">${e.days_late}</span></td>
        <td><span class="badge badge-absent">${e.days_absent}</span></td>
        <td><span class="badge badge-leave">${e.days_on_leave}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    table.innerHTML = `<tr><td colspan="5">Error: ${err.message}</td></tr>`;
  }
}

document.getElementById('loadReportBtn').addEventListener('click', loadReport);
document.getElementById('reportDepartment').addEventListener('change', loadReport);

loadDepartmentOptions();
loadReport();