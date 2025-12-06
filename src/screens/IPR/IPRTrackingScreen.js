import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth, USER_ROLES } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { IPRTrackingComponent } from '../../components/IPRTrackingComponent';
import { LoadingCard, EmptyState } from '../../components/UIComponents';

export default function IPRTrackingScreen({ route }) {
  const { currentUser, userProfile } = useAuth();
  const { isDarkMode } = useTheme();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const { applicationId } = route.params;

  useEffect(() => {
    if (!applicationId) return;

    const iprRef = doc(db, 'ipr', applicationId);
    
    const unsubscribe = onSnapshot(iprRef, (doc) => {
      if (doc.exists()) {
        setApplication({ id: doc.id, ...doc.data() });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [applicationId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f1419']}
          style={styles.gradient}
        >
          <LoadingCard />
        </LinearGradient>
      </View>
    );
  }

  if (!application) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f1419']}
          style={styles.gradient}
        >
          <EmptyState
            icon="alert-circle-outline"
            title="Application Not Found"
            description="The IPR application you're looking for doesn't exist or you don't have permission to view it."
          />
        </LinearGradient>
      </View>
    );
  }

  const isGovernmentView = userProfile?.role === USER_ROLES.GOVERNMENT_OFFICIAL;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f1419']}
        style={styles.gradient}
      >
        <IPRTrackingComponent
          application={application}
          isGovernmentView={isGovernmentView}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1419',
  },
  gradient: {
    flex: 1,
  },
});