/* ============================================================
   SIMPLE EARN — Admin Dashboard Logic
   ============================================================ */

const ADMIN_SECTION_TITLES = {
  'stats':         'System Statistics',
  'with-pending':  'Pending Withdrawals',
  'with-approved': 'Approved Withdrawals',
  'with-rejected': 'Rejected Withdrawals',
  'dep-pending':   'Pending Deposits',
  'dep-approved':  'Approved Deposits',
  'dep-rejected':  'Rejected Deposits',
  'bonus':         'Give Bonus Package',
  'profile':       'Admin Profile',
};

/* ============================================================
   SECTION NAVIGATION
   ============================================================ */
function adminNav(sectionId, navEl) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  navEl?.classList.add('active');
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`section-${sectionId}`)?.classList.add('active');
  const titleEl = document.getElementById('admin-header-title');
  if (titleEl) titleEl.textContent = ADMIN_SECTION_TITLES[sectionId] || sectionId;

  if (sectionId === 'stats')         loadSystemStats();
  if (sectionId === 'with-pending')  loadWithdrawals('pending');
  if (sectionId === 'with-approved') loadWithdrawals('approved');
  if (sectionId === 'with-rejected') loadWithdrawals('rejected');
  if (sectionId === 'dep-pending')   loadDeposits('pending');
  if (sectionId === 'dep-approved')  loadDeposits('approved');
  if (sectionId === 'dep-rejected')  loadDeposits('rejected');

  closeSidebar();
}

/* ============================================================
   INIT
   ============================================================ */
async function initAdminDashboard() {
  try {
    await Promise.all([loadSystemStats(), loadAdminProfile()]);
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) {
      window.location.href = 'index.html';
    }
  }
}

/* ============================================================
   ADMIN PROFILE — no dedicated backend endpoint exists yet.
   Profile data (Name, EMAIL, PROFILE_PIC) is available via
   admin.stats() in backend/Work/admin.py but is not wired to
   any route in app.py. This function sets safe defaults.
   ============================================================ */
async function loadAdminProfile() {
  // No backend endpoint available — show safe defaults.
  // Once a /dep_admin_stats route is added to app.py this
  // function can be updated to call it.
}

/* ============================================================
   SYSTEM STATS — scrollable blocks
   ============================================================ */
function _statCard(label, val, iconColor, svgPath) {
  return `
    <div class="stat-card">
      <div class="stat-icon ${iconColor}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${svgPath}</svg>
      </div>
      <div class="stat-label">${label}</div>
      <div class="stat-value" style="${String(val).startsWith('₦') ? 'font-size:1.1rem' : ''}">${val}</div>
    </div>`;
}

