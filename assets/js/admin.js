let currentAdmin = null;
let allUsers = [];

document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    initNavigation();
    loadDashboardData();
});

function checkAdminAuth() {
    const userData = getUserData();
    
    if (!userData || userData.role !== 'admin') {
        alert('Access denied! Admin only.');
        window.location.href = 'login.html';
        return;
    }
    
    currentAdmin = userData;
    document.getElementById('adminName').textContent = userData.name;
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(sectionId).classList.add('active');
            
            const titles = {
                'dashboard': 'Dashboard',
                'users': 'User Management',
                'messages': 'Broadcast Messages',
                'events': 'Event Management',
                'notifications': 'System Notifications',
                'settings': 'System Settings'
            };
            
            document.getElementById('sectionTitle').textContent = titles[sectionId];
            
            if (sectionId === 'users') {
                loadUsers();
            }
        });
    });
}

async function loadDashboardData() {
    try {
        const response = await fetch('auth.php?action=getAllUsers');
        const data = await response.json();
        
        if (data.success) {
            allUsers = data.users;
            document.getElementById('totalUsers').textContent = allUsers.length;
            document.getElementById('activeUsers').textContent = allUsers.filter(u => u.role !== 'admin').length;
            
            displayRecentActivity();
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function displayRecentActivity() {
    const activityList = document.getElementById('activityList');
    
    const activities = allUsers.slice(0, 10).map(user => ({
        icon: 'fas fa-user-plus',
        title: `${user.name} registered`,
        time: user.registeredAt
    }));
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-info">
                <h4>${activity.title}</h4>
                <p>${formatDate(activity.time)}</p>
            </div>
        </div>
    `).join('');
}

async function loadUsers() {
    try {
        const response = await fetch('auth.php?action=getAllUsers');
        const data = await response.json();
        
        if (data.success) {
            displayUsers(data.users);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function displayUsers(users) {
    const usersTable = document.getElementById('usersTable');
    
    usersTable.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="badge ${user.role === 'admin' ? 'badge-danger' : 'badge-primary'}">${user.role}</span></td>
            <td>${formatDate(user.registeredAt)}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="banUser(${user.id}, 'temp')">
                    <i class="fas fa-ban"></i> Ban
                </button>
                <button class="btn btn-danger btn-sm" onclick="kickUser(${user.id})">
                    <i class="fas fa-user-times"></i> Kick
                </button>
            </td>
        </tr>
    `).join('');
}

function banUser(userId, type) {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = 'Ban User';
    document.getElementById('modalBody').innerHTML = `
        <div class="form-group">
            <label>Ban Duration</label>
            <select id="banDuration" class="form-control">
                <option value="1">1 Hour</option>
                <option value="24">1 Day</option>
                <option value="168">1 Week</option>
                <option value="720">1 Month</option>
                <option value="permanent">Permanent</option>
            </select>
        </div>
        <div class="form-group">
            <label>Reason</label>
            <textarea id="banReason" class="form-control" rows="3" placeholder="Ban reason..."></textarea>
        </div>
    `;
    
    document.getElementById('modalConfirm').onclick = async function() {
        const duration = document.getElementById('banDuration').value;
        const reason = document.getElementById('banReason').value;
        
        showNotification(`User ${userId} banned for ${duration === 'permanent' ? 'permanent' : duration + ' hours'}`, 'success');
        closeModal();
    };
    
    modal.classList.add('active');
}

function kickUser(userId) {
    if (confirm('Are you sure you want to kick this user?')) {
        showNotification(`User ${userId} has been kicked`, 'success');
        loadUsers();
    }
}

async function createDummyUser() {
    const dummyNames = ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Brown', 'Charlie Davis'];
    const randomName = dummyNames[Math.floor(Math.random() * dummyNames.length)];
    const randomEmail = `user${Date.now()}@example.com`;
    
    try {
        const response = await fetch('auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'register',
                name: randomName,
                email: randomEmail,
                password: 'password123'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Dummy user created successfully!', 'success');
            loadUsers();
        }
    } catch (error) {
        showNotification('Failed to create dummy user', 'error');
    }
}

async function sendBroadcast() {
    const type = document.getElementById('messageType').value;
    const title = document.getElementById('messageTitle').value;
    const content = document.getElementById('messageContent').value;
    
    if (!title || !content) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch('auth.php?action=getAllUsers');
        const data = await response.json();
        
        if (data.success) {
            for (const user of data.users) {
                await fetch('server.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'addNotification',
                        userId: user.id,
                        type: type,
                        title: title,
                        message: content
                    })
                });
            }
            
            showNotification('Broadcast sent to all users!', 'success');
            document.getElementById('messageTitle').value = '';
            document.getElementById('messageContent').value = '';
        }
    } catch (error) {
        showNotification('Failed to send broadcast', 'error');
    }
}

async function sendNotification() {
    const target = document.getElementById('notifTarget').value;
    const type = document.getElementById('notifType').value;
    const title = document.getElementById('notifTitle').value;
    const message = document.getElementById('notifMessage').value;
    
    if (!title || !message) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch('server.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'addNotification',
                userId: target,
                type: type,
                title: title,
                message: message
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Notification sent successfully!', 'success');
            document.getElementById('notifTitle').value = '';
            document.getElementById('notifMessage').value = '';
        }
    } catch (error) {
        showNotification('Failed to send notification', 'error');
    }
}

function createEvent() {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = 'Create Event';
    document.getElementById('modalBody').innerHTML = `
        <div class="form-group">
            <label>Event Title</label>
            <input type="text" id="eventTitle" class="form-control" placeholder="Event title">
        </div>
        <div class="form-group">
            <label>Event Date</label>
            <input type="datetime-local" id="eventDate" class="form-control">
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea id="eventDesc" class="form-control" rows="3" placeholder="Event description"></textarea>
        </div>
    `;
    
    document.getElementById('modalConfirm').onclick = function() {
        const title = document.getElementById('eventTitle').value;
        const date = document.getElementById('eventDate').value;
        const desc = document.getElementById('eventDesc').value;
        
        if (title && date && desc) {
            showNotification('Event created successfully!', 'success');
            closeModal();
        }
    };
    
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userData');
        window.location.href = 'index.html';
    }
}

function showNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 2rem;
        border-radius: 12px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    notif.textContent = message;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.remove();
    }, 3000);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function getUserData() {
    const userStr = localStorage.getItem('userData');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
    return null;
}
