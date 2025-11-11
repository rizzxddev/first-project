let currentVerificationEmail = '';
let currentVerificationCode = '';
let pendingUserData = null;

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    initVerificationInputs();
});

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.requireVerification) {
                currentVerificationEmail = email;
                pendingUserData = data.user;
                showVerificationModal();
                showNotification('Kode verifikasi telah dikirim ke email kamu', 'success');
            } else {
                localStorage.setItem('userData', JSON.stringify(data.user));
                showNotification('Login berhasil!', 'success');
                setTimeout(() => {
                    window.location.href = `profile.html?users.id=${data.user.id}`;
                }, 1500);
            }
        } else {
            showNotification(data.message || 'Login gagal', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Terjadi kesalahan saat login', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showNotification('Password tidak cocok', 'error');
        return;
    }
    
    if (password.length < 8) {
        showNotification('Password minimal 8 karakter', 'error');
        return;
    }
    
    try {
        const response = await fetch('auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'register',
                name: name,
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentVerificationEmail = email;
            pendingUserData = data.user;
            showVerificationModal();
            showNotification('Registrasi berhasil! Cek email untuk kode verifikasi', 'success');
        } else {
            showNotification(data.message || 'Registrasi gagal', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showNotification('Terjadi kesalahan saat registrasi', 'error');
    }
}

function togglePassword(inputId = 'password') {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password i');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.classList.remove('fa-eye');
        button.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        button.classList.remove('fa-eye-slash');
        button.classList.add('fa-eye');
    }
}

function showVerificationModal() {
    const modal = document.getElementById('verificationModal');
    modal.classList.add('active');
    
    currentVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Verification code:', currentVerificationCode);
    
    sendVerificationEmail(currentVerificationEmail, currentVerificationCode);
}

function hideVerificationModal() {
    const modal = document.getElementById('verificationModal');
    modal.classList.remove('active');
}

async function sendVerificationEmail(email, code) {
    try {
        await fetch('phpmailer.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sendVerification',
                email: email,
                code: code
            })
        });
    } catch (error) {
        console.error('Email send error:', error);
    }
}

function initVerificationInputs() {
    const inputs = document.querySelectorAll('.verify-input');
    
    inputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            if (this.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value === '' && index > 0) {
                inputs[index - 1].focus();
            }
        });
        
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').slice(0, 6);
            pastedData.split('').forEach((char, i) => {
                if (inputs[i]) {
                    inputs[i].value = char;
                }
            });
            if (pastedData.length === 6) {
                inputs[5].focus();
            }
        });
    });
}

async function verifyCode() {
    const inputs = document.querySelectorAll('.verify-input');
    const code = Array.from(inputs).map(input => input.value).join('');
    
    if (code.length !== 6) {
        showNotification('Masukkan 6 digit kode', 'error');
        return;
    }
    
    if (code === currentVerificationCode) {
        if (pendingUserData) {
            localStorage.setItem('userData', JSON.stringify(pendingUserData));
            showNotification('Verifikasi berhasil!', 'success');
            hideVerificationModal();
            setTimeout(() => {
                window.location.href = `profile.html?users.id=${pendingUserData.id}`;
            }, 1500);
        }
    } else {
        showNotification('Kode verifikasi salah', 'error');
    }
}

function skipVerification() {
    if (pendingUserData) {
        localStorage.setItem('userData', JSON.stringify(pendingUserData));
        showNotification('Login berhasil (tanpa verifikasi)', 'success');
        hideVerificationModal();
        setTimeout(() => {
            window.location.href = `profile.html?users.id=${pendingUserData.id}`;
        }, 1500);
    }
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} active`;
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}
