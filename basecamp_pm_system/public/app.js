// ============================================================
// Project One – SPA Frontend (Production-Ready)
// ============================================================
const API = '/api/v1';
let currentUser = null;
let currentUserRole = null; // role in current project context

// --- Toast Notifications ---
function toast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// --- API Wrapper ---
async function api(method, path, body = null) {
  const opts = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);

  let json = null;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      json = await res.json();
    } catch (_) {}
  }

  if (!res.ok) {
    throw new Error(json?.message || `Error ${res.status}: ${res.statusText || 'Something went wrong'}`);
  }
  return json;
}

// --- Router ---
function router() {
  const hash = location.hash.slice(1) || 'login';
  const parts = hash.split('/');
  const route = parts[0];
  const id = parts[1];
  const app = document.getElementById('app');
  app.innerHTML = '';
  if (route === 'login') renderLogin(app);
  else if (route === 'register') renderRegister(app);
  else if (route === 'forgot-password') renderForgotPassword(app);
  else if (route === 'reset-password' && id) renderResetPassword(app, id);
  else if (route === 'dashboard') renderDashboard(app);
  else if (route === 'project' && id) renderProject(app, id);
  else renderLogin(app);
}
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await api('POST', '/auth/current-user');
    currentUser = res.data;
    if (!location.hash || location.hash === '#login') location.hash = '#dashboard';
    else router();
  } catch (_) {
    router();
  }
});

// ============================================================
// LOGIN PAGE
// ============================================================
function renderLogin(app) {
  app.innerHTML = `
  <div class="login-wrapper">
    <div class="login-card">
      <div class="brand">
        <div class="brand-icon">BP</div>
        <h1>Welcome Back</h1>
        <p>Sign in to continue to your projects</p>
      </div>
      <form id="loginForm">
        <div class="form-group">
          <label for="login-email">Email</label>
          <input type="email" id="login-email" name="email" placeholder="you@example.com" required />
        </div>
        <div class="form-group">
          <label for="login-password">Password</label>
          <input type="password" id="login-password" name="password" placeholder="Enter your password" required />
        </div>
        <button type="submit" class="btn btn-primary btn-full" id="loginSubmitBtn">Sign In</button>
      </form>
      <div style="text-align:center;margin-top:1rem;">
        <button class="link-btn" onclick="location.hash='#forgot-password'">Forgot Password?</button>
      </div>
      <p style="text-align:center;margin-top:0.75rem;font-size:0.875rem;color:var(--text-muted)">
        Don't have an account? <button class="link-btn" onclick="location.hash='#register'">Sign Up</button>
      </p>
    </div>
  </div>`;
  document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const btn = document.getElementById('loginSubmitBtn');
    btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      const res = await api('POST', '/auth/login', {
        email: f.email.value.trim(),
        password: f.password.value
      });
      currentUser = res.data?.user || res.data;
      toast('Welcome back!', 'success');
      location.hash = '#dashboard';
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false; btn.textContent = 'Sign In';
    }
  };
}

// ============================================================
// REGISTER PAGE
// ============================================================
function renderRegister(app) {
  app.innerHTML = `
  <div class="login-wrapper">
    <div class="login-card">
      <div class="brand">
        <div class="brand-icon">BP</div>
        <h1>Create Account</h1>
        <p>Get started with Basecamp PM</p>
      </div>
      <form id="registerForm">
        <div class="form-group">
          <label for="reg-fullname">Full Name</label>
          <input type="text" id="reg-fullname" name="fullname" placeholder="John Doe" required />
        </div>
        <div class="form-group">
          <label for="reg-username">Username</label>
          <input type="text" id="reg-username" name="username" placeholder="johndoe" required />
        </div>
        <div class="form-group">
          <label for="reg-email">Email</label>
          <input type="email" id="reg-email" name="email" placeholder="you@example.com" required />
        </div>
        <div class="form-group">
          <label for="reg-password">Password</label>
          <input type="password" id="reg-password" name="password" placeholder="Create a password" required />
        </div>
        <button type="submit" class="btn btn-primary btn-full" id="regSubmitBtn">Create Account</button>
      </form>
      <p style="text-align:center;margin-top:1.25rem;font-size:0.875rem;color:var(--text-muted)">
        Already have an account? <button class="link-btn" onclick="location.hash='#login'">Sign In</button>
      </p>
    </div>
  </div>`;
  document.getElementById('registerForm').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const btn = document.getElementById('regSubmitBtn');
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
      await api('POST', '/auth/register', {
        fullname: f.fullname.value.trim(),
        username: f.username.value.trim().toLowerCase(),
        email: f.email.value.trim(),
        password: f.password.value
      });
      toast('Account created! Please check your email to verify, then log in.', 'success');
      location.hash = '#login';
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false; btn.textContent = 'Create Account';
    }
  };
}

