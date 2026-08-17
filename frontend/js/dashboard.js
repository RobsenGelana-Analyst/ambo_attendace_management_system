document.getElementById('checkInBtn').addEventListener('click', async () => {
  const msg = document.getElementById('attendanceMsg');
  try {
    await apiCall('/attendance/check-in', { method: 'POST' });
    msg.textContent = 'Checked in successfully!';
    msg.className = '';
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'error';
  }
});

document.getElementById('checkOutBtn').addEventListener('click', async () => {
  const msg = document.getElementById('attendanceMsg');
  try {
    await apiCall('/attendance/check-out', { method: 'POST' });
    msg.textContent = 'Checked out successfully!';
    msg.className = '';
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'error';
  }
});