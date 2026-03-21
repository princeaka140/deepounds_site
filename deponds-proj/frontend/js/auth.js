/* ============================================================
   SIMPLE EARN — Auth Page Logic
   ============================================================ */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---- Tab Switching ---- */
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`panel-${tab.dataset.tab}`)?.classList.add('active');
  });
});

/* ---- Pre-fill referral from URL ---- */
(function checkRef() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    const refGroup = document.getElementById('ref-group');
    const refInput = document.getElementById('reg-ref');
    if (refGroup) refGroup.style.display = 'block';
    if (refInput) refInput.value = ref;
    // Auto-switch to register tab
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelector('[data-tab="register"]')?.classList.add('active');
    document.getElementById('panel-register')?.classList.add('active');
  }
})();

/* ---- Live hint for login identifier ---- */
const identifierInput = document.getElementById('login-identifier');
const identifierHint  = document.getElementById('login-identifier-hint');
if (identifierInput) {
  identifierInput.addEventListener('input', () => {
    const val = identifierInput.value.trim();
    if (!val) { identifierHint.textContent = ''; return; }
    identifierHint.textContent = EMAIL_REGEX.test(val)
      ? '✓ Detected as Email'
      : '✓ Detected as Username';
    identifierHint.style.color = 'var(--success)';
  });
}

/* ---- Login ---- */
async function handleLogin() {
  const identifier = document.getElementById('login-identifier').value.trim();
  const password   = document.getElementById('login-password').value;
  const errEl      = document.getElementById('login-error');

  errEl.style.display = 'none';

  if (!identifier) {
    errEl.textContent = 'Please enter your username or email.';
    errEl.style.display = 'block';
    return;
  }
  if (!password) {
    errEl.textContent = 'Please enter your password.';
    errEl.style.display = 'block';
    return;
  }

  // Regex check: is it an email or username?
  const isEmail = EMAIL_REGEX.test(identifier);
  const payload = isEmail
    ? { email: identifier, username: '', password }
    : { username: identifier, email: '', password };

  setLoading('login-btn', true);
  try {
    const data = await apiCall('/api/login', 'POST', payload);
    if (data.success) {
      showToast('Login successful! Redirecting…', 'success');
      window.location.href = 'dashboard.html';
    } else {
      errEl.textContent = data.message || 'Login failed. Please check your credentials.';
      errEl.style.display = 'block';
    }
  } catch (err) {
    errEl.textContent = err.message || 'Login failed. Please try again.';
    errEl.style.display = 'block';
  } finally {
    setLoading('login-btn', false);
  }
}

/* ---- Register ---- */
async function handleRegister() {
  const name     = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const ref      = document.getElementById('reg-ref').value.trim() || null;
  const errEl    = document.getElementById('reg-error');

  errEl.style.display = 'none';

  if (!name || !username || !email || !password) {
    errEl.textContent = 'All fields are required.';
    errEl.style.display = 'block';
    return;
  }
  if (!EMAIL_REGEX.test(email)) {
    errEl.textContent = 'Please enter a valid email address.';
    errEl.style.display = 'block';
    return;
  }
  if (password.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters.';
    errEl.style.display = 'block';
    return;
  }

  setLoading('reg-btn', true);
  try {
    let url = '/api/register';
    if (ref) url += `?ref=${encodeURIComponent(ref)}`;

    const data = await apiCall(url, 'POST', { name, username, email, password });
    if (data.success) {
      showToast('Account created! Please log in.', 'success');
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.querySelector('[data-tab="login"]')?.classList.add('active');
      document.getElementById('panel-login')?.classList.add('active');
      document.getElementById('login-identifier').value = username;
    } else {
      errEl.textContent = data.message || 'Registration failed.';
      errEl.style.display = 'block';
    }
  } catch (err) {
    errEl.textContent = err.message || 'Registration failed. Please try again.';
    errEl.style.display = 'block';
  } finally {
    setLoading('reg-btn', false);
  }
}

/* ---- Enter key ---- */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const activePanel = document.querySelector('.panel.active');
  if (!activePanel) return;
  if (activePanel.id === 'panel-login') handleLogin();
  else if (activePanel.id === 'panel-register') handleRegister();
});
