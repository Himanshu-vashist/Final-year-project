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
        colors={['#1a1a3e', '#2d2d5f', '#1a1a3e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* World Map Background - Optional */}
        {/* <Image 
          source={require('../../assets/world-map.png')} 
          style={styles.worldMap}
          resizeMode="cover"
        /> */}
        
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
              <Ionicons name="chevron-back" size={30} color="#b366ff" />
            </TouchableOpacity>
            <Text style={styles.welcomeText}>Create Your</Text>
            <Text style={styles.accountText}>Account!</Text>
          </View>

          {/* Sign Up Card */}
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            width: '100%',
          }}>
            <View style={styles.card}>
              {/* Basic Information */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="person-outline" size={22} color="#999" />
                </View>
                <TextInput
                  placeholder="Full Name *"
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                  mode="flat"
                  style={styles.input}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  placeholderTextColor="#999"
                  theme={{ colors: { primary: 'transparent', text: '#fff' } }}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="mail-outline" size={22} color="#999" />
                </View>
                <TextInput
                  placeholder="Email Address *"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  mode="flat"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  placeholderTextColor="#999"
                  theme={{ colors: { primary: 'transparent', text: '#fff' } }}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed-outline" size={22} color="#999" />
                </View>
                <TextInput
                  placeholder="Password *"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  mode="flat"
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  placeholderTextColor="#999"
                  theme={{ colors: { primary: 'transparent', text: '#fff' } }}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={22} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed-outline" size={22} color="#999" />
                </View>
                <TextInput
                  placeholder="Confirm Password *"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  mode="flat"
                  style={styles.input}
                  secureTextEntry={!showConfirmPassword}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  placeholderTextColor="#999"
                  theme={{ colors: { primary: 'transparent', text: '#fff' } }}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={22} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>

              {/* Role Selection */}
              <View style={styles.dropdownContainer}>
                <Text style={styles.sectionTitle}>Select Your Role *</Text>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                >
                  <View style={styles.dropdownButtonContent}>
                    <Ionicons name="briefcase-outline" size={22} color="#999" />
                    <Text style={selectedRole ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
                      {selectedRole ? selectedRole.label : 'Choose your role'}
                    </Text>
                    <Ionicons 
                      name={showRoleDropdown ? "chevron-up" : "chevron-down"} 
                      size={22} 
                      color="#999"
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
                            color={formData.role === role.value ? '#b366ff' : '#999'} 
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
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="business-outline" size={22} color="#999" />
                </View>
                <TextInput
                  placeholder="Organization"
                  value={formData.organization}
                  onChangeText={(value) => updateFormData('organization', value)}
                  mode="flat"
                  style={styles.input}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  placeholderTextColor="#999"
                  theme={{ colors: { primary: 'transparent', text: '#fff' } }}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="ribbon-outline" size={22} color="#999" />
                </View>
                <TextInput
                  placeholder="Designation"
                  value={formData.designation}
                  onChangeText={(value) => updateFormData('designation', value)}
                  mode="flat"
                  style={styles.input}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  placeholderTextColor="#999"
                  theme={{ colors: { primary: 'transparent', text: '#fff' } }}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="call-outline" size={22} color="#999" />
                </View>
                <TextInput
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChangeText={(value) => updateFormData('phone', value)}
                  mode="flat"
                  style={styles.input}
                  keyboardType="phone-pad"
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  placeholderTextColor="#999"
                  theme={{ colors: { primary: 'transparent', text: '#fff' } }}
                />
              </View>

              <TouchableOpacity
                style={styles.signUpButton}
                onPress={handleSignUp}
                activeOpacity={0.8}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#b366ff', '#8b3dc7', '#6a2c96']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.signUpText}>
                    {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.loginLink}>
                <Text style={styles.linkText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.linkTextBold}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  worldMap: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight * 0.4,
    top: screenHeight * 0.15,
    opacity: 0.15,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: screenWidth > 400 ? 25 : 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 40,
    minHeight: screenHeight,
  },
  header: {
    marginBottom: screenHeight > 700 ? 40 : 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 10,
    zIndex: 10,
  },
  welcomeText: {
    fontSize: screenWidth > 400 ? 38 : 32,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: 1,
    textAlign: 'center',
  },
  accountText: {
    fontSize: screenWidth > 400 ? 38 : 32,
    fontWeight: 'bold',
    color: '#b366ff',
    letterSpacing: 1,
    marginTop: -8,
    textAlign: 'center',
  },
  card: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    marginBottom: screenHeight > 700 ? 18 : 15,
    paddingHorizontal: 15,
    height: screenHeight > 700 ? 58 : 55,
  },
  inputIconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: screenWidth > 400 ? 16 : 14,
    color: '#fff',
  },
  eyeIcon: {
    padding: 5,
  },
  dropdownContainer: {
    marginBottom: screenHeight > 700 ? 18 : 15,
  },
  sectionTitle: {
    fontSize: screenWidth > 400 ? 15 : 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  dropdownButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: screenHeight > 700 ? 58 : 55,
    justifyContent: 'center',
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownSelectedText: {
    flex: 1,
    fontSize: screenWidth > 400 ? 16 : 14,
    color: '#fff',
    marginLeft: 10,
  },
  dropdownPlaceholder: {
    flex: 1,
    fontSize: screenWidth > 400 ? 16 : 14,
    color: '#999',
    marginLeft: 10,
  },
  dropdownList: {
    backgroundColor: 'rgba(40, 40, 70, 0.95)',
    borderRadius: 15,
    marginTop: 10,
    overflow: 'hidden',
    elevation: 8,
    maxHeight: screenHeight * 0.5,
  },
  dropdownItem: {
    padding: screenHeight > 700 ? 15 : 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(179, 102, 255, 0.2)',
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
    fontSize: screenWidth > 400 ? 16 : 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  dropdownItemLabelSelected: {
    color: '#b366ff',
  },
  dropdownItemDescription: {
    fontSize: screenWidth > 400 ? 13 : 12,
    color: '#999',
    lineHeight: 18,
  },
  signUpButton: {
    width: '100%',
    height: screenHeight > 700 ? 60 : 55,
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: screenHeight > 700 ? 25 : 20,
    elevation: 8,
    shadowColor: '#b366ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpText: {
    fontSize: screenWidth > 400 ? 18 : 16,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: screenHeight > 700 ? 25 : 20,
    flexWrap: 'wrap',
  },
  linkText: {
    color: '#999',
    fontSize: screenWidth > 400 ? 14 : 13,
  },
  linkTextBold: {
    color: '#b366ff',
    fontSize: screenWidth > 400 ? 14 : 13,
    fontWeight: 'bold',
  },
});
