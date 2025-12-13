# Secure Password Manager

A secure password manager web application with client-side encryption and Firebase backend integration, similar to LastPass.

## Features

- ✅ **User Authentication**: Registration, login, password recovery
- ✅ **Client-Side Encryption**: Zero-knowledge architecture with AES-256 encryption
- ✅ **Password Management**: Add, edit, delete, and search passwords
- ✅ **Password Generator**: Strong, random password generator with customizable options
- ✅ **Password Strength Analyzer**: Real-time password strength checking
- ✅ **Data Breach Checker**: Integration with HaveIBeenPwned API
- ✅ **Dark/Light Mode**: Theme toggle support
- ✅ **Auto-Logout**: Session timeout after inactivity
- ✅ **Import/Export**: JSON-based password import/export
- ✅ **Password Sharing**: Share passwords between users (encrypted)
- ✅ **Responsive Design**: Mobile-friendly interface

## Tech Stack

### Frontend
- HTML5, CSS3
- Vanilla JavaScript (ES6+)
- CryptoJS for encryption
- Firebase Authentication

### Backend
- Node.js/Express.js
- Firebase Admin SDK
- Firebase Firestore
- JWT for authentication
- Express middleware (helmet, cors, rate-limiting)

## Project Structure

```
password-manager/
├── frontend/
│   ├── index.html          # Landing/auth page
│   ├── login.html          # Login page
│   ├── dashboard.html      # Main dashboard
│   ├── css/
│   │   ├── style.css       # Main styles
│   │   └── auth.css        # Auth page styles
│   └── js/
│       ├── auth.js         # Authentication logic
│       ├── encryption.js   # Encryption utilities
│       ├── dashboard.js    # Dashboard functionality
│       ├── password-generator.js  # Password generation
│       └── ui.js           # UI utilities
├── backend/
│   ├── server.js           # Express server
│   ├── package.json        # Dependencies
│   ├── routes/
│   │   ├── auth.js         # Auth routes
│   │   └── passwords.js    # Password routes
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT middleware
│   └── config/
│       └── firebase-config.js  # Firebase config
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Firebase project with Authentication and Firestore enabled
- Firebase service account key

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
PORT=3000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
HAVEIBEENPWNED_API_KEY=your-api-key-optional
```

4. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

### Frontend Setup

1. Update Firebase configuration in `frontend/js/auth.js`:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

2. Update API base URL in `frontend/js/dashboard.js` and `frontend/js/auth.js` if needed:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

3. Serve the frontend using a local server (e.g., Live Server in VS Code, or Python's http.server):
```bash
# Using Python
cd frontend
python -m http.server 5500
```

### Firebase Firestore Security Rules

Set up the following security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User passwords
      match /passwords/{passwordId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Shared passwords
      match /shared_passwords/{shareId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Security Features

### Encryption

- **Master Password**: Hashed using PBKDF2 with 100,000 iterations
- **Individual Passwords**: Encrypted with AES-256-CBC before storage
- **Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations
- **Zero-Knowledge**: Server never sees plaintext passwords

### Security Headers

- Content Security Policy (CSP)
- CORS configuration
- Rate limiting
- Input validation and sanitization
- JWT token authentication

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-token` - Verify Firebase ID token
- `POST /api/auth/reset-password` - Request password reset

### Passwords
- `GET /api/passwords` - Get all passwords for user
- `POST /api/passwords` - Add new password
- `PUT /api/passwords/:id` - Update password
- `DELETE /api/passwords/:id` - Delete password
- `POST /api/passwords/breach-check` - Check password against breaches
- `POST /api/passwords/share` - Share password with another user
- `GET /api/passwords/shared` - Get shared passwords

## Usage

1. **Register**: Create a new account with email and master password
2. **Login**: Sign in with your credentials
3. **Add Password**: Click "Add Password" and fill in the form
4. **View Passwords**: All passwords are displayed in the dashboard
5. **Search/Filter**: Use the search bar and category filters
6. **Generate Password**: Use the password generator tool
7. **Security Check**: Analyze password strength and check for breaches
8. **Export/Import**: Backup and restore your passwords

## Important Security Notes

- ⚠️ **Master Password**: Never share or lose your master password. It cannot be recovered.
- ⚠️ **Backup**: Regularly export your passwords as a backup.
- ⚠️ **HTTPS**: Always use HTTPS in production.
- ⚠️ **JWT Secret**: Change the JWT_SECRET in production to a strong random string.
- ⚠️ **Firebase Config**: Keep your Firebase credentials secure.

## Development

### Running in Development Mode

Backend:
```bash
cd backend
npm run dev
```

Frontend:
- Use a live server or static file server
- Update CORS settings in `backend/server.js` if needed

### Testing

Test the application by:
1. Registering a new account
2. Adding test passwords
3. Verifying encryption/decryption
4. Testing password generator
5. Checking breach checker functionality

## Future Enhancements

- [ ] Two-Factor Authentication (2FA)
- [ ] Browser Extension
- [ ] Mobile PWA support
- [ ] Password expiry reminders
- [ ] Emergency access for trusted contacts
- [ ] Biometric authentication
- [ ] Password health score dashboard
- [ ] Duplicate password detection

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on the repository.

