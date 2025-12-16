# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Secure Vault** is a zero-knowledge password manager with mobile support via Capacitor. Client-side AES-256 encryption with PBKDF2 key derivation ensures passwords are never stored in plaintext on the server.

- **Live Backend**: https://secure-vault-api-l762.onrender.com/api
- **Firebase Project**: vault-28864

## Build & Run Commands

### Backend
```bash
cd backend
npm install
npm start          # Production
npm run dev        # Development with nodemon
```

### Frontend
```bash
# No build needed - serve with any static server
cd frontend
npx http-server    # or python -m http.server 5500
```

### Mobile (Capacitor)
```bash
npm run cap:sync         # Sync frontend to native projects
npm run cap:open:android # Open in Android Studio
npm run cap:open:ios     # Open in Xcode
```

## Architecture

### Frontend-Backend Communication

**API URL Resolution** (in `auth.js` and `dashboard.js`):
- Production/Mobile: `https://secure-vault-api-l762.onrender.com/api`
- Local dev: `http://localhost:3000/api`
- Android emulator: Uses `10.0.2.2` to reach host localhost

**Authentication Flow**:
1. Firebase Auth handles user authentication (compat SDK for Android WebView compatibility)
2. Frontend gets Firebase ID token
3. Backend verifies token via `/api/auth/verify-token` and returns JWT (24h expiry)
4. JWT passed in `Authorization: Bearer <token>` header for all subsequent requests

### Zero-Knowledge Encryption

```
Master Password (never leaves browser)
        ↓
PBKDF2 (SHA-256, 100k iterations, random salt)
        ↓
AES-256-CBC Key
        ↓
Encrypt each password with random IV
        ↓
Server stores: { encryptedPassword, iv, salt } (never plaintext)
```

Key files:
- `frontend/js/encryption.js` - AES-256 encryption/decryption, PBKDF2 key derivation
- `frontend/js/dashboard.js` - Orchestrates encryption before API calls

### API Endpoints

```
POST /api/auth/verify-token  - Exchange Firebase token for JWT
POST /api/auth/register      - Create user
POST /api/auth/login         - Login user

GET    /api/passwords        - Get all passwords (encrypted)
POST   /api/passwords        - Add password
PUT    /api/passwords/:id    - Update password
DELETE /api/passwords/:id    - Delete password
POST   /api/passwords/breach-check - Check HaveIBeenPwned
```

### Firestore Structure
```
users/{userId}
  ├── email, displayName, settings
  └── passwords/{passwordId}
      ├── website, username, category, notes
      ├── encryptedPassword (AES-256 ciphertext)
      ├── iv, salt (for decryption)
      └── timestamp
```

## Environment Variables (backend/.env)

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=<random-string>
FIREBASE_PROJECT_ID=vault-28864
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@vault-28864.iam.gserviceaccount.com
```

Note: `FIREBASE_PRIVATE_KEY` must have literal `\n` characters (not actual newlines).

## Non-Obvious Implementation Details

1. **Firebase Compat SDK**: Frontend uses `firebase-*-compat.js` (not modular SDK) for Android WebView compatibility. This is intentional.

2. **Lazy Firebase Init**: Backend initializes Firebase in `co.nfig/firebase-config.js` BEFORE importing routes. Routes use `getAdmin()` to avoid duplicate app errors.

3. **PBKDF2 100k Iterations**: Intentionally slow (~100ms) to prevent brute-force attacks on key derivation.

4. **Android Emulator Networking**: Cannot use `localhost`; must use `10.0.2.2` (Android's alias for host machine). Handled in API URL resolution.

5. **Rate Limiting**: 100 requests per 15 minutes per IP on `/api/*` routes.

6. **CORS**: Allows `capacitor://localhost`, `https://localhost` (Capacitor Android), and `*.onrender.com`.

## Key Files

| File | Purpose |
|------|---------|
| `frontend/js/auth.js` | Firebase auth, JWT handling, API URL detection |
| `frontend/js/dashboard.js` | Password CRUD, encryption orchestration |
| `frontend/js/encryption.js` | AES-256/PBKDF2 implementation |
| `backend/server.js` | Express setup, middleware, CORS |
| `backend/routes/auth.js` | Auth endpoints, token verification |
| `backend/routes/passwords.js` | Password CRUD with Firestore |
| `capacitor.config.json` | Mobile app config (splash, statusbar) |
| `render.yaml` | Render.com deployment blueprint |

## Deployment

Push to GitHub triggers auto-deploy on Render.com. The `render.yaml` configures both backend (Node) and frontend (static) services.

For mobile: Build APK in Android Studio after `npm run cap:sync`.
