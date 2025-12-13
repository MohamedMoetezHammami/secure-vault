# Firebase Setup Guide

This guide will walk you through setting up Firebase for your password manager application.

## Step 1: Firebase Console Setup

### 1.1 Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **amen-608e7** (or create a new one)

### 1.2 Enable Authentication
1. In the left sidebar, click **Authentication**
2. Click **Get Started** (if not already enabled)
3. Go to the **Sign-in method** tab
4. Click on **Email/Password**
5. Enable the first toggle (Email/Password)
6. Click **Save**

✅ **Authentication is now enabled!**

### 1.3 Enable Firestore Database
1. In the left sidebar, click **Firestore Database**
2. Click **Create database**
3. Choose **Production mode** (we'll add security rules manually)
4. Select a location (choose one close to you)
5. Click **Enable**

✅ **Firestore is now enabled!**

## Step 2: Get Service Account Key (For Backend)

The backend needs a service account key to authenticate with Firebase Admin SDK.

### 2.1 Generate Service Account Key
1. In Firebase Console, click the ⚙️ **Settings** icon (top left)
2. Select **Project settings**
3. Go to the **Service accounts** tab
4. Click **Generate new private key**
5. A JSON file will download - **SAVE THIS FILE SECURELY!**

### 2.2 Extract Values for .env File
Open the downloaded JSON file. You'll see something like:

```json
{
  "type": "service_account",
  "project_id": "amen-608e7",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@amen-608e7.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

## Step 3: Configure Backend

### 3.1 Create .env File
1. Navigate to the `backend` folder
2. Create a file named `.env` (no extension)
3. Copy the following template and fill in your values:

```env
PORT=3000
FIREBASE_PROJECT_ID=amen-608e7
FIREBASE_PRIVATE_KEY_ID=your-private-key-id-from-json
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour actual private key with \n for newlines\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@amen-608e7.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id-from-json
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
JWT_SECRET=generate-a-random-secret-here
NODE_ENV=development
```

### 3.2 Important Notes for .env File

**For FIREBASE_PRIVATE_KEY:**
- The private key from JSON has `\n` in it
- In the .env file, you need to keep the `\n` as literal characters
- The entire key should be on ONE line in .env
- Wrap it in double quotes
- Example format:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**For JWT_SECRET:**
Generate a random secret using one of these methods:

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**Or using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 4: Deploy Firestore Security Rules

### 4.1 Method 1: Using Firebase Console (Easiest)
1. Go to **Firestore Database** in Firebase Console
2. Click on the **Rules** tab
3. Copy the contents of `firestore.rules` file from your project
4. Paste into the rules editor
5. Click **Publish**

### 4.2 Method 2: Using Firebase CLI (Advanced)
1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project root:
```bash
firebase init firestore
```

4. Deploy rules:
```bash
firebase deploy --only firestore:rules
```

## Step 5: Verify Setup

### 5.1 Test Backend
1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies (if not done):
```bash
npm install
```

3. Start the server:
```bash
npm start
```

You should see:
```
Server running on port 3000
Environment: development
Firebase Admin initialized successfully
```

If you see errors, check:
- `.env` file exists and has all required values
- Private key is properly formatted with `\n`
- All environment variables are set correctly

### 5.2 Test Frontend
1. Start a local server in the `frontend` folder
2. Open `http://localhost:5500` (or your server port)
3. Try to register a new account
4. Check Firebase Console → Authentication → Users to see if user was created
5. Check Firestore Database → users collection to see if profile was created

## Troubleshooting

### Error: "Firebase Admin initialization failed"
- Check that `.env` file exists in `backend` folder
- Verify all environment variables are set
- Ensure private key is properly formatted with `\n` escape sequences
- Make sure private key is wrapped in double quotes

### Error: "Permission denied" when accessing Firestore
- Verify Firestore security rules are deployed
- Check that user is authenticated
- Ensure rules match the structure in `firestore.rules`

### Error: "Invalid API key" in frontend
- Verify Firebase config in `frontend/js/auth.js` matches your project
- Check Firebase Console → Project Settings → Your apps

### Error: "CORS error" when calling API
- Check that backend is running on port 3000
- Verify CORS settings in `backend/server.js`
- Ensure frontend URL is in the CORS allowed origins

## Security Checklist

- [ ] `.env` file is in `.gitignore` (already added)
- [ ] Service account key JSON file is kept secure
- [ ] Firestore security rules are deployed
- [ ] JWT_SECRET is a strong random value
- [ ] Firebase Authentication is enabled
- [ ] Firestore Database is enabled
- [ ] Email/Password sign-in method is enabled

## Next Steps

Once Firebase is set up:
1. ✅ Backend server should start without errors
2. ✅ Frontend should be able to register users
3. ✅ Users should be able to login
4. ✅ Passwords should be saved to Firestore

Your Firebase setup is complete! 🎉

