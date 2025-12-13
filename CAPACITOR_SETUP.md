# Capacitor Mobile App Setup Guide

This guide will help you convert your password manager web app into a native mobile app using Capacitor.

## What is Capacitor?

Capacitor is a cross-platform app runtime that lets you build native iOS and Android apps using web technologies (HTML, CSS, JavaScript). It's the modern alternative to Cordova/PhoneGap.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- For iOS: Xcode (Mac only)
- For Android: Android Studio

## Step 1: Install Capacitor

1. Navigate to your project root:
```bash
cd C:\Users\HammamiMohamedMoetez\Desktop\TP_SECU
```

2. Install Capacitor CLI and core:
```bash
npm install @capacitor/core @capacitor/cli
```

3. Install Capacitor platforms:
```bash
npm install @capacitor/android @capacitor/ios
```

## Step 2: Initialize Capacitor

1. Initialize Capacitor in your project:
```bash
npx cap init
```

When prompted:
- **App name**: Secure Vault (or your preferred name)
- **App ID**: com.securevault.app (or your preferred bundle ID)
- **Web dir**: frontend (this is where your web files are)

## Step 3: Add Platforms

1. Add Android platform:
```bash
npx cap add android
```

2. Add iOS platform (Mac only):
```bash
npx cap add ios
```

## Step 4: Configure Capacitor

The `capacitor.config.json` file will be created. Update it with your settings (see the file I'll create).

## Step 5: Build Your Web App

Before syncing to native platforms, make sure your web app is built/ready:

```bash
# Your frontend is already ready, but if you have a build step, run it
# For now, we'll use the frontend folder directly
```

## Step 6: Sync to Native Platforms

Sync your web app to native platforms:

```bash
npx cap sync
```

This command:
- Copies your web app to native projects
- Updates native dependencies
- Updates native project files

## Step 7: Open in Native IDEs

### For Android:
```bash
npx cap open android
```

This opens Android Studio where you can:
- Run on an emulator
- Build APK/AAB
- Run on a connected device

### For iOS (Mac only):
```bash
npx cap open ios
```

This opens Xcode where you can:
- Run on a simulator
- Build for App Store
- Run on a connected device

## Step 8: Install Additional Plugins (Optional)

For enhanced mobile features, you might want:

```bash
# Secure storage
npm install @capacitor/preferences

# Biometric authentication
npm install @capacitor-community/biometric

# Status bar
npm install @capacitor/status-bar

# Splash screen
npm install @capacitor/splash-screen

# Keyboard
npm install @capacitor/keyboard

# App
npm install @capacitor/app
```

Then sync again:
```bash
npx cap sync
```

## Step 9: Mobile-Specific Considerations

### Update API URL for Mobile

In mobile apps, `localhost` won't work. You need to:
1. Use your computer's IP address for development
2. Or deploy your backend to a server

Update `frontend/js/dashboard.js` and `frontend/js/auth.js`:
```javascript
// For development (replace with your computer's IP)
const API_BASE_URL = 'http://192.168.1.100:3000/api';

// For production (replace with your server URL)
// const API_BASE_URL = 'https://your-api-server.com/api';
```

### Enable HTTPS in Production

Mobile apps require HTTPS for API calls in production. Make sure your backend uses HTTPS.

## Step 10: Build and Test

### Android:
1. Open Android Studio
2. Connect a device or start an emulator
3. Click "Run" button

### iOS:
1. Open Xcode
2. Select a simulator or device
3. Click "Run" button

## Troubleshooting

### CORS Issues
- Make sure your backend CORS settings allow requests from `capacitor://localhost`
- Or use your server's domain

### API Connection Issues
- Check that your backend is running
- Verify the API_BASE_URL is correct
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For iOS simulator, use `localhost` or your Mac's IP

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Sync Capacitor: `npx cap sync`
- Clean and rebuild in native IDE

## Production Build

### Android APK:
1. Open Android Studio
2. Build → Generate Signed Bundle / APK
3. Follow the wizard

### iOS:
1. Open Xcode
2. Product → Archive
3. Distribute to App Store

## Next Steps

1. Add biometric authentication for mobile
2. Add secure storage for master password
3. Add push notifications (optional)
4. Optimize for mobile performance
5. Add app icons and splash screens

## Useful Commands

```bash
# Sync web app to native
npx cap sync

# Copy web app only (faster)
npx cap copy

# Update native dependencies
npx cap update

# Check Capacitor version
npx cap doctor
```

