# Quick Start: Mobile App Setup

## Quick Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Capacitor

```bash
npx cap init
```

When prompted:
- App name: `Secure Vault`
- App ID: `com.securevault.app`
- Web dir: `frontend`

### 3. Add Platforms

```bash
# Add Android
npx cap add android

# Add iOS (Mac only)
npx cap add ios
```

### 4. Update API URLs for Mobile

Edit `frontend/js/dashboard.js` and `frontend/js/auth.js`:

**For Android Emulator:**
```javascript
const API_BASE_URL = 'http://10.0.2.2:3000/api';
```

**For iOS Simulator:**
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

**For Physical Devices:**
```javascript
// Replace with your computer's IP address
const API_BASE_URL = 'http://192.168.1.100:3000/api';
```

To find your IP:
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` or `ip addr`

### 5. Sync to Native

```bash
npx cap sync
```

### 6. Open in Native IDE

**Android:**
```bash
npx cap open android
```

**iOS:**
```bash
npx cap open ios
```

### 7. Run Your Backend

Make sure your backend is running:
```bash
cd backend
npm start
```

### 8. Run the App

- In Android Studio: Click the green "Run" button
- In Xcode: Click the play button

## Important Notes

1. **API URL**: Make sure your backend CORS settings allow requests from the mobile app
2. **HTTPS**: For production, you'll need HTTPS
3. **Network**: Physical devices need to be on the same network as your backend

## Troubleshooting

**Can't connect to API:**
- Check backend is running
- Verify IP address is correct
- Check firewall settings
- For Android emulator, use `10.0.2.2` instead of `localhost`

**Build errors:**
- Run `npx cap sync` again
- Clean build in Android Studio/Xcode
- Check all dependencies are installed

## Next: Add Mobile Features

See `CAPACITOR_SETUP.md` for advanced features like:
- Biometric authentication
- Secure storage
- Push notifications

