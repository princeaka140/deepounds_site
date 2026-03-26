

/* ---- Frontend base URL (for referral link rewrite) ---- */
const FRONTEND_BASE = `${location.protocol}//${location.host}`;

/* ============================================================
   INVESTMENT PLANS DATA
   ============================================================ */
const PLANS = [
  { id: 'plan1', name: 'Starter',  cost: 4000,   daily: 450,   total: 27000,  roi: 575 },
  { id: 'plan2', name: 'Silver',   cost: 6000,   daily: 650,   total: 39000,  roi: 550 },
  { id: 'plan3', name: 'Gold',     cost: 10000,  daily: 850,   total: 51000,  roi: 410 },
  { id: 'plan4', name: 'Diamond',  cost: 20000,  daily: 1850,  total: 111000, roi: 455 },
  { id: 'plan5', name: 'Elite',    cost: 50000,  daily: 4250,  total: 255000, roi: 410 },
  { id: 'plan6', name: 'Premium',  cost: 100000, daily: 6500,  total: 390000, roi: 290 },
  { id: 'plan7', name: 'Platinum', cost: 200000, daily: 11500, total: 690000, roi: 245 },
  { id: 'plan8', name: 'Legend',   cost: 300000, daily: 15500, total: 930000, roi: 210, featured: true },
];

/* ============================================================
   SECTION NAVIGATION
   ============================================================ */
const SECTION_TITLES = {
  overview:      'Overview',
  plans:         'Investment Plans',
  deposit:       'Deposit',
  withdraw:      'Withdraw',
  notifications: 'Notifications',
  referral:      'Referral Program',
  settings:      'Settings',
};

function navigate(sectionId, navEl) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  navEl?.classList.add('active');
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`section-${sectionId}`)?.classList.add('active');
  document.getElementById('header-title').textContent = SECTION_TITLES[sectionId] || sectionId;

  if (sectionId === 'notifications') loadNotifications();
  if (sectionId === 'referral') loadReferralLink();
  if (sectionId === 'plans') renderPlans();

  closeSidebar();
}

/* ============================================================
   APP INIT
   ============================================================ */
async function initDashboard() {
  await loadUserStats();
  renderPlans();
  loadNotifications();
  loadReferralLink();
}

/* ============================================================
   USER STATS / OVERVIEW
   ============================================================ */
async function loadUserStats() {
  try {
    const data = await apiCall('/stats', 'POST');

    const name = data.Name || data.username || 'User';
    const firstWord = name.split(' ')[0];

    // Header
    document.getElementById('header-username').textContent = firstWord;
    const hdrAvatar = document.getElementById('header-avatar');
    if (data.PROFILE_PIC) {
      hdrAvatar.innerHTML = `<img src="${data.PROFILE_PIC}" alt="avatar" />`;
    } else {
      hdrAvatar.textContent = initials(name);
    }

    // Settings section
    const settingsAvatar = document.getElementById('settings-avatar');
    if (settingsAvatar) {
      if (data.PROFILE_PIC) {
        settingsAvatar.innerHTML = `<img src="${data.PROFILE_PIC}" alt="avatar" />`;
      } else {
        settingsAvatar.textContent = initials(name);
      }
    }
    const settingsName  = document.getElementById('settings-name');
    const settingsEmail = document.getElementById('settings-email');
    if (settingsName)  settingsName.textContent  = data.Name  || '—';
    if (settingsEmail) settingsEmail.textContent = data.EMAIL || '—';

    // Overview stat cards
    document.getElementById('ov-balance').textContent = `₦${fmt(data.balance)}`;
    document.getElementById('ov-name').textContent    = data.Name    || '—';
    document.getElementById('ov-plans').textContent   = typeof (data.active_plans) === "number" ? data.active_plans : '—';
    document.getElementById('ov-date').textContent    = fmtDate(data['REGISTERED AT']) || '—';
    document.getElementById('ov-region').textContent  = "NG";

    // Account details
    const details = document.getElementById('overview-details');
    const plan = (data.my_plans && data.my_plans.length>0) ? data.my_plans.map(items=> items.plan).join(', ') : "No active plan found"
    const rows = [
      ['Full Name',    data.Name],
      ['Username',     data.username],
      ['Email',        data.EMAIL],
      ['Balance',      data.balance !== undefined ? `₦${fmt(data.balance)}` : '—'],
      ['My plan',      plan],
      ['Device',       data.User_agents],
      ['Registered',   fmtDate(data['REGISTERED AT'])],
    ];
    details.innerHTML = rows.map(([k, v]) => `
      <div class="info-row">
        <span class="key">${k}</span>
        <span class="val">${v || '—'}</span>
      </div>`).join('');


  } catch (err) {
    if (err.status === 401) {
      window.location.href = 'index.html';
    } else {
      showToast('Failed to load account data.', 'error');
    }
  }
}

