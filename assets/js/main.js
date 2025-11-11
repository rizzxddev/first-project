document.addEventListener('DOMContentLoaded', function() {
    initParallax();
    initNavbar();
    initScrollAnimations();
    initProfileButton();
    checkAuth();
});

function initParallax() {
    const layers = document.querySelectorAll('.parallax-layer');
    
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        layers.forEach((layer, index) => {
            const speed = (index + 1) * 10;
            const x = (mouseX - 0.5) * speed;
            const y = (mouseY - 0.5) * speed;
            layer.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        layers.forEach((layer, index) => {
            const speed = (index + 1) * 0.5;
            layer.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
}

function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    navLinks.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                }
            }
        });
    });
}

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .language-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
}

function initProfileButton() {
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const userData = getUserData();
            if (userData && userData.id) {
                window.location.href = `profile.html?users.id=${userData.id}`;
            } else {
                window.location.href = 'login.html';
            }
        });
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function checkAuth() {
    const userData = getUserData();
    if (userData) {
        console.log('User logged in:', userData.email);
    }
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

document.querySelectorAll('.language-card').forEach(card => {
    card.addEventListener('click', function() {
        const userData = getUserData();
        if (userData && userData.id) {
            const lang = this.getAttribute('data-lang');
            const langCodes = {
                'html': '101',
                'javascript': '102',
                'typescript': '103',
                'python': '104',
                'php': '105',
                'nodejs': '106'
            };
            const code = langCodes[lang] || '101';
            window.location.href = `console.html?users.id=${userData.id}.${code}`;
        } else {
            window.location.href = 'login.html';
        }
    });
});

window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});
