import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar
} from 'react-native';
import { TextInput, Button, Card, Title, RadioButton, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
  const scrollViewRef = useRef(null);
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
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const { signUp } = useAuth();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={true}
          bounces={true}
          keyboardShouldPersistTaps="handled"
          indicatorStyle="white"
          persistentScrollbar={true}
        >
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
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            width: '100%',
          }}>
            <Card style={styles.card}>
              <Card.Content>
              {/* <View style={styles.cardHeader}>
                <Ionicons name="person-add-outline" size={24} color="#667eea" />
                <Text style={styles.cardTitle}>Sign Up</Text>
              </View> */}

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
              <View style={styles.dropdownContainer}>
                <Text style={styles.sectionTitle}>Select Your Role *</Text>
                <TouchableOpacity 
                  style={[
                    styles.dropdownButton,
                    formData.role && styles.dropdownButtonSelected
                  ]}
                  onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                >
                  <View style={styles.dropdownButtonContent}>
                    {selectedRole ? (
                      <>
                        <Ionicons 
                          name={selectedRole.icon} 
                          size={20} 
                          color="#4c669f"
                        />
                        <Text style={styles.dropdownSelectedText}>
                          {selectedRole.label}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.dropdownPlaceholder}>Choose your role</Text>
                    )}
                    <Ionicons 
                      name={showRoleDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#4c669f"
                    />
                  </View>
                </TouchableOpacity>
                
                {showRoleDropdown && (
                  <View style={styles.dropdownList}>
                    {ROLE_OPTIONS.map((role) => (
                      <TouchableOpacity
                        key={role.value}
                        style={[
                          styles.dropdownItem,
                          formData.role === role.value && styles.dropdownItemSelected
                        ]}
                        onPress={() => {
                          updateFormData('role', role.value);
                          setShowRoleDropdown(false);
                        }}
                      >
                        <View style={styles.dropdownItemContent}>
                          <Ionicons 
                            name={role.icon} 
                            size={20} 
                            color={formData.role === role.value ? '#4c669f' : '#666'} 
                          />
                          <View style={styles.dropdownItemText}>
                            <Text style={[
                              styles.dropdownItemLabel,
                              formData.role === role.value && styles.dropdownItemLabelSelected
                            ]}>
                              {role.label}
                            </Text>
                            <Text style={styles.dropdownItemDescription}>
                              {role.description}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

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
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: 'rgba(224, 224, 224, 0.5)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    padding: 12,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#4c669f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dropdownButtonSelected: {
    borderColor: '#4c669f',
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownSelectedText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  dropdownPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#999',
  },
  dropdownList: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    marginTop: 8,
    elevation: 6,
    shadowColor: '#192f6a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(8px)',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(76, 102, 159, 0.1)',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dropdownItemText: {
    flex: 1,
    marginLeft: 12,
  },
  dropdownItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  dropdownItemLabelSelected: {
    color: '#4c669f',
  },
  dropdownItemDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    minHeight: Dimensions.get('window').height,
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
    borderRadius: 24,
    elevation: 12,
    shadowColor: '#192f6a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    marginHorizontal: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(16px)',
    padding: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    fontSize: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#4c669f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  roleOption: {
    borderWidth: 1.5,
    borderColor: 'rgba(224, 224, 224, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    transform: [{scale: 1}],
  },
  selectedRole: {
    borderColor: '#667eea',
    backgroundColor: '#f8f9ff',
    elevation: 4,
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  roleContent: {
    flex: 1,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 12,
    color: '#333',
  },
  selectedRoleLabel: {
    color: '#667eea',
  },
  roleDescription: {
    fontSize: 13,
    color: '#666',
    marginLeft: 34,
    lineHeight: 18,
  },
  signUpButton: {
    marginTop: 25,
    marginBottom: 20,
    backgroundColor: '#4c669f',
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#192f6a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  buttonContent: {
    paddingVertical: 10,
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 5,
  },
  linkText: {
    color: '#666',
    fontSize: 15,
  },
  linkTextBold: {
    color: '#667eea',
    fontWeight: 'bold',
  },
});