/* ============================================================
   INVESTMENT PLANS
   ============================================================ */
function renderPlans() {
  const grid = document.getElementById('plans-grid');
  if (!grid) return;

  grid.innerHTML = PLANS.map((plan, i) => `
    <div class="plan-card ${plan.featured ? 'featured' : ''}">
      ${plan.featured ? '<span class="plan-badge">🔥 Best Value</span>' : ''}
      <div>
        <div class="plan-name">Plan ${i + 1} — ${plan.name}</div>
        <div class="plan-cost">₦${fmt(plan.cost)} <span>/ one-time</span></div>
      </div>
      <div class="plan-returns">
        <div class="plan-return-row"><span class="label">Daily Return</span><span class="value green">₦${fmt(plan.daily)}</span></div>
        <div class="plan-return-row"><span class="label">Duration</span><span class="value">60 days</span></div>
        <div class="plan-return-row"><span class="label">Total Return</span><span class="value gold">₦${fmt(plan.total)}</span></div>
        <div class="plan-return-row"><span class="label">ROI</span><span class="value" style="color:var(--primary)">${plan.roi}%</span></div>
      </div>
      <button class="btn btn-primary btn-full" id="plan-btn-${plan.id}"
        onclick="handleBuyPlan('${plan.id}','${plan.name}',${plan.cost},this)">
        Invest ₦${fmt(plan.cost)}
      </button>
    </div>
  `).join('');
}

