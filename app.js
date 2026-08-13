/**
 * CAMPUSCONNECT COLLEGE DIGITAL NOTICE BOARD - APPLICATION LOGIC
 * Multi-Role Auth System: Student, Teacher, Admin (User ID: 12345, Password: aaa)
 */

const STORAGE_KEY_NOTICES = 'campus_notices_v2';
const STORAGE_KEY_USERS = 'campus_users_v2';
const STORAGE_KEY_SESSION = 'campus_session_v2';

// Pre-configured Admin credentials
const ADMIN_CREDENTIALS = {
    userId: '12345',
    password: 'aaa',
    name: 'College Administrator',
    role: 'admin',
    department: 'Administrative HQ'
};

// Initial Seed Users
const SEED_USERS = [
    ADMIN_CREDENTIALS,
    {
        userId: 'STU101',
        password: 'pass123',
        name: 'Ananya Rao',
        role: 'student',
        department: 'Computer Science (CSE)'
    },
    {
        userId: 'TCH201',
        password: 'pass123',
        name: 'Dr. V. K. Murthy',
        role: 'teacher',
        department: 'Electronics (ECE)'
    }
];

// Initial College Sample Notices
const SEED_NOTICES = [
    {
        id: 'notice-201',
        title: '📢 B.Tech End Semester Main Examination Time Table',
        category: 'Academic & Exams',
        priority: 'Urgent',
        audience: 'All Students',
        pinned: true,
        content: 'The official schedule for End Semester Theory & Practical examinations for all B.Tech branches has been published. Hall tickets will be issued at the Controller of Exams desk from 10:00 AM onwards.',
        attachment: 'https://college.edu/exam-timetable-2026.pdf',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        views: 312,
        acknowledgments: 145
    },
    {
        id: 'notice-202',
        title: '🏢 TCS & Infosys On-Campus Placement Recruitment Drive',
        category: 'Placements & Internships',
        priority: 'Urgent',
        audience: 'Final Year Students',
        pinned: true,
        content: 'Placement drive for TCS Ninja/Digital & Infosys Specialist Programmer tracks starts next Monday. Eligible B.Tech 4th year students must complete registration on the Training & Placement portal before Friday 5:00 PM.',
        attachment: 'https://college.edu/placements-tcs-infosys',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        views: 450,
        acknowledgments: 210
    },
    {
        id: 'notice-203',
        title: '🏆 Annual Inter-College Sports & Cultural Fest 2026',
        category: 'Events & Sports',
        priority: 'High',
        audience: 'All Students',
        pinned: false,
        content: 'Registration for Cricket, Football, Badminton, Robotics League, and Coding Hackathon is now open. Team registrations must be submitted to the Student Activity Center by end of this week.',
        attachment: 'https://college.edu/sports-fest',
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
        views: 188,
        acknowledgments: 76
    },
    {
        id: 'notice-204',
        title: '📚 Central Library Book Return Clearance & Fine Exemption',
        category: 'Library & Fees',
        priority: 'Normal',
        audience: 'All Students',
        pinned: false,
        content: 'All students are requested to return borrowed library books for semester stock verification. Late fee exemption applies for books returned before the 25th of this month.',
        attachment: '',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        views: 120,
        acknowledgments: 52
    },
    {
        id: 'notice-205',
        title: '💻 Hands-on Workshop on Generative AI & LLM Fine-Tuning',
        category: 'Academic & Exams',
        priority: 'High',
        audience: 'CSE Department',
        pinned: true,
        content: 'Organized by CSE Dept in collaboration with Industry Experts. Learn building RAG pipelines, LangChain, and fine-tuning open source LLMs. Limited to 80 seats on a first-come, first-served basis.',
        attachment: 'https://college.edu/genai-workshop',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        views: 235,
        acknowledgments: 98
    }
];

// Global State
let users = [];
let notices = [];
let currentUser = null;
let searchQuery = '';
let activeCategory = 'all';
let activeAudience = 'all';
let sortBy = 'newest';
let currentDetailNoticeId = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    loadSession();
    loadNotices();
    renderAll();
});

/* ==========================================================================
   PERSISTENCE & SESSION
   ========================================================================== */
function loadUsers() {
    const stored = localStorage.getItem(STORAGE_KEY_USERS);
    if (stored) {
        try {
            users = JSON.parse(stored);
        } catch (e) {
            users = [...SEED_USERS];
            saveUsers();
        }
    } else {
        users = [...SEED_USERS];
        saveUsers();
    }
}

