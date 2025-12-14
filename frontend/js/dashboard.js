// Dashboard main functionality
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Firebase configuration (should match auth.js)
const firebaseConfig = {
  apiKey: "AIzaSyAc58_k71QiP2mmTXM7zIBt3C8EsW19l3w",
  authDomain: "amen-608e7.firebaseapp.com",
  projectId: "amen-608e7",
  storageBucket: "amen-608e7.firebasestorage.app",
  messagingSenderId: "890723839758",
  appId: "1:890723839758:web:ad9f3a9b779adc8fdf715f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ===========================================
// PRODUCTION API URL - Update this after deploying to Render
// ===========================================
const PRODUCTION_API_URL = 'https://secure-vault-api.onrender.com/';

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
let currentPasswords = [];
let masterPassword = '';

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  const token = localStorage.getItem('jwt_token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  // Prompt for master password if not remembered
  const rememberedPassword = localStorage.getItem('masterPassword');
  if (rememberedPassword) {
    masterPassword = atob(rememberedPassword);
  } else {
    masterPassword = prompt('Enter your master password:');
    if (!masterPassword) {
      window.location.href = 'index.html';
      return;
    }
  }

  // Load user data
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  document.getElementById('userDisplayName').textContent = user.displayName || user.email;
  document.getElementById('userEmail').textContent = user.email;

  // Load and apply settings first
  loadSettings();

  // Load passwords
  await loadPasswords();

  // Initialize event listeners
  setupEventListeners();

  // Setup auto-logout (uses settings loaded above)
  setupAutoLogout();
});

// Load passwords from API
async function loadPasswords() {
  try {
    showLoading(true);
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${API_BASE_URL}/passwords`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load passwords');
    }

    const data = await response.json();
    currentPasswords = data.passwords || [];
    renderPasswords();
    updateStats();
    updateCategories();
  } catch (error) {
    console.error('Error loading passwords:', error);
    showMessage('Failed to load passwords', 'error');
  } finally {
    showLoading(false);
  }
}

// Render passwords list
function renderPasswords(filteredPasswords = null) {
  const passwords = filteredPasswords || currentPasswords;
  const listEl = document.getElementById('passwordsList');

  if (passwords.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <p>No passwords found. Click "Add Password" to get started!</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = passwords.map(password => {
    // Decrypt password for display (masked)
    let decryptedPassword = '';
    try {
      // Use window object to access globally available function
      const decrypt = typeof decryptPassword !== 'undefined' 
        ? decryptPassword 
        : window.decryptPassword;
      decryptedPassword = decrypt(
        password.encryptedPassword,
        masterPassword,
        password.iv,
        password.salt
      );
    } catch (error) {
      decryptedPassword = '***';
    }

    return `
      <div class="password-card" data-id="${password.id}">
        <div class="password-card-header">
          <div class="password-icon">🌐</div>
          <div class="password-info">
            <h3>${escapeHtml(password.website)}</h3>
            <p class="password-username">${escapeHtml(password.username)}</p>
          </div>
        </div>
        <div class="password-card-body">
          <div class="password-field">
            <label>Password:</label>
            <div class="password-display">
              <input type="password" class="password-value" value="${escapeHtml(decryptedPassword)}" readonly>
              <button class="btn-icon toggle-password-btn" data-target="${password.id}">👁️</button>
              <button class="btn-icon copy-btn" data-copy="${password.id}" data-type="password" title="Copy Password">📋</button>
            </div>
          </div>
          <div class="password-field">
            <label>Username:</label>
            <div class="password-display">
              <input type="text" class="username-value" value="${escapeHtml(password.username)}" readonly>
              <button class="btn-icon copy-btn" data-copy="${password.id}" data-type="username" title="Copy Username">📋</button>
            </div>
          </div>
          ${password.category ? `<span class="category-badge">${escapeHtml(password.category)}</span>` : ''}
        </div>
        <div class="password-card-actions">
          <button class="btn btn-secondary btn-sm edit-password" data-id="${password.id}">Edit</button>
          <button class="btn btn-danger btn-sm delete-password" data-id="${password.id}">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  // Attach event listeners to password cards
  attachPasswordCardListeners();
}

// Attach event listeners to password cards
function attachPasswordCardListeners() {
  // Toggle password visibility
  document.querySelectorAll('.toggle-password-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const passwordId = btn.dataset.target;
      const passwordInput = btn.closest('.password-card').querySelector('.password-value');
      if (passwordInput) {
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
      }
    });
  });

  // Copy to clipboard
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const passwordId = btn.dataset.copy;
      const type = btn.dataset.type;
      const password = currentPasswords.find(p => p.id === passwordId);
      
      if (!password) return;

      let textToCopy = '';
      if (type === 'password') {
        try {
          // Use window object to access globally available function
          const decrypt = typeof decryptPassword !== 'undefined' 
            ? decryptPassword 
            : window.decryptPassword;
          textToCopy = decrypt(
            password.encryptedPassword,
            masterPassword,
            password.iv,
            password.salt
          );
        } catch (error) {
          showMessage('Failed to decrypt password', 'error');
          return;
        }
      } else {
        textToCopy = password.username;
      }

      await copyToClipboard(textToCopy);
      showMessage(`${type === 'password' ? 'Password' : 'Username'} copied to clipboard!`, 'success');
    });
  });

  // Edit password
  document.querySelectorAll('.edit-password').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const passwordId = btn.dataset.id;
      const password = currentPasswords.find(p => p.id === passwordId);
      if (password) {
        openPasswordModal(password);
      }
    });
  });

  // Delete password
  document.querySelectorAll('.delete-password').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const passwordId = btn.dataset.id;
      if (confirm('Are you sure you want to delete this password?')) {
        await deletePassword(passwordId);
      }
    });
  });
}

