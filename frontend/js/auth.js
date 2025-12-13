// Authentication module using Firebase Auth
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Firebase configuration - Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyD_ybjYpySqzUrd3zfuF3O0g29bds8C3Ok",
  authDomain: "vault-28864.firebaseapp.com",
  projectId: "vault-28864",
  storageBucket: "vault-28864.firebasestorage.app",
  messagingSenderId: "31539120914",
  appId: "1:31539120914:web:3367e923dc5203f3c981cb"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ===========================================
// PRODUCTION API URL - Update this after deploying to Render
// ===========================================
const PRODUCTION_API_URL = 'https://secure-vault-api.onrender.com/api';

// Get API base URL based on platform
function getApiBaseUrl() {
  const hostname = window.location.hostname;

  // Check if running in production (not localhost)
  if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('192.168')) {
    console.log('🌐 Production environment detected');
    return PRODUCTION_API_URL;
  }

  // Check if running in Capacitor
  if (typeof window !== 'undefined') {
    // Check for Capacitor
    if (window.Capacitor && window.Capacitor.getPlatform) {
      const platform = window.Capacitor.getPlatform();
      console.log('📱 Running on platform:', platform);

      // For mobile apps, use production API
      if (platform === 'android' || platform === 'ios') {
        console.log('🔗 Mobile app detected, using production API');
        return PRODUCTION_API_URL;
      }
    }

    // Check if running in Android WebView (alternative detection)
    if (navigator.userAgent.includes('Android') && !navigator.userAgent.includes('Chrome')) {
      console.log('🔗 Detected Android WebView, using production API');
      return PRODUCTION_API_URL;
    }
  }

  // For local web browser development
  const url = 'http://localhost:3000/api';
  console.log('🔗 Using local development API URL:', url);
  return url;
}

const API_BASE_URL = getApiBaseUrl();
console.log('✅ Final API_BASE_URL:', API_BASE_URL);

// Utility functions
function showMessage(message, type = 'info') {
  const messageEl = document.getElementById('authMessage');
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 5000);
  }
}

function setLoading(isLoading) {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            submitBtn.textContent = isLoading ? 'Loading...' : submitBtn.dataset.originalText || submitBtn.textContent;
        }
    });
}

// Tab switching for index.html
if (document.querySelector('.auth-tabs')) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      
      // Update active tab button
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show/hide forms
      document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
      });
      
      if (tab === 'login') {
        document.getElementById('login-form').classList.add('active');
      } else if (tab === 'register') {
        document.getElementById('register-form').classList.add('active');
      }
    });
  });
}

// Password visibility toggle
document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  });
});

// Password strength checker for registration
const registerPassword = document.getElementById('registerPassword');
if (registerPassword) {
  registerPassword.addEventListener('input', () => {
    const password = registerPassword.value;
    const strengthEl = document.getElementById('registerPasswordStrength');
    if (strengthEl && password) {
      const analysis = analyzePasswordStrength(password);
      strengthEl.innerHTML = `
        <div class="strength-bar">
          <div class="strength-fill strength-${analysis.strength.toLowerCase().replace(' ', '-')}" 
               style="width: ${analysis.score}%"></div>
        </div>
        <span class="strength-text">${analysis.strength}</span>
      `;
    }
  });
}

// Password match checker
const confirmPassword = document.getElementById('confirmPassword');
if (confirmPassword && registerPassword) {
  confirmPassword.addEventListener('input', () => {
    const matchEl = document.getElementById('passwordMatch');
    if (matchEl) {
      if (confirmPassword.value && confirmPassword.value !== registerPassword.value) {
        matchEl.textContent = 'Passwords do not match';
        matchEl.className = 'password-match error';
      } else if (confirmPassword.value) {
        matchEl.textContent = 'Passwords match';
        matchEl.className = 'password-match success';
      } else {
        matchEl.textContent = '';
      }
    }
  });
}

// Login form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(true);

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // Verify token with backend and get JWT
      const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Store JWT token and user data
      localStorage.setItem('jwt_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('masterPassword', rememberMe ? btoa(password) : ''); // Base64 encode for "remember me"

      // Check email verification
      if (!userCredential.user.emailVerified) {
        showMessage('Please verify your email. Check your inbox for verification link.', 'warning');
      }

      // Redirect to dashboard
      window.location.href = 'dashboard.html';
    } catch (error) {
      console.error('Login error:', error);
      console.error('API URL was:', API_BASE_URL);
      console.error('Error details:', error.message);
      
      let errorMessage = 'Login failed. ';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage += 'Cannot connect to server. Please check:\n';
        errorMessage += '1. Backend server is running on port 3000\n';
        errorMessage += '2. API URL: ' + API_BASE_URL + '\n';
        errorMessage += '3. Check console for more details';
      } else {
        errorMessage += error.message || 'Please check your credentials.';
      }
      
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  });
}

// Register form handler
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(true);

    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    const displayName = document.getElementById('registerName').value;

    if (password !== confirmPass) {
      showMessage('Passwords do not match', 'error');
      setLoading(false);
      return;
    }

    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send email verification
      await sendEmailVerification(userCredential.user);

      // Get ID token and verify with backend
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Store JWT token and user data
      localStorage.setItem('jwt_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      showMessage('Registration successful! Please verify your email.', 'success');
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      console.error('API URL was:', API_BASE_URL);
      
      let errorMessage = 'Registration failed. ';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already registered';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage += 'Cannot connect to server. Please check:\n';
        errorMessage += '1. Backend server is running on port 3000\n';
        errorMessage += '2. API URL: ' + API_BASE_URL + '\n';
        errorMessage += '3. Check console for more details';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  });
}

// Forgot password handler
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    // Hide login form, show forgot password form
    if (document.getElementById('login-form')) {
      document.getElementById('login-form').classList.remove('active');
    }
    if (document.getElementById('forgot-password-form')) {
      document.getElementById('forgot-password-form').classList.add('active');
    }
  });
}

const backToLogin = document.getElementById('backToLogin');
if (backToLogin) {
  backToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    if (document.getElementById('forgot-password-form')) {
      document.getElementById('forgot-password-form').classList.remove('active');
    }
    if (document.getElementById('login-form')) {
      document.getElementById('login-form').classList.add('active');
    }
  });
}

const forgotPasswordForm = document.getElementById('forgotPasswordForm');
if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(true);

    const email = document.getElementById('resetEmail').value;

    try {
      await sendPasswordResetEmail(auth, email);
      showMessage('Password reset email sent! Check your inbox.', 'success');
    } catch (error) {
      console.error('Password reset error:', error);
      showMessage('Failed to send reset email. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  });
}

// Theme toggle for auth page
const themeToggleAuth = document.getElementById('themeToggleAuth');
if (themeToggleAuth) {
  themeToggleAuth.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  // Load saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }
}

// Check auth state - redirect if already logged in
onAuthStateChanged(auth, (user) => {
  if (user && window.location.pathname.includes('index.html')) {
    // User is logged in, redirect to dashboard
    const token = localStorage.getItem('jwt_token');
    if (token) {
      window.location.href = 'dashboard.html';
    }
  }
});

// Password strength analyzer (simplified version)
function analyzePasswordStrength(password) {
  let score = 0;
  
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (/[a-z]/.test(password)) score += 20;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;
  
  let strength;
  if (score >= 80) strength = 'Very Strong';
  else if (score >= 60) strength = 'Strong';
  else if (score >= 40) strength = 'Moderate';
  else if (score >= 20) strength = 'Weak';
  else strength = 'Very Weak';
  
  return { score: Math.min(100, score), strength };
}

