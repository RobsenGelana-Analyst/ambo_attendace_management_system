async function loadLeaveRequests() {
  const table = document.getElementById('leaveTable');
  try {
    const requests = await apiCall('/leave/me');
    if (requests.length === 0) {
      table.innerHTML = `<tr class="empty-row"><td colspan="4">No leave requests yet</td></tr>`;
      return;
    }
    table.innerHTML = requests.map(r => `
      <tr>
        <td>${r.leave_types?.name || '-'}</td>
        <td>${r.start_date}</td>
        <td>${r.end_date}</td>
        <td><span class="badge badge-${r.status}">${r.status}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    table.innerHTML = `<tr><td colspan="4">Error: ${err.message}</td></tr>`;
  }
}

loadLeaveRequests();