# Setup Guide

## Quick Start

Follow these steps to get the password manager up and running:

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable Email/Password provider
4. Enable Firestore:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see `firestore.rules`)
5. Get your web app config:
   - Go to Project Settings → Your apps
   - Add a web app if you haven't
   - Copy the Firebase config object

### 2. Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
# Copy the example file
cp .env.example .env
```

4. Fill in your Firebase credentials in `.env`:
   - Get service account key from Firebase Console:
     - Project Settings → Service Accounts
     - Generate new private key
     - Download JSON file
   - Copy values from JSON to `.env`

5. Set a strong JWT_SECRET:
```bash
# Generate a random secret (on Linux/Mac)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

6. Start the server:
```bash
npm start
# or for development
npm run dev
```

The server should be running on `http://localhost:3000`

### 3. Frontend Setup

1. Update Firebase configuration:
   - Open `frontend/js/auth.js`
   - Replace the `firebaseConfig` object with your Firebase project config

2. Serve the frontend:
   
   **Option A: Using Python**
   ```bash
   cd frontend
   python -m http.server 5500
   ```

   **Option B: Using Node.js http-server**
   ```bash
   npx http-server frontend -p 5500
   ```

   **Option C: Using VS Code Live Server**
   - Install ive ServerL extension
   - Right-click on `frontend/index.html`
   - Select "Open with Live Server"

3. Open in browser:
   - Navigate to `http://localhost:5500` or `http://127.0.0.1:5500`

### 4. Firestore Security Rules

1. Go to Firebase Console → Firestore Database → Rules
2. Copy the rules from `firestore.rules` file
3. Publish the rules

## Configuration

### Backend Environment Variables

Required variables in `.env`:

- `PORT`: Server port (default: 3000)
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Service account private key
- `FIREBASE_CLIENT_EMAIL`: Service account email
- `JWT_SECRET`: Secret key for JWT tokens
- `NODE_ENV`: Environment (development/production)

### Frontend Configuration

Update in `frontend/js/auth.js`:
- Firebase config object (from Firebase Console)

Update in `frontend/js/dashboard.js`:
- `API_BASE_URL`: Backend API URL (default: `http://localhost:3000/api`)

## Testing

1. **Register a new account:**
   - Go to the registration page
   - Fill in email and master password
   - Complete registration

2. **Login:**
   - Use your credentials to log in
   - You'll be redirected to the dashboard

3. **Add a password:**
   - Click "Add Password"
   - Fill in the form
   - Password will be encrypted before saving

4. **Test features:**
   - Password generator
   - Password strength analyzer
   - Copy to clipboard
   - Search and filter
   - Dark/Light mode toggle

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Change PORT in .env or kill the process using port 3000
```

**Firebase initialization error:**
- Check that all Firebase credentials in `.env` are correct
- Ensure private key is properly formatted with `\n` escape sequences

**Module not found:**
```bash
cd backend
npm install
```

### Frontend Issues

**CORS errors:**
- Ensure backend CORS is configured for your frontend URL
- Check `backend/server.js` CORS settings

**Firebase not initialized:**
- Check browser console for errors
- Verify Firebase config is correct in `auth.js`
- Ensure Firebase Authentication is enabled

**Can't decrypt passwords:**
- Verify master password is correct
- Check that encryption/decryption functions are loaded
- Check browser console for errors

**API connection errors:**
- Verify backend is running on correct port
- Check `API_BASE_URL` in `dashboard.js`
- Check network tab in browser dev tools

## Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Use HTTPS for both frontend and backend
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting appropriately
- [ ] Review and update Firestore security rules
- [ ] Enable Firebase App Check
- [ ] Set up proper error logging
- [ ] Remove or secure any debug information
- [ ] Use environment variables for all secrets
- [ ] Enable Firebase Security Rules
- [ ] Set up backup procedures for encrypted data

## Production Deployment

1. **Backend:**
   - Use a process manager like PM2
   - Set `NODE_ENV=production`
   - Use a reverse proxy (nginx)
   - Enable HTTPS

2. **Frontend:**
   - Build/minify JavaScript (optional)
   - Serve via CDN or static hosting
   - Enable HTTPS

3. **Firebase:**
   - Set up proper security rules
   - Enable Firebase App Check
   - Configure authorized domains

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review error logs in browser console and server logs
- Ensure all dependencies are installed correctly

