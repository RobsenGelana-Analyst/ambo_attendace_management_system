async function loadDepartmentOptions() {
  const select = document.getElementById('leaveDeptFilter');
  try {
    const departments = await apiCall('/public/departments');
    select.innerHTML =
      `<option value="">All departments</option>` +
      departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  } catch (err) {
    console.error('Could not load departments', err);
  }
}

async function loadLeaveRequests() {
  const departmentId = document.getElementById('leaveDeptFilter').value;
  const status = document.getElementById('leaveStatusFilter').value;
  const table = document.getElementById('leaveTable');

  table.innerHTML = `<tr class="empty-row"><td colspan="7">Loading...</td></tr>`;

  try {
    let url = '/leave';
    const params = [];
    if (departmentId) params.push(`department_id=${departmentId}`);
    if (status) params.push(`status=${status}`);
    if (params.length) url += `?${params.join('&')}`;

    const requests = await apiCall(url);
    if (requests.length === 0) {
      table.innerHTML = `<tr class="empty-row"><td colspan="7">No leave requests found</td></tr>`;
      return;
    }
    table.innerHTML = requests.map(r => `
      <tr data-id="${r.id}">
        <td>${r.employees?.full_name || '-'}</td>
        <td>${r.leave_types?.name || '-'}</td>
        <td>${r.start_date}</td>
        <td>${r.end_date}</td>
        <td>${r.reason || '-'}</td>
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
    table.innerHTML = `<tr><td colspan="7">Error: ${err.message}</td></tr>`;
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

document.getElementById('leaveDeptFilter').addEventListener('change', loadLeaveRequests);
document.getElementById('leaveStatusFilter').addEventListener('change', loadLeaveRequests);

loadDepartmentOptions();
loadLeaveRequests();