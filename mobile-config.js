// Mobile-specific configuration
// This file helps configure the app for mobile devices

// Detect if running in Capacitor
const isCapacitor = typeof window !== 'undefined' && window.Capacitor;

// Get API base URL based on platform
function getApiBaseUrl() {
  if (isCapacitor) {
    const platform = window.Capacitor.getPlatform();
    
    // For Android emulator
    if (platform === 'android') {
      // Use 10.0.2.2 to access localhost from Android emulator
      // For physical device, use your computer's IP address
      return 'http://10.0.2.2:3000/api';
    }
    
    // For iOS simulator
    if (platform === 'ios') {
      // iOS simulator can use localhost
      return 'http://localhost:3000/api';
    }
  }
  
  // For web browser
  return 'http://localhost:3000/api';
}

// Production API URL (update this when deploying)
const PRODUCTION_API_URL = 'https://your-api-server.com/api';

// Use production URL in production builds
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? PRODUCTION_API_URL 
  : getApiBaseUrl();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_BASE_URL, isCapacitor };
}

