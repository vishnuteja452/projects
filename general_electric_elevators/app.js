/* ==========================================================================
   General Electric Elevators - LiftCare Pro Application Script
   State Management, LocalStorage Database Mocking, & Portal Routing
   ========================================================================== */

// 1. Initial State Data Definition (Database Mock)
const INITIAL_ELEVATORS = [];
const INITIAL_EMPLOYEES = []; // Completely empty on first load. Admin created on first boot.
const INITIAL_TICKETS = [];
const INITIAL_ATTENDANCE = [];
const INITIAL_NOTIFICATIONS = [];

// Global Application State Object
let state = {
    role: "", // customer, employee, admin
    user: null, // Logged in user: { id, name, email, role, elevatorId, roleDetail }
    impersonating: false,
    adminUser: null, // Remembers original admin user when impersonating
    elevators: [],
    employees: [],
    tickets: [],
    attendance: [],
    notifications: []
};

// 2. LocalStorage Helpers
function saveStateToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getOrInitializeStorage(key, initialData) {
    const data = localStorage.getItem(key);
    if (!data) {
        localStorage.setItem(key, JSON.stringify(initialData));
        return initialData;
    }
    return JSON.parse(data);
}

function loadStateFromStorage() {
    state.elevators = getOrInitializeStorage("ge_elevators", INITIAL_ELEVATORS);
    state.employees = getOrInitializeStorage("ge_employees", INITIAL_EMPLOYEES);
    state.tickets = getOrInitializeStorage("ge_tickets", INITIAL_TICKETS);
    state.attendance = getOrInitializeStorage("ge_attendance", INITIAL_ATTENDANCE);
    state.notifications = getOrInitializeStorage("ge_notifications", INITIAL_NOTIFICATIONS);
    loadSession();
}

function saveSession(user, role, impersonating = false, adminUser = null) {
    state.user = user;
    state.role = role;
    state.impersonating = impersonating;
    state.adminUser = adminUser;
    saveStateToStorage("ge_session", { user, role, impersonating, adminUser });
}

function clearSession() {
    state.user = null;
    state.role = "";
    state.impersonating = false;
    state.adminUser = null;
    localStorage.removeItem("ge_session");
}

function loadSession() {
    const session = localStorage.getItem("ge_session");
    if (session) {
        const parsed = JSON.parse(session);
        state.user = parsed.user;
        state.role = parsed.role;
        state.impersonating = parsed.impersonating || false;
        state.adminUser = parsed.adminUser || null;
    }
}

// System Notification dispatch utility
function addNotification(msg) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    
    state.notifications.unshift({
        message: msg,
        time: `Today, ${timeStr}`
    });
    
    // Cap notifications at 10 items
    if (state.notifications.length > 10) {
        state.notifications.pop();
    }
    
    saveStateToStorage("ge_notifications", state.notifications);
}

// 3. Application Lifecycle Entrypoint
window.onload = function() {
    initApp();
};

function initApp() {
    loadStateFromStorage();
    setupClock();
    mockGetLocation();
    
    // Check if any admin exists in the database
    const adminExists = state.employees.some(emp => emp.role === "admin");
    
    if (!adminExists) {
        // Force First-Time Admin Setup
        showAuthView("admin-setup");
        document.getElementById("splash-screen").classList.remove("hidden");
        document.getElementById("app-container").classList.add("hidden");
    } else {
        if (state.user) {
            // Restore existing session
            document.getElementById("splash-screen").classList.add("hidden");
            document.getElementById("app-container").classList.remove("hidden");
            switchPortal(state.role);
        } else {
            // Redirect to sign in
            showAuthView("login");
            document.getElementById("splash-screen").classList.remove("hidden");
            document.getElementById("app-container").classList.add("hidden");
        }
    }
}

// -- Auth Views Controllers
function showAuthView(viewName) {
    document.getElementById("auth-login-view").classList.add("hidden");
    document.getElementById("auth-setup-view").classList.add("hidden");
    document.getElementById("auth-admin-setup-view").classList.add("hidden");
    document.getElementById("auth-signup-view").classList.add("hidden");
    
    // Clear errors
    const loginError = document.getElementById("login-error");
    const setupError = document.getElementById("setup-error");
    const signupError = document.getElementById("signup-error");
    if (loginError) loginError.classList.add("hidden");
    if (setupError) setupError.classList.add("hidden");
    if (signupError) signupError.classList.add("hidden");

    if (viewName === "login") {
        document.getElementById("auth-login-view").classList.remove("hidden");
    } else if (viewName === "setup") {
        document.getElementById("auth-setup-view").classList.remove("hidden");
    } else if (viewName === "admin-setup") {
        document.getElementById("auth-admin-setup-view").classList.remove("hidden");
    } else if (viewName === "signup") {
        document.getElementById("auth-signup-view").classList.remove("hidden");
    }
}

function handleAuthLogin(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const pass = document.getElementById("login-password").value;
    const errorDiv = document.getElementById("login-error");

    const user = state.employees.find(emp => emp.email.toLowerCase() === email);
    if (!user || user.password !== pass) {
        errorDiv.textContent = "Invalid email address or password.";
        errorDiv.classList.remove("hidden");
        return;
    }

    // Role mapping: admin -> admin, technician/inspector -> employee, customer -> customer
    let role = "customer";
    if (user.role === "admin") role = "admin";
    else if (user.role === "technician" || user.role === "inspector") role = "employee";

    saveSession(user, role);
    
    // Reset forms
    document.getElementById("login-form").reset();
    
    // Switch views
    document.getElementById("splash-screen").classList.add("hidden");
    document.getElementById("app-container").classList.remove("hidden");
    switchPortal(role);
}

function handleAuthSetup(e) {
    e.preventDefault();
    const email = document.getElementById("setup-email").value.trim().toLowerCase();
    const password = document.getElementById("setup-password").value;
    const confirm = document.getElementById("setup-confirm").value;
    const errorDiv = document.getElementById("setup-error");

    if (password.length < 6) {
        errorDiv.textContent = "Password must be at least 6 characters long.";
        errorDiv.classList.remove("hidden");
        return;
    }

    if (password !== confirm) {
        errorDiv.textContent = "Passwords do not match.";
        errorDiv.classList.remove("hidden");
        return;
    }

    const idx = state.employees.findIndex(emp => emp.email.toLowerCase() === email);
    if (idx === -1) {
        errorDiv.textContent = "This email is not pre-registered. Contact GE admin.";
        errorDiv.classList.remove("hidden");
        return;
    }

    const user = state.employees[idx];
    if (user.password) {
        errorDiv.textContent = "Password has already been set up. Please log in.";
        errorDiv.classList.remove("hidden");
        return;
    }

    state.employees[idx].password = password;
    saveStateToStorage("ge_employees", state.employees);
    addNotification(`User ${user.name} configured their password.`);
    alert("Password registered successfully! Please log in.");
    
    document.getElementById("setup-password-form").reset();
    showAuthView("login");
}

function handleAdminSetup(e) {
    e.preventDefault();
    const name = document.getElementById("admin-setup-name").value.trim();
    const email = document.getElementById("admin-setup-email").value.trim().toLowerCase();
    const password = document.getElementById("admin-setup-password").value;

    const newAdmin = {
        id: "EMP-101",
        name: name,
        email: email,
        password: password,
        role: "admin",
        phone: "+91 9999999999",
        status: "Active",
        roleDetail: "Platform Super Administrator"
    };

    state.employees = [newAdmin];
    saveStateToStorage("ge_employees", state.employees);
    addNotification("Primary administrator account initialized.");
    alert("System Admin account registered! You can now sign in.");
    
    document.getElementById("admin-setup-form").reset();
    showAuthView("login");
}