async function handleBuyPlan(planId, planName, cost, btn) {
  const ok = confirm(`Purchase ${planName} Plan for ₦${fmt(cost)}?\n\nThis will deduct ₦${fmt(cost)} from your balance and activate your plan immediately.`);
  if (!ok) return;

  btn.classList.add('btn-loading');
  btn.disabled = true;
  try {
    const data = await apiCall('/package', 'POST', { plan: planId });
    const msg = typeof data === 'string' ? data : (data.message || JSON.stringify(data));
    if (msg.toLowerCase().includes('success') || msg.toLowerCase().includes('purchased')) {
      showToast(`✅ ${planName} Plan activated successfully!`, 'success');
    } else {
      showToast(msg, 'warning');
    }
  } catch (err) {
    showToast(err.message || 'Failed to purchase plan.', 'error');
  } finally {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
}

/* ============================================================
   DEPOSIT — Gateway selection & confirm
   ============================================================ */
const GATEWAYS = {
  server1: { name: 'Server 1', icon: '⚡', bank: 'Moniepoint MFB', accountName: 'Kamsi Chosen Oragwam', accountNumber: '5075903950', maxDeposit: 20000 },
  server2: { name: 'Server 2', icon: '🔒', bank: 'Moniepoint MFB', accountName: 'Bulus Ezra Bitrus',    accountNumber: '5222488176', maxDeposit: null },
  server3: { name: 'Server 3', icon: '💎', bank: 'Palmpay',         accountName: 'Kamsi Oragwam',        accountNumber: '8130185201', maxDeposit: 30000 },
};

let _selectedGateway = null;

function selectGateway(gwId) {
  const gw = GATEWAYS[gwId];
  if (!gw) return;
  _selectedGateway = gw;

  // Populate detail fields
  document.getElementById('dep-gw-icon').textContent    = gw.icon;
  document.getElementById('dep-gw-name').textContent    = gw.name;
  document.getElementById('dep-bank-display').textContent  = gw.bank;
  document.getElementById('dep-name-display').textContent  = gw.accountName;
  document.getElementById('dep-acctno-display').textContent = gw.accountNumber;

  // Reset amount & error
  const amtEl = document.getElementById('dep-amount');
  if (amtEl) {
    amtEl.value = '';
    amtEl.max = gw.maxDeposit || '';
  }
  const hintEl = document.getElementById('dep-amount-hint');
  if (hintEl) {
    hintEl.textContent = gw.maxDeposit
      ? `Min: ₦4,000 — Max: ₦${fmt(gw.maxDeposit)}`
      : 'Minimum: ₦4,000 (no upper limit)';
  }
  const errEl = document.getElementById('dep-error');
  if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

  // Transition steps
  document.getElementById('dep-step-1').style.display = 'none';
  document.getElementById('dep-step-2').style.display = '';
  document.getElementById('dep-amount')?.focus();
}

function depGoBack() {
  _selectedGateway = null;
  document.getElementById('dep-step-2').style.display = 'none';
  document.getElementById('dep-step-1').style.display = '';
}

function copyDepAcctNo() {
  const num = _selectedGateway?.accountNumber;
  if (!num) return;
  navigator.clipboard.writeText(num)
    .then(() => showToast('Account number copied!', 'success'))
    .catch(() => showToast('Could not copy.', 'warning'));
}

async function handleDepositConfirm() {
  if (!_selectedGateway) return;
  const errEl  = document.getElementById('dep-error');
  const amount = parseInt(document.getElementById('dep-amount')?.value || '0');

  errEl.style.display = 'none';

  if (!amount || amount < 4000) {
    errEl.textContent = 'Minimum deposit is ₦4,000.';
    errEl.style.display = 'block';
    return;
  }

  const gw = _selectedGateway;

  if (gw.maxDeposit && amount > gw.maxDeposit) {
    errEl.textContent = `Maximum deposit for ${gw.name} is ₦${fmt(gw.maxDeposit)}.`;
    errEl.style.display = 'block';
    return;
  }

  const bankDetails = `Bank: ${gw.bank}\nAccount Name: ${gw.accountName}\nAccount Number: ${gw.accountNumber}\nGateway: ${gw.name}`;

  setLoading('dep-btn', true);
  try {
    await apiCall('/deposit', 'POST', { amount_filled: amount, bank_details: bankDetails });
    showToast('✅ Deposit request submitted! Awaiting approval.', 'success');
    depGoBack();
  } catch (err) {
    const msg = err.data?.detail || err.message || 'Deposit failed.';
    errEl.textContent = msg;
    errEl.style.display = 'block';
  } finally {
    setLoading('dep-btn', false);
  }
}

/* ============================================================
   WITHDRAW — form submit handler
   ============================================================ */
async function handleWithdrawSubmit(e) {
  e.preventDefault();
  const amount    = parseInt(document.getElementById('with-amount').value);
  const bankName  = document.getElementById('with-bank-name').value.trim();
  const acctNo    = document.getElementById('with-acct-no').value.trim();
  const acctName  = document.getElementById('with-acct-name').value.trim();
  const errEl     = document.getElementById('with-error');

  errEl.style.display = 'none';

  if (!amount || amount < 600) {
    errEl.textContent = 'Minimum withdrawal is ₦600.';
    errEl.style.display = 'block';
    return;
  }

  const bankDetails = `Bank Name: ${bankName}\nAccount Number: ${acctNo}\nAccount Name: ${acctName}`;

  setLoading('with-btn', true);
  try {
    const data = await apiCall('/withdrawal', 'POST', { amount_filled: amount, bank_details: bankDetails });
    const msg = typeof data === 'string' ? data : (data.message || 'Withdrawal request submitted!');
    if (msg.toLowerCase().includes('insufficient')) {
      errEl.textContent = msg;
      errEl.style.display = 'block';
    } else {
      showToast('✅ ' + msg, 'success');
      e.target.reset();
    }
  } catch (err) {
    const msg = err.data?.detail || err.message || 'Withdrawal failed.';
    errEl.textContent = msg;
    errEl.style.display = 'block';
  } finally {
    setLoading('with-btn', false);
  }
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
async function loadNotifications() {
  const list = document.getElementById('notifications-list');
  if (!list) return;
  list.innerHTML = `<div class="empty-state"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg><p>Loading…</p></div>`;

  try {
    const data = await apiCall('/notification', 'POST');
    const items = Array.isArray(data) ? data : (data ? [data] : []);

    if (!items.length) {
      list.innerHTML = `<div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <p>No notifications yet. Start investing to see updates here.</p>
      </div>`;
      return;
    }

    const count = items.length;
    ['notif-count-badge', 'header-notif-badge'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = count > 99 ? '99+' : count; el.style.display = ''; }
    });

    list.innerHTML = [...items].reverse().map(item => {
      const msg  = item.message || (Array.isArray(item) ? item[1] : '') || JSON.stringify(item);
      const date = item.date    || (Array.isArray(item) ? item[2] : '') || '';
      return `<div class="notif-item">
        <div class="notif-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <div class="notif-body">
          <div class="notif-msg">${msg}</div>
          ${date ? `<div class="notif-time">${fmtDateTime(date)}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><p style="color:var(--danger)">Failed to load notifications.</p></div>`;
  }
}

/* ============================================================
   REFERRAL LINK — rewrite backend URL → frontend URL
   ============================================================ */
async function loadReferralLink() {
  const input = document.getElementById('ref-link-input');
  if (!input || input.value) return;

  try {
    const data = await apiCall('/refferal_link', 'POST');
    const backendLink = data.ref_link || '';
     const rec = (data.records && data.records.length>0) ? data.records : []
    if(rec.length>0){ document.getElementById("ref-load").innerHTML = ""
      rec.forEach(items =>{
        const li = document.createElement('li');
        li.textContent = `${items.name} is currently on ${items.plan}`
        document.getElementById("records").appendChild(li)
      })
    }
    else{
      document.getElementById("ref-load").innerHTML = "No refferal found"
    }

    // Extract the ?ref= username from backend link and build frontend URL
    let frontendLink = '';
    try {
      const backendUrl = new URL(backendLink);
      const refUsername = backendUrl.searchParams.get('ref');
      if (refUsername) {
        // Build path relative to current location (same folder as dashboard.html)
        const base = `${location.protocol}//${location.host}`;
        const path = location.pathname.replace('dashboard.html', 'index.html');
        frontendLink = `${base}${path}?ref=${encodeURIComponent(refUsername)}`;
      }
    } catch {
      frontendLink = backendLink;
    }

    input.value = frontendLink || backendLink || 'Unable to load referral link.';
  } catch {
    input.value = 'Failed to load referral link.';
  }
}