function saveUsers() {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

function loadSession() {
    const session = localStorage.getItem(STORAGE_KEY_SESSION);
    if (session) {
        try {
            currentUser = JSON.parse(session);
        } catch (e) {
            currentUser = null;
        }
    }
    updateUserSessionUI();
}

function saveSession(user) {
    currentUser = user;
    if (user) {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
    } else {
        localStorage.removeItem(STORAGE_KEY_SESSION);
    }
    updateUserSessionUI();
}

function loadNotices() {
    const stored = localStorage.getItem(STORAGE_KEY_NOTICES);
    if (stored) {
        try {
            notices = JSON.parse(stored);
        } catch (e) {
            notices = [...SEED_NOTICES];
            saveNotices();
        }
    } else {
        notices = [...SEED_NOTICES];
        saveNotices();
    }
}

function saveNotices() {
    localStorage.setItem(STORAGE_KEY_NOTICES, JSON.stringify(notices));
}

function seedSampleData() {
    if (confirm('Reset college notice board to default sample data?')) {
        notices = [...SEED_NOTICES];
        saveNotices();
        renderAll();
        showToast('Notice board reset to original college sample data', 'info');
    }
}

/* ==========================================================================
   AUTHENTICATION & TAB CONTROL
   ========================================================================== */
function openAuthModal(defaultTab = 'student') {
    switchAuthTab(defaultTab);
    document.getElementById('authModal').classList.add('active');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
}

function switchAuthTab(tabName) {
    const tabs = document.querySelectorAll('#authTabs .auth-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    const targetTab = document.querySelector(`#authTabs .auth-tab[data-tab="${tabName}"]`);
    if (targetTab) targetTab.classList.add('active');

    // Hide all forms
    document.getElementById('studentLoginForm').classList.add('hidden');
    document.getElementById('teacherLoginForm').classList.add('hidden');
    document.getElementById('adminLoginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');

    // Show active form
    if (tabName === 'student') document.getElementById('studentLoginForm').classList.remove('hidden');
    if (tabName === 'teacher') document.getElementById('teacherLoginForm').classList.remove('hidden');
    if (tabName === 'admin') document.getElementById('adminLoginForm').classList.remove('hidden');
    if (tabName === 'register') document.getElementById('registerForm').classList.remove('hidden');
}

function handleLogin(e, role) {
    e.preventDefault();

    let userIdInput = '';
    let passwordInput = '';

    if (role === 'student') {
        userIdInput = document.getElementById('studentUserId').value.trim();
        passwordInput = document.getElementById('studentPassword').value;
    } else if (role === 'teacher') {
        userIdInput = document.getElementById('teacherUserId').value.trim();
        passwordInput = document.getElementById('teacherPassword').value;
    } else if (role === 'admin') {
        userIdInput = document.getElementById('adminUserId').value.trim();
        passwordInput = document.getElementById('adminPassword').value;
    }

    // Check matching user
    const foundUser = users.find(u => 
        u.userId.toLowerCase() === userIdInput.toLowerCase() && 
        u.password === passwordInput &&
        u.role === role
    );

    if (foundUser) {
        saveSession(foundUser);
        closeAuthModal();
        renderAll();
        showToast(`Welcome back, ${foundUser.name}! (${foundUser.role.toUpperCase()} Portal Active)`, 'success');
    } else {
        showToast(`Invalid ${role.toUpperCase()} credentials. Check User ID and Password!`, 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();

    const role = document.getElementById('regRole').value;
    const name = document.getElementById('regName').value.trim();
    const userId = document.getElementById('regUserId').value.trim();
    const department = document.getElementById('regDepartment').value;
    const password = document.getElementById('regPassword').value;

    if (!name || !userId || !password) {
        showToast('Please fill out all required fields.', 'error');
        return;
    }

    // Check existing
    const existing = users.find(u => u.userId.toLowerCase() === userId.toLowerCase());
    if (existing) {
        showToast(`User ID "${userId}" already exists. Please login instead.`, 'warning');
        return;
    }

    const newUser = {
        userId,
        password,
        name,
        role,
        department
    };

    users.push(newUser);
    saveUsers();

    // Auto login
    saveSession(newUser);
    closeAuthModal();
    renderAll();
    showToast(`Account created successfully! Welcome ${name}`, 'success');
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        saveSession(null);
        renderAll();
        showToast('Logged out successfully', 'info');
    }
}

function updateUserSessionUI() {
    const userProfileBadge = document.getElementById('userProfileBadge');
    const userAuthBtn = document.getElementById('userAuthBtn');
    const adminAuthBtn = document.getElementById('adminAuthBtn');
    const postNoticeBtn = document.getElementById('postNoticeBtn');

    if (currentUser) {
        userProfileBadge.classList.remove('hidden');
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();

        const roleBadge = document.getElementById('userRoleBadge');
        roleBadge.textContent = currentUser.role.toUpperCase();

        if (currentUser.role === 'admin') {
            roleBadge.className = 'badge badge-primary';
            postNoticeBtn.classList.remove('hidden');
            adminAuthBtn.classList.add('hidden');
            userAuthBtn.classList.add('hidden');
        } else if (currentUser.role === 'teacher') {
            roleBadge.className = 'badge badge-info';
            postNoticeBtn.classList.add('hidden');
            adminAuthBtn.classList.remove('hidden');
            userAuthBtn.classList.add('hidden');
        } else {
            roleBadge.className = 'badge badge-success';
            postNoticeBtn.classList.add('hidden');
            adminAuthBtn.classList.remove('hidden');
            userAuthBtn.classList.add('hidden');
        }
    } else {
        userProfileBadge.classList.add('hidden');
        postNoticeBtn.classList.add('hidden');
        adminAuthBtn.classList.remove('hidden');
        userAuthBtn.classList.remove('hidden');
    }
}

/* ==========================================================================
   SEARCH, FILTERING & SORTING
   ========================================================================== */
function handleSearchInput() {
    searchQuery = document.getElementById('searchInput').value.trim().toLowerCase();
    const clearBtn = document.getElementById('clearSearchBtn');
    if (searchQuery) {
        clearBtn.classList.remove('hidden');
    } else {
        clearBtn.classList.add('hidden');
    }
    renderAll();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    searchQuery = '';
    document.getElementById('clearSearchBtn').classList.add('hidden');
    renderAll();
}

function setCategoryFilter(category, btnElement) {
    activeCategory = category;
    const pills = document.querySelectorAll('#categoryPills .pill');
    pills.forEach(pill => pill.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    renderAll();
}

function handleFilterChange() {
    activeAudience = document.getElementById('audienceFilter').value;
    sortBy = document.getElementById('sortBy').value;
    renderAll();
}

function resetAllFilters() {
    searchQuery = '';
    activeCategory = 'all';
    activeAudience = 'all';
    sortBy = 'newest';

    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearchBtn').classList.add('hidden');
    document.getElementById('audienceFilter').value = 'all';
    document.getElementById('sortBy').value = 'newest';

    const pills = document.querySelectorAll('#categoryPills .pill');
    pills.forEach(pill => pill.classList.remove('active'));
    document.querySelector('#categoryPills .pill[data-category="all"]').classList.add('active');

    renderAll();
    showToast('Filters reset', 'info');
}

function getFilteredNotices() {
    return notices.filter(notice => {
        const matchesSearch = !searchQuery || 
            notice.title.toLowerCase().includes(searchQuery) ||
            notice.content.toLowerCase().includes(searchQuery) ||
            notice.category.toLowerCase().includes(searchQuery) ||
            notice.audience.toLowerCase().includes(searchQuery);

        const matchesCategory = activeCategory === 'all' || notice.category === activeCategory;
        const matchesAudience = activeAudience === 'all' || notice.audience === activeAudience;

        return matchesSearch && matchesCategory && matchesAudience;
    }).sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.timestamp) - new Date(a.timestamp);
        if (sortBy === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp);
        if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
        if (sortBy === 'pinned') return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        return 0;
    });
}

/* ==========================================================================
   RENDER SYSTEM
   ========================================================================== */
function renderAll() {
    renderTicker();
    renderStats();
    renderNoticeGrids();
}

function renderTicker() {
    const tickerContent = document.getElementById('tickerContent');
    const urgentItems = notices.filter(n => n.priority === 'Urgent');

    if (urgentItems.length === 0) {
        tickerContent.innerHTML = `<span class="ticker-item"><span class="badge-ticker">CAMPUS</span> Welcome to CampusConnect Notice Board!</span>`;
        return;
    }

    tickerContent.innerHTML = urgentItems.map(item => `
        <span class="ticker-item" onclick="openDetailModal('${item.id}')" style="cursor: pointer;">
            <span class="badge-ticker">${item.category.toUpperCase()}</span>
            <strong>${escapeHTML(item.title)}</strong>
        </span>
    `).join(' • ');
}

function renderStats() {
    document.getElementById('totalNoticesCount').textContent = notices.length;
    document.getElementById('examNoticesCount').textContent = notices.filter(n => n.category === 'Academic & Exams').length;
    document.getElementById('placementNoticesCount').textContent = notices.filter(n => n.category === 'Placements & Internships').length;
    document.getElementById('pinnedNoticesCount').textContent = notices.filter(n => n.pinned).length;
}

function renderNoticeGrids() {
    const filtered = getFilteredNotices();
    const pinnedSection = document.getElementById('pinnedSection');
    const pinnedGrid = document.getElementById('pinnedGrid');
    const noticeGrid = document.getElementById('noticeGrid');
    const emptyState = document.getElementById('emptyState');
    const filterIndicator = document.getElementById('filterIndicator');
    const filterSummaryText = document.getElementById('filterSummaryText');

    const isFiltered = searchQuery || activeCategory !== 'all' || activeAudience !== 'all';
    if (isFiltered) {
        filterIndicator.classList.remove('hidden');
        let summary = [];
        if (searchQuery) summary.push(`Keyword "${searchQuery}"`);
        if (activeCategory !== 'all') summary.push(`Category "${activeCategory}"`);
        if (activeAudience !== 'all') summary.push(`Audience "${activeAudience}"`);
        filterSummaryText.textContent = summary.join(', ');
    } else {
        filterIndicator.classList.add('hidden');
    }

    if (filtered.length === 0) {
        pinnedSection.classList.add('hidden');
        noticeGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    const pinnedItems = filtered.filter(n => n.pinned);
    const standardItems = filtered.filter(n => !n.pinned);

    if (pinnedItems.length > 0 && !searchQuery && activeCategory === 'all' && activeAudience === 'all') {
        pinnedSection.classList.remove('hidden');
        pinnedGrid.innerHTML = pinnedItems.map(notice => createNoticeCardHTML(notice)).join('');
        noticeGrid.innerHTML = standardItems.map(notice => createNoticeCardHTML(notice)).join('');
    } else {
        pinnedSection.classList.add('hidden');
        noticeGrid.innerHTML = filtered.map(notice => createNoticeCardHTML(notice)).join('');
    }
}

function createNoticeCardHTML(notice) {
    const priorityClass = `badge-${notice.priority.toLowerCase()}`;
    const formattedTime = formatTimestamp(notice.timestamp);

    const isAdminUser = currentUser && currentUser.role === 'admin';
    const adminButtons = isAdminUser ? `
        <div class="card-admin-actions">
            <button class="action-btn-sm" onclick="event.stopPropagation(); editNotice('${notice.id}')" title="Edit Notice">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button class="action-btn-sm delete" onclick="event.stopPropagation(); deleteNotice('${notice.id}')" title="Delete Notice">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    ` : '';

    return `
        <article class="notice-card ${notice.pinned ? 'pinned-card' : ''}" onclick="openDetailModal('${notice.id}')">
            <div>
                <div class="card-top-bar">
                    <div class="card-badges">
                        <span class="badge badge-category">${escapeHTML(notice.category)}</span>
                        <span class="badge ${priorityClass}">${notice.priority}</span>
                    </div>
                    ${notice.pinned ? '<i class="fa-solid fa-thumbtack pin-indicator" title="Pinned Bulletin"></i>' : ''}
                </div>

                <h3 class="card-title">${escapeHTML(notice.title)}</h3>
                <p class="card-excerpt">${escapeHTML(notice.content)}</p>
            </div>

            <div>
                <div class="card-meta">
                    <div class="card-meta-left">
                        <span><i class="fa-solid fa-clock"></i> ${formattedTime}</span>
                        <span><i class="fa-solid fa-users"></i> ${escapeHTML(notice.audience || 'All')}</span>
                    </div>
                </div>

                <div class="card-footer">
                    <span class="badge badge-outline">
                        <i class="fa-solid fa-eye"></i> ${notice.views || 0} Views
                    </span>
                    
                    ${adminButtons}
                </div>
            </div>
        </article>
    `;
}

/* ==========================================================================
   NOTICE DETAIL & ACKNOWLEDGMENTS
   ========================================================================== */
function openDetailModal(id) {
    const notice = notices.find(n => n.id === id);
    if (!notice) return;

    currentDetailNoticeId = id;

    notice.views = (notice.views || 0) + 1;
    saveNotices();

    document.getElementById('detailTitle').textContent = notice.title;
    document.getElementById('detailCategoryBadge').textContent = notice.category;
    
    const prioBadge = document.getElementById('detailPriorityBadge');
    prioBadge.textContent = notice.priority;
    prioBadge.className = `badge badge-${notice.priority.toLowerCase()}`;

    document.getElementById('detailAudienceBadge').textContent = notice.audience || 'All Students';
    document.getElementById('detailDate').textContent = formatTimestamp(notice.timestamp);
    document.getElementById('detailViews').textContent = notice.views;
    document.getElementById('detailAcks').textContent = notice.acknowledgments || 0;
    document.getElementById('detailContent').textContent = notice.content;

    const attachmentWrap = document.getElementById('detailAttachmentWrap');
    const attachmentLink = document.getElementById('detailAttachmentLink');
    if (notice.attachment) {
        attachmentWrap.classList.remove('hidden');
        attachmentLink.href = notice.attachment;
        attachmentLink.textContent = notice.attachment;
    } else {
        attachmentWrap.classList.add('hidden');
    }

    document.getElementById('detailModal').classList.add('active');
    renderStats();
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('active');
    currentDetailNoticeId = null;
    renderAll();
}

function acknowledgeCurrentNotice() {
    if (!currentDetailNoticeId) return;
    const notice = notices.find(n => n.id === currentDetailNoticeId);
    if (notice) {
        notice.acknowledgments = (notice.acknowledgments || 0) + 1;
        saveNotices();
        document.getElementById('detailAcks').textContent = notice.acknowledgments;
        showToast('Marked as read!', 'success');
    }
}

/* ==========================================================================
   ADMIN NOTICE MANAGEMENT (STRICTLY ADMIN ONLY)
   ========================================================================== */
function openNoticeModal(editNoticeId = null) {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Only Admin can post or edit notices!', 'warning');
        openAuthModal('admin');
        return;
    }

    const form = document.getElementById('noticeForm');
    form.reset();

    if (editNoticeId) {
        const notice = notices.find(n => n.id === editNoticeId);
        if (notice) {
            document.getElementById('noticeId').value = notice.id;
            document.getElementById('formTitle').value = notice.title;
            document.getElementById('formCategory').value = notice.category;
            document.getElementById('formPriority').value = notice.priority;
            document.getElementById('formAudience').value = notice.audience || 'All Students';
            document.getElementById('formPinned').checked = !!notice.pinned;
            document.getElementById('formContent').value = notice.content;
            document.getElementById('formAttachment').value = notice.attachment || '';
            document.getElementById('formModalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit College Notice';
        }
    } else {
        document.getElementById('noticeId').value = '';
        document.getElementById('formModalTitle').innerHTML = '<i class="fa-solid fa-plus"></i> Post College Notice';
    }

    document.getElementById('noticeFormModal').classList.add('active');
}

function closeNoticeModal() {
    document.getElementById('noticeFormModal').classList.remove('active');
}

function saveNotice(e) {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Access denied. Admin role required.', 'error');
        return;
    }

    const id = document.getElementById('noticeId').value;
    const title = document.getElementById('formTitle').value.trim();
    const category = document.getElementById('formCategory').value;
    const priority = document.getElementById('formPriority').value;
    const audience = document.getElementById('formAudience').value;
    const pinned = document.getElementById('formPinned').checked;
    const content = document.getElementById('formContent').value.trim();
    const attachment = document.getElementById('formAttachment').value.trim();

    if (!title || !content) {
        showToast('Title and Description are required!', 'error');
        return;
    }

    if (id) {
        const index = notices.findIndex(n => n.id === id);
        if (index !== -1) {
            notices[index] = {
                ...notices[index],
                title,
                category,
                priority,
                audience,
                pinned,
                content,
                attachment,
                timestamp: new Date().toISOString()
            };
            showToast('College Notice updated successfully', 'success');
        }
    } else {
        const newNotice = {
            id: 'notice-' + Date.now(),
            title,
            category,
            priority,
            audience,
            pinned,
            content,
            attachment,
            timestamp: new Date().toISOString(),
            views: 0,
            acknowledgments: 0
        };
        notices.unshift(newNotice);
        showToast('New College Notice Published!', 'success');
    }

    saveNotices();
    closeNoticeModal();
    renderAll();
}

function editNotice(id) {
    openNoticeModal(id);
}

function deleteNotice(id) {
    if (!currentUser || currentUser.role !== 'admin') return;
    const notice = notices.find(n => n.id === id);
    if (notice && confirm(`Are you sure you want to delete notice: "${notice.title}"?`)) {
        notices = notices.filter(n => n.id !== id);
        saveNotices();
        renderAll();
        showToast('College notice deleted', 'warning');
    }
}

/* ==========================================================================
   HELPERS & TOAST SYSTEM
   ========================================================================== */
function formatTimestamp(isoString) {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    if (type === 'error') iconClass = 'fa-circle-xmark';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = '0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}
