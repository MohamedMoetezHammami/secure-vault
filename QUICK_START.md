# Quick Start - Firebase Setup

## ✅ Already Done
- Frontend Firebase config is set in `frontend/js/auth.js` and `frontend/js/dashboard.js`
- Backend Firebase config file is ready

## 🔧 What You Need to Do

### Step 1: Enable Firebase Services

1. **Enable Authentication:**
   - Go to https://console.firebase.google.com/project/amen-608e7/authentication
   - Click "Get Started" → "Sign-in method" tab
   - Enable "Email/Password"
   - Click Save

2. **Enable Firestore:**
   - Go to https://console.firebase.google.com/project/amen-608e7/firestore
   - Click "Create database"
   - Choose "Production mode"
   - Select a location → Enable

### Step 2: Get Service Account Key (Backend)

1. Go to: https://console.firebase.google.com/project/amen-608e7/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Download the JSON file (keep it secure!)

### Step 3: Create Backend .env File

1. Go to `backend` folder
2. Create a file named `.env` (no extension, just `.env`)
3. Open the downloaded service account JSON file
4. Create `.env` with these values:

```env
PORT=3000
FIREBASE_PROJECT_ID=amen-608e7
FIREBASE_PRIVATE_KEY_ID=paste-from-json-file
FIREBASE_PRIVATE_KEY="paste-entire-private-key-from-json-keep-the-\n-characters"
FIREBASE_CLIENT_EMAIL=paste-from-json-file
FIREBASE_CLIENT_ID=paste-from-json-file
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
JWT_SECRET=paste-a-random-secret-here
NODE_ENV=development
```

**Important for FIREBASE_PRIVATE_KEY:**
- Copy the entire `private_key` value from JSON (including BEGIN/END lines)
- It will have `\n` characters - keep them as `\n` (don't convert to actual newlines)
- Wrap the entire thing in double quotes
- Put it all on ONE line in the .env file

**Generate JWT_SECRET:**
```powershell
# Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Step 4: Deploy Firestore Rules

1. Go to: https://console.firebase.google.com/project/amen-608e7/firestore/rules
2. Copy the contents of `firestore.rules` file
3. Paste into the rules editor
4. Click **"Publish"**

### Step 5: Test Everything

1. **Start Backend:**
   ```bash
   cd backend
   npm install
   npm start
   ```
   Should see: "Firebase Admin initialized successfully"

2. **Start Frontend:**
   - Open `frontend` folder in VS Code
   - Right-click `index.html` → "Open with Live Server"
   - Or use: `python -m http.server 5500` from frontend folder

3. **Test Registration:**
   - Go to the app in browser
   - Try registering a new account
   - Check Firebase Console → Authentication → Users (should see new user)

## 🐛 Troubleshooting

**Backend won't start:**
- Check `.env` file exists in `backend` folder
- Verify all values are filled in
- Make sure private key has `\n` (backslash-n, not actual newline)

**Can't register/login:**
- Check Authentication is enabled in Firebase Console
- Verify Firestore is enabled
- Check browser console for errors

**Firestore permission denied:**
- Make sure Firestore rules are published
- Rules should allow authenticated users to read/write their own data

## 📚 Full Guide

See `FIREBASE_SETUP.md` for detailed instructions.

