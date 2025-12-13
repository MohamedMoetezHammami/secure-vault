// ============================================
// API Configuration for Secure Vault
// ============================================

// Detect environment and set API URL accordingly
const getApiUrl = () => {
  // Check if we're in a Capacitor/mobile environment
  if (typeof window !== 'undefined' && window.Capacitor) {
    // For mobile apps, always use the production API
    return 'https://secure-vault-api.onrender.com/api';
  }

  // Check current hostname
  const hostname = window.location.hostname;

  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }

  // Render static site or other production hosting
  // Replace with your actual Render backend URL after deployment
  return 'https://secure-vault-api.onrender.com/api';
};

// Export configuration
const CONFIG = {
  API_URL: getApiUrl(),

  // Firebase config (client-side)
  FIREBASE: {
    apiKey: "AIzaSyCY6CVL8uvwxq4kH-J7tToAB9uyj1aB2M4",
    authDomain: "vault-28864.firebaseapp.com",
    projectId: "vault-28864",
    storageBucket: "vault-28864.appspot.com",
    messagingSenderId: "1029054809337",
    appId: "1:1029054809337:web:YOUR_APP_ID"
  },

  // App settings
  APP: {
    name: 'Secure Vault',
    version: '1.0.0'
  }
};

// Make it globally available
window.CONFIG = CONFIG;

console.log('🔧 API URL configured:', CONFIG.API_URL);
