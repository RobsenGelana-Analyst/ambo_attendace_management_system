const token = localStorage.getItem('access_token');
if (!token) window.location.href = '../index.html';

document.addEventListener('DOMContentLoaded', () => {
  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = localStorage.getItem('full_name') || '';

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.href = '../index.html';
    });
  }
});

async function apiCall(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebarEl = document.querySelector('.sidebar');

if (hamburgerBtn && sidebarEl) {
  hamburgerBtn.addEventListener('click', () => {
    sidebarEl.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (
      sidebarEl.classList.contains('open') &&
      !sidebarEl.contains(e.target) &&
      !hamburgerBtn.contains(e.target)
    ) {
      sidebarEl.classList.remove('open');
    }
  });
}