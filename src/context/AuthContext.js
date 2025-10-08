import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const USER_ROLES = {
  GOVERNMENT_OFFICIAL: 'government_official',
  RESEARCHER: 'researcher',
  ENTREPRENEUR: 'entrepreneur',
  INVESTOR: 'investor',
  PUBLIC_USER: 'public_user',
  ADMIN: 'admin'
};

export const USER_PERMISSIONS = {
  [USER_ROLES.GOVERNMENT_OFFICIAL]: [
    'view_all_data',
    'generate_reports',
    'manage_funding',
    'approve_applications',
    'view_analytics',
    'manage_ipr',
    'track_ipr'
  ],
  [USER_ROLES.RESEARCHER]: [
    'submit_research',
    'view_research',
    'collaborate',
    'apply_for_funding',
    'manage_profile'
  ],
  [USER_ROLES.ENTREPRENEUR]: [
    'submit_startup',
    'view_opportunities',
    'apply_for_funding',
    'manage_profile',
    'access_resources',
    'submit_ipr',
    'track_own_ipr'
  ],
  [USER_ROLES.INVESTOR]: [
    'view_startups',
    'view_opportunities',
    'manage_investments',
    'access_reports',
    'manage_profile'
  ],
  [USER_ROLES.PUBLIC_USER]: [
    'view_public_data',
    'access_resources',
    'view_success_stories'
  ],
  [USER_ROLES.ADMIN]: [
    'full_access',
    'manage_users',
    'system_settings',
    'view_all_data',
    'generate_reports'
  ]
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AuthContext: Auth state changed:', user ? 'logged in' : 'logged out');
      try {
        if (user) {
          console.log('AuthContext: User is logged in, fetching profile');
          const profile = await getUserProfile(user.uid);
          setCurrentUser(user);
          setUserProfile(profile);
          await AsyncStorage.setItem('userToken', user.uid);
          console.log('AuthContext: Profile loaded and state updated');
        } else {
          console.log('AuthContext: User is logged out, clearing state');
          setCurrentUser(null);
          setUserProfile(null);
          await AsyncStorage.removeItem('userToken');
        }
      } catch (error) {
        console.error('AuthContext: Error in auth state change:', error);
        // Ensure state is cleared on error
        setCurrentUser(null);
        setUserProfile(null);
        await AsyncStorage.removeItem('userToken');
      } finally {
        setLoading(false);
      }
    });

    return () => {
      console.log('AuthContext: Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const getUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const createUserProfile = async (uid, profileData) => {
    try {
      const userProfile = {
        uid,
        email: profileData.email,
        role: profileData.role,
        name: profileData.name,
        organization: profileData.organization || '',
        designation: profileData.designation || '',
        phone: profileData.phone || '',
        verified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...profileData
      };

      await setDoc(doc(db, 'users', uid), userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  const signUp = async (email, password, profileData) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const profile = await createUserProfile(user.uid, { ...profileData, email });
      setUserProfile(profile);
      return { user, profile };
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
      return { user, profile };
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('AuthContext: Starting logout process');
    try {
      // First sign out from Firebase
      console.log('AuthContext: Signing out from Firebase');
      await signOut(auth);
      
      // Then clear the local storage
      console.log('AuthContext: Clearing local storage');
      await AsyncStorage.removeItem('userToken');
      
      // Finally clear the state
      console.log('AuthContext: Clearing state');
      setCurrentUser(null);
      setUserProfile(null);
      
      console.log('AuthContext: Logout successful');
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
      // Make sure state is cleared even if there's an error
      setCurrentUser(null);
      setUserProfile(null);
      await AsyncStorage.removeItem('userToken');
      throw error;
    }
  };

  const hasPermission = (permission) => {
    if (!userProfile || !userProfile.role) return false;
    const rolePermissions = USER_PERMISSIONS[userProfile.role] || [];
    return rolePermissions.includes(permission) || rolePermissions.includes('full_access');
  };

  const isRole = (role) => {
    return userProfile && userProfile.role === role;
  };

  const updateProfile = async (updates) => {
    try {
      if (!currentUser) throw new Error('No authenticated user');
      
      const updatedProfile = {
        ...userProfile,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', currentUser.uid), updatedProfile, { merge: true });
      setUserProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signUp,
    signIn,
    logout,
    hasPermission,
    isRole,
    updateProfile,
    getUserProfile,
    USER_ROLES,
    USER_PERMISSIONS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}