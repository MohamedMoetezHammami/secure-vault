const admin = require('firebase-admin');

let initialized = false;

const initializeFirebase = () => {
  if (initialized) {
    return admin;
  }

  try {
    // Check if required environment variables are set
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('FIREBASE_PROJECT_ID is not set in .env file');
    }
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('FIREBASE_PRIVATE_KEY is not set in .env file');
    }
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error('FIREBASE_CLIENT_EMAIL is not set in .env file');
    }

    // Firebase Admin SDK uses service account credentials from environment variables
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      clientId: process.env.FIREBASE_CLIENT_ID,
      authUri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      tokenUri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
    };

    // Initialize Firebase Admin with service account
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    initialized = true;
    console.log('Firebase Admin initialized successfully');
    console.log(`Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
    return admin;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    if (error.code === 'app/duplicate-app') {
      console.log('Firebase app already initialized, continuing...');
      initialized = true;
      return admin;
    }
    console.error('\n⚠️  Make sure you have:');
    console.error('   1. Created a .env file in the backend folder');
    console.error('   2. Filled in all Firebase service account credentials');
    console.error('   3. Downloaded the service account JSON from Firebase Console');
    console.error('\nSee QUICK_START.md or FIREBASE_SETUP.md for instructions.\n');
    throw error;
  }
};

module.exports = { initializeFirebase, getAdmin: () => admin };

