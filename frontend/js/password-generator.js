// Password Generator Utility

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Generate a strong random password
 * @param {number} length - Password length (8-64)
 * @param {object} options - Generation options
 * @returns {string} Generated password
 */
function generatePassword(length = 16, options = {}) {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  // Build character set
  let charset = '';
  if (includeUppercase) charset += UPPERCASE;
  if (includeLowercase) charset += LOWERCASE;
  if (includeNumbers) charset += NUMBERS;
  if (includeSymbols) charset += SYMBOLS;

  if (!charset) {
    throw new Error('At least one character type must be enabled');
  }

  // Ensure length is within valid range
  length = Math.max(8, Math.min(64, length));

  // Generate password using crypto API for better randomness
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  // Ensure at least one character from each selected type is included
  if (includeUppercase && !/[A-Z]/.test(password)) {
    password = replaceRandomChar(password, UPPERCASE);
  }
  if (includeLowercase && !/[a-z]/.test(password)) {
    password = replaceRandomChar(password, LOWERCASE);
  }
  if (includeNumbers && !/[0-9]/.test(password)) {
    password = replaceRandomChar(password, NUMBERS);
  }
  if (includeSymbols && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    password = replaceRandomChar(password, SYMBOLS);
  }

  return password;
}

/**
 * Replace a random character in password with character from charset
 */
function replaceRandomChar(password, charset) {
  const randomIndex = Math.floor(Math.random() * password.length);
  const randomChar = charset[Math.floor(Math.random() * charset.length)];
  return password.substring(0, randomIndex) + randomChar + password.substring(randomIndex + 1);
}

/**
 * Calculate password strength score (0-100)
 * @param {string} password - Password to analyze
 * @returns {object} Strength analysis
 */
function analyzePasswordStrength(password) {
  if (!password) {
    return { score: 0, strength: 'Very Weak', feedback: [] };
  }

  let score = 0;
  const feedback = [];

  // Length checks
  if (password.length >= 8) score += 10;
  else feedback.push('Use at least 8 characters');

  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 10;

  // Character variety
  if (/[a-z]/.test(password)) {
    score += 10;
  } else {
    feedback.push('Add lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 10;
  } else {
    feedback.push('Add uppercase letters');
  }

  if (/[0-9]/.test(password)) {
    score += 10;
  } else {
    feedback.push('Add numbers');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 10;
  } else {
    feedback.push('Add special characters');
  }

  // Patterns and complexity
  if (!/(.)\1{2,}/.test(password)) {
    score += 5; // No repeated characters
  } else {
    feedback.push('Avoid repeated characters');
  }

  if (!/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    score += 5; // No sequential patterns
  } else {
    feedback.push('Avoid sequential patterns');
  }

  if (!/password|123456|qwerty|letmein/i.test(password)) {
    score += 5; // Not a common password
  } else {
    feedback.push('Avoid common passwords');
  }

  // Entropy bonus
  const uniqueChars = new Set(password).size;
  if (uniqueChars / password.length > 0.7) {
    score += 5;
  }

  score = Math.min(100, score);

  let strength;
  if (score >= 80) strength = 'Very Strong';
  else if (score >= 60) strength = 'Strong';
  else if (score >= 40) strength = 'Moderate';
  else if (score >= 20) strength = 'Weak';
  else strength = 'Very Weak';

  return { score, strength, feedback };
}

/**
 * Check if password was found in data breaches using HaveIBeenPwned API
 * Note: This uses k-anonymity method - only first 5 chars of SHA-1 hash sent
 */
async function checkPasswordBreach(password) {
  try {
    // Hash password with SHA-1
    const hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    // Query HaveIBeenPwned API (k-anonymity)
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const data = await response.text();

    // Check if our hash suffix is in the response
    const hashes = data.split('\r\n');
    const found = hashes.find(line => line.startsWith(suffix));

    if (found) {
      const count = parseInt(found.split(':')[1]);
      return {
        breached: true,
        count,
        message: `This password has been found in ${count.toLocaleString()} data breaches`,
      };
    }

    return {
      breached: false,
      count: 0,
      message: 'This password has not been found in known breaches',
    };
  } catch (error) {
    console.error('Breach check error:', error);
    return {
      breached: false,
      count: 0,
      message: 'Unable to check password breaches',
      error: true,
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generatePassword,
    analyzePasswordStrength,
    checkPasswordBreach,
  };
}

