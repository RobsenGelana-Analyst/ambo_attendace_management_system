async function loadAttendance() {
  const table = document.getElementById('attendanceTable');
  try {
    const records = await apiCall('/attendance/me');
    if (records.length === 0) {
      table.innerHTML = `<tr class="empty-row"><td colspan="4">No attendance records yet</td></tr>`;
      return;
    }
    table.innerHTML = records.map(r => `
      <tr>
        <td>${r.date}</td>
        <td>${r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : '-'}</td>
        <td>${r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : '-'}</td>
        <td><span class="badge badge-${r.status}">${r.status.replace('_', ' ')}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    table.innerHTML = `<tr><td colspan="4">Error: ${err.message}</td></tr>`;
  }
}

loadAttendance();