function handleAuthSignup(e) {
    e.preventDefault();
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim().toLowerCase();
    const role = document.getElementById("signup-role").value;
    const phone = document.getElementById("signup-phone").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirm = document.getElementById("signup-confirm").value;
    const errorDiv = document.getElementById("signup-error");

    if (!name || !email || !password) {
        errorDiv.textContent = "Name, email, and password are required.";
        errorDiv.classList.remove("hidden");
        return;
    }

    if (password.length < 6) {
        errorDiv.textContent = "Password must be at least 6 characters long.";
        errorDiv.classList.remove("hidden");
        return;
    }

    if (password !== confirm) {
        errorDiv.textContent = "Passwords do not match.";
        errorDiv.classList.remove("hidden");
        return;
    }

    // Check if email already exists
    const existing = state.employees.find(emp => emp.email.toLowerCase() === email);
    if (existing) {
        errorDiv.textContent = "An account with this email already exists.";
        errorDiv.classList.remove("hidden");
        return;
    }

    // Generate unique employee ID
    const maxId = state.employees.reduce((max, emp) => {
        const num = parseInt(emp.id.replace("EMP-", ""));
        return num > max ? num : max;
    }, 100);
    const newId = `EMP-${maxId + 1}`;

    const newUser = {
        id: newId,
        name: name,
        email: email,
        password: password,
        role: role,
        phone: phone || "",
        status: "Active",
        roleDetail: role.charAt(0).toUpperCase() + role.slice(1)
    };

    state.employees.push(newUser);
    saveStateToStorage("ge_employees", state.employees);
    addNotification(`New ${role} account created: ${name}.`);
    alert("Account created successfully! Please sign in.");

    document.getElementById("signup-form").reset();
    showAuthView("login");
}

// -- Portal Switching & Impersonation
function switchPortal(role) {
    state.role = role;
    
    // Toggle nav sections
    document.getElementById("menu-customer").classList.add("hidden");
    document.getElementById("menu-employee").classList.add("hidden");
    document.getElementById("menu-admin").classList.add("hidden");
    document.getElementById(`menu-${role}`).classList.remove("hidden");

    // Route to default tab depending on portal role
    const defaultTabMap = {
        "customer": "cust-dash",
        "employee": "emp-dash",
        "admin": "admin-dash"
    };

    switchTab(defaultTabMap[role]);
    
    // Update Profile details in Sidebar
    document.getElementById("nav-user-name").textContent = state.user.name;
    document.getElementById("nav-user-role").textContent = state.user.roleDetail || state.user.role.toUpperCase();
    document.getElementById("nav-avatar-char").textContent = state.user.name.charAt(0);

    // Setup Admin Impersonator Switcher dropdown
    const switcher = document.getElementById("admin-override-switcher");
    if (switcher) {
        // Show only if actual user is Admin (or we are currently impersonating)
        const isActualAdmin = state.impersonating || (state.user && state.user.role === "admin");
        if (isActualAdmin) {
            switcher.classList.remove("hidden");
            renderImpersonatorSelectOptions();
        } else {
            switcher.classList.add("hidden");
        }
    }

    // Toggle Impersonation Banner visibility
    const banner = document.getElementById("impersonation-banner");
    const bannerText = document.getElementById("impersonation-banner-text");
    if (banner && bannerText) {
        if (state.impersonating) {
            banner.classList.remove("hidden");
            bannerText.textContent = `⚠️ Impersonating Active: ${state.user.name} (${state.user.role.toUpperCase()} VIEW)`;
        } else {
            banner.classList.add("hidden");
        }
    }

    // Refresh views
    renderActivePortalViews();
}

function renderImpersonatorSelectOptions() {
    const custGroup = document.getElementById("impersonate-optgroup-customers");
    const techGroup = document.getElementById("impersonate-optgroup-techs");
    const select = document.getElementById("admin-impersonate-select");
    if (!custGroup || !techGroup || !select) return;

    custGroup.innerHTML = "";
    techGroup.innerHTML = "";

    // Load active customers
    const customers = state.employees.filter(emp => emp.role === "customer");
    custGroup.innerHTML = customers.map(c => `<option value="cust_${c.id}">${c.name}</option>`).join("");

    // Load active technicians
    const techs = state.employees.filter(emp => emp.role === "technician" || emp.role === "inspector");
    techGroup.innerHTML = techs.map(t => `<option value="tech_${t.id}">${t.name} (${t.role})</option>`).join("");

    // Set select value based on state
    if (state.impersonating) {
        select.value = `${state.role === 'customer' ? 'cust_' : 'tech_'}${state.user.id}`;
    } else {
        select.value = "";
    }
}

function handleAdminImpersonateSelect(val) {
    if (!val) {
        endImpersonation();
        return;
    }

    const type = val.split("_")[0];
    const id = val.substring(type.length + 1);

    const userToImpersonate = state.employees.find(emp => emp.id === id);
    if (!userToImpersonate) return;

    // Cache original admin user
    const originalAdmin = state.impersonating ? state.adminUser : state.user;

    // Perform override
    let targetRole = "customer";
    if (userToImpersonate.role === "technician" || userToImpersonate.role === "inspector") {
        targetRole = "employee";
    }

    saveSession(userToImpersonate, targetRole, true, originalAdmin);
    switchPortal(targetRole);
}

function endImpersonation() {
    if (!state.impersonating || !state.adminUser) return;
    
    const admin = state.adminUser;
    saveSession(admin, "admin", false, null);
    
    // Clear select value
    const select = document.getElementById("admin-impersonate-select");
    if (select) select.value = "";

    switchPortal("admin");
}

function logout() {
    clearSession();
    window.location.reload();
}

function switchTab(tabId) {
    // Hide tabs
    document.querySelectorAll(".page-tab").forEach(tab => tab.classList.add("hidden"));
    
    // Show active tab
    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.classList.remove("hidden");
    }

    // Nav-Item highlighting
    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.classList.remove("active");
    });
    
    // Find active sidebar link and add class
    const sidebarLink = Array.from(document.querySelectorAll(".nav-item")).find(link => {
        return link.getAttribute("onclick").includes(`'${tabId}'`);
    });
    if (sidebarLink) {
        sidebarLink.classList.add("active");
    }

    // Set page title
    const pageTitleMap = {
        "cust-dash": "Customer Dashboard",
        "cust-install": "Track Installation Progress",
        "cust-services": "Service & Maintenance Requests",
        "emp-dash": "Employee Dashboard",
        "emp-attendance": "GPS Attendance Marking",
        "emp-tasks": "Assigned Tasks & Reports",
        "admin-dash": "Admin Control Dashboard",
        "admin-projects": "Active Project Tracking",
        "admin-tickets": "Service Tickets Intake",
        "admin-attendance": "Staff Clock In Logs",
        "admin-employees": "Staff Directory Management"
    };
    
    document.getElementById("page-title").textContent = pageTitleMap[tabId] || "Dashboard";
    
    // Render dynamic updates on tab change
    renderActivePortalViews();
}

// 5. Clock and GPS Systems (Real-time checks)
function setupClock() {
    setInterval(() => {
        const now = new Date();
        const clockElems = document.querySelectorAll("#live-clock");
        const dateElems = document.querySelectorAll("#live-date");
        clockElems.forEach(el => {
            if (el) el.textContent = now.toLocaleTimeString();
        });
        dateElems.forEach(el => {
            if (el) el.textContent = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        });
    }, 1000);
}

function mockGetLocation() {
    const geoIndicator = document.getElementById("geo-status-indicator");
    if (!geoIndicator) return;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                geoIndicator.innerHTML = `
                    <div class="status-dot green"></div>
                    <span>GPS Coordinates Secured: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}</span>
                `;
                geoIndicator.dataset.lat = position.coords.latitude;
                geoIndicator.dataset.lng = position.coords.longitude;
            },
            () => {
                // Fallback to simulated location if blocked
                geoIndicator.innerHTML = `
                    <div class="status-dot green"></div>
                    <span>Simulated GPS Location Active: Worli Site C (19.0180, 72.8152)</span>
                `;
                geoIndicator.dataset.lat = 19.0180;
                geoIndicator.dataset.lng = 72.8152;
            }
        );
    }
}

