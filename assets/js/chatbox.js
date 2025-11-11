let currentUserId = null;
let currentChatUserId = null;
let messages = [];
let notifications = [];

document.addEventListener('DOMContentLoaded', function() {
    initChatbox();
    initTabs();
    initMessageInput();
    loadData();
    setInterval(loadData, 3000);
});

function initChatbox() {
    const userData = getUserData();
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUserId = userData.id;
    
    const urlParams = new URLSearchParams(window.location.search);
    const chatUserId = urlParams.get('chat');
    
    if (chatUserId) {
        currentChatUserId = parseInt(chatUserId);
        loadChatUser(currentChatUserId);
    }
}

function initTabs() {
    const tabBtns = document.querySelectorAll('.sidebar-tab');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

function initMessageInput() {
    const messageInput = document.getElementById('messageInput');
    const charCount = document.getElementById('charCount');
    
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            charCount.textContent = this.value.length;
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
        
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

async function loadData() {
    await loadMessages();
    await loadNotifications();
    await loadEvents();
}

async function loadMessages() {
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
            messages = data.messages;
            displayMessageList();
            updateMessageCount();
            
            if (currentChatUserId) {
                displayChatMessages();
            }
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function displayMessageList() {
    const messageList = document.getElementById('messageList');
    
    const usersResponse = await fetch('auth.php?action=getAllUsers');
    const usersData = await usersResponse.json();
    
    if (!usersData.success) return;
    
    const users = usersData.users;
    const conversations = {};
    
    messages.forEach(msg => {
        const otherUserId = msg.fromId === currentUserId ? msg.toId : msg.fromId;
        
        if (!conversations[otherUserId] || new Date(msg.timestamp) > new Date(conversations[otherUserId].timestamp)) {
            conversations[otherUserId] = msg;
        }
    });
    
    const conversationArray = Object.entries(conversations).map(([userId, msg]) => {
        const user = users.find(u => u.id == userId);
        return { userId: parseInt(userId), message: msg, user: user };
    });
    
    if (conversationArray.length === 0) {
        messageList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-envelope-open"></i>
                <p>No messages yet</p>
            </div>
        `;
        return;
    }
    
    messageList.innerHTML = conversationArray.map(conv => {
        const isUnread = conv.message.toId === currentUserId && !conv.message.read;
        const isActive = conv.userId === currentChatUserId;
        
        return `
            <div class="message-item ${isUnread ? 'unread' : ''} ${isActive ? 'active' : ''}" 
                 onclick="openChat(${conv.userId})">
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="message-info">
                    <div class="message-header">
                        <span class="message-name">${conv.user ? conv.user.name : 'User ' + conv.userId}</span>
                        <span class="message-time">${formatTime(conv.message.timestamp)}</span>
                    </div>
                    <div class="message-preview">${conv.message.message}</div>
                </div>
            </div>
        `;
    }).join('');
}

function updateMessageCount() {
    const unreadCount = messages.filter(m => m.toId === currentUserId && !m.read).length;
    document.getElementById('inboxCount').textContent = unreadCount;
}

async function loadChatUser(userId) {
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
            document.getElementById('chatUserName').textContent = data.user.name;
            document.getElementById('chatUserStatus').textContent = `ID: ${data.user.id}`;
            document.getElementById('chatInputContainer').style.display = 'block';
            displayChatMessages();
        }
    } catch (error) {
        console.error('Error loading chat user:', error);
    }
}

function displayChatMessages() {
    const chatMessages = document.getElementById('chatMessages');
    
    const chatMsgs = messages.filter(m => 
        (m.fromId === currentUserId && m.toId === currentChatUserId) ||
        (m.fromId === currentChatUserId && m.toId === currentUserId)
    );
    
    if (chatMsgs.length === 0) {
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-comments"></i>
                <h2>Start Conversation</h2>
                <p>Send a message to start chatting</p>
            </div>
        `;
        return;
    }
    
    chatMessages.innerHTML = chatMsgs.map(msg => {
        const isOwn = msg.fromId === currentUserId;
        const formattedMessage = formatMessage(msg.message);
        
        return `
            <div class="chat-message ${isOwn ? 'own' : ''}">
                <div class="message-avatar-small">
                    <i class="fas fa-user"></i>
                </div>
                <div class="message-content">
                    <div class="message-text">${formattedMessage}</div>
                    <div class="message-timestamp">${formatTime(msg.timestamp)}</div>
                </div>
            </div>
        `;
    }).join('');
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    chatMsgs.forEach(msg => {
        if (msg.toId === currentUserId && !msg.read) {
            markAsRead(msg.id);
        }
    });
}

function formatMessage(text) {
    text = text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');
    return text;
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message || !currentChatUserId) return;
    
    if (message.length > 1000) {
        alert('Message too long! Maximum 1000 characters.');
        return;
    }
    
    try {
        const response = await fetch('server.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sendMessage',
                fromId: currentUserId,
                toId: currentChatUserId,
                message: message
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            messageInput.value = '';
            document.getElementById('charCount').textContent = '0';
            messageInput.style.height = 'auto';
            await loadMessages();
            showNotification('Message sent!');
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

async function markAsRead(messageId) {
    try {
        await fetch('server.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'markAsRead',
                messageId: messageId
            })
        });
    } catch (error) {
        console.error('Error marking as read:', error);
    }
}

async function loadNotifications() {
    try {
        const response = await fetch('server.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getNotifications',
                userId: currentUserId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            notifications = data.notifications;
            displayNotifications();
            updateNotificationCount();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function displayNotifications() {
    const notificationList = document.getElementById('notificationList');
    
    if (notifications.length === 0) {
        notificationList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications</p>
            </div>
        `;
        return;
    }
    
    notificationList.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.read ? '' : 'unread'}">
            <div class="notification-header">
                <div class="notification-icon">
                    <i class="fas fa-${notif.type === 'login' ? 'sign-in-alt' : 'bell'}"></i>
                </div>
                <span class="notification-title">${notif.title}</span>
                <span class="notification-time">${formatTime(notif.timestamp)}</span>
            </div>
            <div class="notification-message">${notif.message}</div>
        </div>
    `).join('');
}

function updateNotificationCount() {
    const unreadCount = notifications.filter(n => !n.read).length;
    document.getElementById('notifCount').textContent = unreadCount;
}

async function loadEvents() {
    const eventList = document.getElementById('eventList');
    
    eventList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-calendar-times"></i>
            <p>No events scheduled</p>
        </div>
    `;
}

function openChat(userId) {
    window.location.href = `chatbox.html?users.id=${currentUserId}&chat=${userId}`;
}

function clearChat() {
    if (confirm('Are you sure you want to clear this chat?')) {
        console.log('Chat cleared');
    }
}

function toggleEmojiPicker() {
    const emojiPicker = document.getElementById('emojiPicker');
    emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'flex' : 'none';
}

function insertEmoji(emoji) {
    const messageInput = document.getElementById('messageInput');
    messageInput.value += emoji;
    document.getElementById('charCount').textContent = messageInput.value.length;
    messageInput.focus();
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
}

function showNotification(message) {
    const notif = document.createElement('div');
    notif.className = 'notification-toast';
    notif.textContent = message;
    notif.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: var(--success);
        color: white;
        padding: 1rem 2rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideInUp 0.3s ease;
    `;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.remove();
    }, 3000);
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