// Setup event listeners
function setupEventListeners() {
  // Add password button
  document.getElementById('addPasswordBtn').addEventListener('click', () => {
    openPasswordModal();
  });

  // Password form submission
  document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await savePassword();
  });

  // Modal close buttons
  document.getElementById('closeModal').addEventListener('click', closePasswordModal);
  document.getElementById('cancelBtn').addEventListener('click', closePasswordModal);

  // Search functionality
  document.getElementById('searchInput').addEventListener('input', (e) => {
    filterPasswords(e.target.value);
  });

  // Sort functionality
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    sortPasswords(e.target.value);
  });

  // Password generator
  document.getElementById('passwordGeneratorLink').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('generatorModal').classList.add('active');
  });

  document.getElementById('generatePasswordBtn').addEventListener('click', () => {
    document.getElementById('generatorModal').classList.add('active');
  });

  // Generator modal
  setupPasswordGenerator();

  // Security Check
  document.getElementById('securityCheckLink').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('securityCheckModal').classList.add('active');
    runSecurityCheck();
    closeMobileMenu(); // Close mobile menu if open
  });

  document.getElementById('closeSecurityCheckModal').addEventListener('click', () => {
    document.getElementById('securityCheckModal').classList.remove('active');
  });

  document.getElementById('runSecurityCheckBtn').addEventListener('click', runSecurityCheck);

  // Shared Passwords
  document.getElementById('sharedPasswordsLink').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('sharedPasswordsModal').classList.add('active');
    loadSharedPasswords();
    closeMobileMenu(); // Close mobile menu if open
  });

  document.getElementById('closeSharedPasswordsModal').addEventListener('click', () => {
    document.getElementById('sharedPasswordsModal').classList.remove('active');
  });

  // Settings
  document.getElementById('settingsLink').addEventListener('click', (e) => {
    e.preventDefault();
    openSettingsModal();
  });

  document.getElementById('closeSettingsModal').addEventListener('click', closeSettingsModal);
  document.getElementById('cancelSettingsBtn').addEventListener('click', closeSettingsModal);
  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveSettings();
  });

  // Export Data
  document.getElementById('exportLink').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('exportModal').classList.add('active');
  });

  document.getElementById('closeExportModal').addEventListener('click', () => {
    document.getElementById('exportModal').classList.remove('active');
  });

  document.getElementById('cancelExportBtn').addEventListener('click', () => {
    document.getElementById('exportModal').classList.remove('active');
  });

  document.getElementById('exportDataBtn').addEventListener('click', async () => {
    await exportData();
  });

  // Import Data
  document.getElementById('importLink').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('importModal').classList.add('active');
  });

  document.getElementById('closeImportModal').addEventListener('click', () => {
    document.getElementById('importModal').classList.remove('active');
    document.getElementById('importFile').value = '';
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('importDataBtn').disabled = true;
  });

  document.getElementById('cancelImportBtn').addEventListener('click', () => {
    document.getElementById('importModal').classList.remove('active');
    document.getElementById('importFile').value = '';
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('importDataBtn').disabled = true;
  });

  document.getElementById('importFile').addEventListener('change', (e) => {
    previewImportFile(e.target.files[0]);
  });

  document.getElementById('importDataBtn').addEventListener('click', async () => {
    await importData();
  });

  // Logout
  document.getElementById('logoutLink').addEventListener('click', async (e) => {
    e.preventDefault();
    await handleLogout();
  });

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // User menu
  document.getElementById('userMenuBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('userMenuDropdown').classList.toggle('show');
  });

  document.addEventListener('click', () => {
    document.getElementById('userMenuDropdown').classList.remove('show');
  });

  // Category filter
  document.getElementById('categoryList').addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
      document.querySelectorAll('#categoryList li').forEach(li => li.classList.remove('active'));
      e.target.classList.add('active');
      const category = e.target.dataset.category;
      filterByCategory(category);
      // Close mobile menu after selection
      closeMobileMenu();
    }
  });

  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
  const sidebar = document.querySelector('.sidebar');

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileMenu();
    });
  }

  if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener('click', closeMobileMenu);
  }

  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (sidebar && mobileMenuToggle) {
      if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        if (sidebar.classList.contains('active')) {
          closeMobileMenu();
        }
      }
    }
  });

  // Bottom navigation
  setupBottomNavigation();
}

