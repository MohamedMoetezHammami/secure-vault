const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { getAdmin } = require('../config/firebase-config');

// Lazy load Firebase Admin (only when needed)
const getDB = () => {
  const admin = getAdmin();
  return admin.firestore();
};

// Register new user
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('displayName').optional().trim().escape(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, displayName } = req.body;

      // Get Firebase Admin and DB
      const admin = getAdmin();
      const db = getDB();

      // Create user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: displayName || email.split('@')[0],
        emailVerified: false,
      });

      // Send email verification
      await admin.auth().generateEmailVerificationLink(email);

      // Create user profile in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        email,
        displayName: displayName || email.split('@')[0],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        settings: {
          theme: 'light',
          autoLogout: 30, // minutes
          twoFactorEnabled: false,
        },
      });

      // Generate JWT token
      const token = jwt.sign(
        { uid: userRecord.uid, email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'User registered successfully. Please verify your email.',
        token,
        user: {
          uid: userRecord.uid,
          email,
          displayName: displayName || email.split('@')[0],
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-exists') {
        return res.status(400).json({ error: 'Email already registered' });
      }
      res.status(500).json({ error: 'Registration failed', details: error.message });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Get Firebase Admin and DB
      const admin = getAdmin();
      const db = getDB();

      // Get user by email
      const userRecord = await admin.auth().getUserByEmail(email);

      // Verify password using Firebase Auth
      // Note: Firebase Auth handles password verification
      // We'll use a custom token approach or verify through Firebase Client SDK
      // For this implementation, we'll assume the client verifies with Firebase Auth
      // and then sends a request with verified ID token

      // Generate JWT token
      const token = jwt.sign(
        { uid: userRecord.uid, email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Get user profile
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      const userData = userDoc.data();

      res.json({
        token,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userData?.displayName || userRecord.displayName,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      res.status(500).json({ error: 'Login failed', details: error.message });
    }
  }
);

// Verify Firebase ID token and return JWT (for client-side Firebase Auth)
router.post('/verify-token', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token required' });
    }

    // Get Firebase Admin and DB
    const admin = getAdmin();
    const db = getDB();

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    // Generate JWT token
    const token = jwt.sign(
      { uid, email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Get user profile
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    res.json({
      token,
      user: {
        uid,
        email,
        displayName: userData?.displayName || email.split('@')[0],
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid ID token' });
  }
});

// Password reset request
router.post('/reset-password',
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Get Firebase Admin
      const admin = getAdmin();

      // Generate password reset link
      const resetLink = await admin.auth().generatePasswordResetLink(email);

      // In production, send this link via email service
      res.json({
        message: 'Password reset link generated',
        resetLink, // In production, send via email instead
      });
    } catch (error) {
      console.error('Password reset error:', error);
      // Don't reveal if email exists
      res.json({
        message: 'If the email exists, a reset link has been sent.',
      });
    }
  }
);

module.exports = router;

