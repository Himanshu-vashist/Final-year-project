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
    'view_analytics'
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
    'access_resources'
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        setCurrentUser(user);
        setUserProfile(profile);
        await AsyncStorage.setItem('userToken', user.uid);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        await AsyncStorage.removeItem('userToken');
      }
      setLoading(false);
    });

    return unsubscribe;
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
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      await AsyncStorage.removeItem('userToken');
    } catch (error) {
      console.error('Error signing out:', error);
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