function copyRefLink() {
  const input = document.getElementById('ref-link-input');
  if (!input?.value) return;
  navigator.clipboard.writeText(input.value)
    .then(() => showToast('Referral link copied!', 'success'))
    .catch(() => {
      input.select();
      document.execCommand('copy');
      showToast('Referral link copied!', 'success');
    });
}

/* ============================================================
   PROFILE PICTURE — file upload (base64)
   ============================================================ */
function previewProfileImage(input) {
  const preview = document.getElementById('settings-avatar');
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    preview.innerHTML = `<img src="${e.target.result}" alt="preview" />`;
  };
  reader.readAsDataURL(input.files[0]);
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const fileInput = document.getElementById('profile-file');
  if (!fileInput.files || !fileInput.files[0]) {
    showToast('Please select an image file first.', 'warning');
    return;
  }

  setLoading('profile-btn', true);
  try {
    // Convert file to base64 data URL
    const dataUrl = await readFileAsDataURL(fileInput.files[0]);

    await apiCall('/add_profile', 'POST', { image: dataUrl });
    showToast('Profile picture updated!', 'success');

    // Update all avatar elements
    ['settings-avatar', 'header-avatar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<img src="${dataUrl}" alt="avatar" />`;
    });
  } catch (err) {
    showToast(err.message || 'Failed to update profile.', 'error');
  } finally {
    setLoading('profile-btn', false);
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

/* ============================================================
   CHANGE PASSWORD — form submit
   ============================================================ */
async function handleChangePassword(e) {
  e.preventDefault();
  const oldPw  = document.getElementById('old-pw').value;
  const newPw  = document.getElementById('new-pw').value;
  const confPw = document.getElementById('confirm-pw').value;

  if (!oldPw || !newPw || !confPw) {
    showToast('All password fields are required.', 'warning');
    return;
  }
  if (newPw !== confPw) {
    showToast('New passwords do not match.', 'warning');
    return;
  }
  if (newPw.length < 6) {
    showToast('New password must be at least 6 characters.', 'warning');
    return;
  }

  setLoading('pw-btn', true);
  try {
    const data = await apiCall('/change_pw', 'POST', { old_password: oldPw, new_password: newPw });
    const msg = typeof data === 'string' ? data : (data.message || '');
    if (data.success) {
      showToast('Password changed successfully!', 'success');
      e.target.reset();
    } else {
      showToast(msg || 'Failed to change password.', 'error');
    }
  } catch (err) {
    showToast(err.message || 'Failed to change password.', 'error');
  } finally {
    setLoading('pw-btn', false);
  }
}

/* ============================================================
   NOTIFICATION DROPDOWN — header bell icon popup
   ============================================================ */
let _notifDropdownLoaded = false;

function toggleNotifDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('notif-dropdown');
  const isOpen = dropdown.classList.contains('open');
  dropdown.classList.toggle('open', !isOpen);
  if (!isOpen && !_notifDropdownLoaded) loadNotifDropdown();
}

