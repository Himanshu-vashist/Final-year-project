import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { TextInput, Button, Card, Title, Avatar, Switch, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, USER_ROLES } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const { userProfile, updateProfile, logout, currentUser } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();
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

  const handleLogout = async () => {
    console.log('Logout button pressed');
    try {
      console.log('Starting logout process');
      setLoading(true);
      
      // Call logout directly without confirmation for testing
      console.log('Calling logout function...');
      await logout();
      console.log('Logout completed');
      
      // Navigate to the login screen
      console.log('Navigating to login screen...');
      navigation.replace('Login');
      
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout: ' + error.message);
    } finally {
      setLoading(false);
    }
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
    <LinearGradient
      colors={['#1a1a3e', '#2d2d5f', '#1a1a3e']}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
              <Avatar.Text 
                size={80} 
                label={userProfile?.name?.charAt(0) || 'U'} 
                style={styles.avatar}
              />
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setEditing(!editing)}
              activeOpacity={0.7}
            >
              <Ionicons name={editing ? "close" : "pencil"} size={20} color="#b366ff" />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfoSection}>
            <Text style={styles.userName}>{userProfile?.name}</Text>
            <Text style={styles.userRole}>{getRoleDisplayName(userProfile?.role)}</Text>
            <View style={styles.verificationBadge}>
              <Ionicons name={verificationStatus.icon} size={16} color={verificationStatus.color} />
              <Text style={[styles.verificationText, { color: verificationStatus.color }]}>
                {verificationStatus.text}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Basic Information */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={20} color="#b366ff" />
              <Text style={styles.cardTitle}>Basic Information</Text>
            </View>
            
            <TextInput
              label="Full Name"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              mode="flat"
              style={styles.input}
              editable={editing}
              left={<TextInput.Icon icon="account" color="#b366ff" />}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              theme={{ colors: { primary: '#b366ff', text: '#fff', placeholder: '#999' } }}
              textColor="#fff"
            />

            <TextInput
              label="Email Address"
              value={currentUser?.email || ''}
              mode="flat"
              style={styles.input}
              editable={false}
              left={<TextInput.Icon icon="email" color="#b366ff" />}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              theme={{ colors: { primary: '#b366ff', text: '#fff', placeholder: '#999' } }}
              textColor="#fff"
            />

            <TextInput
              label="Organization"
              value={formData.organization}
              onChangeText={(value) => updateFormData('organization', value)}
              mode="flat"
              style={styles.input}
              editable={editing}
              left={<TextInput.Icon icon="office-building" color="#b366ff" />}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              theme={{ colors: { primary: '#b366ff', text: '#fff', placeholder: '#999' } }}
              textColor="#fff"
            />

            <TextInput
              label="Designation"
              value={formData.designation}
              onChangeText={(value) => updateFormData('designation', value)}
              mode="flat"
              style={styles.input}
              editable={editing}
              left={<TextInput.Icon icon="badge-account" color="#b366ff" />}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              theme={{ colors: { primary: '#b366ff', text: '#fff', placeholder: '#999' } }}
              textColor="#fff"
            />

            <TextInput
              label="Phone Number"
              value={formData.phone}
              onChangeText={(value) => updateFormData('phone', value)}
              mode="flat"
              style={styles.input}
              editable={editing}
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" color="#b366ff" />}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              theme={{ colors: { primary: '#b366ff', text: '#fff', placeholder: '#999' } }}
              textColor="#fff"
            />

            <TextInput
              label="Bio"
              value={formData.bio}
              onChangeText={(value) => updateFormData('bio', value)}
              mode="flat"
              style={styles.input}
              editable={editing}
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="text" color="#b366ff" />}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              theme={{ colors: { primary: '#b366ff', text: '#fff', placeholder: '#999' } }}
              textColor="#fff"
            />
          </View>

          {/* Professional Links */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="link-outline" size={20} color="#b366ff" />
              <Text style={styles.cardTitle}>Professional Links</Text>
            </View>
            
            <TextInput
              label="Website"
              value={formData.website}
              onChangeText={(value) => updateFormData('website', value)}
              mode="flat"
              style={styles.input}
              editable={editing}
              left={<TextInput.Icon icon="web" color="#b366ff" />}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              theme={{ colors: { primary: '#b366ff', text: '#fff', placeholder: '#999' } }}
              textColor="#fff"
            />

            <TextInput
              label="LinkedIn Profile"
              value={formData.linkedin}
              onChangeText={(value) => updateFormData('linkedin', value)}
              mode="flat"
              style={styles.input}
              editable={editing}
              left={<TextInput.Icon icon="linkedin" color="#b366ff" />}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              theme={{ colors: { primary: '#b366ff', text: '#fff', placeholder: '#999' } }}
              textColor="#fff"
            />
          </View>

          {/* Settings */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="settings-outline" size={20} color="#b366ff" />
              <Text style={styles.cardTitle}>Settings</Text>
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingDescription}>
                  Enable blue dark theme throughout the app
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                color="#b366ff"
              />
            </View>

            <View style={styles.dividerLine} />

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
                color="#b366ff"
              />
            </View>

            <View style={styles.dividerLine} />

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
                color="#b366ff"
              />
            </View>
          </View>

          {/* Account Statistics */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="stats-chart-outline" size={20} color="#b366ff" />
              <Text style={styles.cardTitle}>Account Statistics</Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="calendar-outline" size={20} color="#b366ff" />
                <Text style={styles.statValue}>
                  {new Date(userProfile?.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.statLabel}>Member Since</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={20} color="#b366ff" />
                <Text style={styles.statValue}>
                  {new Date(userProfile?.updatedAt).toLocaleDateString()}
                </Text>
                <Text style={styles.statLabel}>Last Updated</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          {editing && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.8}
                style={styles.saveButtonWrapper}
              >
                <LinearGradient
                  colors={['#b366ff', '#8b3dc7', '#6a2c96']}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
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
                activeOpacity={0.8}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={handleLogout}
            disabled={loading}
            activeOpacity={0.8}
            style={styles.logoutButton}
          >
            <Ionicons name="log-out-outline" size={20} color="#ff4444" />
            <Text style={styles.logoutButtonText}>
              {loading ? 'Logging out...' : 'Logout'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 25,
    paddingBottom: 25,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: 'rgba(179, 102, 255, 0.3)',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#b366ff',
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: 'rgba(179, 102, 255, 0.2)',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfoSection: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  userRole: {
    fontSize: 14,
    color: '#ddd',
    opacity: 0.9,
    marginBottom: 10,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  content: {
    paddingHorizontal: 25,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(179, 102, 255, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 16,
  },
  dividerLine: {
    height: 1,
    backgroundColor: 'rgba(179, 102, 255, 0.2)',
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(179, 102, 255, 0.2)',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#ccc',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  saveButtonWrapper: {
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#b366ff',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  saveButton: {
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cancelButton: {
    height: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(179, 102, 255, 0.3)',
  },
  cancelButtonText: {
    color: '#b366ff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    height: 55,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    marginBottom: 30,
  },
  logoutButtonText: {
    color: '#ff4444',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginLeft: 8,
  },
});