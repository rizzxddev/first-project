let currentUserId = null;
let viewingUserId = null;
let currentUser = null;
let viewingUser = null;

document.addEventListener('DOMContentLoaded', function() {
    initProfile();
    initTabs();
    checkMessages();
    setInterval(checkMessages, 5000);
});

function initProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('users.id');
    
    if (!userIdParam) {
        window.location.href = 'login.html';
        return;
    }
    
    viewingUserId = parseInt(userIdParam);
    
    const userData = getUserData();
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUserId = userData.id;
    currentUser = userData;
    
    if (currentUserId === viewingUserId) {
        loadOwnProfile();
    } else {
        loadUserProfile(viewingUserId);
    }
}

async function loadOwnProfile() {
    try {
        const response = await fetch('auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getUser',
                userId: currentUserId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            displayProfile(data.user, true);
            loadFriends(data.user.friends);
            loadProjects(currentUserId);
            loadActivity(currentUserId);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function loadUserProfile(userId) {
    try {
        const response = await fetch('auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getUser',
                userId: userId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            viewingUser = data.user;
            displayProfile(data.user, false);
            loadFriends(data.user.friends);
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

function displayProfile(user, isOwn) {
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userId').textContent = user.id;
    document.getElementById('userRole').textContent = user.role === 'admin' ? 'Administrator' : 'User';
    document.getElementById('saveCount').textContent = user.saves || 0;
    document.getElementById('friendCount').textContent = user.friends ? user.friends.length : 0;
    document.getElementById('lastLogin').textContent = formatDate(user.lastLogin);
    document.getElementById('registeredAt').textContent = formatDate(user.registeredAt);
    
    if (isOwn) {
        document.getElementById('profileActions').style.display = 'none';
    } else {
        document.getElementById('profileActions').style.display = 'flex';
    }
    
    if (user.role === 'admin') {
        document.getElementById('userRole').style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        document.getElementById('userRole').style.color = 'white';
    }
}

async function loadFriends(friendIds) {
    if (!friendIds || friendIds.length === 0) {
        return;
    }
    
    try {
        const response = await fetch('auth.php?action=getAllUsers');
        const data = await response.json();
        
        if (data.success) {
            const friends = data.users.filter(u => friendIds.includes(u.id));
            displayFriends(friends);
        }
    } catch (error) {
        console.error('Error loading friends:', error);
    }
}

function displayFriends(friends) {
    const friendsList = document.getElementById('friendsList');
    
    if (friends.length === 0) {
        return;
    }
    
    friendsList.innerHTML = friends.map(friend => `
        <div class="friend-card" onclick="location.href='profile.html?users.id=${friend.id}'">
            <div class="friend-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="friend-info">
                <h4>${friend.name}</h4>
                <p>ID: ${friend.id}</p>
            </div>
        </div>
    `).join('');
}

async function loadProjects(userId) {
    try {
        const response = await fetch('server.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'loadProjects',
                userId: userId
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.projects.length > 0) {
            displayProjects(data.projects);
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function displayProjects(projects) {
    const projectsList = document.getElementById('projectsList');
    
    const langIcons = {
        '101': 'fab fa-html5',
        '102': 'fab fa-js',
        '103': 'fas fa-code',
        '104': 'fab fa-python',
        '105': 'fab fa-php',
        '106': 'fab fa-node-js'
    };
    
    projectsList.innerHTML = projects.map(project => `
        <div class="project-card">
            <h4>
                <i class="${langIcons[project.langCode] || 'fas fa-file-code'}"></i>
                ${project.filename}
            </h4>
            <p>${formatDate(project.updatedAt)}</p>
            <div class="project-actions">
                <button class="project-btn" onclick="openProject('${project.id}')">
                    <i class="fas fa-folder-open"></i> Open
                </button>
                <button class="project-btn" onclick="deleteProject('${project.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function loadActivity(userId) {
    const activityList = document.getElementById('activityList');
    
    const activities = [
        {
            icon: 'fas fa-sign-in-alt',
            title: 'Logged in',
            description: 'Last login to the platform',
            time: currentUser.lastLogin
        },
        {
            icon: 'fas fa-user-plus',
            title: 'Account created',
            description: 'Registered on the platform',
            time: currentUser.registeredAt
        }
    ];
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-info">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
            </div>
            <div class="activity-time">${formatDate(activity.time)}</div>
        </div>
    `).join('');
}

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

async function checkMessages() {
    if (!currentUserId) return;
    
    try {
        const response = await fetch('server.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getMessages',
                userId: currentUserId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const unreadCount = data.messages.filter(m => !m.read && m.toId === currentUserId).length;
            document.getElementById('messageCount').textContent = unreadCount;
        }
    } catch (error) {
        console.error('Error checking messages:', error);
    }
}

async function startChat() {
    if (!viewingUserId || viewingUserId === currentUserId) return;
    
    window.location.href = `chatbox.html?users.id=${currentUserId}&chat=${viewingUserId}`;
}

async function addFriend() {
    if (!viewingUserId || viewingUserId === currentUserId) return;
    
    try {
        const response = await fetch('auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'addFriend',
                userId: currentUserId,
                friendId: viewingUserId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Friend added successfully!', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error adding friend:', error);
        showNotification('Failed to add friend', 'error');
    }
}

function openProject(projectId) {
    console.log('Opening project:', projectId);
}

async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
        const response = await fetch('server.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'deleteProject',
                projectId: projectId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Project deleted successfully!', 'success');
            loadProjects(currentUserId);
        }
    } catch (error) {
        console.error('Error deleting project:', error);
    }
}

function logout() {
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
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

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} active`;
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}
