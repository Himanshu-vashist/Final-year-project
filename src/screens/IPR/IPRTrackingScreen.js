import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth, USER_ROLES } from '../../context/AuthContext';
import { IPRTrackingComponent } from '../../components/IPRTrackingComponent';
import { LoadingCard } from '../../components/UIComponents';

export default function IPRTrackingScreen({ route }) {
  const { currentUser, userProfile } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const { applicationId } = route.params;

  useEffect(() => {
    if (!applicationId) return;

    const iprRef = doc(db, 'ipr_applications', applicationId);
    
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
        <LoadingCard />
      </View>
    );
  }

  if (!application) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="alert-circle-outline"
          title="Application Not Found"
          description="The IPR application you're looking for doesn't exist or you don't have permission to view it."
        />
      </View>
    );
  }

  const isGovernmentView = userProfile?.role === USER_ROLES.GOVERNMENT_OFFICIAL;

  return (
    <View style={styles.container}>
      <IPRTrackingComponent
        application={application}
        isGovernmentView={isGovernmentView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});