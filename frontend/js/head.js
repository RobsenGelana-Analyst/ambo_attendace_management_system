let myDepartmentId = null;

async function init() {
  try {
    const me = await apiCall('/employees/me');
    myDepartmentId = me.department_id;
    loadAttendance();
    loadLeaveRequests();
  } catch (err) {
    document.getElementById('deptAttendanceTable').innerHTML =
      `<tr><td colspan="5">Error loading your profile: ${err.message}</td></tr>`;
  }
}

async function loadAttendance() {
  const table = document.getElementById('deptAttendanceTable');
  try {
    const records = await apiCall(`/attendance/department/${myDepartmentId}`);
    if (records.length === 0) {
      table.innerHTML = `<tr class="empty-row"><td colspan="5">No attendance records</td></tr>`;
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

async function loadLeaveRequests() {
  const table = document.getElementById('deptLeaveTable');
  try {
    const requests = await apiCall(`/leave/department/${myDepartmentId}`);
    if (requests.length === 0) {
      table.innerHTML = `<tr class="empty-row"><td colspan="6">No leave requests</td></tr>`;
      return;
    }
    table.innerHTML = requests.map(r => `
      <tr>
        <td>${r.employees?.full_name || '-'}</td>
        <td>${r.leave_types?.name || '-'}</td>
        <td>${r.start_date}</td>
        <td>${r.end_date}</td>
        <td><span class="badge badge-${r.status}">${r.status}</span></td>
        <td>
          ${r.status === 'pending' ? `
            <button class="approveBtn" data-id="${r.id}" style="width:auto; padding:0.4rem 0.8rem; margin:0 0.3rem 0 0; font-size:0.8rem;">Approve</button>
            <button class="rejectBtn" data-id="${r.id}" style="width:auto; padding:0.4rem 0.8rem; margin:0; font-size:0.8rem; background:var(--danger);">Reject</button>
          ` : '-'}
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.approveBtn').forEach(btn => {
      btn.addEventListener('click', () => handleDecision(btn.dataset.id, 'approve'));
    });
    document.querySelectorAll('.rejectBtn').forEach(btn => {
      btn.addEventListener('click', () => handleDecision(btn.dataset.id, 'reject'));
    });
  } catch (err) {
    table.innerHTML = `<tr><td colspan="6">Error: ${err.message}</td></tr>`;
  }
}

async function handleDecision(id, action) {
  try {
    await apiCall(`/leave/${id}/${action}`, { method: 'PATCH' });
    loadLeaveRequests();
  } catch (err) {
    alert(`Failed to ${action}: ${err.message}`);
  }
}

init();