// ============================================================
// FORGOT PASSWORD PAGE
// ============================================================
function renderForgotPassword(app) {
  app.innerHTML = `
  <div class="login-wrapper">
    <div class="login-card">
      <div class="brand">
        <div class="brand-icon">🔑</div>
        <h1>Forgot Password</h1>
        <p>Enter your email and we'll send you a reset link</p>
      </div>
      <form id="forgotForm">
        <div class="form-group">
          <label for="forgot-email">Email Address</label>
          <input type="email" id="forgot-email" name="email" placeholder="you@example.com" required />
        </div>
        <button type="submit" class="btn btn-primary btn-full" id="forgotSubmitBtn">Send Reset Link</button>
      </form>
      <p style="text-align:center;margin-top:1.25rem;font-size:0.875rem;color:var(--text-muted)">
        Remember your password? <button class="link-btn" onclick="location.hash='#login'">Sign In</button>
      </p>
    </div>
  </div>`;
  document.getElementById('forgotForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('forgotSubmitBtn');
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      await api('POST', '/auth/forgotpassword', { email: e.target.email.value.trim() });
      toast('Password reset link sent to your email!', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
    btn.disabled = false; btn.textContent = 'Send Reset Link';
  };
}

// ============================================================
// RESET PASSWORD PAGE
// ============================================================
function renderResetPassword(app, token) {
  app.innerHTML = `
  <div class="login-wrapper">
    <div class="login-card">
      <div class="brand">
        <div class="brand-icon">🔒</div>
        <h1>Reset Password</h1>
        <p>Enter your new password below</p>
      </div>
      <form id="resetForm">
        <div class="form-group">
          <label for="reset-password">New Password</label>
          <input type="password" id="reset-password" name="newpassword" placeholder="Enter new password" required />
        </div>
        <div class="form-group">
          <label for="reset-confirm">Confirm Password</label>
          <input type="password" id="reset-confirm" name="confirm" placeholder="Confirm new password" required />
        </div>
        <button type="submit" class="btn btn-primary btn-full" id="resetSubmitBtn">Reset Password</button>
      </form>
      <p style="text-align:center;margin-top:1.25rem;font-size:0.875rem;color:var(--text-muted)">
        <button class="link-btn" onclick="location.hash='#login'">Back to Sign In</button>
      </p>
    </div>
  </div>`;
  document.getElementById('resetForm').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.newpassword.value !== f.confirm.value) {
      toast('Passwords do not match', 'error');
      return;
    }
    const btn = document.getElementById('resetSubmitBtn');
    btn.disabled = true; btn.textContent = 'Resetting…';
    try {
      await api('POST', '/auth/resetforgotpassword/' + token, { newpassword: f.newpassword.value });
      toast('Password reset successfully! Please log in.', 'success');
      location.hash = '#login';
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false; btn.textContent = 'Reset Password';
    }
  };
}

