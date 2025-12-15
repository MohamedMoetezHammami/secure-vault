// Authentication module using Firebase Auth
// Using compat version for better Android WebView support
let app, auth;
let firebaseInitialized = false;

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_ybjYpySqzUrd3zfuF3O0g29bds8C3Ok",
  authDomain: "vault-28864.firebaseapp.com",
  projectId: "vault-28864",
  storageBucket: "vault-28864.firebasestorage.app",
  messagingSenderId: "31539120914",
  appId: "1:31539120914:web:3367e923dc5203f3c981cb"
};

// Initialize Firebase with compat SDK (loaded via script tags in HTML)
function initFirebase() {
  if (firebaseInitialized) return;

  try {
    // Check if Firebase compat is available (loaded via script tag)
    if (typeof firebase !== 'undefined') {
      // Using compat SDK
      if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
      } else {
        app = firebase.apps[0];
      }
      auth = firebase.auth();
      firebaseInitialized = true;
      console.log('✅ Firebase initialized (compat SDK)');
    } else {
      console.error('❌ Firebase SDK not loaded. Make sure firebase scripts are included in HTML.');
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
}

// ===========================================
// PRODUCTION API URL - Your Render backend
// ===========================================
const PRODUCTION_API_URL = 'https://secure-vault-api-l762.onrender.com/api';

// Get API base URL based on platform
function getApiBaseUrl() {
  // Check if running in Capacitor FIRST (mobile app)
  if (typeof window !== 'undefined' && window.Capacitor) {
    if (window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      console.log('📱 Capacitor native platform detected');
      return PRODUCTION_API_URL;
    }
    if (window.Capacitor.getPlatform) {
      const platform = window.Capacitor.getPlatform();
      console.log('📱 Running on platform:', platform);
      if (platform === 'android' || platform === 'ios') {
        console.log('🔗 Mobile app detected, using production API');
        return PRODUCTION_API_URL;
      }
    }
  }

  // Check user agent for Android WebView
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    const ua = navigator.userAgent;
    // Android WebView detection
    if (ua.includes('wv') || (ua.includes('Android') && ua.includes('Version/'))) {
      console.log('🔗 Android WebView detected, using production API');
      return PRODUCTION_API_URL;
    }
  }

  // Check hostname
  const hostname = window.location.hostname;

  // Capacitor uses 'localhost' on Android, but we already checked for Capacitor above
  // So if we're here and hostname is localhost, it's actual localhost dev
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Double check it's not Capacitor
    if (window.location.protocol === 'https:' || window.location.port === '') {
      // Likely Capacitor (uses https://localhost on Android)
      console.log('🔗 HTTPS localhost detected (likely Capacitor), using production API');
      return PRODUCTION_API_URL;
    }
    const url = 'http://localhost:3000/api';
    console.log('🔗 Using local development API URL:', url);
    return url;
  }

  // Any other case - use production
  console.log('🌐 Production environment detected');
  return PRODUCTION_API_URL;
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

// Initialize Firebase when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initFirebase();
});

// Also try to init immediately in case DOM is already ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initFirebase();
}

// Login form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Ensure Firebase is initialized
    if (!firebaseInitialized) {
      initFirebase();
    }

    if (!auth) {
      showMessage('Firebase not initialized. Please refresh the page.', 'error');
      return;
    }

    setLoading(true);

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;

    try {
      // Sign in with Firebase Auth (compat SDK)
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
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

    // Ensure Firebase is initialized
    if (!firebaseInitialized) {
      initFirebase();
    }

    if (!auth) {
      showMessage('Firebase not initialized. Please refresh the page.', 'error');
      return;
    }

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
      // Create user with Firebase Auth (compat SDK)
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);

      // Send email verification
      await userCredential.user.sendEmailVerification();

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

    // Ensure Firebase is initialized
    if (!firebaseInitialized) {
      initFirebase();
    }

    if (!auth) {
      showMessage('Firebase not initialized. Please refresh the page.', 'error');
      return;
    }

    setLoading(true);

    const email = document.getElementById('resetEmail').value;

    try {
      await auth.sendPasswordResetEmail(email);
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
function setupAuthStateListener() {
  if (!auth) {
    // Retry after a short delay if Firebase not yet initialized
    setTimeout(() => {
      initFirebase();
      if (auth) {
        setupAuthStateListener();
      }
    }, 500);
    return;
  }

  auth.onAuthStateChanged((user) => {
    if (user && window.location.pathname.includes('index.html')) {
      // User is logged in, redirect to dashboard
      const token = localStorage.getItem('jwt_token');
      if (token) {
        window.location.href = 'dashboard.html';
      }
    }
  });
}

// Set up auth state listener after Firebase is ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(setupAuthStateListener, 100);
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

