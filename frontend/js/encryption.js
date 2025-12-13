// Encryption utilities using CryptoJS
// Implements zero-knowledge architecture with client-side encryption

const ENCRYPTION_ITERATIONS = 100000; // PBKDF2 iterations
const KEY_SIZE = 256 / 32; // 256 bits = 8 words
const IV_SIZE = 128 / 32; // 128 bits = 4 words

/**
 * Derive encryption key from master password using PBKDF2
 * @param {string} masterPassword - User's master password
 * @param {string} salt - Salt for key derivation (hex string)
 * @returns {string} Derived key (hex string)
 */
function deriveKey(masterPassword, salt) {
  const saltWordArray = CryptoJS.enc.Hex.parse(salt);
  const key = CryptoJS.PBKDF2(masterPassword, saltWordArray, {
    keySize: KEY_SIZE,
    iterations: ENCRYPTION_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });
  return key.toString();
}

/**
 * Generate a random salt for key derivation
 * @returns {string} Random salt (hex string)
 */
function generateSalt() {
  return CryptoJS.lib.WordArray.random(128 / 8).toString();
}

/**
 * Generate a random IV for AES encryption
 * @returns {string} Random IV (hex string)
 */
function generateIV() {
  return CryptoJS.lib.WordArray.random(128 / 8).toString();
}

/**
 * Encrypt a password using AES-256
 * @param {string} plaintext - Password to encrypt
 * @param {string} masterPassword - User's master password
 * @param {string} salt - Salt for key derivation (optional, generates new if not provided)
 * @returns {object} Encrypted data with ciphertext, iv, and salt
 */
function encryptPassword(plaintext, masterPassword, salt = null) {
  if (!plaintext || !masterPassword) {
    throw new Error('Plaintext and master password are required');
  }

  // Generate salt if not provided
  if (!salt) {
    salt = generateSalt();
  }

  // Derive encryption key from master password
  const key = deriveKey(masterPassword, salt);

  // Generate IV
  const iv = generateIV();

  // Encrypt using AES-256-CBC
  const encrypted = CryptoJS.AES.encrypt(plaintext, CryptoJS.enc.Hex.parse(key), {
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    encryptedPassword: encrypted.ciphertext.toString(CryptoJS.enc.Hex),
    iv: iv,
    salt: salt,
  };
}

/**
 * Decrypt a password using AES-256
 * @param {string} encryptedPassword - Encrypted password (hex string)
 * @param {string} masterPassword - User's master password
 * @param {string} iv - Initialization vector (hex string)
 * @param {string} salt - Salt used for key derivation (hex string)
 * @returns {string} Decrypted password
 */
function decryptPassword(encryptedPassword, masterPassword, iv, salt) {
  if (!encryptedPassword || !masterPassword || !iv || !salt) {
    throw new Error('All parameters are required for decryption');
  }

  try {
    // Derive the same encryption key
    const key = deriveKey(masterPassword, salt);

    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(
      {
        ciphertext: CryptoJS.enc.Hex.parse(encryptedPassword),
      },
      CryptoJS.enc.Hex.parse(key),
      {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

    if (!plaintext) {
      throw new Error('Decryption failed - invalid master password or corrupted data');
    }

    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt password. Please check your master password.');
  }
}

/**
 * Hash master password for storage (using PBKDF2)
 * @param {string} password - Master password
 * @param {string} salt - Salt for hashing (optional)
 * @returns {object} Hashed password with hash and salt
 */
function hashMasterPassword(password, salt = null) {
  if (!salt) {
    salt = generateSalt();
  }

  const saltWordArray = CryptoJS.enc.Hex.parse(salt);
  const hash = CryptoJS.PBKDF2(password, saltWordArray, {
    keySize: KEY_SIZE,
    iterations: ENCRYPTION_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });

  return {
    hash: hash.toString(),
    salt: salt,
  };
}

/**
 * Verify master password against stored hash
 * @param {string} password - Password to verify
 * @param {string} hash - Stored hash
 * @param {string} salt - Stored salt
 * @returns {boolean} True if password matches
 */
function verifyMasterPassword(password, hash, salt) {
  const hashed = hashMasterPassword(password, salt);
  return hashed.hash === hash;
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    encryptPassword,
    decryptPassword,
    hashMasterPassword,
    verifyMasterPassword,
    generateSalt,
    generateIV,
  };
}