// ============================================================
// DASHBOARD
// ============================================================
async function renderDashboard(app) {
  app.innerHTML = `
  <div class="dashboard">
    ${sidebarHTML('projects')}
    <main class="main-content">
      <div class="page-header fade-in">
        <div>
          <h1>My Projects</h1>
          <p class="subtitle">Manage and track all your projects</p>
        </div>
        <button class="btn btn-primary" id="newProjectBtn">+ New Project</button>
      </div>
      <div id="statsRow" class="stats-row fade-in-1"></div>
      <div id="projectsGrid" class="projects-grid">
        <div class="spinner-wrapper"><div class="spinner"></div></div>
      </div>
    </main>
  </div>`;
  document.getElementById('newProjectBtn').onclick = () => openProjectModal();
  bindSidebarLogout();
  try {
    const res = await api('GET', '/projects');
    const projects = res.data || [];
    const totalMembers = projects.reduce((s, p) => s + (p.members || 0), 0);
    const statsEl = document.getElementById('statsRow');
    statsEl.innerHTML = `
      <div class="stat-card fade-in-1"><div class="stat-label">Total Projects</div><div class="stat-value">${projects.length}</div></div>
      <div class="stat-card fade-in-2"><div class="stat-label">Active</div><div class="stat-value">${projects.length}</div></div>
      <div class="stat-card fade-in-3"><div class="stat-label">Total Members</div><div class="stat-value">${totalMembers}</div></div>
    `;
    const grid = document.getElementById('projectsGrid');
    if (!projects.length) {
      grid.innerHTML = `<div class="empty-state fade-in"><div class="empty-icon">📂</div><h3>No projects yet</h3><p>Create your first project to get started</p><button class="btn btn-primary" onclick="openProjectModal()">+ New Project</button></div>`;
    } else {
      grid.innerHTML = projects.map((p, i) => `
        <div class="project-card fade-in-${Math.min(i+1,4)}" onclick="location.hash='#project/${p._id}'">
          <h3>${esc(p.name)}</h3>
          <p class="card-desc">${esc(p.description || 'No description')}</p>
          <div class="card-meta">
            <span>${new Date(p.createdAt || Date.now()).toLocaleDateString()}</span>
            <span style="display:flex;align-items:center;gap:0.5rem;">
              <span class="badge badge-role">${esc(p.role || 'member')}</span>
              <span>👥 ${p.members || 0}</span>
            </span>
          </div>
        </div>`).join('');
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// PROJECT DETAIL
// ============================================================
async function renderProject(app, projectId) {
  currentUserRole = null;
  app.innerHTML = `
  <div class="dashboard">
    ${sidebarHTML('projects')}
    <main class="main-content">
      <div class="breadcrumbs fade-in"><a href="#dashboard">Projects</a> <span>›</span> <span id="projName">Loading…</span></div>
      <div class="page-header fade-in">
        <div><h1 id="projTitle">Loading…</h1><p class="subtitle" id="projDesc"></p></div>
        <div class="header-actions" id="headerActions">
          <button class="btn btn-primary" id="newTaskBtn">+ New Task</button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-nav" id="tabNav">
        <button class="tab-btn active" data-tab="tasks">📋 Tasks</button>
        <button class="tab-btn" data-tab="members">👥 Members</button>
        <button class="tab-btn" data-tab="settings">⚙️ Settings</button>
      </div>

      <!-- Tasks Tab -->
      <div id="tab-tasks" class="tab-content active">
        <div id="tasksList" class="tasks-list">
          <div class="spinner-wrapper"><div class="spinner"></div></div>
        </div>
      </div>

      <!-- Members Tab -->
      <div id="tab-members" class="tab-content" style="display:none;">
        <div id="membersSection"></div>
      </div>

      <!-- Settings Tab -->
      <div id="tab-settings" class="tab-content" style="display:none;">
        <div id="settingsSection"></div>
      </div>
    </main>
  </div>`;

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => { c.style.display = 'none'; c.classList.remove('active'); });
      btn.classList.add('active');
      const tab = document.getElementById('tab-' + btn.dataset.tab);
      if (tab) { tab.style.display = 'block'; tab.classList.add('active'); }
    };
  });

  document.getElementById('newTaskBtn').onclick = () => openTaskModal(projectId);
  bindSidebarLogout();

  // Determine user role in this project
  try {
    const membersRes = await api('GET', '/projects/' + projectId + '/members');
    const members = membersRes.data || [];
    const me = members.find(m => m.userId === currentUser?._id);
    currentUserRole = me?.role || null;
    renderMembersTab(projectId, members);
  } catch(_) {}

  // Load project info
  try {
    const projRes = await api('GET', '/projects/' + projectId);
    const proj = projRes.data;
    if (proj) {
      document.getElementById('projName').textContent = proj.name || 'Project';
      document.getElementById('projTitle').textContent = proj.name || 'Project';
      document.getElementById('projDesc').textContent = proj.description || '';
      renderSettingsTab(projectId, proj);
    }
  } catch(_) {}

  // Load tasks
  await loadTasks(projectId);
}

