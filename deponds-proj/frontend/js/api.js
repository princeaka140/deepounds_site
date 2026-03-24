/* ============================================================
   SIMPLE EARN — API Helper
   ============================================================ */

const API_BASE = '/api';


async function apiCall(endpoint, method = 'POST', body = null) {
  const options = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== null) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, options);

  // Handle non-JSON or error responses gracefully
  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = { message: await res.text() };
  }

  if (!res.ok) {
    const err = new Error(data.detail || data.message || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✓',
    error:   '✗',
    warning: '⚠',
    info:    'ℹ',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span style="font-weight:700;">${icons[type] || icons.info}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3800);
}

/* ============================================================
   BUTTON LOADING STATE
   ============================================================ */
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.classList.add('btn-loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
}

/* ============================================================
   PASSWORD TOGGLE
   ============================================================ */
function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.innerHTML = isPassword
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

/* ============================================================
   SIDEBAR TOGGLE (shared by dashboard & admin-dashboard)
   ============================================================ */
function openSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  sidebar?.classList.add('open');
  overlay?.classList.add('active');
}
function closeSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  sidebar?.classList.remove('open');
  overlay?.classList.remove('active');
}

/* ============================================================
   UTILITY
   ============================================================ */
function fmt(n) {
  if (n === null || n === undefined || n === '' || n === '—') return '—';
  return Number(n).toLocaleString('en-NG');
}
function fmtDate(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleDateString('en-NG', { day:'2-digit', month:'short', year:'numeric' });
  } catch { return str; }
}
function fmtDateTime(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleString('en-NG', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch { return str; }
}
function initials(name) {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function statusBadge(status) {
  const map = {
    pending:    'badge-warning',
    approved:   'badge-success',
    successful: 'badge-success',
    rejected:   'badge-danger',
    failed:     'badge-danger',
    active:     'badge-success',
    expired:    'badge-muted',
  };
  return `<span class="badge ${map[status] || 'badge-muted'}">${status}</span>`;
}