// 6. Dynamic Rendering System
function renderActivePortalViews() {
    loadStateFromStorage();
    
    // Renders custom lists depending on role
    if (state.role === "customer") {
        renderCustomerDashboard();
        renderCustomerInstallationProgress();
        renderCustomerServiceOptions();
    } else if (state.role === "employee") {
        renderEmployeeDashboard();
        renderEmployeeAttendanceLog();
        renderEmployeeTaskList();
    } else if (state.role === "admin") {
        renderAdminDashboard();
        renderAdminProjects();
        renderAdminTickets();
        renderAdminAttendance();
        renderAdminEmployeesList();
    }

    renderNotificationsList();
}

// -- A. Customer Render Functions
function renderCustomerDashboard() {
    const elevatorList = document.getElementById("customer-elevator-list");
    if (!elevatorList) return;

    // Load installations active for Client
    const clientElevators = state.elevators.filter(el => el.clientEmail === state.user.email);
    
    elevatorList.innerHTML = "";
    
    if (clientElevators.length === 0) {
        elevatorList.innerHTML = "<p class='text-muted'>No elevator units registered under your profile.</p>";
        const progressElem = document.getElementById("cust-stat-install-progress");
        if (progressElem) progressElem.textContent = "No Projects";
        const ticketsCountElem = document.getElementById("cust-stat-active-tickets");
        if (ticketsCountElem) ticketsCountElem.textContent = "0 Active Requests";
        return;
    }

    clientElevators.forEach(el => {
        const isActiveInstall = el.progress < 100;
        elevatorList.innerHTML += `
            <div class="elevator-item">
                <div class="elevator-item-left">
                    <h4>${el.buildingName}</h4>
                    <p>Model: ${el.model} | ID: ${el.id}</p>
                    <p class="subtext">Status: <strong>${isActiveInstall ? 'Under Installation' : 'Active & Certified'}</strong></p>
                </div>
                <div class="elevator-item-right">
                    ${isActiveInstall ? 
                      `<span class="badge badge-warning">Progress: ${el.progress}%</span>
                       <button class="btn btn-outline-gold btn-sm" onclick="switchTab('cust-install')">Track Progress</button>` 
                      : `<span class="badge badge-success">Running Normal</span>
                         <span class="subtext">Last Maintenance: Completed</span>`
                    }
                </div>
            </div>
        `;
    });

    // Stats updates
    const activeInstall = clientElevators.find(el => el.progress < 100);
    const progressText = activeInstall ? 
        `${activeInstall.stages[activeInstall.currentStage].name} (${activeInstall.progress}%)` : "All Projects Completed";
    
    const progressElem = document.getElementById("cust-stat-install-progress");
    if (progressElem) progressElem.textContent = progressText;
    
    // Filter tickets related to this customer's elevators
    const clientElevatorIds = clientElevators.map(el => el.id);
    const activeTicketsCount = state.tickets.filter(tk => clientElevatorIds.includes(tk.elevatorId) && tk.status !== "completed").length;
    const ticketsCountElem = document.getElementById("cust-stat-active-tickets");
    if (ticketsCountElem) ticketsCountElem.textContent = `${activeTicketsCount} Active Requests`;
}

function renderCustomerInstallationProgress() {
    const progressList = document.getElementById("install-steps-list");
    if (!progressList) return;

    // Use first customer elevator
    const clientElevators = state.elevators.filter(el => el.clientEmail === state.user.email);
    const project = clientElevators.find(el => el.progress < 100) || clientElevators[0];
    
    if (!project) {
        document.getElementById("cust-track-building-name").textContent = "No active projects";
        document.getElementById("cust-track-handover-date").textContent = "--";
        document.getElementById("cust-track-percentage").textContent = "0%";
        document.getElementById("cust-track-bar").style.width = "0%";
        progressList.innerHTML = "<p class='text-muted text-center'>No projects found under your profile.</p>";
        return;
    }

    document.getElementById("cust-track-building-name").textContent = project.buildingName;
    let formattedHandoverDate = "--";
    if (project.handoverDate) {
        const d = new Date(project.handoverDate);
        if (!isNaN(d.getTime())) {
            // Fix timezone shift by using UTC components
            formattedHandoverDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
        } else {
            formattedHandoverDate = project.handoverDate;
        }
    }
    document.getElementById("cust-track-handover-date").textContent = formattedHandoverDate;
    document.getElementById("cust-track-percentage").textContent = `${project.progress}%`;
    document.getElementById("cust-track-bar").style.width = `${project.progress}%`;

    progressList.innerHTML = "";
    project.stages.forEach((st, idx) => {
        let statusClass = "pending";
        let badgeText = "Upcoming";
        let statusBadgeClass = "badge-info";

        if (st.status === "completed") {
            statusClass = "completed";
            badgeText = "Completed";
            statusBadgeClass = "badge-success";
        } else if (st.status === "in-progress") {
            statusClass = "in-progress";
            badgeText = "In Progress";
            statusBadgeClass = "badge-warning";
        }

        progressList.innerHTML += `
            <div class="timeline-step ${statusClass}">
                <div class="step-marker"></div>
                <div class="step-content">
                    <div class="step-content-header">
                        <h4>Stage ${idx + 1}: ${st.name}</h4>
                        <span class="badge ${statusBadgeClass}">${badgeText}</span>
                    </div>
                    <p>Milestone targets include engineering signoff and calibration verification protocols.</p>
                    ${st.date ? `<div class="step-meta"><span>Date Completed:</span><span>${st.date}</span></div>` : ""}
                </div>
            </div>
        `;
    });
}

function renderCustomerServiceOptions() {
    const selectElevator = document.getElementById("ticket-elevator");
    const ticketHistory = document.getElementById("customer-ticket-list");
    if (!selectElevator || !ticketHistory) return;

    const clientElevators = state.elevators.filter(el => el.clientEmail === state.user.email);

    // Options dropdown
    selectElevator.innerHTML = clientElevators.map(el => `<option value="${el.id}">${el.buildingName}</option>`).join("");

    // History
    ticketHistory.innerHTML = "";
    const clientElevatorIds = clientElevators.map(el => el.id);
    const customerTickets = state.tickets.filter(tk => clientElevatorIds.includes(tk.elevatorId));

    if (customerTickets.length === 0) {
        ticketHistory.innerHTML = "<p class='text-muted text-center'>No service logs found.</p>";
        return;
    }

    customerTickets.forEach(tk => {
        let badgeColor = "badge-info";
        if (tk.status === "completed") badgeColor = "badge-success";
        if (tk.status === "assigned") badgeColor = "badge-warning";
        if (tk.category.includes("SOS") || tk.category.includes("Emergency")) badgeColor = "badge-danger";

        ticketHistory.innerHTML += `
            <div class="ticket-card-item">
                <div class="ticket-card-header">
                    <h4>${tk.category}</h4>
                    <span class="badge ${badgeColor}">${tk.status}</span>
                </div>
                <p><strong>Building:</strong> ${tk.elevatorName}</p>
                <p><strong>Notes:</strong> ${tk.description}</p>
                <div class="ticket-tech-tag">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>Technician: ${tk.technicianName}</span>
                </div>
                ${tk.resolutionNote ? `
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.08);">
                        <p class="text-success" style="margin-bottom:6px;"><strong>Fix Note:</strong> ${tk.resolutionNote}</p>
                        ${tk.signatureData ? `
                            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:8px;">
                                <div>
                                    <span class="subtext text-muted" style="font-size:0.75rem; display:block;">Client Signoff:</span>
                                    <strong style="font-size:0.85rem; color:var(--text-main);">${tk.signatureName}</strong>
                                </div>
                                <img src="${tk.signatureData}" alt="Customer Signature" style="height: 35px; border-bottom: 1px solid rgba(255,255,255,0.2); filter: brightness(1.3) contrast(1.2);" />
                            </div>
                        ` : ""}
                    </div>
                ` : ""}
            </div>
        `;
    });
}