// Mobile menu functions
function toggleMobileMenu() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('mobileMenuOverlay');
  
  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    if (sidebar.classList.contains('active')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
}

function closeMobileMenu() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('mobileMenuOverlay');
  
  if (sidebar && overlay) {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Setup bottom navigation
function setupBottomNavigation() {
  const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
  
  if (bottomNavItems.length === 0) return; // Not on mobile
  
  bottomNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      
      // Update active state
      bottomNavItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Handle navigation
      switch(section) {
        case 'home':
          // Scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
          // Update home nav to active
          document.querySelectorAll('.bottom-nav-item').forEach(nav => {
            if (nav.dataset.section === 'home') nav.classList.add('active');
          });
          break;
        case 'add':
          openPasswordModal();
          // Reset to home after closing
          setTimeout(() => {
            document.querySelectorAll('.bottom-nav-item').forEach(nav => {
              if (nav.dataset.section === 'home') nav.classList.add('active');
              else nav.classList.remove('active');
            });
          }, 100);
          break;
        case 'generator':
          document.getElementById('generatorModal').classList.add('active');
          break;
        case 'security':
          document.getElementById('securityCheckModal').classList.add('active');
          runSecurityCheck();
          break;
        case 'menu':
          toggleMobileMenu();
          break;
      }
    });
  });
}

// Open password modal
function openPasswordModal(password = null) {
  const modal = document.getElementById('passwordModal');
  const form = document.getElementById('passwordForm');
  const title = document.getElementById('modalTitle');

  if (password) {
    // Edit mode
    title.textContent = 'Edit Password';
    document.getElementById('passwordId').value = password.id;
    document.getElementById('website').value = password.website;
    document.getElementById('username').value = password.username;
    
    // Decrypt password
    try {
      // Use window object to access globally available function
      const decrypt = typeof decryptPassword !== 'undefined' 
        ? decryptPassword 
        : window.decryptPassword;
      const decrypted = decrypt(
        password.encryptedPassword,
        masterPassword,
        password.iv,
        password.salt
      );
      document.getElementById('password').value = decrypted;
    } catch (error) {
      showMessage('Failed to decrypt password', 'error');
      return;
    }

    document.getElementById('category').value = password.category || 'Uncategorized';
    document.getElementById('notes').value = password.notes || '';
  } else {
    // Add mode
    title.textContent = 'Add Password';
    form.reset();
    document.getElementById('passwordId').value = '';
  }

  modal.classList.add('active');
  updatePasswordStrength();
}

// Close password modal
function closePasswordModal() {
  document.getElementById('passwordModal').classList.remove('active');
  document.getElementById('passwordForm').reset();
}

