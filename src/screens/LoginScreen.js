import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput, Checkbox } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#1a1a3e', '#2d2d5f', '#1a1a3e']}
        style={styles.container}
      >
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={30} color="#b366ff" />
        </TouchableOpacity>

        {/* CONTENT */}
        <View style={styles.contentContainer}>

          {/* App Icon + Branding */}
          <View style={styles.brandHeader}>
            <Ionicons name="cube-outline" size={64} color="#b366ff" />
            <Text style={styles.brandTitle}>INNOVATE GUJARAT</Text>
            <Text style={styles.brandSubtitle}>
              Unified Platform for Research, Innovation & IPR
            </Text>
          </View>

          {/* FORM AREA */}
          <View style={styles.inputCard}>

            {/* Title */}
            <Text style={styles.loginTitle}>Login to Your Account</Text>

            {/* EMAIL */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={22} color="#999" style={styles.inputIcon} />
              <TextInput
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                mode="flat"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                placeholderTextColor="#999"
                theme={{
                  colors: { text: '#fff', placeholder: '#999', primary: 'transparent' }
                }}
              />
            </View>

            {/* PASSWORD */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={22} color="#999" style={styles.inputIcon} />
              
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                mode="flat"
                secureTextEntry={!showPassword}
                style={styles.input}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                placeholderTextColor="#999"
                theme={{
                  colors: { text: '#fff', placeholder: '#999', primary: 'transparent' }
                }}
              />

              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={22} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>

            {/* REMEMBER ME */}
            <TouchableOpacity 
              style={styles.rememberContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <Checkbox
                status={rememberMe ? 'checked' : 'unchecked'}
                onPress={() => setRememberMe(!rememberMe)}
                color="#b366ff"
                uncheckedColor="#666"
              />
              <Text style={styles.rememberText}>Remember for 30 days</Text>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* LOGIN BUTTON */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#b366ff', '#8b3dc7', '#6a2c96']}
                style={styles.buttonGradient}
              >
                <Text style={styles.loginText}>{loading ? 'Logging In...' : 'LOGIN'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signUpText}> Sign Up</Text>
            </TouchableOpacity>
          </View>

        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    padding: 8,
    zIndex: 10,
  },

  contentContainer: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: height > 700 ? 120 : 90,
    justifyContent: 'space-between',
  },

  brandHeader: {
    alignItems: 'center',
    marginBottom: 35,
  },

  brandTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#b366ff',
    letterSpacing: 1,
    marginTop: 10,
  },

  brandSubtitle: {
    fontSize: 14,
    color: '#ddd',
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'center',
  },

  loginTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 25,
    textAlign: 'center',
  },

  inputCard: { marginBottom: 10 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 15,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: 15,
  },

  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  rememberText: {
    color: '#fff',
    fontSize: 13,
  },

  forgotPassword: {
    color: '#b366ff',
    textAlign: 'right',
    marginBottom: 25,
    textDecorationLine: 'underline',
  },

  loginButton: {
    height: 55,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#b366ff',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },

  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
  },

  footerText: {
    color: '#bbb',
    fontSize: 14,
  },

  signUpText: {
    color: '#b366ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