// -- B. Employee Render Functions
function renderEmployeeDashboard() {
    const miniTasks = document.getElementById("employee-dashboard-task-list");
    if (!miniTasks) return;

    // Filter tasks assigned to Amit Sharma (EMP-102)
    const empTasks = state.tickets.filter(tk => tk.technicianId === state.user.id && tk.status !== "completed");
    const empProjects = state.elevators.filter(el => el.progress < 100); // Active project installs

    miniTasks.innerHTML = "";

    if (empTasks.length === 0 && empProjects.length === 0) {
        miniTasks.innerHTML = "<p class='text-muted'>No tasks assigned for today. Safety first!</p>";
        return;
    }

    // List service tickets
    empTasks.forEach(tk => {
        miniTasks.innerHTML += `
            <div class="elevator-item">
                <div class="elevator-item-left">
                    <h4>🔧 Repair: ${tk.elevatorName}</h4>
                    <p>Issue: ${tk.category}</p>
                    <p class="subtext">Instruction: ${tk.description}</p>
                </div>
                <div class="elevator-item-right">
                    <span class="badge badge-warning">Service Request</span>
                    <button class="btn btn-outline-gold btn-sm" onclick="switchTab('emp-tasks')">Open Ticket</button>
                </div>
            </div>
        `;
    });

    // List installation projects
    empProjects.forEach(el => {
        miniTasks.innerHTML += `
            <div class="elevator-item">
                <div class="elevator-item-left">
                    <h4>🏗 Installation: ${el.buildingName}</h4>
                    <p>Current Stage: ${el.stages[el.currentStage].name}</p>
                    <p class="subtext">Overall Progress: ${el.progress}%</p>
                </div>
                <div class="elevator-item-right">
                    <span class="badge badge-info">Project Install</span>
                    <button class="btn btn-outline-gold btn-sm" onclick="switchTab('emp-tasks')">Update Stages</button>
                </div>
            </div>
        `;
    });

    // Quick stats updates
    document.getElementById("emp-stat-assigned-tasks").textContent = `${empTasks.length + empProjects.length} Tasks`;

    // Attendance card check
    const todayStr = new Date().toDateString();
    const log = state.attendance.find(at => at.employeeId === state.user.id && at.date === todayStr);

    if (log) {
        document.getElementById("emp-stat-attendance-status").textContent = "Present";
        document.getElementById("emp-stat-attendance-time").textContent = `Checked In at ${log.checkIn}`;
        
        // Disable clock-in, show clock-out
        document.getElementById("btn-clock-in").classList.add("hidden");
        
        const successPanel = document.getElementById("clock-success-panel");
        const statusLabel = document.getElementById("clock-status-label");
        const coordsText = document.getElementById("attendance-coords");

        if (log.checkOut) {
            document.getElementById("btn-clock-out").classList.add("hidden");
            if (successPanel) successPanel.classList.remove("hidden");
            if (statusLabel) statusLabel.textContent = `Clocked Out at ${log.checkOut}`;
        } else {
            document.getElementById("btn-clock-out").classList.remove("hidden");
            if (successPanel) successPanel.classList.remove("hidden");
            if (statusLabel) statusLabel.textContent = `Clocked In at ${log.checkIn}`;
        }
        if (coordsText) coordsText.textContent = `Location: ${log.location}`;
    } else {
        document.getElementById("emp-stat-attendance-status").textContent = "Absent";
        document.getElementById("emp-stat-attendance-time").textContent = "Check-in required";
        document.getElementById("btn-clock-in").classList.remove("hidden");
        document.getElementById("btn-clock-out").classList.add("hidden");
        const successPanel = document.getElementById("clock-success-panel");
        if (successPanel) successPanel.classList.add("hidden");
    }
}

function renderEmployeeAttendanceLog() {
    const tableBody = document.getElementById("employee-clock-table-body");
    if (!tableBody) return;

    const myLogs = state.attendance.filter(at => at.employeeId === state.user.id);
    tableBody.innerHTML = "";

    if (myLogs.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='4' class='text-center text-muted'>No check-ins logged for this period.</td></tr>";
        return;
    }

    myLogs.forEach(lg => {
        tableBody.innerHTML += `
            <tr>
                <td>${lg.date}</td>
                <td>${lg.checkIn}</td>
                <td>${lg.checkOut || "--"}</td>
                <td><span class="badge badge-success">Present</span></td>
            </tr>
        `;
    });
}

function renderEmployeeTaskList() {
    const sidebarList = document.getElementById("employee-tasks-sidebar-list");
    if (!sidebarList) return;

    const empTasks = state.tickets.filter(tk => tk.technicianId === state.user.id && tk.status !== "completed");
    const empProjects = state.elevators.filter(el => el.progress < 100);

    sidebarList.innerHTML = "";

    // Clear detail pane by default
    document.getElementById("employee-task-details-pane").innerHTML = `
        <div class="no-task-selected">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--text-muted)" stroke-width="1.5" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <p>Select an assigned task from the left list to update progress or complete reports.</p>
        </div>
    `;

    if (empTasks.length === 0 && empProjects.length === 0) {
        sidebarList.innerHTML = "<p class='text-muted text-center'>No active tasks.</p>";
        return;
    }

    // Render tickets
    empTasks.forEach(tk => {
        let cardClass = tk.category.includes("SOS") ? "task-mini-card border-danger bg-dark-danger" : "task-mini-card";
        let badgeColor = tk.category.includes("SOS") ? "badge-danger" : "badge-warning";
        
        sidebarList.innerHTML += `
            <div class="${cardClass}" onclick="selectEmployeeTask('ticket', '${tk.id}', this)">
                <h4>🔧 Repair: ${tk.elevatorName}</h4>
                <p>Issue: ${tk.category}</p>
                <span class="badge ${badgeColor}" style="margin-top:8px;">${tk.category.includes("SOS") ? 'CRITICAL SOS' : 'Open Ticket'}</span>
            </div>
        `;
    });

    // Render installation projects
    empProjects.forEach(el => {
        sidebarList.innerHTML += `
            <div class="task-mini-card" onclick="selectEmployeeTask('project', '${el.id}', this)">
                <h4>🏗 Install: ${el.buildingName}</h4>
                <p>Stage: ${el.stages[el.currentStage].name}</p>
                <span class="badge badge-info" style="margin-top:8px;">Project Install</span>
            </div>
        `;
    });
}

