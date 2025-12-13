# Install Capacitor - Step by Step

## Step 1: Install Capacitor Dependencies

Open your terminal in the project root and run:

```bash
npm install
```

This will install all Capacitor dependencies defined in `package.json`.

## Step 2: Initialize Capacitor

Run the initialization command:

```bash
npx cap init
```

**When prompted, enter:**
- **App name**: `Secure Vault`
- **App ID**: `com.securevault.app` (or your preferred bundle ID)
- **Web dir**: `frontend`

This creates the `capacitor.config.json` file (already created for you).

## Step 3: Add Android Platform

```bash
npx cap add android
```

This creates the `android/` folder with your Android project.

## Step 4: Add iOS Platform (Mac only)

If you're on Mac and want to build for iOS:

```bash
npx cap add ios
```

This creates the `ios/` folder with your iOS project.

## Step 5: Update API URL for Your Setup

### For Android Emulator:
The code is already set to use `http://10.0.2.2:3000/api` which works for Android emulator.

### For Physical Android Device:
1. Find your computer's IP address:
   - Windows: Open Command Prompt and run `ipconfig`
   - Look for "IPv4 Address" (e.g., 192.168.1.100)

2. Update `frontend/js/dashboard.js` and `frontend/js/auth.js`:
   ```javascript
   // Replace 192.168.1.100 with your actual IP
   return 'http://192.168.1.100:3000/api';
   ```

### For iOS Simulator:
The code uses `http://localhost:3000/api` which works for iOS simulator.

### For Physical iOS Device:
Same as Android - use your computer's IP address.

## Step 6: Sync Your Web App

After making any changes to your web app, sync to native:

```bash
npx cap sync
```

This copies your `frontend/` folder to the native projects.

## Step 7: Open in Native IDE

### Android:
```bash
npx cap open android
```

This opens Android Studio. Then:
1. Wait for Gradle sync to complete
2. Connect an Android device or start an emulator
3. Click the green "Run" button

### iOS (Mac only):
```bash
npx cap open ios
```

This opens Xcode. Then:
1. Select a simulator or connected device
2. Click the play button to run

## Step 8: Test Your App

1. Make sure your backend is running:
   ```bash
   cd backend
   npm start
   ```

2. Run the app from Android Studio or Xcode

3. Test the login and password management features

## Troubleshooting

### "Cannot connect to API" Error

**For Android Emulator:**
- Make sure you're using `10.0.2.2` (already configured)
- Check that backend is running on port 3000
- Verify CORS settings in `backend/server.js`

**For Physical Device:**
- Use your computer's IP address (not localhost)
- Make sure device and computer are on same WiFi network
- Check Windows Firewall isn't blocking port 3000
- Try temporarily disabling firewall to test

**For iOS Simulator:**
- `localhost` should work
- If not, try your Mac's IP address

### Build Errors

1. Clean the project:
   - Android Studio: Build → Clean Project
   - Xcode: Product → Clean Build Folder

2. Sync again:
   ```bash
   npx cap sync
   ```

3. Rebuild in the IDE

### App Crashes on Launch

1. Check browser console for errors
2. Make sure all scripts are loading correctly
3. Verify Capacitor is initialized properly

## Next Steps

Once basic setup works, you can add:

1. **Biometric Authentication** - Use fingerprint/face ID
2. **Secure Storage** - Store master password securely
3. **App Icons** - Custom app icons
4. **Splash Screen** - Custom splash screen
5. **Push Notifications** - Optional feature

See `CAPACITOR_SETUP.md` for advanced features.

