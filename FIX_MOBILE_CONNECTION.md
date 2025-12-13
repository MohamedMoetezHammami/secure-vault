# Fix "Failed to fetch" Error in Android App

## The Problem

The "Failed to fetch" error means the mobile app cannot connect to your backend server.

## Quick Checklist

1. ✅ **Backend server is running** on port 3000
2. ✅ **API URL is correct** for Android emulator
3. ✅ **CORS is configured** to allow mobile requests
4. ✅ **Network connectivity** is working

## Step-by-Step Fix

### Step 1: Make Sure Backend is Running

Open a terminal and start your backend:

```bash
cd backend
npm start
```

You should see:
```
Server running on port 3000
Firebase Admin initialized successfully
```

**Keep this terminal open!** The backend must be running for the app to work.

### Step 2: Check API URL in App

The app should automatically detect Android and use `http://10.0.2.2:3000/api`.

**To verify:**
1. Open Chrome DevTools in Android Studio
2. Or use `adb logcat` to see console logs
3. Look for: `✅ Final API_BASE_URL: http://10.0.2.2:3000/api`

### Step 3: Test Backend Connection

Test if the backend is accessible:

**From your computer's browser:**
```
http://localhost:3000/api/health
```

Should return: `{"status":"ok","timestamp":"..."}`

**From Android emulator:**
The emulator uses `10.0.2.2` to access your computer's localhost.

### Step 4: Check CORS Settings

The backend CORS is now configured to allow all origins in development. Make sure `backend/server.js` has the updated CORS configuration.

### Step 5: Sync Capacitor Again

After making changes, sync to native:

```bash
npx cap sync
```

Then rebuild in Android Studio.

## Common Issues and Solutions

### Issue 1: Backend Not Running
**Solution:** Start the backend server:
```bash
cd backend
npm start
```

### Issue 2: Wrong API URL
**For Android Emulator:**
- Should use: `http://10.0.2.2:3000/api`
- ✅ Already configured in the code

**For Physical Android Device:**
1. Find your computer's IP:
   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   ```

2. Update `frontend/js/auth.js` and `frontend/js/dashboard.js`:
   ```javascript
   if (platform === 'android') {
     return 'http://192.168.1.100:3000/api'; // Your IP
   }
   ```

3. Sync again:
   ```bash
   npx cap sync
   ```

### Issue 3: Firewall Blocking
**Windows Firewall might block port 3000.**

**Solution:**
1. Open Windows Defender Firewall
2. Allow Node.js through firewall
3. Or temporarily disable firewall to test

### Issue 4: CORS Error
**Solution:** The backend CORS is now configured to allow all origins. If still having issues, check `backend/server.js`.

### Issue 5: Network Security Config (Android)
Android 9+ blocks cleartext HTTP by default. We need to allow it.

**Solution:** Create `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

Then update `android/app/src/main/AndroidManifest.xml`:
```xml
<application
    ...
    android:usesCleartextTraffic="true"
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

## Debug Steps

### 1. Check Console Logs

In Android Studio:
- View → Tool Windows → Logcat
- Filter by "chromium" or "WebView"
- Look for API URL and error messages

### 2. Test API Directly

From Android emulator's browser (if available):
```
http://10.0.2.2:3000/api/health
```

### 3. Check Network Tab

Use Chrome DevTools:
- Connect device via USB
- Chrome → chrome://inspect
- Inspect your app
- Check Network tab for failed requests

## Quick Test

1. **Start backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Test health endpoint:**
   Open browser: `http://localhost:3000/api/health`
   Should see: `{"status":"ok",...}`

3. **Sync and rebuild:**
   ```bash
   npx cap sync
   npx cap open android
   ```

4. **Run app and check logs:**
   - Look for API URL in console
   - Check for connection errors

## Still Not Working?

1. **Check backend logs** - Are requests reaching the server?
2. **Check Android logs** - Use Logcat in Android Studio
3. **Try physical device** - Emulator sometimes has network issues
4. **Use your computer's IP** - For physical devices

## Production Note

For production, you'll need:
- HTTPS (not HTTP)
- Proper domain name
- Updated API URL in app
- Proper CORS configuration