// Save password
async function savePassword() {
  try {
    const passwordId = document.getElementById('passwordId').value;
    const website = document.getElementById('website').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const category = document.getElementById('category').value;
    const notes = document.getElementById('notes').value;

    // Encrypt password
    // Use window object to access globally available function
    const encrypt = typeof encryptPassword !== 'undefined' 
      ? encryptPassword 
      : window.encryptPassword;
    const encrypted = encrypt(password, masterPassword);

    const token = localStorage.getItem('jwt_token');
    const url = passwordId
      ? `${API_BASE_URL}/passwords/${passwordId}`
      : `${API_BASE_URL}/passwords`;

    const response = await fetch(url, {
      method: passwordId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        website,
        username,
        encryptedPassword: encrypted.encryptedPassword,
        iv: encrypted.iv,
        salt: encrypted.salt,
        category,
        notes,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save password');
    }

    showMessage('Password saved successfully!', 'success');
    closePasswordModal();
    await loadPasswords();
  } catch (error) {
    console.error('Error saving password:', error);
    showMessage('Failed to save password', 'error');
  }
}

// Delete password
async function deletePassword(passwordId) {
  try {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${API_BASE_URL}/passwords/${passwordId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete password');
    }

    showMessage('Password deleted successfully!', 'success');
    await loadPasswords();
  } catch (error) {
    console.error('Error deleting password:', error);
    showMessage('Failed to delete password', 'error');
  }
}

// Store currently selected category
let currentCategory = 'all';

// Filter passwords
function filterPasswords(searchTerm) {
  let filtered = currentPasswords;

  // Apply category filter first
  if (currentCategory !== 'all') {
    filtered = filtered.filter(p => p.category === currentCategory);
  }

  // Apply search filter
  if (searchTerm) {
    filtered = filtered.filter(password =>
      password.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (password.category && password.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  renderPasswords(filtered);
}

// Sort passwords
function sortPasswords(sortBy) {
  let sorted = [...currentPasswords];

  switch (sortBy) {
    case 'newest':
      sorted.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      break;
    case 'oldest':
      sorted.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
      break;
    case 'az':
      sorted.sort((a, b) => a.website.localeCompare(b.website));
      break;
    case 'za':
      sorted.sort((a, b) => b.website.localeCompare(a.website));
      break;
  }

  renderPasswords(sorted);
}

// Filter by category
function filterByCategory(category) {
  currentCategory = category;
  const searchTerm = document.getElementById('searchInput').value;
  filterPasswords(searchTerm);
}

// Update categories list
function updateCategories() {
  const categories = new Set(currentPasswords.map(p => p.category || 'Uncategorized'));
  const listEl = document.getElementById('categoryList');
  
  const allCategories = Array.from(categories).sort();
  const html = '<li class="active" data-category="all">All Passwords</li>' +
    allCategories.map(cat => `<li data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</li>`).join('');
  
  listEl.innerHTML = html;
}

// Update stats
function updateStats() {
  document.getElementById('totalPasswords').textContent = currentPasswords.length;
  
  // Calculate weak passwords
  const weakCount = currentPasswords.filter(p => {
    try {
      const decrypt = typeof decryptPassword !== 'undefined' ? decryptPassword : window.decryptPassword;
      const decrypted = decrypt(p.encryptedPassword, masterPassword, p.iv, p.salt);
      const analyzer = typeof analyzePasswordStrength !== 'undefined' ? analyzePasswordStrength : window.analyzePasswordStrength;
      const analysis = analyzer(decrypted);
      return analysis.score < 60;
    } catch {
      return false;
    }
  }).length;

  // Calculate reused passwords
  const passwordMap = new Map();
  currentPasswords.forEach(p => {
    try {
      const decrypt = typeof decryptPassword !== 'undefined' ? decryptPassword : window.decryptPassword;
      const decrypted = decrypt(p.encryptedPassword, masterPassword, p.iv, p.salt);
      if (!passwordMap.has(decrypted)) {
        passwordMap.set(decrypted, []);
      }
      passwordMap.get(decrypted).push(p);
    } catch {
      // Skip if can't decrypt
    }
  });
  const reusedCount = Array.from(passwordMap.values()).filter(arr => arr.length > 1).length;

  document.getElementById('weakPasswords').textContent = weakCount;
  document.getElementById('reusedPasswords').textContent = reusedCount;

  // Calculate security score
  const total = currentPasswords.length || 1;
  const strongCount = total - weakCount - reusedCount;
  const score = Math.round((strongCount / total) * 100);
  document.getElementById('securityScore').textContent = `${score}%`;
}

// Setup password generator
function setupPasswordGenerator() {
  const lengthSlider = document.getElementById('passwordLength');
  const lengthValue = document.getElementById('lengthValue');
  const generateBtn = document.getElementById('generateBtn');
  const copyGeneratedBtn = document.getElementById('copyGeneratedBtn');
  const generatedPasswordInput = document.getElementById('generatedPassword');

  if (!lengthSlider) return; // Generator modal not loaded

  lengthSlider.addEventListener('input', (e) => {
    lengthValue.textContent = e.target.value;
  });

  generateBtn.addEventListener('click', () => {
    const options = {
      length: parseInt(lengthSlider.value),
      includeUppercase: document.getElementById('includeUppercase').checked,
      includeLowercase: document.getElementById('includeLowercase').checked,
      includeNumbers: document.getElementById('includeNumbers').checked,
      includeSymbols: document.getElementById('includeSymbols').checked,
    };
    // Use window object to access globally available function
    const password = typeof generatePassword !== 'undefined' 
      ? generatePassword(options.length, options)
      : window.generatePassword(options.length, options);
    generatedPasswordInput.value = password;
  });

  copyGeneratedBtn.addEventListener('click', async () => {
    await copyToClipboard(generatedPasswordInput.value);
    showMessage('Password copied to clipboard!', 'success');
  });

  document.getElementById('closeGeneratorModal').addEventListener('click', () => {
    document.getElementById('generatorModal').classList.remove('active');
  });

  // Use generated password in form
  generatedPasswordInput.addEventListener('dblclick', () => {
    if (generatedPasswordInput.value) {
      document.getElementById('password').value = generatedPasswordInput.value;
      document.getElementById('generatorModal').classList.remove('active');
      updatePasswordStrength();
    }
  });
}

// Update password strength indicator
function updatePasswordStrength() {
  const passwordInput = document.getElementById('password');
  const strengthEl = document.getElementById('passwordStrength');
  
  if (passwordInput && strengthEl) {
    passwordInput.addEventListener('input', () => {
      const password = passwordInput.value;
      if (password) {
        // Use window object to access globally available function
        const analyzer = typeof analyzePasswordStrength !== 'undefined' 
          ? analyzePasswordStrength 
          : window.analyzePasswordStrength;
        const analysis = analyzer(password);
        strengthEl.innerHTML = `
          <div class="strength-bar">
            <div class="strength-fill strength-${analysis.strength.toLowerCase().replace(' ', '-')}" 
                 style="width: ${analysis.score}%"></div>
          </div>
          <span class="strength-text">${analysis.strength}</span>
        `;
      } else {
        strengthEl.innerHTML = '';
      }
    });
  }
}

// Security Check functionality
async function runSecurityCheck() {
  const summaryEl = document.getElementById('securitySummary');
  const weakListEl = document.getElementById('weakPasswordsList');
  const reusedListEl = document.getElementById('reusedPasswordsList');
  const breachedListEl = document.getElementById('breachedPasswordsList');
  const weakSection = document.getElementById('weakPasswordsSection');
  const reusedSection = document.getElementById('reusedPasswordsSection');
  const breachedSection = document.getElementById('breachedPasswordsSection');

  summaryEl.innerHTML = '<p>🔍 Running security check...</p>';
  weakListEl.innerHTML = '';
  reusedListEl.innerHTML = '';
  breachedListEl.innerHTML = '';
  weakSection.style.display = 'none';
  reusedSection.style.display = 'none';
  breachedSection.style.display = 'none';

  try {
    const weakPasswords = [];
    const reusedMap = new Map();
    const breachedPasswords = [];

    // Analyze all passwords
    for (const pwd of currentPasswords) {
      try {
        const decrypt = typeof decryptPassword !== 'undefined' ? decryptPassword : window.decryptPassword;
        const decrypted = decrypt(pwd.encryptedPassword, masterPassword, pwd.iv, pwd.salt);
        
        // Check password strength
        const analyzer = typeof analyzePasswordStrength !== 'undefined' ? analyzePasswordStrength : window.analyzePasswordStrength;
        const analysis = analyzer(decrypted);
        
        if (analysis.score < 60) {
          weakPasswords.push({ ...pwd, strength: analysis.strength, score: analysis.score });
        }

        // Check for reused passwords
        if (!reusedMap.has(decrypted)) {
          reusedMap.set(decrypted, []);
        }
        reusedMap.get(decrypted).push(pwd);

        // Check for breaches (client-side check)
        try {
          const breachChecker = typeof checkPasswordBreach !== 'undefined' ? checkPasswordBreach : window.checkPasswordBreach;
          const breachResult = await breachChecker(decrypted);
          if (breachResult.breached) {
            breachedPasswords.push({ ...pwd, breachCount: breachResult.count });
          }
        } catch (error) {
          console.error('Breach check error:', error);
        }

      } catch (error) {
        console.error('Error analyzing password:', error);
      }
    }

    // Display results
    const total = currentPasswords.length;
    const issues = weakPasswords.length + Array.from(reusedMap.values()).filter(arr => arr.length > 1).length + breachedPasswords.length;

    if (issues === 0) {
      summaryEl.innerHTML = `
        <div class="security-status success">
          <h3>✅ All Good!</h3>
          <p>Your passwords are secure. No issues found.</p>
        </div>
      `;
    } else {
      summaryEl.innerHTML = `
        <div class="security-status warning">
          <h3>⚠️ ${issues} Issue${issues > 1 ? 's' : ''} Found</h3>
          <p>Found ${weakPasswords.length} weak, ${Array.from(reusedMap.values()).filter(arr => arr.length > 1).length} reused, and ${breachedPasswords.length} breached password${breachedPasswords.length !== 1 ? 's' : ''}.</p>
        </div>
      `;
    }

    // Display weak passwords
    if (weakPasswords.length > 0) {
      weakSection.style.display = 'block';
      weakListEl.innerHTML = weakPasswords.map(pwd => `
        <li>
          <strong>${escapeHtml(pwd.website)}</strong> - ${escapeHtml(pwd.strength)} (Score: ${pwd.score})
          <button class="btn btn-sm btn-secondary" onclick="document.getElementById('passwordsList').scrollIntoView(); 
            const password = currentPasswords.find(p => p.id === '${pwd.id}'); 
            if (password) openPasswordModal(password);">Edit</button>
        </li>
      `).join('');
    }

    // Display reused passwords
    const reused = Array.from(reusedMap.values()).filter(arr => arr.length > 1);
    if (reused.length > 0) {
      reusedSection.style.display = 'block';
      reusedListEl.innerHTML = reused.map(arr => `
        <li>
          <strong>Used ${arr.length} times:</strong>
          <ul>
            ${arr.map(pwd => `<li>${escapeHtml(pwd.website)} (${escapeHtml(pwd.username)})</li>`).join('')}
          </ul>
        </li>
      `).join('');
    }

    // Display breached passwords
    if (breachedPasswords.length > 0) {
      breachedSection.style.display = 'block';
      breachedListEl.innerHTML = breachedPasswords.map(pwd => `
        <li>
          <strong>${escapeHtml(pwd.website)}</strong> - Found in ${pwd.breachCount.toLocaleString()} data breach${pwd.breachCount !== 1 ? 'es' : ''}
          <button class="btn btn-sm btn-secondary" onclick="document.getElementById('passwordsList').scrollIntoView(); 
            const password = currentPasswords.find(p => p.id === '${pwd.id}'); 
            if (password) openPasswordModal(password);">Change Password</button>
        </li>
      `).join('');
    }

  } catch (error) {
    console.error('Security check error:', error);
    summaryEl.innerHTML = '<p class="error">❌ Error running security check. Please try again.</p>';
  }
}

// Load shared passwords
async function loadSharedPasswords() {
  const listEl = document.getElementById('sharedPasswordsList');
  listEl.innerHTML = '<p>Loading shared passwords...</p>';

  try {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${API_BASE_URL}/passwords/shared`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load shared passwords');
    }

    const data = await response.json();
    const shared = data.shared || [];

    if (shared.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><p>No shared passwords yet.</p></div>';
      return;
    }

    listEl.innerHTML = shared.map(item => {
      // Decrypt password
      let decryptedPassword = '';
      try {
        const decrypt = typeof decryptPassword !== 'undefined' ? decryptPassword : window.decryptPassword;
        decryptedPassword = decrypt(item.encryptedPassword, masterPassword, item.iv, item.salt);
      } catch (error) {
        decryptedPassword = '***';
      }

      return `
        <div class="password-card">
          <div class="password-card-header">
            <div class="password-icon">👥</div>
            <div class="password-info">
              <h3>Shared from ${escapeHtml(item.fromEmail)}</h3>
              <p class="password-username">Shared on ${formatDate(item.sharedAt)}</p>
            </div>
          </div>
          <div class="password-card-body">
            <div class="password-field">
              <label>Password:</label>
              <div class="password-display">
                <input type="password" class="password-value" value="${escapeHtml(decryptedPassword)}" readonly>
                <button class="btn-icon toggle-shared-password" onclick="this.previousElementSibling.type = this.previousElementSibling.type === 'password' ? 'text' : 'password'">👁️</button>
                <button class="btn-icon copy-btn" onclick="navigator.clipboard.writeText('${escapeHtml(decryptedPassword)}'); showMessage('Password copied!', 'success')">📋</button>
              </div>
            </div>
          </div>
            <div class="password-card-actions">
            <button class="btn btn-danger btn-sm" onclick="deleteSharedPassword('${item.id}')">Remove</button>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading shared passwords:', error);
    listEl.innerHTML = '<div class="empty-state"><p class="error">Failed to load shared passwords.</p></div>';
  }
}

// Delete shared password
async function deleteSharedPassword(shareId) {
  if (!confirm('Remove this shared password from your list?')) return;

  try {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${API_BASE_URL}/passwords/shared/${shareId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete shared password');
    }

    showMessage('Shared password removed', 'success');
    await loadSharedPasswords();
  } catch (error) {
    console.error('Error deleting shared password:', error);
    showMessage('Failed to remove shared password', 'error');
  }
}

// Settings functionality
function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  
  // Load current settings
  const theme = localStorage.getItem('theme') || 'light';
  const autoLogout = localStorage.getItem('autoLogout') || '30';
  const rememberMasterPassword = localStorage.getItem('masterPassword') ? true : false;
  const showPasswordStrength = localStorage.getItem('showPasswordStrength') !== 'false';

  document.getElementById('themeSetting').value = theme;
  document.getElementById('autoLogoutSetting').value = autoLogout;
  document.getElementById('rememberMasterPassword').checked = rememberMasterPassword;
  document.getElementById('showPasswordStrength').checked = showPasswordStrength;

  modal.classList.add('active');
}

function closeSettingsModal() {
  document.getElementById('settingsModal').classList.remove('active');
}

async function saveSettings() {
  try {
    const theme = document.getElementById('themeSetting').value;
    const autoLogout = document.getElementById('autoLogoutSetting').value;
    const rememberMasterPassword = document.getElementById('rememberMasterPassword').checked;
    const showPasswordStrength = document.getElementById('showPasswordStrength').checked;

    // Save to localStorage
    localStorage.setItem('theme', theme);
    localStorage.setItem('autoLogout', autoLogout);
    localStorage.setItem('showPasswordStrength', showPasswordStrength);

    // Apply theme
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else if (theme === 'light') {
      document.body.classList.remove('dark-mode');
    } else {
      // Auto - use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }

    // Update auto-logout timeout
    window.autoLogoutMinutes = parseInt(autoLogout);
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      resetInactivityTimer();
    }

    // Settings are saved locally for now
    // Backend sync can be added later if needed

    showMessage('Settings saved successfully!', 'success');
    closeSettingsModal();
  } catch (error) {
    console.error('Error saving settings:', error);
    showMessage('Failed to save settings', 'error');
  }
}

// Export data functionality
async function exportData() {
  try {
    showLoading(true);
    const exportFormat = document.querySelector('input[name="exportFormat"]:checked').value;
    
    let exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      format: exportFormat,
      passwords: [],
    };

    if (exportFormat === 'encrypted') {
      // Export encrypted passwords (can be imported back)
      exportData.passwords = currentPasswords.map(pwd => ({
        website: pwd.website,
        username: pwd.username,
        encryptedPassword: pwd.encryptedPassword,
        iv: pwd.iv,
        salt: pwd.salt,
        category: pwd.category,
        notes: pwd.notes,
        createdAt: pwd.createdAt?.toDate ? pwd.createdAt.toDate().toISOString() : pwd.createdAt,
      }));
    } else {
      // Export decrypted passwords (plaintext - for migration)
      exportData.passwords = currentPasswords.map(pwd => {
        try {
          const decrypt = typeof decryptPassword !== 'undefined' ? decryptPassword : window.decryptPassword;
          const decrypted = decrypt(pwd.encryptedPassword, masterPassword, pwd.iv, pwd.salt);
          return {
            website: pwd.website,
            username: pwd.username,
            password: decrypted,
            category: pwd.category,
            notes: pwd.notes,
            createdAt: pwd.createdAt?.toDate ? pwd.createdAt.toDate().toISOString() : pwd.createdAt,
          };
        } catch (error) {
          console.error('Error decrypting password for export:', error);
          return null;
        }
      }).filter(p => p !== null);
    }

    // Create and download file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `password-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showMessage('Data exported successfully!', 'success');
    document.getElementById('exportModal').classList.remove('active');
  } catch (error) {
    console.error('Error exporting data:', error);
    showMessage('Failed to export data', 'error');
  } finally {
    showLoading(false);
  }
}

// Import data functionality
function previewImportFile(file) {
  if (!file) {
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('importDataBtn').disabled = true;
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      if (!data.passwords || !Array.isArray(data.passwords)) {
        throw new Error('Invalid file format');
      }

      const count = data.passwords.length;
      const format = data.format || 'unknown';
      
      document.getElementById('importPreviewText').textContent = 
        `Found ${count} password${count !== 1 ? 's' : ''} to import. Format: ${format === 'encrypted' ? 'Encrypted' : 'Decrypted'}.`;
      document.getElementById('importPreview').style.display = 'block';
      document.getElementById('importDataBtn').disabled = false;
    } catch (error) {
      document.getElementById('importPreviewText').textContent = 
        `Error: ${error.message}. Please select a valid export file.`;
      document.getElementById('importPreview').style.display = 'block';
      document.getElementById('importDataBtn').disabled = true;
    }
  };
  reader.readAsText(file);
}

async function importData() {
  const fileInput = document.getElementById('importFile');
  const file = fileInput.files[0];
  const overwrite = document.getElementById('overwriteExisting').checked;

  if (!file) {
    showMessage('Please select a file to import', 'error');
    return;
  }

  try {
    showLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        
        if (!importData.passwords || !Array.isArray(importData.passwords)) {
          throw new Error('Invalid file format');
        }

        const token = localStorage.getItem('jwt_token');
        let imported = 0;
        let skipped = 0;
        let errors = 0;

        for (const pwd of importData.passwords) {
          try {
            // Check if password already exists
            if (!overwrite) {
              const exists = currentPasswords.find(
                p => p.website === pwd.website && p.username === pwd.username
              );
              if (exists) {
                skipped++;
                continue;
              }
            }

            let encryptedPassword, iv, salt;

            if (importData.format === 'encrypted' && pwd.encryptedPassword) {
              // Import encrypted password (keep as is)
              encryptedPassword = pwd.encryptedPassword;
              iv = pwd.iv;
              salt = pwd.salt;
            } else if (pwd.password) {
              // Import decrypted password (encrypt it)
              const encrypt = typeof encryptPassword !== 'undefined' ? encryptPassword : window.encryptPassword;
              const encrypted = encrypt(pwd.password, masterPassword);
              encryptedPassword = encrypted.encryptedPassword;
              iv = encrypted.iv;
              salt = encrypted.salt;
            } else {
              throw new Error('Invalid password format');
            }

            // Save password
            const response = await fetch(`${API_BASE_URL}/passwords`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                website: pwd.website,
                username: pwd.username,
                encryptedPassword,
                iv,
                salt,
                category: pwd.category || 'Uncategorized',
                notes: pwd.notes || '',
              }),
            });

            if (response.ok) {
              imported++;
            } else {
              errors++;
            }
          } catch (error) {
            console.error('Error importing password:', error);
            errors++;
          }
        }

        showMessage(
          `Import complete! ${imported} imported, ${skipped} skipped, ${errors} errors.`,
          imported > 0 ? 'success' : 'warning'
        );

        // Reload passwords
        await loadPasswords();
        document.getElementById('importModal').classList.remove('active');
        document.getElementById('importFile').value = '';
        document.getElementById('importPreview').style.display = 'none';
        document.getElementById('importDataBtn').disabled = true;
      } catch (error) {
        console.error('Error parsing import file:', error);
        showMessage('Failed to import data: ' + error.message, 'error');
      } finally {
        showLoading(false);
      }
    };

    reader.readAsText(file);
  } catch (error) {
    console.error('Error reading import file:', error);
    showMessage('Failed to read import file', 'error');
    showLoading(false);
  }
}

