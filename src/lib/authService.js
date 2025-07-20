// Authentication service functions for Firebase Auth
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  serverTimestamp,
  collection,
  addDoc
} from 'firebase/firestore';
import { auth, db } from './firebase.js';

/**
 * Store login data in Firestore
 * @param {Object} user - Firebase user object
 * @param {string} action - 'signup' or 'login'
 * @param {Object} additionalData - Additional data to store
 */
const storeLoginData = async (user, action, additionalData = {}) => {
  try {
    const loginData = {
      userId: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      action: action, // 'signup' or 'login'
      timestamp: serverTimestamp(),
      emailVerified: user.emailVerified,
      userAgent: navigator.userAgent,
      ipAddress: 'client-side', // Note: Real IP would need server-side implementation
      ...additionalData
    };

    // Store in 'login' collection
    await addDoc(collection(db, 'login'), loginData);
    
    console.log(`Login data stored for ${action}:`, loginData);
    return { success: true };
  } catch (error) {
    console.error('Error storing login data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Store user profile data in Firestore for manual verification
 * @param {Object} user - Firebase user object
 * @param {string} displayName - User display name
 * @param {string} role - User role (student/driver)
 */
const storeUserProfile = async (user, displayName, role = 'student') => {
  try {
    const userProfile = {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      role: role,
      isVerified: false, // Manual verification required
      isPending: true,
      createdAt: serverTimestamp(),
      verifiedAt: null,
      verifiedBy: null
    };

    // Store in 'users' collection for manual verification
    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    console.log('User profile stored for manual verification:', userProfile);
    return { success: true };
  } catch (error) {
    console.error('Error storing user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign up a new user with email and password (NO automatic email verification)
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name (optional)
 * @param {string} role - User role (student/driver)
 * @returns {Promise<Object>} User object
 */
export const signUp = async (email, password, displayName = '', role = 'student') => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update user profile with display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    // Store user profile for manual verification (instead of sending email)
    await storeUserProfile(user, displayName, role);
    
    // Store signup data in Firestore
    await storeLoginData(user, 'signup', {
      displayName: displayName,
      role: role,
      accountCreated: true,
      manualVerificationRequired: true
    });
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || displayName,
        emailVerified: false, // Will be manually verified by admin
        role: role
      },
      message: 'Account created successfully! Your account is pending admin verification.'
    };
  } catch (error) {
    return {
      success: false,
      error: error.code,
      message: getAuthErrorMessage(error.code)
    };
  }
};

/**
 * Sign in a user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User object
 */
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Store login data in Firestore
    await storeLoginData(user, 'login', {
      loginMethod: 'email_password'
    });
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      },
      message: 'Signed in successfully!'
    };
  } catch (error) {
    return {
      success: false,
      error: error.code,
      message: getAuthErrorMessage(error.code)
    };
  }
};

/**
 * Sign out the current user
 * @returns {Promise<Object>} Success status
 */
export const signOutUser = async () => {
  try {
    const user = auth.currentUser;
    
    // Store logout data before signing out
    if (user) {
      await storeLoginData(user, 'logout');
    }
    
    await signOut(auth);
    return {
      success: true,
      message: 'Signed out successfully!'
    };
  } catch (error) {
    return {
      success: false,
      error: error.code,
      message: getAuthErrorMessage(error.code)
    };
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<Object>} Success status
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    
    // Store password reset request
    await addDoc(collection(db, 'login'), {
      email: email,
      action: 'password_reset_request',
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent
    });
    
    return {
      success: true,
      message: 'Password reset email sent! Check your inbox.'
    };
  } catch (error) {
    return {
      success: false,
      error: error.code,
      message: getAuthErrorMessage(error.code)
    };
  }
};

/**
 * Get current authenticated user
 * @returns {Object|null} Current user or null
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function to handle auth state changes
 * @returns {Function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Store auth state change
      await storeLoginData(user, 'auth_state_change', {
        sessionRestored: true
      });
    }
    callback(user);
  });
};

/**
 * Get user-friendly error messages
 * @param {string} errorCode - Firebase error code
 * @returns {string} User-friendly error message
 */
const getAuthErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'An error occurred. Please try again.';
  }
};

