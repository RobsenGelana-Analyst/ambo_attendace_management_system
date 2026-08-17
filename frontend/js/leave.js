async function loadLeaveTypes() {
  const select = document.getElementById('leaveType');
  try {
    const types = await apiCall('/public/leave-types');
    select.innerHTML = types.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  } catch (err) {
    select.innerHTML = `<option>Error loading types</option>`;
  }
}

document.getElementById('leaveForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('leaveMsg');
  try {
    await apiCall('/leave', {
      method: 'POST',
      body: JSON.stringify({
        leave_type_id: document.getElementById('leaveType').value,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        reason: document.getElementById('reason').value,
      }),
    });
    msg.textContent = 'Leave request submitted!';
    msg.className = '';
    document.getElementById('leaveForm').reset();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'error';
  }
});

loadLeaveTypes();