function closeNotifDropdown() {
  document.getElementById('notif-dropdown')?.classList.remove('open');
}

async function loadNotifDropdown() {
  const list = document.getElementById('notif-dropdown-list');
  if (!list) return;

  try {
    const data = await apiCall('/notification', 'POST');
    const items = Array.isArray(data) ? data : (data ? [data] : []);
    _notifDropdownLoaded = true;

    // Sync badge counts
    const count = items.length;
    ['notif-count-badge', 'header-notif-badge'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = count > 99 ? '99+' : count; el.style.display = count ? '' : 'none'; }
    });

    if (!items.length) {
      list.innerHTML = `<div class="empty-state" style="padding:1.5rem 1rem;"><p>No notifications yet.</p></div>`;
      return;
    }

    list.innerHTML = [...items].reverse().slice(0, 8).map(item => {
      const msg  = item.message || (Array.isArray(item) ? item[1] : '') || '';
      const date = item.date    || (Array.isArray(item) ? item[2] : '') || '';
      return `<div class="notif-item-sm">
        <div class="notif-icon-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <div class="notif-body">
          <div class="notif-msg">${msg}</div>
          ${date ? `<div class="notif-time">${fmtDateTime(date)}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  } catch {
    list.innerHTML = `<div class="empty-state" style="padding:1rem;"><p style="color:var(--danger)">Failed to load.</p></div>`;
  }
}

function viewAllNotifications() {
  closeNotifDropdown();
  navigate('notifications', document.querySelector('[data-section=notifications]'));
}

/* ============================================================
   LOGOUT
   ============================================================ */
async function handleLogout() {
  try { await apiCall('/logout', 'POST'); } catch { /* ignore */ }
  showToast('Logged out successfully.', 'info');
  setTimeout(() => { window.location.href = 'index.html'; }, 600);
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', initDashboard);
