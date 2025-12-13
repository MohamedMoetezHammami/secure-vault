// Mobile initialization script
// This will only work when running in Capacitor (mobile app)
// In web browser, it will gracefully skip

document.addEventListener('DOMContentLoaded', () => {
  // Check if running in Capacitor
  // Capacitor injects window.Capacitor when running in native app
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    console.log('📱 Running in Capacitor mobile app');
    
    // Initialize mobile features
    initMobileFeatures();
  } else {
    console.log('🌐 Running in web browser');
  }
});

async function initMobileFeatures() {
  try {
    // These will be available when Capacitor plugins are installed
    // For now, we'll check if they exist before using them
    
    // Status Bar
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar) {
      const { StatusBar } = window.Capacitor.Plugins;
      await StatusBar.setStyle({ style: 'dark' });
      await StatusBar.setBackgroundColor({ color: '#6366f1' });
    }
    
    // Splash Screen
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen) {
      const { SplashScreen } = window.Capacitor.Plugins;
      setTimeout(async () => {
        await SplashScreen.hide();
      }, 2000);
    }
    
    // App lifecycle
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      const { App } = window.Capacitor.Plugins;
      
      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          console.log('App went to background');
          // Optional: Lock app or clear sensitive data
        } else {
          console.log('App came to foreground');
        }
      });
      
      // Android back button
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        } else {
          window.history.back();
        }
      });
    }
    
    // Keyboard
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Keyboard) {
      const { Keyboard } = window.Capacitor.Plugins;
      
      Keyboard.addListener('keyboardWillShow', (info) => {
        document.body.style.paddingBottom = `${info.keyboardHeight}px`;
      });
      
      Keyboard.addListener('keyboardWillHide', () => {
        document.body.style.paddingBottom = '0';
      });
    }
    
    console.log('✅ Mobile features initialized');
  } catch (error) {
    console.log('⚠️ Error initializing mobile features:', error);
  }
}

