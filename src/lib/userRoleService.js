// User role service for managing driver verification and permissions
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase.js';

// User roles
export const USER_ROLES = {
  STUDENT: 'student',
  DRIVER: 'driver',
  ADMIN: 'admin'
};

// Driver verification status
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

/**
 * Create or update user profile with role
 */
export const createUserProfile = async (userId, email, displayName, role = USER_ROLES.STUDENT) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      email,
      displayName,
      role,
      verificationStatus: role === USER_ROLES.DRIVER ? VERIFICATION_STATUS.PENDING : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user profile and role
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() };
    } else {
      return { success: false, error: 'User profile not found' };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Request driver verification
 */
export const requestDriverVerification = async (userId, driverInfo) => {
  try {
    console.log('Requesting driver verification for user:', userId, 'with info:', driverInfo);

    const userRef = doc(db, 'users', userId);
    
    const updateData = {
      role: USER_ROLES.DRIVER,
      isPending: true,
      isVerified: false,
      isRejected: false,
      driverInfo: {
        licenseNumber: driverInfo.licenseNumber,
        busNumber: driverInfo.busNumber,
        route: driverInfo.route,
        phoneNumber: driverInfo.phoneNumber,
        additionalInfo: driverInfo.additionalInfo,
        requestedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    };

    console.log('Updating user document with:', updateData);
    
    // Use setDoc with merge instead of updateDoc to ensure it works
    await setDoc(userRef, updateData, { merge: true });
    
    console.log('Driver verification request submitted successfully');
    return { success: true };
  } catch (error) {
    console.error('Error requesting driver verification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify driver (admin function)
 */
export const verifyDriver = async (userId, isApproved, adminNotes = '') => {
  try {
    // First check if the user document exists
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User document not found');
    }
    
    const currentData = userSnap.data();
    
    // Ensure the user is actually a driver requesting verification
    if (currentData.role !== USER_ROLES.DRIVER) {
      throw new Error('User is not a driver');
    }
    
    const updateData = {
      ...currentData, // Preserve existing data
      adminNotes,
      isPending: false,
      updatedAt: serverTimestamp()
    };
    
    if (isApproved) {
      updateData.isVerified = true;
      updateData.isRejected = false;
      updateData.verifiedAt = serverTimestamp();
    } else {
      updateData.isVerified = false;
      updateData.isRejected = true;
      updateData.rejectedAt = serverTimestamp();
    }
    
    // Use setDoc with merge instead of updateDoc to avoid permission issues
    await setDoc(userRef, updateData, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error verifying driver:', error);
    return { success: false, error: error.message || 'Failed to verify driver' };
  }
};

/**
 * Get pending driver verifications (admin function)
 */
export const getPendingDriverVerifications = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('isPending', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const pendingDrivers = [];
    
    querySnapshot.forEach((doc) => {
      const userData = {
        id: doc.id,
        ...doc.data()
      };
      
      // Filter for drivers that are pending and not verified
      if (userData.role === USER_ROLES.DRIVER && userData.isVerified === false) {
        pendingDrivers.push(userData);
      }
    });
    
    return { success: true, data: pendingDrivers };
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user can share location (is verified driver)
 */
export const canShareLocation = async (userId) => {
  try {
    const profile = await getUserProfile(userId);
    if (!profile.success) return false;
    
    const userData = profile.data;
    return userData.role === USER_ROLES.DRIVER && 
           userData.isVerified === true && userData.isPending === false;
  } catch (error) {
    console.error('Error checking location sharing permission:', error);
    return false;
  }
};

/**
 * Listen to user profile changes
 */
export const listenToUserProfile = (userId, callback) => {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback({ success: true, data: doc.data() });
    } else {
      callback({ success: false, error: 'User profile not found' });
    }
  });
};

/**
 * Get all verified drivers
 */
export const getVerifiedDrivers = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('isVerified', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const verifiedDrivers = [];
    
    querySnapshot.forEach((doc) => {
      const userData = {
        id: doc.id,
        ...doc.data()
      };
      
      // Filter for verified drivers only
      if (userData.role === USER_ROLES.DRIVER) {
        verifiedDrivers.push(userData);
      }
    });
    
    return { success: true, data: verifiedDrivers };
  } catch (error) {
    console.error('Error getting verified drivers:', error);
    return { success: false, error: error.message };
  }
};

