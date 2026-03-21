/* ============================================================
   SIMPLE EARN — Admin Login Logic
   ============================================================ */

async function handleAdminLogin() {
  const username = document.getElementById('adm-username').value.trim();
  const email    = document.getElementById('adm-email').value.trim();
  const password = document.getElementById('adm-password').value;
  const errEl    = document.getElementById('adm-error');

  errEl.style.display = 'none';

  if (!username || !email || !password) {
    errEl.textContent = 'All fields are required.';
    errEl.style.display = 'block';
    return;
  }

  setLoading('adm-login-btn', true);
  try {
    const data = await apiCall('/auth_dep_ad_log', 'POST', { username, email, password });
    if (data.success) {
      showToast('Admin authenticated. Redirecting…', 'success');
      window.location.href = 'dashboard.html';
    } else {
      errEl.textContent = data.message || 'Invalid admin credentials.';
      errEl.style.display = 'block';
    }
  } catch (err) {
    errEl.textContent = err.message || 'Authentication failed. Please try again.';
    errEl.style.display = 'block';
  } finally {
    setLoading('adm-login-btn', false);
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleAdminLogin();
});
