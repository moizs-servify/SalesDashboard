// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.querySelector('.login-btn');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        redirectToDashboard();
    }
    
    // Add event listeners
    loginForm.addEventListener('submit', handleLogin);
    
    // Password toggle functionality
    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordIcon = document.getElementById('password-icon');
    
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle icon
        if (type === 'text') {
            passwordIcon.classList.remove('fa-eye');
            passwordIcon.classList.add('fa-eye-slash');
        } else {
            passwordIcon.classList.remove('fa-eye-slash');
            passwordIcon.classList.add('fa-eye');
        }
    });
});

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const remember = document.getElementById('remember').checked;
    
    // Validate inputs
    if (!validateEmail(email)) {
        showError(emailInput, 'Please enter a valid email address');
        return;
    }
    
    if (password.length < 6) {
        showError(passwordInput, 'Password must be at least 6 characters');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
        // Call the backend login API
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store token
            if (remember) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            } else {
                sessionStorage.setItem('authToken', data.token);
                sessionStorage.setItem('user', JSON.stringify(data.user));
            }
            
            // Redirect to dashboard
            redirectToDashboard();
            
        } else {
            showError(loginForm, data.message || 'Invalid email or password');
        }
        
    } catch (error) {
        showError(loginForm, 'An error occurred. Please try again.');
        console.error('Login error:', error);
    } finally {
        setLoadingState(false);
    }
}

// Validate email format
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show error message
function showError(element, message) {
    // Remove existing error states
    clearErrors();
    
    // Add error class to element
    element.classList.add('error');
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Insert error message after the element
    if (element.tagName === 'FORM') {
        element.appendChild(errorDiv);
    } else {
        element.parentNode.insertBefore(errorDiv, element.nextSibling);
    }
    
    // Auto-remove error after 5 seconds
    setTimeout(() => {
        clearErrors();
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Clear all error states
function clearErrors() {
    document.querySelectorAll('.error').forEach(element => {
        element.classList.remove('error');
    });
    
    document.querySelectorAll('.error-message').forEach(element => {
        element.remove();
    });
}

// Set loading state
function setLoadingState(loading) {
    if (loading) {
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
    } else {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }
}

// Redirect to dashboard
function redirectToDashboard() {
    window.location.href = '/dashboard';
}

// Handle forgot password
document.querySelector('.forgot-password').addEventListener('click', function(e) {
    e.preventDefault();
    showSuccess('Password reset functionality would be implemented here');
});
