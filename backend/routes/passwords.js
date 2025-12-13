const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getAdmin } = require('../config/firebase-config');
const { authenticateToken } = require('../middleware/authMiddleware');
const axios = require('axios');

// Lazy load Firebase Admin and DB
const getDB = () => {
  const admin = getAdmin();
  return admin.firestore();
};

// Get all passwords for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.uid;
    const passwordsRef = db.collection('users').doc(userId).collection('passwords');
    const snapshot = await passwordsRef.get();

    const passwords = [];
    snapshot.forEach((doc) => {
      passwords.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({ passwords });
  } catch (error) {
    console.error('Error fetching passwords:', error);
    res.status(500).json({ error: 'Failed to fetch passwords' });
  }
});

// Add new password
router.post('/',
  authenticateToken,
  [
    body('website').trim().notEmpty(),
    body('username').trim().notEmpty(),
    body('encryptedPassword').notEmpty(),
    body('category').optional().trim(),
    body('notes').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const admin = getAdmin();
      const db = getDB();
      const userId = req.user.uid;
      const { website, username, encryptedPassword, category, notes, iv, salt } = req.body;

      // Store encrypted password (never store plaintext)
      const passwordData = {
        website,
        username,
        encryptedPassword,
        iv, // Initialization vector for AES
        salt, // Salt for key derivation
        category: category || 'Uncategorized',
        notes: notes || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await db
        .collection('users')
        .doc(userId)
        .collection('passwords')
        .add(passwordData);

      res.status(201).json({
        message: 'Password saved successfully',
        id: docRef.id,
      });
    } catch (error) {
      console.error('Error adding password:', error);
      res.status(500).json({ error: 'Failed to save password' });
    }
  }
);

// Update password
router.put('/:id',
  authenticateToken,
  [
    body('website').optional().trim().notEmpty(),
    body('username').optional().trim().notEmpty(),
    body('encryptedPassword').optional().notEmpty(),
    body('category').optional().trim(),
    body('notes').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const admin = getAdmin();
      const db = getDB();
      const userId = req.user.uid;
      const passwordId = req.params.id;
      const updateData = {
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Remove undefined fields
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const passwordRef = db
        .collection('users')
        .doc(userId)
        .collection('passwords')
        .doc(passwordId);

      // Verify ownership
      const passwordDoc = await passwordRef.get();
      if (!passwordDoc.exists) {
        return res.status(404).json({ error: 'Password not found' });
      }

      await passwordRef.update(updateData);

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  }
);

// Delete password
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.uid;
    const passwordId = req.params.id;

    const passwordRef = db
      .collection('users')
      .doc(userId)
      .collection('passwords')
      .doc(passwordId);

    // Verify ownership
    const passwordDoc = await passwordRef.get();
    if (!passwordDoc.exists) {
      return res.status(404).json({ error: 'Password not found' });
    }

    await passwordRef.delete();

    res.json({ message: 'Password deleted successfully' });
  } catch (error) {
    console.error('Error deleting password:', error);
    res.status(500).json({ error: 'Failed to delete password' });
  }
});

// Check password against breaches (HaveIBeenPwned API)
router.post('/breach-check', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    // Hash password using SHA-1 (as per HaveIBeenPwned API)
    const crypto = require('crypto');
    const sha1Hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1Hash.substring(0, 5);
    const suffix = sha1Hash.substring(5);

    // Query HaveIBeenPwned API
    try {
      const response = await axios.get(
        `https://api.pwnedpasswords.com/range/${prefix}`,
        { timeout: 5000 }
      );

      const hashes = response.data.split('\r\n');
      const found = hashes.find((line) => line.startsWith(suffix));

      if (found) {
        const count = parseInt(found.split(':')[1]);
        return res.json({
          breached: true,
          count,
          message: `This password has been found in ${count} data breaches`,
        });
      }

      res.json({
        breached: false,
        message: 'This password has not been found in known breaches',
      });
    } catch (apiError) {
      console.error('HaveIBeenPwned API error:', apiError);
      res.status(503).json({ error: 'Breach check service unavailable' });
    }
  } catch (error) {
    console.error('Error checking password breach:', error);
    res.status(500).json({ error: 'Failed to check password' });
  }
});

// Share password with another user
router.post('/share', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { passwordId, recipientEmail, encryptedPassword, iv, salt } = req.body;

    if (!passwordId || !recipientEmail || !encryptedPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get Firebase Admin and DB
    const admin = getAdmin();
    const db = getDB();

    // Get recipient user
    const recipient = await admin.auth().getUserByEmail(recipientEmail);
    const recipientId = recipient.uid;

    // Create shared password entry
    const shareData = {
      fromUserId: userId,
      fromEmail: req.user.email,
      toUserId: recipientId,
      toEmail: recipientEmail,
      encryptedPassword,
      iv,
      salt,
      sharedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const shareRef = await db
      .collection('users')
      .doc(recipientId)
      .collection('shared_passwords')
      .add(shareData);

    res.status(201).json({
      message: 'Password shared successfully',
      shareId: shareRef.id,
    });
  } catch (error) {
    console.error('Error sharing password:', error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    res.status(500).json({ error: 'Failed to share password' });
  }
});

// Get shared passwords
router.get('/shared', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.uid;
    const sharedRef = db.collection('users').doc(userId).collection('shared_passwords');
    const snapshot = await sharedRef.get();

    const shared = [];
    snapshot.forEach((doc) => {
      shared.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({ shared });
  } catch (error) {
    console.error('Error fetching shared passwords:', error);
    res.status(500).json({ error: 'Failed to fetch shared passwords' });
  }
});

// Delete shared password
router.delete('/shared/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.uid;
    const shareId = req.params.id;

    const shareRef = db
      .collection('users')
      .doc(userId)
      .collection('shared_passwords')
      .doc(shareId);

    // Verify it exists
    const shareDoc = await shareRef.get();
    if (!shareDoc.exists) {
      return res.status(404).json({ error: 'Shared password not found' });
    }

    await shareRef.delete();

    res.json({ message: 'Shared password deleted successfully' });
  } catch (error) {
    console.error('Error deleting shared password:', error);
    res.status(500).json({ error: 'Failed to delete shared password' });
  }
});

module.exports = router;