function selectEmployeeTask(type, id, element) {
    document.querySelectorAll(".task-mini-card").forEach(el => el.classList.remove("active"));
    if (element) element.classList.add("active");

    const pane = document.getElementById("employee-task-details-pane");
    if (!pane) return;
    
    if (type === "ticket") {
        const tk = state.tickets.find(t => t.id === id);
        pane.innerHTML = `
            <div class="task-details-header">
                <h2>🔧 Repair Request: ${tk.elevatorName}</h2>
                <p>Ticket ID: ${tk.id} | Assigned on ${tk.createdDate}</p>
            </div>
            <div class="task-details-body">
                <div class="info-block">
                    <h4>Problem Category</h4>
                    <p class="${tk.category.includes("SOS") ? 'text-danger font-bold' : ''}">${tk.category}</p>
                </div>
                <div class="info-block">
                    <h4>Customer Description</h4>
                    <p>${tk.description}</p>
                </div>
                <div class="action-block">
                    <h3 class="section-title">Submit Field Resolution Report</h3>
                    <form onsubmit="submitTaskResolution(event, '${tk.id}')">
                        <div class="form-group">
                            <label for="res-note">Action Taken / Resolution Note</label>
                            <textarea id="res-note" class="form-control" rows="3" placeholder="Explain what was fixed, parts replaced, etc." required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Digital Signature of Customer (Draw below)</label>
                            <div style="background: #050a10; border: 1px solid var(--border-color); border-radius: var(--radius-sm); position: relative; margin-bottom: 8px;">
                                <canvas id="signature-pad" width="400" height="150" style="width: 100%; height: 150px; display: block; cursor: crosshair;"></canvas>
                                <button type="button" class="btn btn-sm btn-outline-danger" onclick="clearSignaturePad()" style="position: absolute; bottom: 8px; right: 8px;">Clear</button>
                            </div>
                            <input type="hidden" id="res-signature-data" required>
                        </div>
                        <div class="form-group">
                            <label for="res-signature-name">Customer Name</label>
                            <input type="text" id="res-signature-name" class="form-control" placeholder="Type customer name (e.g. Ramesh Patel)" required>
                        </div>
                        <button type="submit" class="btn btn-success btn-full">Close Ticket & Submit Report</button>
                    </form>
                </div>
            </div>
        `;
        initSignaturePad();
    } else if (type === "project") {
        const el = state.elevators.find(e => e.id === id);
        const stage = el.stages[el.currentStage];
        
        pane.innerHTML = `
            <div class="task-details-header">
                <h2>🏗 Installation Project: ${el.buildingName}</h2>
                <p>Project ID: ${el.id} | Model: ${el.model}</p>
            </div>
            <div class="task-details-body">
                <div class="info-block">
                    <h4>Current Stage under Installation</h4>
                    <p><strong>Stage ${el.currentStage + 1}: ${stage.name}</strong></p>
                    <p class="subtext">Installation Status: In Progress</p>
                </div>
                <div class="info-block">
                    <h4>Site Address</h4>
                    <p>${el.address}</p>
                </div>
                <div class="action-block">
                    <h3 class="section-title">Update Milestone Completion</h3>
                    <p class="text-muted" style="font-size: 0.85rem; margin-bottom: 15px;">Confirm that stage <strong>${stage.name}</strong> is completed, and advance this elevator project to the next stage.</p>
                    <button class="btn btn-primary btn-full" onclick="advanceProjectStage('${el.id}')">Mark Stage Completed & Next Stage</button>
                </div>
            </div>
        `;
    }
}

// -- C. Admin Render Functions
function renderAdminDashboard() {
    // Top numbers
    document.getElementById("admin-stat-total-elevators").textContent = state.elevators.length;
    document.getElementById("admin-stat-pending-installs").textContent = state.elevators.filter(e => e.progress < 100).length;
    document.getElementById("admin-stat-open-tickets").textContent = state.tickets.filter(t => t.status !== "completed").length;
    
    const todayStr = new Date().toDateString();
    const presentCount = state.attendance.filter(at => at.date === todayStr).length;
    document.getElementById("admin-stat-staff-present").textContent = `${presentCount} / ${state.employees.length}`;

    // Projects list with progress bars
    const projectList = document.getElementById("admin-dashboard-project-list");
    if (!projectList) return;

    projectList.innerHTML = "";
    state.elevators.forEach(el => {
        projectList.innerHTML += `
            <div style="margin-bottom: 18px;">
                <div class="progress-info" style="font-size: 0.85rem; margin-bottom: 4px; display: flex; justify-content: space-between;">
                    <span>${el.buildingName} (${el.model})</span>
                    <span class="text-primary font-bold">${el.progress}%</span>
                </div>
                <div class="progress-bar-bg" style="height: 6px;">
                    <div class="progress-bar-fill" style="width: ${el.progress}%;"></div>
                </div>
            </div>
        `;
    });

    // SOS Alerts tracker
    const sosBox = document.getElementById("admin-sos-tracker-box");
    if (!sosBox) return;

    const sosAlerts = state.tickets.filter(tk => tk.category === "Emergency Breakdown (SOS)" && tk.status !== "completed");
    
    if (sosAlerts.length === 0) {
        sosBox.innerHTML = `
            <p class="text-muted text-center" style="padding: 20px 0;">All elevator operations running normally.</p>
        `;
    } else {
        sosBox.innerHTML = "";
        sosAlerts.forEach(sos => {
            sosBox.innerHTML += `
                <div class="sos-ticket-admin">
                    <h4 class="text-danger" style="margin-bottom:4px; display: flex; align-items:center; gap:8px;">
                        <span class="status-dot green" style="background: red; box-shadow: 0 0 6px red;"></span>
                        💥 DANGER: TRAPPED USER SOS
                    </h4>
                    <p><strong>Building:</strong> ${sos.elevatorName}</p>
                    <p><strong>Status:</strong> ${sos.status.toUpperCase()}</p>
                    <p style="font-size: 0.85rem;"><strong>Assigned Tech:</strong> ${sos.technicianName}</p>
                    <div style="display:flex; gap:10px; margin-top:8px;">
                        <button class="btn btn-primary btn-full btn-sm" onclick="switchTab('admin-tickets')">Go to Dispatches</button>
                    </div>
                </div>
            `;
        });
    }
}

