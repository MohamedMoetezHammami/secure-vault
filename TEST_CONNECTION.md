# Test Backend Connection

## Quick Test Steps

### 1. Verify Backend is Running

Open terminal and check:
```bash
cd backend
npm start
```

You should see:
```
Server running on port 3000
Environment: development
Firebase Admin initialized successfully
```

### 2. Test from Browser

Open your browser and go to:
```
http://localhost:3000/api/health
```

You should see:
```json
{"status":"ok","timestamp":"2025-..."}
```

### 3. Test from Android Emulator

The Android emulator uses `10.0.2.2` to access your computer's localhost.

**Option A: Use ADB to test**
```bash
adb shell
curl http://10.0.2.2:3000/api/health
```

**Option B: Check in app console**
- Open Android Studio
- View → Tool Windows → Logcat
- Filter by "chromium" or your app name
- Look for console.log messages showing API URL

### 4. Check API URL Detection

In the app, open browser console (via Chrome DevTools) and you should see:
```
📱 Running on platform: android
🔗 Using API URL for Android: http://10.0.2.2:3000/api
✅ Final API_BASE_URL: http://10.0.2.2:3000/api
```

## Common Issues

### "Failed to fetch" Error

**Possible causes:**
1. Backend not running → Start backend server
2. Wrong API URL → Check console logs
3. Network security blocking HTTP → Already fixed with network_security_config.xml
4. Firewall blocking → Allow Node.js through firewall

### Backend Not Accessible

**Check:**
1. Is backend running? `http://localhost:3000/api/health`
2. Is port 3000 free? Check if another app is using it
3. Is firewall blocking? Temporarily disable to test

### Android Can't Connect

**For Emulator:**
- Use `10.0.2.2` (already configured)
- Make sure backend is running on host machine

**For Physical Device:**
- Use your computer's IP address
- Both device and computer must be on same WiFi
- Check Windows Firewall settings

## Debug Commands

### Check if backend is accessible
```bash
# From your computer
curl http://localhost:3000/api/health

# Should return: {"status":"ok",...}
```

### Check Android network
```bash
# Connect device and test
adb shell ping -c 3 10.0.2.2
```

### View app logs
```bash
# In Android Studio: View → Tool Windows → Logcat
# Or from command line:
adb logcat | grep -i "chromium\|webview\|api"
```

## Next Steps After Fix

1. ✅ Backend running
2. ✅ Network security config added
3. ✅ CORS configured
4. ✅ API URL detection working
5. ✅ Sync and rebuild app

```bash
npx cap sync
npx cap open android
```

Then rebuild and run the app!

