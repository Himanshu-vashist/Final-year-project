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
  StatusBar,
  Keyboard
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, USER_ROLES } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ROLE_OPTIONS = [
  { value: USER_ROLES.GOVERNMENT_OFFICIAL, label: 'Government Official', description: 'Policy makers, administrators, and government employees', icon: 'business-outline' },
  { value: USER_ROLES.RESEARCHER, label: 'Researcher', description: 'Scientists, academicians, and research professionals', icon: 'flask-outline' },
  { value: USER_ROLES.ENTREPRENEUR, label: 'Entrepreneur', description: 'Start-up founders and business innovators', icon: 'rocket-outline' },
  { value: USER_ROLES.INVESTOR, label: 'Investor', description: 'Angel investors, VCs, and funding organizations', icon: 'trending-up-outline' },
  { value: USER_ROLES.PUBLIC_USER, label: 'Public User', description: 'General public and interested individuals', icon: 'people-outline' }
];

export default function SignUpScreen({ navigation }) {
  const { theme } = useTheme();
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
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
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

      Alert.alert('Success', 'Account created successfully! Please wait for verification.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={theme.gradients.dark}
        style={styles.gradient}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={true}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={30} color="#b366ff" />
            </TouchableOpacity>
            <Text style={styles.welcomeText}>Create Your</Text>
            <Text style={styles.accountText}>Account!</Text>
          </View>

          {/* Main Card */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.card}>

              {/* Basic Fields */}
              {[
                { icon: 'person-outline', placeholder: 'Full Name *', key: 'name' },
                { icon: 'mail-outline', placeholder: 'Email Address *', key: 'email', keyboardType: 'email-address' },
              ].map((item, i) => (
                <View key={item.key} style={styles.inputContainer}>
                  <Ionicons name={item.icon} size={22} color="#999" style={styles.inputIconContainer} />
                  <TextInput
                    placeholder={item.placeholder}
                    value={formData[item.key]}
                    onChangeText={t => updateFormData(item.key, t)}
                    style={styles.input}
                    mode="flat"
                    textColor="#fff"
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    keyboardType={item.keyboardType || 'default'}
                    placeholderTextColor="#999"
                    autoCapitalize={item.key === 'email' ? 'none' : 'words'}
                  />
                </View>
              ))}

              {/* Password */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="#999" style={styles.inputIconContainer} />
                <TextInput
                  placeholder="Password *"
                  value={formData.password}
                  onChangeText={t => updateFormData('password', t)}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  mode="flat"
                  textColor="#fff"
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="#999" style={styles.inputIconContainer} />
                <TextInput
                  placeholder="Confirm Password *"
                  value={formData.confirmPassword}
                  onChangeText={t => updateFormData('confirmPassword', t)}
                  secureTextEntry={!showConfirmPassword}
                  style={styles.input}
                  mode="flat"
                  textColor="#fff"
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Role Selection */}
              <View style={styles.dropdownContainer}>
                <Text style={styles.sectionTitle}>Select Your Role *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                >
                  <Ionicons name="briefcase-outline" size={22} color="#999" />
                  <Text style={selectedRole ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
                    {selectedRole ? selectedRole.label : 'Choose your role'}
                  </Text>
                  <Ionicons name={showRoleDropdown ? 'chevron-up' : 'chevron-down'} size={22} color="#999" />
                </TouchableOpacity>

                {showRoleDropdown && (
                  <View style={styles.dropdownList}>
                    {ROLE_OPTIONS.map(role => (
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
                        <Ionicons
                          name={role.icon}
                          size={20}
                          color={formData.role === role.value ? '#b366ff' : '#999'}
                        />
                        <View style={styles.dropdownItemText}>
                          <Text style={[styles.dropdownItemLabel, formData.role === role.value && styles.dropdownItemLabelSelected]}>
                            {role.label}
                          </Text>
                          <Text style={styles.dropdownItemDescription}>{role.description}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Additional Information */}
              {[
                { icon: 'business-outline', placeholder: 'Organization', key: 'organization' },
                { icon: 'ribbon-outline', placeholder: 'Designation', key: 'designation' },
                { icon: 'call-outline', placeholder: 'Phone Number', key: 'phone', keyboardType: 'phone-pad' }
              ].map((item) => (
                <View key={item.key} style={styles.inputContainer}>
                  <Ionicons name={item.icon} size={22} color="#999" style={styles.inputIconContainer} />
                  <TextInput
                    placeholder={item.placeholder}
                    value={formData[item.key]}
                    onChangeText={t => updateFormData(item.key, t)}
                    style={styles.input}
                    mode="flat"
                    textColor="#fff"
                    keyboardType={item.keyboardType || 'default'}
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    placeholderTextColor="#999"
                  />
                </View>
              ))}

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.signUpButton}
                onPress={handleSignUp}
                disabled={loading}
                activeOpacity={0.8}
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

              {/* Login Link */}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollContainer: {
    paddingHorizontal: screenWidth > 400 ? 25 : 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    position: 'relative'
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 10,
    zIndex: 10
  },
  welcomeText: {
    fontSize: screenWidth > 400 ? 38 : 32,
    fontWeight: '300',
    color: '#fff',
    textAlign: 'center'
  },
  accountText: {
    fontSize: screenWidth > 400 ? 38 : 32,
    fontWeight: 'bold',
    color: '#b366ff',
    textAlign: 'center',
    marginTop: -8
  },
  card: { width: '100%' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 15,
    marginBottom: 16,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIconContainer: { marginRight: 10 },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    height: 55,
  },
  dropdownContainer: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10
  },
  dropdownButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    flexDirection: 'row',
    alignItems: 'center'
  },
  dropdownSelectedText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#fff'
  },
  dropdownPlaceholder: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#999'
  },
  dropdownList: {
    backgroundColor: 'rgba(40,40,70,0.95)',
    borderRadius: 15,
    marginTop: 10,
    overflow: 'hidden',
    elevation: 8,
    maxHeight: screenHeight * 0.4
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row'
  },
  dropdownItemSelected: { backgroundColor: 'rgba(179,102,255,0.2)' },
  dropdownItemText: { marginLeft: 10, flex: 1 },
  dropdownItemLabel: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4
  },
  dropdownItemLabelSelected: { color: '#b366ff' },
  dropdownItemDescription: { fontSize: 12, color: '#999' },
  signUpButton: {
    height: 55,
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 20,
    elevation: 8
  },
  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  signUpText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20
  },
  linkText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  linkTextBold: { color: '#b366ff', fontSize: 14, fontWeight: 'bold' }
});