// Utility functions
function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

function showMessage(message, type = 'info') {
  // Create or update message element
  let messageEl = document.querySelector('.message-toast');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.className = 'message-toast';
    document.body.appendChild(messageEl);
  }
  
  messageEl.textContent = message;
  messageEl.className = `message-toast ${type} show`;
  
  setTimeout(() => {
    messageEl.classList.remove('show');
  }, 3000);
}

function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(date) {
  if (!date) return 'N/A';
  
  try {
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  } catch (error) {
    return 'N/A';
  }
}

async function handleLogout() {
  try {
    await signOut(auth);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
    localStorage.removeItem('masterPassword');
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout error:', error);
    // Force logout even if Firebase signOut fails
    localStorage.clear();
    window.location.href = 'index.html';
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Load theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
}

// Load settings
function loadSettings() {
  const theme = localStorage.getItem('theme') || 'light';
  const autoLogout = localStorage.getItem('autoLogout') || '30';

  // Apply theme
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else if (theme === 'light') {
    document.body.classList.remove('dark-mode');
  } else {
    // Auto - use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  // Store auto-logout setting for use in setupAutoLogout
  window.autoLogoutMinutes = parseInt(autoLogout);
}

// Setup auto-logout after inactivity
let inactivityTimer;
function setupAutoLogout() {
  const timeout = (window.autoLogoutMinutes || 30) * 60 * 1000; // minutes to milliseconds
  resetInactivityTimer();

  document.addEventListener('mousedown', resetInactivityTimer);
  document.addEventListener('keypress', resetInactivityTimer);
  document.addEventListener('scroll', resetInactivityTimer);
  document.addEventListener('touchstart', resetInactivityTimer);
}

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  const timeout = (window.autoLogoutMinutes || 30) * 60 * 1000;
  inactivityTimer = setTimeout(() => {
    showMessage('Session expired due to inactivity. Please login again.', 'warning');
    handleLogout();
  }, timeout);
}

