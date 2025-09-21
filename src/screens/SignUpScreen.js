import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { TextInput, Button, Card, Title, RadioButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, USER_ROLES } from '../context/AuthContext';

const ROLE_OPTIONS = [
  {
    value: USER_ROLES.GOVERNMENT_OFFICIAL,
    label: 'Government Official',
    description: 'Policy makers, administrators, and government employees',
    icon: 'business-outline'
  },
  {
    value: USER_ROLES.RESEARCHER,
    label: 'Researcher',
    description: 'Scientists, academicians, and research professionals',
    icon: 'flask-outline'
  },
  {
    value: USER_ROLES.ENTREPRENEUR,
    label: 'Entrepreneur',
    description: 'Start-up founders and business innovators',
    icon: 'rocket-outline'
  },
  {
    value: USER_ROLES.INVESTOR,
    label: 'Investor',
    description: 'Angel investors, VCs, and funding organizations',
    icon: 'trending-up-outline'
  },
  {
    value: USER_ROLES.PUBLIC_USER,
    label: 'Public User',
    description: 'General public and interested individuals',
    icon: 'people-outline'
  }
];

export default function SignUpScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    organization: '',
    designation: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signUp } = useAuth();

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { name, email, password, confirmPassword, role } = formData;

    if (!name || !email || !password || !confirmPassword || !role) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signUp(formData.email, formData.password, {
        name: formData.name,
        role: formData.role,
        organization: formData.organization,
        designation: formData.designation,
        phone: formData.phone
      });
      
      Alert.alert(
        'Success', 
        'Account created successfully! Please wait for verification.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('Sign Up Failed', error.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLE_OPTIONS.find(option => option.value === formData.role);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Title style={styles.title}>Create Account</Title>
            <Text style={styles.subtitle}>Join Gujarat Innovation Hub</Text>
          </View>

          {/* Sign Up Card */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Ionicons name="person-add-outline" size={24} color="#667eea" />
                <Text style={styles.cardTitle}>Sign Up</Text>
              </View>

              {/* Basic Information */}
              <TextInput
                label="Full Name *"
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="account" />}
                theme={{ colors: { primary: '#667eea' } }}
              />

              <TextInput
                label="Email Address *"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                left={<TextInput.Icon icon="email" />}
                theme={{ colors: { primary: '#667eea' } }}
              />

              <TextInput
                label="Password *"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                mode="outlined"
                style={styles.input}
                secureTextEntry={!showPassword}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon 
                    icon={showPassword ? "eye-off" : "eye"} 
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                theme={{ colors: { primary: '#667eea' } }}
              />

              <TextInput
                label="Confirm Password *"
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                mode="outlined"
                style={styles.input}
                secureTextEntry={!showConfirmPassword}
                left={<TextInput.Icon icon="lock-check" />}
                right={
                  <TextInput.Icon 
                    icon={showConfirmPassword ? "eye-off" : "eye"} 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                theme={{ colors: { primary: '#667eea' } }}
              />

              {/* Role Selection */}
              <Text style={styles.sectionTitle}>Select Your Role *</Text>
              {ROLE_OPTIONS.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleOption,
                    formData.role === role.value && styles.selectedRole
                  ]}
                  onPress={() => updateFormData('role', role.value)}
                >
                  <View style={styles.roleContent}>
                    <View style={styles.roleHeader}>
                      <Ionicons 
                        name={role.icon} 
                        size={20} 
                        color={formData.role === role.value ? '#667eea' : '#666'} 
                      />
                      <Text style={[
                        styles.roleLabel,
                        formData.role === role.value && styles.selectedRoleLabel
                      ]}>
                        {role.label}
                      </Text>
                      <RadioButton
                        value={role.value}
                        status={formData.role === role.value ? 'checked' : 'unchecked'}
                        color="#667eea"
                      />
                    </View>
                    <Text style={styles.roleDescription}>{role.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Additional Information */}
              <TextInput
                label="Organization"
                value={formData.organization}
                onChangeText={(value) => updateFormData('organization', value)}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="office-building" />}
                theme={{ colors: { primary: '#667eea' } }}
              />

              <TextInput
                label="Designation"
                value={formData.designation}
                onChangeText={(value) => updateFormData('designation', value)}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="badge-account" />}
                theme={{ colors: { primary: '#667eea' } }}
              />

              <TextInput
                label="Phone Number"
                value={formData.phone}
                onChangeText={(value) => updateFormData('phone', value)}
                mode="outlined"
                style={styles.input}
                keyboardType="phone-pad"
                left={<TextInput.Icon icon="phone" />}
                theme={{ colors: { primary: '#667eea' } }}
              />

              <Button
                mode="contained"
                onPress={handleSignUp}
                loading={loading}
                disabled={loading}
                style={styles.signUpButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.linkText}>
                  Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  card: {
    borderRadius: 15,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  roleOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  selectedRole: {
    borderColor: '#667eea',
    backgroundColor: '#f8f9ff',
  },
  roleContent: {
    flex: 1,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  roleLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    color: '#333',
  },
  selectedRoleLabel: {
    color: '#667eea',
  },
  roleDescription: {
    fontSize: 12,
    color: '#666',
    marginLeft: 30,
  },
  signUpButton: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#667eea',
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#667eea',
    fontWeight: 'bold',
  },
});