function renderAdminProjects() {
    const tableBody = document.getElementById("admin-projects-table-body");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    state.elevators.forEach(el => {
        let badgeColor = "badge-success";
        if (el.progress < 100) badgeColor = "badge-warning";

        tableBody.innerHTML += `
            <tr>
                <td>
                    <strong>${el.buildingName}</strong>
                    <div class="subtext text-muted" style="font-size:0.75rem;">${el.address}</div>
                </td>
                <td>${el.model}</td>
                <td>
                    <div class="progress-bar-bg" style="width: 100px; height: 6px; display: inline-block; vertical-align: middle; margin-right: 6px;">
                        <div class="progress-bar-fill" style="width: ${el.progress}%;"></div>
                    </div>
                    <span class="badge ${badgeColor}">${el.progress}%</span>
                </td>
                <td>${el.progress === 100 ? "Handover Completed" : el.stages[el.currentStage].name}</td>
                <td>${el.handoverDate ? new Date(new Date(el.handoverDate).getTime() + new Date(el.handoverDate).getTimezoneOffset() * 60000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "--"}</td>
                <td>
                    <button class="btn btn-outline-danger btn-sm" onclick="deleteProject('${el.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

function renderAdminTickets() {
    const tableBody = document.getElementById("admin-tickets-table-body");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    state.tickets.forEach(tk => {
        let badgeColor = "badge-info";
        if (tk.status === "completed") badgeColor = "badge-success";
        if (tk.status === "assigned") badgeColor = "badge-warning";
        if (tk.category.includes("SOS") || tk.category.includes("Emergency")) badgeColor = "badge-danger animate-pulse";

        tableBody.innerHTML += `
            <tr>
                <td>${tk.id}</td>
                <td>
                    <strong>${tk.elevatorName}</strong>
                    <div class="subtext text-muted" style="font-size:0.75rem;">${tk.category}</div>
                </td>
                <td>${tk.description}</td>
                <td><span class="badge ${badgeColor}">${tk.status}</span></td>
                <td>${tk.technicianName}</td>
                <td>
                    ${tk.status === "pending" ? 
                      `<button class="btn btn-primary btn-sm" onclick="openAssignTicketModal('${tk.id}')">Assign Tech</button>` : 
                      `<span class="text-muted" style="font-size: 0.8rem;">Dispatched</span>`
                    }
                </td>
            </tr>
        `;
    });
}

function renderAdminAttendance() {
    const tableBody = document.getElementById("admin-attendance-table-body");
    if (!tableBody) return;

    const todayStr = new Date().toDateString();
    const todayLogs = state.attendance.filter(at => at.date === todayStr);

    tableBody.innerHTML = "";
    
    if (todayLogs.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='6' class='text-center text-muted' style='padding:20px 0;'>No employee check-ins logged for today.</td></tr>";
        return;
    }

    todayLogs.forEach(lg => {
        tableBody.innerHTML += `
            <tr>
                <td><strong>${lg.employeeName}</strong></td>
                <td>Technician</td>
                <td>${lg.checkIn}</td>
                <td>${lg.checkOut || "--"}</td>
                <td>${lg.location}</td>
                <td><span class="badge badge-success">Present</span></td>
            </tr>
        `;
    });
}

function renderAdminEmployeesList() {
    const tableBody = document.getElementById("admin-employee-table-body");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    state.employees.forEach(emp => {
        const isSelfOrPrimaryAdmin = emp.id === "EMP-101" || (state.user && state.user.id === emp.id);
        const actionHtml = isSelfOrPrimaryAdmin 
            ? `<span class="text-muted" style="font-size: 0.8rem;">Protected</span>`
            : `<button class="btn btn-outline-danger btn-sm" onclick="deleteEmployee('${emp.id}')">Remove</button>`;

        tableBody.innerHTML += `
            <tr>
                <td>${emp.id}</td>
                <td><strong>${emp.name}</strong></td>
                <td>${emp.role.toUpperCase()}</td>
                <td>${emp.phone}</td>
                <td>
                    <span class="badge ${emp.status === 'Active' ? 'badge-success' : 'badge-danger'}">
                        ${emp.status}
                    </span>
                </td>
                <td>
                    ${actionHtml}
                </td>
            </tr>
        `;
    });
}

function renderNotificationsList() {
    const notiList = document.getElementById("noti-list");
    const badgeCount = document.getElementById("noti-badge-count");
    if (!notiList || !badgeCount) return;

    badgeCount.textContent = state.notifications.length;
    if (state.notifications.length === 0) {
        badgeCount.classList.add("hidden");
        notiList.innerHTML = "<p class='text-muted text-center' style='padding:16px;'>No notifications yet.</p>";
        return;
    }
    
    badgeCount.classList.remove("hidden");
    notiList.innerHTML = "";
    state.notifications.forEach(nt => {
        notiList.innerHTML += `
            <div class="noti-item">
                <span>${nt.message}</span>
                <span class="noti-time">${nt.time}</span>
            </div>
        `;
    });
}

// Toggle notifications dropdown panel
function toggleNotifications() {
    const panel = document.getElementById("noti-panel");
    if (panel) panel.classList.toggle("hidden");
}

function clearNotifications(e) {
    if (e) e.stopPropagation();
    state.notifications = [];
    saveStateToStorage("ge_notifications", state.notifications);
    renderActivePortalViews();
}

// 7. Action Forms Submission Handling

// -- A. Customer Actions
function submitServiceRequest(e) {
    e.preventDefault();
    const elevatorId = document.getElementById("ticket-elevator").value;
    const category = document.getElementById("ticket-issue-type").value;
    const description = document.getElementById("ticket-desc").value;
    
    const elevator = state.elevators.find(el => el.id === elevatorId);
    
    const newTicket = {
        id: `TCKT-${Math.floor(100 + Math.random() * 900)}`,
        elevatorId: elevatorId,
        elevatorName: elevator ? elevator.buildingName : "Unknown Elevator",
        category: category,
        description: description,
        status: "pending",
        technicianId: "",
        technicianName: "Unassigned",
        createdDate: new Date().toISOString().split('T')[0],
        resolutionNote: ""
    };

    state.tickets.push(newTicket);
    saveStateToStorage("ge_tickets", state.tickets);
    
    // Add Notification
    addNotification(`New support ticket ${newTicket.id} filed for ${newTicket.elevatorName}.`);
    
    // Reset Form
    document.getElementById("service-request-form").reset();
    
    // Re-render
    renderActivePortalViews();
}

function triggerSOS() {
    const newSOS = {
        id: `TCKT-SOS-${Math.floor(100 + Math.random() * 900)}`,
        elevatorId: "ELEV-001",
        elevatorName: "Skyline Residency - Block A (TRAPPED SOS)",
        category: "Emergency Breakdown (SOS)",
        description: "EMERGENCY: User pressed Trapped Panic SOS Button inside app.",
        status: "pending",
        technicianId: "",
        technicianName: "Unassigned",
        createdDate: new Date().toISOString().split('T')[0],
        resolutionNote: ""
    };

    state.tickets.unshift(newSOS);
    saveStateToStorage("ge_tickets", state.tickets);

    addNotification(`🚨 CRITICAL EMERGENCY SOS triggered at Skyline Residency - Block A!`);
    
    closeEmergencyModal();
    alert("Emergency SOS Sent! Local technicians and GE administrators have been notified.");
    renderActivePortalViews();
}

// -- B. Employee Actions
function performClockIn() {
    const todayStr = new Date().toDateString();
    const timeStr = new Date().toLocaleTimeString();
    
    const geoIndicator = document.getElementById("geo-status-indicator");
    const loc = geoIndicator ? geoIndicator.textContent.replace("GPS Coordinates Secured: ", "").replace("Simulated GPS Location Active: ", "") : "Worli Mumbai";

    const log = {
        id: `ATT-${Math.floor(1000 + Math.random() * 9000)}`,
        employeeId: state.user.id,
        employeeName: state.user.name,
        date: todayStr,
        checkIn: timeStr,
        checkOut: "",
        location: loc
    };

    state.attendance.push(log);
    
    // Update employee status in database
    const idx = state.employees.findIndex(em => em.id === state.user.id);
    if (idx !== -1) {
        state.employees[idx].status = "Active";
    }
    
    saveStateToStorage("ge_employees", state.employees);
    saveStateToStorage("ge_attendance", state.attendance);

    addNotification(`${state.user.name} checked in at ${timeStr}.`);

    renderActivePortalViews();
}

function performClockOut() {
    const todayStr = new Date().toDateString();
    const timeStr = new Date().toLocaleTimeString();

    const idxAtt = state.attendance.findIndex(at => at.employeeId === state.user.id && at.date === todayStr && at.checkOut === "");
    if (idxAtt !== -1) {
        state.attendance[idxAtt].checkOut = timeStr;
    }

    const idxEmp = state.employees.findIndex(em => em.id === state.user.id);
    if (idxEmp !== -1) {
        state.employees[idxEmp].status = "Inactive";
    }

    saveStateToStorage("ge_employees", state.employees);
    saveStateToStorage("ge_attendance", state.attendance);

    addNotification(`${state.user.name} checked out at ${timeStr}.`);

    renderActivePortalViews();
}

function submitTaskResolution(e, ticketId) {
    e.preventDefault();
    const resNote = document.getElementById("res-note").value;
    const sigData = document.getElementById("res-signature-data").value;
    const sigName = document.getElementById("res-signature-name").value;
    
    if (!sigData) {
        alert("Please request the customer to sign on the canvas before submitting.");
        return;
    }

    const idx = state.tickets.findIndex(tk => tk.id === ticketId);
    if (idx !== -1) {
        state.tickets[idx].status = "completed";
        state.tickets[idx].resolutionNote = resNote;
        state.tickets[idx].signatureData = sigData;
        state.tickets[idx].signatureName = sigName;
        state.tickets[idx].closedDate = new Date().toISOString().split('T')[0];
    }

    saveStateToStorage("ge_tickets", state.tickets);
    addNotification(`Service ticket ${ticketId} resolved and signed off by ${sigName}.`);
    
    renderActivePortalViews();
}

function advanceProjectStage(projectId) {
    const idx = state.elevators.findIndex(el => el.id === projectId);
    if (idx === -1) return;

    const el = state.elevators[idx];
    el.stages[el.currentStage].status = "completed";
    el.stages[el.currentStage].date = new Date().toISOString().split('T')[0];

    if (el.currentStage < el.stages.length - 1) {
        el.currentStage++;
        el.stages[el.currentStage].status = "in-progress";
        el.progress = Math.min(99, Math.round(((el.currentStage) / el.stages.length) * 100));
        addNotification(`Project ${el.buildingName} advanced to Stage ${el.currentStage + 1}: ${el.stages[el.currentStage].name}.`);
    } else {
        el.progress = 100;
        addNotification(`Project ${el.buildingName} installation completed!`);
    }

    saveStateToStorage("ge_elevators", state.elevators);
    renderActivePortalViews();
}

// -- C. Admin Actions
function openAssignTicketModal(ticketId) {
    const modal = document.getElementById("assign-ticket-modal");
    if (!modal) return;

    document.getElementById("assign-ticket-id").value = ticketId;
    
    // Load active technicians in dropdown
    const select = document.getElementById("assign-select-tech");
    const techs = state.employees.filter(emp => emp.role === "technician");
    
    select.innerHTML = techs.map(tc => `<option value="${tc.id}">${tc.name} (${tc.status})</option>`).join("");
    
    modal.classList.remove("hidden");
}

function closeAssignTicketModal() {
    const modal = document.getElementById("assign-ticket-modal");
    if (modal) modal.classList.add("hidden");
}

function saveTicketAssignment(e) {
    e.preventDefault();
    const ticketId = document.getElementById("assign-ticket-id").value;
    const techId = document.getElementById("assign-select-tech").value;
    const tech = state.employees.find(emp => emp.id === techId);

    const idx = state.tickets.findIndex(tk => tk.id === ticketId);
    if (idx !== -1 && tech) {
        state.tickets[idx].status = "assigned";
        state.tickets[idx].technicianId = tech.id;
        state.tickets[idx].technicianName = tech.name;
        
        addNotification(`Ticket ${ticketId} assigned to technician ${tech.name}.`);
    }

    saveStateToStorage("ge_tickets", state.tickets);
    closeAssignTicketModal();
    renderActivePortalViews();
}

// Projects Management
function openAddProjectModal() {
    const modal = document.getElementById("add-project-modal");
    if (modal) modal.classList.remove("hidden");
}

function closeAddProjectModal() {
    const modal = document.getElementById("add-project-modal");
    if (modal) modal.classList.add("hidden");
}

function saveNewProject(e) {
    e.preventDefault();
    const name = document.getElementById("proj-client-name").value.trim();
    const email = document.getElementById("proj-client-email").value.trim().toLowerCase();
    const address = document.getElementById("proj-address").value.trim();
    const model = document.getElementById("proj-model").value;
    const date = document.getElementById("proj-handover").value;

    // Check if client user already exists, if not create one
    const existingCust = state.employees.find(emp => emp.email && emp.email.toLowerCase() === email);
    if (!existingCust) {
        const custUser = {
            id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
            name: name,
            email: email,
            password: "", // Setup required
            role: "customer",
            phone: "+91 9999999999",
            status: "Active",
            roleDetail: `Client (${name})`
        };
        state.employees.push(custUser);
        saveStateToStorage("ge_employees", state.employees);
    }

    const newProj = {
        id: `ELEV-00${state.elevators.length + 1}`,
        buildingName: name,
        clientName: name,
        clientEmail: email,
        address: address,
        model: model,
        progress: 10,
        currentStage: 0,
        handoverDate: date,
        stages: [
            { name: "Site Readiness Inspection", status: "in-progress", date: "" },
            { name: "Shaft Plumb Line Verification", status: "pending", date: "" },
            { name: "Bracket & Guide Rail Mounting", status: "pending", date: "" },
            { name: "Landing Door Alignment", status: "pending", date: "" },
            { name: "Car Frame & Cabin Assembly", status: "pending", date: "" },
            { name: "Traction Machine & Rope Laying", status: "pending", date: "" },
            { name: "Electrical Wiring & Control Panel", status: "pending", date: "" },
            { name: "Safety Gear & Speed Governor Calibration", status: "pending", date: "" },
            { name: "Final Inspection & Licensing Signoff", status: "pending", date: "" }
        ]
    };

    state.elevators.push(newProj);
    saveStateToStorage("ge_elevators", state.elevators);
    addNotification(`New project for ${name} registered successfully.`);

    document.getElementById("add-project-form").reset();
    closeAddProjectModal();
    renderActivePortalViews();
}

function deleteProject(projectId) {
    if (!confirm("Are you sure you want to delete this elevator project and revoke the customer's portal access?")) return;
    const proj = state.elevators.find(el => el.id === projectId);
    if (!proj) return;
    
    // Delete the elevator project
    state.elevators = state.elevators.filter(el => el.id !== projectId);
    saveStateToStorage("ge_elevators", state.elevators);

    // Clean up the associated customer from the user directory
    state.employees = state.employees.filter(emp => emp.email !== proj.clientEmail);
    saveStateToStorage("ge_employees", state.employees);

    addNotification(`Deleted project ${proj.buildingName} and associated customer user.`);
    renderActivePortalViews();
}

// Staff Management
function openAddEmployeeModal() {
    const modal = document.getElementById("add-employee-modal");
    if (modal) modal.classList.remove("hidden");
}

function closeAddEmployeeModal() {
    const modal = document.getElementById("add-employee-modal");
    if (modal) modal.classList.add("hidden");
}

function saveNewEmployee(e) {
    e.preventDefault();
    const name = document.getElementById("emp-name").value.trim();
    const email = document.getElementById("emp-email").value.trim().toLowerCase();
    const role = document.getElementById("emp-role").value;
    const phone = document.getElementById("emp-phone").value.trim();

    const existingEmp = state.employees.find(emp => emp.email && emp.email.toLowerCase() === email);
    if (existingEmp) {
        alert("A user with this email address already exists.");
        return;
    }

    const newEmp = {
        id: `EMP-${Math.floor(104 + Math.random() * 900)}`,
        name: name,
        email: email,
        password: "", // Setup required
        role: role,
        phone: phone,
        status: "Inactive",
        roleDetail: role.toUpperCase() === "ADMIN" ? "Operations Admin" : `GE ${role.charAt(0).toUpperCase() + role.slice(1)}`
    };

    state.employees.push(newEmp);
    saveStateToStorage("ge_employees", state.employees);
    addNotification(`Staff member ${name} registered as ${role}.`);

    document.getElementById("add-employee-form").reset();
    closeAddEmployeeModal();
    renderActivePortalViews();
}

function deleteEmployee(empId) {
    // Prevent deleting primary admin or self
    if (empId === "EMP-101") {
        alert("Cannot delete primary system administrator.");
        return;
    }
    if (state.user && state.user.id === empId) {
        alert("Cannot delete your own active administrator profile.");
        return;
    }
    if (!confirm("Are you sure you want to delete this staff member? This will permanently revoke their access.")) return;
    const emp = state.employees.find(e => e.id === empId);
    if (!emp) return;

    state.employees = state.employees.filter(e => e.id !== empId);
    saveStateToStorage("ge_employees", state.employees);

    addNotification(`Staff member ${emp.name} deleted.`);
    renderActivePortalViews();
}

// Emergency Modal Toggles
function openEmergencyModal() {
    const modal = document.getElementById("emergency-modal");
    if (modal) modal.classList.remove("hidden");
}

function closeEmergencyModal() {
    const modal = document.getElementById("emergency-modal");
    if (modal) modal.classList.add("hidden");
}

// Responsive Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) sidebar.classList.toggle("active");
}

// ==========================================================================
// 8. Signature Drawing Canvas Engine
// ==========================================================================
let signatureDrawing = false;
let sigCanvas, sigCtx;

function initSignaturePad() {
    sigCanvas = document.getElementById("signature-pad");
    if (!sigCanvas) return;

    sigCtx = sigCanvas.getContext("2d");
    sigCtx.strokeStyle = "#005eb8"; // Gold brush style
    sigCtx.lineWidth = 3;
    sigCtx.lineCap = "round";

    // Set canvas dimensions explicitly for drawing precision
    sigCanvas.width = sigCanvas.offsetWidth;
    sigCanvas.height = sigCanvas.offsetHeight;
    
    // Clear initial state
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);

    const hiddenInput = document.getElementById("res-signature-data");

    function getCoordinates(e) {
        const rect = sigCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        return {
            x: ((clientX - rect.left) / rect.width) * sigCanvas.width,
            y: ((clientY - rect.top) / rect.height) * sigCanvas.height
        };
    }

    function startDrawing(e) {
        e.preventDefault();
        signatureDrawing = true;
        const pos = getCoordinates(e);
        sigCtx.beginPath();
        sigCtx.moveTo(pos.x, pos.y);
    }

    function draw(e) {
        if (!signatureDrawing) return;
        e.preventDefault();
        const pos = getCoordinates(e);
        sigCtx.lineTo(pos.x, pos.y);
        sigCtx.stroke();
        
        if (hiddenInput) {
            hiddenInput.value = sigCanvas.toDataURL(); // Capture base64 PNG
        }
    }

    function stopDrawing() {
        signatureDrawing = false;
    }

    // Mouse Events
    sigCanvas.addEventListener("mousedown", startDrawing);
    sigCanvas.addEventListener("mousemove", draw);
    sigCanvas.addEventListener("mouseup", stopDrawing);
    sigCanvas.addEventListener("mouseleave", stopDrawing);

    // Touch Support for Mobiles
    sigCanvas.addEventListener("touchstart", startDrawing, { passive: false });
    sigCanvas.addEventListener("touchmove", draw, { passive: false });
    sigCanvas.addEventListener("touchend", stopDrawing);
}

function clearSignaturePad() {
    if (sigCanvas && sigCtx) {
        sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
        const hiddenInput = document.getElementById("res-signature-data");
        if (hiddenInput) hiddenInput.value = "";
    }
}

// ==========================================================================
// 9. Premium Service Report & PDF Invoice Generator
// ==========================================================================
function openInvoiceModal(ticketId) {
    const modal = document.getElementById("invoice-modal");
    const container = document.getElementById("invoice-modal-body");
    if (!modal || !container) return;

    const tk = state.tickets.find(t => t.id === ticketId);
    if (!tk) return;

    // Simulate itemized billing details
    const isEmergency = tk.category.includes("SOS") || tk.category.includes("Emergency");
    const baseFee = isEmergency ? 2500 : 800;
    const partsFee = isEmergency ? 1200 : 0;
    const taxes = Math.round((baseFee + partsFee) * 0.18); // 18% CGST + SGST
    const totalAmount = baseFee + partsFee + taxes;

    container.innerHTML = `
        <div class="invoice-container">
            <div class="invoice-header">
                <div class="invoice-logo-title">
                    <h2>General Electric Elevators</h2>
                    <p>LIFTCARE PRO</p>
                    <span style="font-size:0.75rem; color:#4b5563;">Plot No. 12, MIDC Industrial Area, Mumbai, IN</span>
                </div>
                <div class="invoice-details-meta">
                    <strong>Invoice #:</strong> GE-${tk.id}<br/>
                    <strong>Date Issued:</strong> ${tk.closedDate || tk.createdDate}<br/>
                    <strong>Status:</strong> <span class="invoice-stamp">${tk.status === 'completed' ? 'PAID' : 'DUE'}</span>
                </div>
            </div>
            
            <div class="invoice-grid">
                <div class="invoice-bill-item">
                    <h4>Customer Billing Details</h4>
                    <p>
                        <strong>Name:</strong> ${tk.signatureName || "Skyline Resident Admin"}<br/>
                        <strong>Location:</strong> ${tk.elevatorName}<br/>
                        <strong>Ticket Reference:</strong> ${tk.id}
                    </p>
                </div>
                <div class="invoice-bill-item">
                    <h4>Maintenance Summary</h4>
                    <p>
                        <strong>Technician:</strong> ${tk.technicianName}<br/>
                        <strong>Issue Category:</strong> ${tk.category}<br/>
                        <strong>Completion Date:</strong> ${tk.closedDate || "--"}
                    </p>
                </div>
            </div>

            <div class="invoice-section-title">Field Service Diagnosis & Action</div>
            <p style="font-size: 0.85rem; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
                ${tk.resolutionNote || "System recalibration completed. Door safety interlock and guide rails inspected."}
            </p>

            <div class="invoice-section-title">Itemized Charges</div>
            <table class="invoice-billing-table">
                <thead>
                    <tr>
                        <th>Description of Service / Part</th>
                        <th>Rate (INR)</th>
                        <th>Qty</th>
                        <th>Amount (INR)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>Standard Calibration & Repair Visit</strong>
                            <div style="font-size:0.75rem; color:#6b7280;">Includes elevator control panel diagnostic checkout</div>
                        </td>
                        <td>₹${baseFee}</td>
                        <td>1</td>
                        <td>₹${baseFee}</td>
                    </tr>
                    ${partsFee > 0 ? `
                    <tr>
                        <td>
                            <strong>Emergency Safety Gear Sensor Replacement</strong>
                            <div style="font-size:0.75rem; color:#6b7280;">Refit electrical limit switch relays</div>
                        </td>
                        <td>₹${partsFee}</td>
                        <td>1</td>
                        <td>₹${partsFee}</td>
                    </tr>` : ""}
                    <tr>
                        <td colspan="3" style="text-align: right; font-weight:600;">Subtotal</td>
                        <td>₹${baseFee + partsFee}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align: right; font-weight:600;">GST (18%)</td>
                        <td>₹${taxes}</td>
                    </tr>
                    <tr class="invoice-total-row">
                        <td colspan="3" style="text-align: right;">Total Amount Due</td>
                        <td>₹${totalAmount}</td>
                    </tr>
                </tbody>
            </table>

            <div class="invoice-signature-section">
                <div class="invoice-sign-box">
                    <div class="invoice-sign-line">
                        <div style="border: 1px solid #10b981; color: #10b981; padding: 2px 8px; font-size:0.65rem; border-radius:3px; font-weight:bold;">DIGITALLY VERIFIED</div>
                    </div>
                    <span>GE Supervisor Signoff</span>
                </div>
                <div class="invoice-sign-box">
                    <div class="invoice-sign-line">
                        ${tk.signatureData ? `<img src="${tk.signatureData}" alt="Customer Signature" />` : `<span style="color:#d1d5db; font-size:0.75rem;">No signature captured</span>`}
                    </div>
                    <span>Client Authorization Sign</span>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove("hidden");
}

function closeInvoiceModal() {
    const modal = document.getElementById("invoice-modal");
    if (modal) modal.classList.add("hidden");
}

function printInvoice() {
    window.print();
}

// ==========================================================================
// 10. Admin Tickets Extension for Invoices & Realtime Sync
// ==========================================================================
// Hook a listener to real-time local storage sync between browser tabs
window.addEventListener("storage", function(e) {
    if (e.key && e.key.startsWith("ge_")) {
        loadStateFromStorage();
        renderActivePortalViews();
    }
});

// Update renderAdminTickets to add report view
const originalRenderAdminTickets = renderAdminTickets;
renderAdminTickets = function() {
    const tableBody = document.getElementById("admin-tickets-table-body");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    state.tickets.forEach(tk => {
        let badgeColor = "badge-info";
        if (tk.status === "completed") badgeColor = "badge-success";
        if (tk.status === "assigned") badgeColor = "badge-warning";
        if (tk.category.includes("SOS") || tk.category.includes("Emergency")) badgeColor = "badge-danger animate-pulse";

        tableBody.innerHTML += `
            <tr>
                <td>${tk.id}</td>
                <td>
                    <strong>${tk.elevatorName}</strong>
                    <div class="subtext text-muted" style="font-size:0.75rem;">${tk.category}</div>
                </td>
                <td>${tk.description}</td>
                <td><span class="badge ${badgeColor}">${tk.status}</span></td>
                <td>${tk.technicianName}</td>
                <td>
                    <div style="display:flex; gap:8px;">
                        ${tk.status === "pending" ? 
                          `<button class="btn btn-primary btn-sm" onclick="openAssignTicketModal('${tk.id}')">Assign Tech</button>` : 
                          `<span class="text-muted" style="font-size: 0.8rem; display:inline-block; align-self:center; margin-right:8px;">Dispatched</span>`
                        }
                        ${tk.status === "completed" ? 
                          `<button class="btn btn-outline-gold btn-sm" onclick="openInvoiceModal('${tk.id}')">View Invoice</button>` : ""
                        }
                    </div>
                </td>
            </tr>
        `;
    });
};

