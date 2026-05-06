import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function PendingVerificationScreen() {
  const { logout, userProfile } = useAuth();

  return (
    <LinearGradient
      colors={['#1a1a3e', '#2d2d5f', '#1a1a3e']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="time-outline" size={80} color="#FF9800" />
        </View>
        
        <Text style={styles.title}>Verification Pending</Text>
        
        <Text style={styles.description}>
          Thank you for joining the Gujarat Innovation Hub. Your account ({userProfile?.role}) is currently under review by our administrators.
        </Text>
        
        <Text style={styles.subDescription}>
          You will receive full access once your credentials have been verified. This usually takes 24-48 hours.
        </Text>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
    width: '100%',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#ddd',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
  },
  subDescription: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 30,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.4)',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
