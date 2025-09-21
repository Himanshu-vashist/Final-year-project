import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image
} from 'react-native';
import { TextInput, Button, Card, Title, Avatar, Switch, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, USER_ROLES } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen({ navigation }) {
  const { userProfile, updateProfile, logout, currentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    organization: userProfile?.organization || '',
    designation: userProfile?.designation || '',
    phone: userProfile?.phone || '',
    bio: userProfile?.bio || '',
    website: userProfile?.website || '',
    linkedin: userProfile?.linkedin || '',
    notificationsEnabled: userProfile?.notificationsEnabled ?? true,
    publicProfile: userProfile?.publicProfile ?? false
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(formData);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      // In a real app, you would upload this to Firebase Storage
      console.log('Selected image:', result.assets[0].uri);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      [USER_ROLES.GOVERNMENT_OFFICIAL]: 'Government Official',
      [USER_ROLES.RESEARCHER]: 'Researcher',
      [USER_ROLES.ENTREPRENEUR]: 'Entrepreneur',
      [USER_ROLES.INVESTOR]: 'Investor',
      [USER_ROLES.PUBLIC_USER]: 'Public User',
      [USER_ROLES.ADMIN]: 'Administrator'
    };
    return roleNames[role] || role;
  };

  const getVerificationStatus = () => {
    if (userProfile?.verified) {
      return { text: 'Verified', color: '#4CAF50', icon: 'checkmark-circle' };
    }
    return { text: 'Pending Verification', color: '#FF9800', icon: 'time' };
  };

  const verificationStatus = getVerificationStatus();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={pickImage}>
            <Avatar.Text 
              size={80} 
              label={userProfile?.name?.charAt(0) || 'U'} 
              style={styles.avatar}
            />
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userProfile?.name}</Text>
            <Text style={styles.userRole}>{getRoleDisplayName(userProfile?.role)}</Text>
            <View style={styles.verificationBadge}>
              <Ionicons name={verificationStatus.icon} size={16} color={verificationStatus.color} />
              <Text style={[styles.verificationText, { color: verificationStatus.color }]}>
                {verificationStatus.text}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setEditing(!editing)}
          >
            <Ionicons name={editing ? "close" : "pencil"} size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Basic Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Basic Information</Title>
            
            <TextInput
              label="Full Name"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              mode="outlined"
              style={styles.input}
              editable={editing}
              left={<TextInput.Icon icon="account" />}
              theme={{ colors: { primary: '#667eea' } }}
            />

            <TextInput
              label="Email Address"
              value={currentUser?.email || ''}
              mode="outlined"
              style={styles.input}
              editable={false}
              left={<TextInput.Icon icon="email" />}
              theme={{ colors: { primary: '#667eea' } }}
            />

            <TextInput
              label="Organization"
              value={formData.organization}
              onChangeText={(value) => updateFormData('organization', value)}
              mode="outlined"
              style={styles.input}
              editable={editing}
              left={<TextInput.Icon icon="office-building" />}
              theme={{ colors: { primary: '#667eea' } }}
            />

            <TextInput
              label="Designation"
              value={formData.designation}
              onChangeText={(value) => updateFormData('designation', value)}
              mode="outlined"
              style={styles.input}
              editable={editing}
              left={<TextInput.Icon icon="badge-account" />}
              theme={{ colors: { primary: '#667eea' } }}
            />

            <TextInput
              label="Phone Number"
              value={formData.phone}
              onChangeText={(value) => updateFormData('phone', value)}
              mode="outlined"
              style={styles.input}
              editable={editing}
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
              theme={{ colors: { primary: '#667eea' } }}
            />

            <TextInput
              label="Bio"
              value={formData.bio}
              onChangeText={(value) => updateFormData('bio', value)}
              mode="outlined"
              style={styles.input}
              editable={editing}
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="text" />}
              theme={{ colors: { primary: '#667eea' } }}
            />
          </Card.Content>
        </Card>

        {/* Professional Links */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Professional Links</Title>
            
            <TextInput
              label="Website"
              value={formData.website}
              onChangeText={(value) => updateFormData('website', value)}
              mode="outlined"
              style={styles.input}
              editable={editing}
              left={<TextInput.Icon icon="web" />}
              theme={{ colors: { primary: '#667eea' } }}
            />

            <TextInput
              label="LinkedIn Profile"
              value={formData.linkedin}
              onChangeText={(value) => updateFormData('linkedin', value)}
              mode="outlined"
              style={styles.input}
              editable={editing}
              left={<TextInput.Icon icon="linkedin" />}
              theme={{ colors: { primary: '#667eea' } }}
            />
          </Card.Content>
        </Card>

        {/* Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Settings</Title>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Enable Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive updates about your applications and opportunities
                </Text>
              </View>
              <Switch
                value={formData.notificationsEnabled}
                onValueChange={(value) => updateFormData('notificationsEnabled', value)}
                disabled={!editing}
                color="#667eea"
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Public Profile</Text>
                <Text style={styles.settingDescription}>
                  Make your profile visible to other users
                </Text>
              </View>
              <Switch
                value={formData.publicProfile}
                onValueChange={(value) => updateFormData('publicProfile', value)}
                disabled={!editing}
                color="#667eea"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Account Statistics */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Account Statistics</Title>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {new Date(userProfile?.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.statLabel}>Member Since</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {new Date(userProfile?.updatedAt).toLocaleDateString()}
                </Text>
                <Text style={styles.statLabel}>Last Updated</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        {editing && (
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              style={styles.saveButton}
              contentStyle={styles.buttonContent}
            >
              Save Changes
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => {
                setEditing(false);
                setFormData({
                  name: userProfile?.name || '',
                  organization: userProfile?.organization || '',
                  designation: userProfile?.designation || '',
                  phone: userProfile?.phone || '',
                  bio: userProfile?.bio || '',
                  website: userProfile?.website || '',
                  linkedin: userProfile?.linkedin || '',
                  notificationsEnabled: userProfile?.notificationsEnabled ?? true,
                  publicProfile: userProfile?.publicProfile ?? false
                });
              }}
              style={styles.cancelButton}
              contentStyle={styles.buttonContent}
            >
              Cancel
            </Button>
          </View>
        )}

        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={styles.buttonContent}
          textColor="#f44336"
          icon="logout"
        >
          Logout
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#667eea',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 20,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  editButton: {
    padding: 10,
  },
  content: {
    padding: 20,
  },
  card: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  divider: {
    marginVertical: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#667eea',
    marginBottom: 10,
  },
  cancelButton: {
    borderColor: '#667eea',
    marginBottom: 10,
  },
  logoutButton: {
    borderColor: '#f44336',
    marginBottom: 30,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});