async function loadSystemStats() {
  const container = document.getElementById('sys-stats-container');
  if (container) container.innerHTML = `<div class="empty-state"><p>Loading stats…</p></div>`;

  try {
    const d = await apiCall('/dep_system_stats', 'POST');

    const countCards = [
      _statCard('Total Users',          extractCount(d.total_users),         'blue',  '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
      _statCard('Pending Withdrawals',  extractCount(d.pending_withdrawals),  'gold',  '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
      _statCard('Approved Withdrawals', extractCount(d.approved_withdrawals), 'green', '<polyline points="20 6 9 17 4 12"/>'),
      _statCard('Rejected Withdrawals', extractCount(d.rejected_withdrawals), 'red',   '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
      _statCard('Pending Deposits',     extractCount(d['pending_-deposits']), 'gold',  '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
      _statCard('Approved Deposits',    extractCount(d.approved_deposits),    'green', '<polyline points="20 6 9 17 4 12"/>'),
      _statCard('Rejected Deposits',    extractCount(d.rejected_deposits),    'red',   '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
    ];

    const finCards = [
      _statCard('Deposited Funds',    `₦${fmt(d.deposited_funds)}`,   'gold',  '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
      _statCard('Withdrawn Funds',    `₦${fmt(d.withdrawn_funds)}`,   'red',   '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
      _statCard("Users' Income",      `₦${fmt(d.users_income)}`,      'green', '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'),
      _statCard('Total Funds Flowed', `₦${fmt(d.total_funds_flown)}`, 'blue',  '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
      _statCard('Current Revenue',    `₦${fmt(d.current_revenue)}`,   'gold',  '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'),
      _statCard('Total Revenue',      `₦${fmt(d.total_revenue)}`,     d.total_revenue >= 0 ? 'green' : 'red', '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'),
    ];

    // Revenue analysis rows
    const revHtml = `
      <div class="revenue-block">
        <h4>Revenue Analysis</h4>
        <div class="info-row"><span class="key">Total Revenue</span><span class="val ${d.total_revenue >= 0 ? 'text-success' : 'text-danger'}">₦${fmt(d.total_revenue)}</span></div>
        <div class="info-row"><span class="key">Revenue Analysis</span><span class="val">${d.total_revenue_analysis || '—'}</span></div>
        <div class="info-row"><span class="key">Current Revenue</span><span class="val ${d.current_revenue >= 0 ? 'text-success' : 'text-danger'}">₦${fmt(d.current_revenue)}</span></div>
        <div class="info-row"><span class="key">Current Revenue %</span><span class="val">${d.current_revenue_analysis || '—'}</span></div>
      </div>`;

    // Notifications list
    const notifs = Array.isArray(d.notifications) ? d.notifications : [];
    const notifHtml = notifs.length ? `
      <div class="stats-group">
        <div class="stats-group-title">Platform Notifications (${notifs.length})</div>
        <div class="card" style="padding:0.75rem;">
          <div class="admin-notif-scroll">
            ${[...notifs].reverse().map(n => {
              const user  = n.user_name || (Array.isArray(n) ? n[1] : '') || '?';
              const msg   = n.message   || (Array.isArray(n) ? n[2] : '') || JSON.stringify(n);
              const date  = n.date      || (Array.isArray(n) ? n[3] : '') || '';
              return `<div class="admin-notif-row">
                <span class="notif-user">${user}</span>
                <span class="notif-msg">${msg}${date ? ` <span style="font-size:0.72rem;color:var(--text-faint);">&nbsp;·&nbsp;${fmtDate(date)}</span>` : ''}</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>` : '';

    container.innerHTML = `
      <div class="stats-group">
        <div class="stats-group-title">Platform Counts</div>
        <div class="stats-scroll">${countCards.join('')}</div>
      </div>
      <div class="stats-group">
        <div class="stats-group-title">Financial Overview</div>
        <div class="stats-scroll">${finCards.join('')}</div>
      </div>
      ${revHtml}
      ${notifHtml}`;

    // Update pending counts in sidebar
    const withBadge = document.getElementById('with-pending-count');
    if (withBadge) {
      const wc = extractCount(d.pending_withdrawals);
      withBadge.textContent = wc;
      withBadge.style.display = wc > 0 ? '' : 'none';
    }
    const depBadge = document.getElementById('dep-pending-count');
    if (depBadge) {
      const dc = extractCount(d['pending_-deposits']);
      depBadge.textContent = dc;
      depBadge.style.display = dc > 0 ? '' : 'none';
    }

  } catch (err) {
    if (container) container.innerHTML = `<div class="empty-state"><p style="color:var(--danger)">Failed to load stats. ${err.message || ''}</p></div>`;
    throw err;
  }
}

function extractCount(val) {
  if (val === null || val === undefined) return 0;
  // sqlite3.Row with row_factory serialized by FastAPI as a plain dict
  // e.g. {"COUNT(DISTINCT user_name)": 5} — grab the first value.
  if (!Array.isArray(val) && typeof val === 'object') {
    const values = Object.values(val);
    return values.length > 0 ? (values[0] ?? 0) : 0;
  }
  // FastAPI may also serialise a single-column Row as a JSON array [5]
  if (Array.isArray(val)) return val[0] ?? 0;
  return val;
}

/* ============================================================
   WITHDRAWALS TABLE — inline approve/reject
   ============================================================ */
async function loadWithdrawals(status) {
  const endpoints = {
    pending:  '/dep_with_pending',
    approved: '/dep_with_approved',
    rejected: '/dep_with_rejected',
  };
  const bodyId = `with-${status}-body`;
  const tbody  = document.getElementById(bodyId);
  if (!tbody) return;
  const cols = status === 'pending' ? 6 : 5;
  tbody.innerHTML = `<tr><td colspan="${cols}"><div class="empty-state"><p>Loading…</p></div></td></tr>`;

  try {
    const raw = await apiCall(endpoints[status], 'POST');
    // Backend now returns a list of dicts (fetchall + dict(row)) — handle both
    // array response and legacy single-object fallback gracefully.
    const rows = Array.isArray(raw) ? raw : (raw ? [raw] : []);

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="${cols}"><div class="empty-state"><p>No ${status} withdrawals.</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map((row) => {
      const username  = row.user_name    || '—';
      const date      = row.date         || '—';
      const amount    = row.amount       || '—';
      const bankDets  = row.bank_details || '—';
      const rowStatus = row.status       || status;
      const id        = row.id;

      if (status === 'pending') {
        return `<tr>
          <td>${username}</td>
          <td class="mono text-accent">₦${fmt(amount)}</td>
          <td style="max-width:150px;font-size:0.82rem;white-space:pre-line;word-break:break-word;">${bankDets}</td>
          <td style="font-size:0.8rem;color:var(--text-muted);">${fmtDate(date)}</td>
          <td>${statusBadge(rowStatus)}</td>
          <td>
            <div class="action-row">
              <button class="btn btn-success btn-sm" onclick="actionWithdrawal('${username}','approve',${id},this)">✓ Approve</button>
              <button class="btn btn-danger btn-sm"  onclick="actionWithdrawal('${username}','reject',${id},this)">✗ Reject</button>
            </div>
          </td>
        </tr>`;
      }
      return `<tr>
        <td>${username}</td>
        <td class="mono">₦${fmt(amount)}</td>
        <td style="max-width:150px;font-size:0.82rem;white-space:pre-line;word-break:break-word;">${bankDets}</td>
        <td style="font-size:0.8rem;color:var(--text-muted);">${fmtDate(date)}</td>
        <td>${statusBadge(rowStatus)}</td>
      </tr>`;
    }).join('');

    if (status === 'pending') {
      const badge = document.getElementById('with-pending-count');
      if (badge) { badge.textContent = rows.length; badge.style.display = ''; }
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="${cols}"><div class="empty-state"><p style="color:var(--danger)">${err.message || 'Failed to load.'}</p></div></td></tr>`;
  }
}

async function actionWithdrawal(username, action, id, btn) {
  btn.disabled = true;
  btn.classList.add('btn-loading');
  try {
    const data = await apiCall('/dep_approve_reject_with', 'POST', { username, action, id });
    const msg = typeof data === 'string' ? data : (data.message || JSON.stringify(data));
    showToast(msg, action === 'approve' ? 'success' : 'warning');
    await loadWithdrawals('pending');
  } catch (err) {
    showToast(err.message || 'Action failed.', 'error');
    btn.disabled = false;
    btn.classList.remove('btn-loading');
  }
}

/* ============================================================
   DEPOSITS TABLE — inline approve/reject (mirrors withdrawals)
   ============================================================ */
async function loadDeposits(status) {
  const endpoints = {
    pending:  '/dep_dep_pending',
    approved: '/dep_dep_approved',
    rejected: '/dep_dep_rejected',
  };
  const bodyId = `dep-${status}-body`;
  const tbody  = document.getElementById(bodyId);
  if (!tbody) return;
  const cols = status === 'pending' ? 6 : 5;
  tbody.innerHTML = `<tr><td colspan="${cols}"><div class="empty-state"><p>Loading…</p></div></td></tr>`;

  try {
    const raw = await apiCall(endpoints[status], 'POST');
    const rows = Array.isArray(raw) ? raw : (raw ? [raw] : []);

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="${cols}"><div class="empty-state"><p>No ${status} deposits.</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map((row) => {
      const username  = row.user_name    || '—';
      const date      = row.date         || '—';
      // deposit table uses balance_added column (not amount)
      const amount    = row.balance_added || '—';
      const bankDets  = row.bank_details  || '—';
      const rowStatus = row.status        || status;
      const id        = row.id;

      if (status === 'pending') {
        return `<tr>
          <td>${username}</td>
          <td class="mono text-accent">₦${fmt(amount)}</td>
          <td style="max-width:150px;font-size:0.82rem;white-space:pre-line;word-break:break-word;">${bankDets}</td>
          <td style="font-size:0.8rem;color:var(--text-muted);">${fmtDate(date)}</td>
          <td>${statusBadge(rowStatus)}</td>
          <td>
            <div class="action-row">
              <button class="btn btn-success btn-sm" onclick="actionDeposit('${username}','approve',${id},this)">✓ Approve</button>
              <button class="btn btn-danger btn-sm"  onclick="actionDeposit('${username}','reject',${id},this)">✗ Reject</button>
            </div>
          </td>
        </tr>`;
      }
      return `<tr>
        <td>${username}</td>
        <td class="mono">₦${fmt(amount)}</td>
        <td style="max-width:150px;font-size:0.82rem;white-space:pre-line;word-break:break-word;">${bankDets}</td>
        <td style="font-size:0.8rem;color:var(--text-muted);">${fmtDate(date)}</td>
        <td>${statusBadge(rowStatus)}</td>
      </tr>`;
    }).join('');

    if (status === 'pending') {
      const badge = document.getElementById('dep-pending-count');
      if (badge) { badge.textContent = rows.length; badge.style.display = ''; }
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="${cols}"><div class="empty-state"><p style="color:var(--danger)">${err.message || 'Failed to load.'}</p></div></td></tr>`;
  }
}

async function actionDeposit(username, action, id, btn) {
  btn.disabled = true;
  btn.classList.add('btn-loading');
  try {
    const data = await apiCall('/dep_approve_reject_dep', 'POST', { username, action, id });
    const msg = typeof data === 'string' ? data : (data.message || JSON.stringify(data));
    showToast(msg, action === 'approve' ? 'success' : 'warning');
    await loadDeposits('pending');
  } catch (err) {
    showToast(err.message || 'Action failed.', 'error');
    btn.disabled = false;
    btn.classList.remove('btn-loading');
  }
}

/* ============================================================
   BONUS PACKAGE
   ============================================================ */
async function handleGiveBonus() {
  const username = document.getElementById('bonus-username').value.trim();
  const plan     = document.getElementById('bonus-plan').value;
  const resultEl = document.getElementById('bonus-result');

  if (!username || !plan) {
    showToast('Please fill in both username and plan.', 'warning');
    return;
  }

  setLoading('bonus-btn', true);
  if (resultEl) resultEl.textContent = '';
  try {
    const data = await apiCall('/dep_bonus_package', 'POST', { username, plan });
    const msg = typeof data === 'string' ? data : (data.message || JSON.stringify(data));
    showToast('Bonus package given successfully!', 'success');
    if (resultEl) { resultEl.textContent = '✓ ' + msg; resultEl.style.color = 'var(--success)'; }
    document.getElementById('bonus-username').value = '';
    document.getElementById('bonus-plan').value = '';
  } catch (err) {
    showToast(err.message || 'Failed to give bonus.', 'error');
    if (resultEl) { resultEl.textContent = err.message; resultEl.style.color = 'var(--danger)'; }
  } finally {
    setLoading('bonus-btn', false);
  }
}

/* ============================================================
   ADMIN PROFILE PICTURE
   ============================================================ */
function previewAdminImage(input) {
  const preview = document.getElementById('profile-avatar');
  if (!input.files || !input.files[0] || !preview) return;
  const reader = new FileReader();
  reader.onload = e => { preview.innerHTML = `<img src="${e.target.result}" alt="preview" />`; };
  reader.readAsDataURL(input.files[0]);
}

async function handleAdminUpdateProfile(e) {
  e.preventDefault();
  const fileInput = document.getElementById('admin-profile-file');
  if (!fileInput.files || !fileInput.files[0]) {
    showToast('Please select an image file first.', 'warning');
    return;
  }

  setLoading('admin-profile-btn', true);
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = ev => resolve(ev.target.result);
      reader.onerror = ()  => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(fileInput.files[0]);
    });
    await apiCall('/dep_add_profile', 'POST', { image: dataUrl });
    showToast('Admin profile picture updated!', 'success');
    ['profile-avatar', 'admin-avatar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<img src="${dataUrl}" alt="avatar" />`;
    });
  } catch (err) {
    showToast(err.message || 'Failed to update profile.', 'error');
  } finally {
    setLoading('admin-profile-btn', false);
  }
}

/* ============================================================
   LOGOUT
   ============================================================ */
async function handleAdminLogout() {
  try { await apiCall('/dep_logout', 'POST'); } catch { /* ignore */ }
  showToast('Admin logged out.', 'info');
  setTimeout(() => { window.location.href = 'index.html'; }, 600);
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', initAdminDashboard);