async function loadTasks(projectId) {
  const list = document.getElementById('tasksList');
  if (!list) return;
  try {
    const res = await api('GET', '/projects/' + projectId + '/tasks');
    const tasks = res.data?.tasks || res.data || [];
    if (!tasks.length) {
      list.innerHTML = `<div class="empty-state fade-in"><div class="empty-icon">📋</div><h3>No tasks yet</h3><p>Create your first task for this project</p><button class="btn btn-primary" onclick="openTaskModal('${projectId}')">+ New Task</button></div>`;
    } else {
      list.innerHTML = tasks.map((t, i) => {
        const statusClass = t.status === 'done' ? 'badge-done' : t.status === 'in_progress' ? 'badge-progress' : 'badge-todo';
        let attachHTML = '';
        if (t.attachments && t.attachments.length) {
          attachHTML = `<div class="attachments-list">${t.attachments.map(a => `<div class="attachment-item">📎 ${esc(a.filename)} <span>(${esc(a.mimetype)}, ${a.size} bytes)</span> <a href="${esc(a.url)}" target="_blank">download</a></div>`).join('')}</div>`;
        }
        return `
        <div class="task-card fade-in-${Math.min(i+1,4)}" id="task-${t._id}">
          <div class="task-info">
            <div class="task-header-row">
              <h3>${esc(t.title)}</h3>
              <div class="task-actions">
                <select class="status-select status-${t.status || 'todo'}" data-taskid="${t._id}" data-projectid="${projectId}" onchange="changeTaskStatus(this)">
                  <option value="todo" ${t.status==='todo'?'selected':''}>Todo</option>
                  <option value="in_progress" ${t.status==='in_progress'?'selected':''}>In Progress</option>
                  <option value="done" ${t.status==='done'?'selected':''}>Done</option>
                </select>
                <button class="btn btn-ghost btn-sm" onclick="openEditTaskModal('${projectId}','${t._id}',${JSON.stringify(esc(t.title)).replace(/'/g,"\\'")} ,${JSON.stringify(esc(t.description||'')).replace(/'/g,"\\'")})" title="Edit">✏️</button>
                <button class="btn btn-ghost btn-sm btn-danger-text" onclick="deleteTask('${projectId}','${t._id}')" title="Delete">🗑️</button>
              </div>
            </div>
            <p class="task-desc">${esc(t.description || '')}</p>
            <div class="task-meta">
              <span class="badge ${statusClass}">${t.status || 'todo'}</span>
              ${t.dueDate ? `<span>Due: ${new Date(t.dueDate).toLocaleDateString()}</span>` : ''}
            </div>
            ${attachHTML}
          </div>
        </div>`;
      }).join('');
    }
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><p>${esc(err.message)}</p></div>`;
  }
}

// --- Task Status Change ---
async function changeTaskStatus(selectEl) {
  const taskId = selectEl.dataset.taskid;
  const projectId = selectEl.dataset.projectid;
  const newStatus = selectEl.value;
  try {
    await api('PUT', '/projects/' + projectId + '/tasks/' + taskId, { status: newStatus });
    toast('Task status updated', 'success');
    await loadTasks(projectId);
  } catch (err) {
    toast(err.message, 'error');
  }
}

// --- Delete Task ---
async function deleteTask(projectId, taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  try {
    await api('DELETE', '/projects/' + projectId + '/tasks/' + taskId);
    toast('Task deleted', 'success');
    await loadTasks(projectId);
  } catch (err) {
    toast(err.message, 'error');
  }
}

// --- Edit Task Modal ---
function openEditTaskModal(projectId, taskId, title, description) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2>Edit Task</h2>
      <form id="editTaskForm">
        <div class="form-group"><label>Title</label><input type="text" name="title" value="${title}" required /></div>
        <div class="form-group"><label>Description</label><textarea name="description" rows="3">${description}</textarea></div>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">Save Changes</button>
          <button type="button" class="btn btn-secondary" id="cancelEditTask">Cancel</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#cancelEditTask').onclick = () => overlay.remove();
  overlay.querySelector('#editTaskForm').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      await api('PUT', '/projects/' + projectId + '/tasks/' + taskId, {
        title: f.title.value.trim(),
        description: f.description.value.trim()
      });
      overlay.remove();
      toast('Task updated!', 'success');
      await loadTasks(projectId);
    } catch (err) { toast(err.message, 'error'); }
  };
}

// ============================================================
// MEMBERS TAB
// ============================================================
function renderMembersTab(projectId, members) {
  const section = document.getElementById('membersSection');
  if (!section) return;
  const isAdmin = currentUserRole === 'admin';
  section.innerHTML = `
    <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
      <h2>Project Members (${members.length})</h2>
      ${isAdmin ? `<button class="btn btn-primary btn-sm" id="inviteMemberBtn">+ Invite Member</button>` : ''}
    </div>
    <div class="members-list">
      ${members.length === 0 ? '<p style="color:var(--text-muted)">No members found</p>' :
        members.map(m => `
        <div class="member-card">
          <div class="member-avatar">${(m.username || m.email || '?')[0].toUpperCase()}</div>
          <div class="member-info">
            <div class="member-name">${esc(m.username || 'Unknown')}</div>
            <div class="member-email">${esc(m.email || '')}</div>
          </div>
          <div class="member-role-area">
            ${isAdmin && m.userId !== currentUser?._id ? `
              <select class="role-select" data-userid="${m.userId}" data-projectid="${projectId}" onchange="changeMemberRole(this)">
                <option value="admin" ${m.role==='admin'?'selected':''}>Admin</option>
                <option value="project_admin" ${m.role==='project_admin'?'selected':''}>Project Admin</option>
                <option value="member" ${m.role==='member'?'selected':''}>Member</option>
              </select>
              <button class="btn btn-ghost btn-sm btn-danger-text" onclick="removeMember('${projectId}','${m.userId}')" title="Remove">✕</button>
            ` : `<span class="badge badge-role">${esc(m.role)}</span>`}
          </div>
        </div>`).join('')
      }
    </div>`;
  if (isAdmin) {
    const btn = document.getElementById('inviteMemberBtn');
    if (btn) btn.onclick = () => openInviteMemberModal(projectId);
  }
}

// --- Invite Member Modal ---
function openInviteMemberModal(projectId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2>Invite Member</h2>
      <form id="inviteMemberForm">
        <div class="form-group"><label>Email Address</label><input type="email" name="email" placeholder="member@example.com" required /></div>
        <div class="form-group">
          <label>Role</label>
          <select name="role" class="form-select">
            <option value="member">Member</option>
            <option value="project_admin">Project Admin</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">Invite</button>
          <button type="button" class="btn btn-secondary" id="cancelInvite">Cancel</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#cancelInvite').onclick = () => overlay.remove();
  overlay.querySelector('#inviteMemberForm').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      await api('POST', '/projects/' + projectId + '/members', {
        email: f.email.value.trim(),
        role: f.role.value
      });
      overlay.remove();
      toast('Member invited!', 'success');
      renderProject(document.getElementById('app'), projectId);
    } catch (err) { toast(err.message, 'error'); }
  };
}

// --- Change Member Role ---
async function changeMemberRole(selectEl) {
  const userId = selectEl.dataset.userid;
  const projectId = selectEl.dataset.projectid;
  try {
    await api('PUT', '/projects/' + projectId + '/members/' + userId, { role: selectEl.value });
    toast('Role updated', 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// --- Remove Member ---
async function removeMember(projectId, userId) {
  if (!confirm('Remove this member from the project?')) return;
  try {
    await api('DELETE', '/projects/' + projectId + '/members/' + userId);
    toast('Member removed', 'success');
    renderProject(document.getElementById('app'), projectId);
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ============================================================
// SETTINGS TAB (Project Edit / Delete)
// ============================================================
function renderSettingsTab(projectId, proj) {
  const section = document.getElementById('settingsSection');
  if (!section) return;
  const isAdmin = currentUserRole === 'admin';
  section.innerHTML = `
    <h2 style="margin-bottom:1.5rem;">Project Settings</h2>
    <div class="settings-card">
      <h3>General</h3>
      <form id="editProjectForm">
        <div class="form-group"><label>Project Name</label><input type="text" name="name" value="${esc(proj.name || '')}" ${!isAdmin ? 'disabled' : ''} required /></div>
        <div class="form-group"><label>Description</label><textarea name="description" rows="3" ${!isAdmin ? 'disabled' : ''}>${esc(proj.description || '')}</textarea></div>
        ${isAdmin ? `<button type="submit" class="btn btn-primary">Save Changes</button>` : '<p style="color:var(--text-muted);font-size:0.875rem;">Only project admins can edit settings.</p>'}
      </form>
    </div>
    ${isAdmin ? `
    <div class="settings-card danger-zone">
      <h3 style="color:var(--danger);">Danger Zone</h3>
      <p style="font-size:0.875rem;margin-bottom:1rem;">Deleting this project will permanently remove all associated tasks and members. This action cannot be undone.</p>
      <button class="btn btn-danger" id="deleteProjectBtn">Delete Project</button>
    </div>` : ''}`;

  if (isAdmin) {
    document.getElementById('editProjectForm').onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        await api('PUT', '/projects/' + projectId, {
          name: f.name.value.trim(),
          description: f.description.value.trim()
        });
        toast('Project updated!', 'success');
        // Update displayed name
        document.getElementById('projName').textContent = f.name.value.trim();
        document.getElementById('projTitle').textContent = f.name.value.trim();
        document.getElementById('projDesc').textContent = f.description.value.trim();
      } catch (err) { toast(err.message, 'error'); }
    };
    const delBtn = document.getElementById('deleteProjectBtn');
    if (delBtn) {
      delBtn.onclick = async () => {
        if (!confirm('Are you SURE you want to delete this project? This is permanent.')) return;
        try {
          await api('DELETE', '/projects/' + projectId);
          toast('Project deleted', 'success');
          location.hash = '#dashboard';
        } catch (err) { toast(err.message, 'error'); }
      };
    }
  }
}

// ============================================================
// SIDEBAR
// ============================================================
function sidebarHTML(active) {
  const name = currentUser?.fullname || currentUser?.username || 'User';
  const email = currentUser?.email || '';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  return `
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="icon">BP</div>
      <span>Basecamp PM</span>
    </div>
    <nav>
      <div class="nav-item ${active==='projects'?'active':''}" onclick="location.hash='#dashboard'">📂 Projects</div>
    </nav>
    <div class="sidebar-footer">
      <div class="user-info">
        <div class="avatar">${initials}</div>
        <div>
          <div class="user-name">${esc(name)}</div>
          <div class="user-email">${esc(email)}</div>
        </div>
      </div>
      <button class="btn btn-ghost btn-full logout-btn" style="justify-content:flex-start;">↪ Sign Out</button>
    </div>
  </aside>`;
}
function bindSidebarLogout() {
  const btn = document.querySelector('.logout-btn');
  if (btn) btn.onclick = async () => {
    try { await api('POST', '/auth/logout'); } catch(_) {}
    currentUser = null;
    toast('Signed out', 'info');
    location.hash = '#login';
  };
}

// ============================================================
// MODALS
// ============================================================
function openProjectModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2>Create Project</h2>
      <form id="projModalForm">
        <div class="form-group"><label>Project Name</label><input type="text" name="name" placeholder="My awesome project" required /></div>
        <div class="form-group"><label>Description</label><textarea name="description" rows="3" placeholder="What is this project about?"></textarea></div>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">Create</button>
          <button type="button" class="btn btn-secondary" id="cancelProj">Cancel</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#cancelProj').onclick = () => overlay.remove();
  overlay.querySelector('#projModalForm').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      await api('POST', '/projects', { name: f.name.value.trim(), description: f.description.value.trim() });
      overlay.remove();
      toast('Project created!', 'success');
      location.hash = '#dashboard';
      router();
    } catch (err) { toast(err.message, 'error'); }
  };
}

function openTaskModal(projectId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2>Create Task</h2>
      <form id="taskModalForm">
        <div class="form-group"><label>Title</label><input type="text" name="title" placeholder="Task title" required /></div>
        <div class="form-group"><label>Description</label><textarea name="description" rows="3" placeholder="Describe the task"></textarea></div>
        <div class="form-row">
          <div class="form-group"><label>Due Date</label><input type="date" name="dueDate" /></div>
          <div class="form-group">
            <label>Status</label>
            <select name="status" class="form-select">
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">Create</button>
          <button type="button" class="btn btn-secondary" id="cancelTask">Cancel</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#cancelTask').onclick = () => overlay.remove();
  overlay.querySelector('#taskModalForm').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const payload = {
      title: f.title.value.trim(),
      description: f.description.value.trim(),
      dueDate: f.dueDate.value || undefined,
      status: f.status.value,
      project: projectId,
    };
    try {
      await api('POST', '/projects/' + projectId + '/tasks', payload);
      overlay.remove();
      toast('Task created!', 'success');
      await loadTasks(projectId);
    } catch (err) { toast(err.message, 'error'); }
  };
}

// --- Utility ---
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
