// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    initMobileMenu();
    
    // Smooth scrolling
    initSmoothScrolling();
    
    // Page-specific initializations
    if (window.location.pathname.includes('dashboard.html')) {
        initDashboard();
    } else if (window.location.pathname.includes('auth.html')) {
        initAuthForms();
    }
});

function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
}

function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId !== '#') {
                document.querySelector(targetId).scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Dashboard Functions
function initDashboard() {
    // Check authentication
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Display user info
    displayUserInfo(currentUser);
    
    // Initialize stats
    updateStatsDisplay(currentUser);
    
    // Set up event listeners
    setupDashboardEvents(currentUser);
}

function getCurrentUser() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.loggedIn) {
        window.location.href = 'auth.html';
        return null;
    }
    return currentUser;
}

function displayUserInfo(user) {
    if (user.name) {
        document.getElementById('username').textContent = user.name;
        document.getElementById('user-greeting').textContent = user.name.split(' ')[0];
    }
}

function updateStatsDisplay(user) {
    document.getElementById('devices-count').textContent = user.devicesRecycled || 0;
    document.getElementById('weight-count').textContent = (user.totalWeight || 0) + ' kg';
    document.getElementById('co2-count').textContent = (user.co2Saved || 0) + ' kg';
}

function setupDashboardEvents(user) {
    // Add device button
    document.getElementById('add-device-btn').addEventListener('click', function() {
        user.devicesRecycled = (user.devicesRecycled || 0) + 1;
        user.totalWeight = (user.totalWeight || 0) + 2.5;
        user.co2Saved = (user.co2Saved || 0) + 6.25;
        
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateStatsDisplay(user);
        alert('New device added! Your impact has been updated.');
    });
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
}

// Authentication Functions
function initAuthForms() {
    // Form elements
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    // Check URL for signup parameter
    if (new URLSearchParams(window.location.search).get('signup') === 'true') {
        showSignupForm();
    } else {
        showLoginForm();
    }
    
    // Form submissions
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
    
    // Toggle links
    const showSignup = document.getElementById('showSignup');
    const showSignin = document.getElementById('showSignin');
    
    if (showSignup) showSignup.addEventListener('click', function(e) {
        e.preventDefault();
        showSignupForm();
    });
    
    if (showSignin) showSignin.addEventListener('click', function(e) {
        e.preventDefault();
        showLoginForm();
    });
}

function showLoginForm() {
    document.getElementById('signin-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
}

function showSignupForm() {
    document.getElementById('signin-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    // In a real app, verify credentials with server
    const user = {
        email: email,
        name: email.split('@')[0],
        loggedIn: true,
        devicesRecycled: 0,
        totalWeight: 0,
        co2Saved: 0,
        lastLogin: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = 'dashboard.html';
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirm').value;
    
    if (!name || !email || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        document.querySelector('.error-message').classList.remove('hidden');
        return;
    }
    
    const user = {
        name: name,
        email: email,
        loggedIn: true,
        devicesRecycled: 0,
        totalWeight: 0,
        co2Saved: 0,
        joined: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = 'dashboard.html';
}