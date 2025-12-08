// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   Animated,
//   Dimensions,
//   StatusBar
// } from 'react-native';
// import { TextInput, Button, Card, Title, RadioButton, Surface } from 'react-native-paper';
// import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur';
// import { Ionicons } from '@expo/vector-icons';
// import { useAuth, USER_ROLES } from '../context/AuthContext';

// const ROLE_OPTIONS = [
//   {
//     value: USER_ROLES.GOVERNMENT_OFFICIAL,
//     label: 'Government Official',
//     description: 'Policy makers, administrators, and government employees',
//     icon: 'business-outline'
//   },
//   {
//     value: USER_ROLES.RESEARCHER,
//     label: 'Researcher',
//     description: 'Scientists, academicians, and research professionals',
//     icon: 'flask-outline'
//   },
//   {
//     value: USER_ROLES.ENTREPRENEUR,
//     label: 'Entrepreneur',
//     description: 'Start-up founders and business innovators',
//     icon: 'rocket-outline'
//   },
//   {
//     value: USER_ROLES.INVESTOR,
//     label: 'Investor',
//     description: 'Angel investors, VCs, and funding organizations',
//     icon: 'trending-up-outline'
//   },
//   {
//     value: USER_ROLES.PUBLIC_USER,
//     label: 'Public User',
//     description: 'General public and interested individuals',
//     icon: 'people-outline'
//   }
// ];

// export default function SignUpScreen({ navigation }) {
//   const scrollViewRef = useRef(null);
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     role: '',
//     organization: '',
//     designation: '',
//     phone: ''
//   });
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [showRoleDropdown, setShowRoleDropdown] = useState(false);
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(30)).current;

//   const { signUp } = useAuth();

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 1000,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, []);

//   const updateFormData = (field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   const validateForm = () => {
//     const { name, email, password, confirmPassword, role } = formData;

//     if (!name || !email || !password || !confirmPassword || !role) {
//       Alert.alert('Error', 'Please fill in all required fields');
//       return false;
//     }

//     if (password !== confirmPassword) {
//       Alert.alert('Error', 'Passwords do not match');
//       return false;
//     }

//     if (password.length < 6) {
//       Alert.alert('Error', 'Password must be at least 6 characters long');
//       return false;
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       Alert.alert('Error', 'Please enter a valid email address');
//       return false;
//     }

//     return true;
//   };

//   const handleSignUp = async () => {
//     if (!validateForm()) return;

//     setLoading(true);
//     try {
//       await signUp(formData.email, formData.password, {
//         name: formData.name,
//         role: formData.role,
//         organization: formData.organization,
//         designation: formData.designation,
//         phone: formData.phone
//       });
      
//       Alert.alert(
//         'Success', 
//         'Account created successfully! Please wait for verification.',
//         [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
//       );
//     } catch (error) {
//       console.error('Sign up error:', error);
//       Alert.alert('Sign Up Failed', error.message || 'Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const selectedRole = ROLE_OPTIONS.find(option => option.value === formData.role);

//   return (
//     <KeyboardAvoidingView 
//       style={styles.container} 
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
//     >
//       <StatusBar barStyle="light-content" />
//       <LinearGradient
//         colors={['#1a1a3e', '#2d2d5f', '#1a1a3e']}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//         style={styles.gradient}
//       >
//         {/* World Map Background - Optional */}
//         {/* <Image 
//           source={require('../../assets/world-map.png')} 
//           style={styles.worldMap}
//           resizeMode="cover"
//         /> */}
        
//         <ScrollView 
//           ref={scrollViewRef}
//           contentContainerStyle={styles.scrollContainer}
//           showsVerticalScrollIndicator={true}
//           bounces={true}
//           keyboardShouldPersistTaps="handled"
//           indicatorStyle="white"
//           persistentScrollbar={true}
//         >
//           {/* Header */}
//           <View style={styles.header}>
//             <TouchableOpacity 
//               style={styles.backButton}
//               onPress={() => navigation.goBack()}
//             >
//               <Ionicons name="chevron-back" size={30} color="#b366ff" />
//             </TouchableOpacity>
//             <Text style={styles.welcomeText}>Create Your</Text>
//             <Text style={styles.accountText}>Account!</Text>
//           </View>

//           {/* Sign Up Card */}
//           <Animated.View style={{
//             opacity: fadeAnim,
//             transform: [{ translateY: slideAnim }],
//             width: '100%',
//           }}>
//             <View style={styles.card}>
//               {/* Basic Information */}
//               <View style={styles.inputContainer}>
//                 <View style={styles.inputIconContainer}>
//                   <Ionicons name="person-outline" size={22} color="#999" />
//                 </View>
//                 <TextInput
//                   placeholder="Full Name *"
//                   value={formData.name}
//                   onChangeText={(value) => updateFormData('name', value)}
//                   mode="flat"
//                   style={styles.input}
//                   underlineColor="transparent"
//                   activeUnderlineColor="transparent"
//                   placeholderTextColor="#999"
//                   theme={{ colors: { primary: 'transparent', text: '#fff' } }}
//                 />
//               </View>

//               <View style={styles.inputContainer}>
//                 <View style={styles.inputIconContainer}>
//                   <Ionicons name="mail-outline" size={22} color="#999" />
//                 </View>
//                 <TextInput
//                   placeholder="Email Address *"
//                   value={formData.email}
//                   onChangeText={(value) => updateFormData('email', value)}
//                   mode="flat"
//                   style={styles.input}
//                   keyboardType="email-address"
//                   autoCapitalize="none"
//                   underlineColor="transparent"
//                   activeUnderlineColor="transparent"
//                   placeholderTextColor="#999"
//                   theme={{ colors: { primary: 'transparent', text: '#fff' } }}
//                 />
//               </View>

//               <View style={styles.inputContainer}>
//                 <View style={styles.inputIconContainer}>
//                   <Ionicons name="lock-closed-outline" size={22} color="#999" />
//                 </View>
//                 <TextInput
//                   placeholder="Password *"
//                   value={formData.password}
//                   onChangeText={(value) => updateFormData('password', value)}
//                   mode="flat"
//                   style={styles.input}
//                   secureTextEntry={!showPassword}
//                   underlineColor="transparent"
//                   activeUnderlineColor="transparent"
//                   placeholderTextColor="#999"
//                   theme={{ colors: { primary: 'transparent', text: '#fff' } }}
//                 />
//                 <TouchableOpacity 
//                   style={styles.eyeIcon}
//                   onPress={() => setShowPassword(!showPassword)}
//                 >
//                   <Ionicons 
//                     name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
//                     size={22} 
//                     color="#999" 
//                   />
//                 </TouchableOpacity>
//               </View>

//               <View style={styles.inputContainer}>
//                 <View style={styles.inputIconContainer}>
//                   <Ionicons name="lock-closed-outline" size={22} color="#999" />
//                 </View>
//                 <TextInput
//                   placeholder="Confirm Password *"
//                   value={formData.confirmPassword}
//                   onChangeText={(value) => updateFormData('confirmPassword', value)}
//                   mode="flat"
//                   style={styles.input}
//                   secureTextEntry={!showConfirmPassword}
//                   underlineColor="transparent"
//                   activeUnderlineColor="transparent"
//                   placeholderTextColor="#999"
//                   theme={{ colors: { primary: 'transparent', text: '#fff' } }}
//                 />
//                 <TouchableOpacity 
//                   style={styles.eyeIcon}
//                   onPress={() => setShowConfirmPassword(!showConfirmPassword)}
//                 >
//                   <Ionicons 
//                     name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
//                     size={22} 
//                     color="#999" 
//                   />
//                 </TouchableOpacity>
//               </View>

//               {/* Role Selection */}
//               <View style={styles.dropdownContainer}>
//                 <Text style={styles.sectionTitle}>Select Your Role *</Text>
//                 <TouchableOpacity 
//                   style={styles.dropdownButton}
//                   onPress={() => setShowRoleDropdown(!showRoleDropdown)}
//                 >
//                   <View style={styles.dropdownButtonContent}>
//                     <Ionicons name="briefcase-outline" size={22} color="#999" />
//                     <Text style={selectedRole ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
//                       {selectedRole ? selectedRole.label : 'Choose your role'}
//                     </Text>
//                     <Ionicons 
//                       name={showRoleDropdown ? "chevron-up" : "chevron-down"} 
//                       size={22} 
//                       color="#999"
//                     />
//                   </View>
//                 </TouchableOpacity>
                
//                 {showRoleDropdown && (
//                   <View style={styles.dropdownList}>
//                     {ROLE_OPTIONS.map((role) => (
//                       <TouchableOpacity
//                         key={role.value}
//                         style={[
//                           styles.dropdownItem,
//                           formData.role === role.value && styles.dropdownItemSelected
//                         ]}
//                         onPress={() => {
//                           updateFormData('role', role.value);
//                           setShowRoleDropdown(false);
//                         }}
//                       >
//                         <View style={styles.dropdownItemContent}>
//                           <Ionicons 
//                             name={role.icon} 
//                             size={20} 
//                             color={formData.role === role.value ? '#b366ff' : '#999'} 
//                           />
//                           <View style={styles.dropdownItemText}>
//                             <Text style={[
//                               styles.dropdownItemLabel,
//                               formData.role === role.value && styles.dropdownItemLabelSelected
//                             ]}>
//                               {role.label}
//                             </Text>
//                             <Text style={styles.dropdownItemDescription}>
//                               {role.description}
//                             </Text>
//                           </View>
//                         </View>
//                       </TouchableOpacity>
//                     ))}
//                   </View>
//                 )}
//               </View>

//               {/* Additional Information */}
//               <View style={styles.inputContainer}>
//                 <View style={styles.inputIconContainer}>
//                   <Ionicons name="business-outline" size={22} color="#999" />
//                 </View>
//                 <TextInput
//                   placeholder="Organization"
//                   value={formData.organization}
//                   onChangeText={(value) => updateFormData('organization', value)}
//                   mode="flat"
//                   style={styles.input}
//                   underlineColor="transparent"
//                   activeUnderlineColor="transparent"
//                   placeholderTextColor="#999"
//                   theme={{ colors: { primary: 'transparent', text: '#fff' } }}
//                 />
//               </View>

//               <View style={styles.inputContainer}>
//                 <View style={styles.inputIconContainer}>
//                   <Ionicons name="ribbon-outline" size={22} color="#999" />
//                 </View>
//                 <TextInput
//                   placeholder="Designation"
//                   value={formData.designation}
//                   onChangeText={(value) => updateFormData('designation', value)}
//                   mode="flat"
//                   style={styles.input}
//                   underlineColor="transparent"
//                   activeUnderlineColor="transparent"
//                   placeholderTextColor="#999"
//                   theme={{ colors: { primary: 'transparent', text: '#fff' } }}
//                 />
//               </View>

//               <View style={styles.inputContainer}>
//                 <View style={styles.inputIconContainer}>
//                   <Ionicons name="call-outline" size={22} color="#999" />
//                 </View>
//                 <TextInput
//                   placeholder="Phone Number"
//                   value={formData.phone}
//                   onChangeText={(value) => updateFormData('phone', value)}
//                   mode="flat"
//                   style={styles.input}
//                   keyboardType="phone-pad"
//                   underlineColor="transparent"
//                   activeUnderlineColor="transparent"
//                   placeholderTextColor="#999"
//                   theme={{ colors: { primary: 'transparent', text: '#fff' } }}
//                 />
//               </View>

//               <TouchableOpacity
//                 style={styles.signUpButton}
//                 onPress={handleSignUp}
//                 activeOpacity={0.8}
//                 disabled={loading}
//               >
//                 <LinearGradient
//                   colors={['#b366ff', '#8b3dc7', '#6a2c96']}
//                   start={{ x: 0, y: 0 }}
//                   end={{ x: 1, y: 0 }}
//                   style={styles.buttonGradient}
//                 >
//                   <Text style={styles.signUpText}>
//                     {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
//                   </Text>
//                 </LinearGradient>
//               </TouchableOpacity>

//               <View style={styles.loginLink}>
//                 <Text style={styles.linkText}>Already have an account? </Text>
//                 <TouchableOpacity onPress={() => navigation.navigate('Login')}>
//                   <Text style={styles.linkTextBold}>Sign In</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </Animated.View>
//         </ScrollView>
//       </LinearGradient>
//     </KeyboardAvoidingView>
//   );
// }

// const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   gradient: {
//     flex: 1,
//   },
//   worldMap: {
//     position: 'absolute',
//     width: screenWidth,
//     height: screenHeight * 0.4,
//     top: screenHeight * 0.15,
//     opacity: 0.15,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     paddingHorizontal: screenWidth > 400 ? 25 : 20,
//     paddingTop: Platform.OS === 'ios' ? 60 : 50,
//     paddingBottom: 40,
//     minHeight: screenHeight,
//   },
//   header: {
//     marginBottom: screenHeight > 700 ? 40 : 30,
//     position: 'relative',
//   },
//   backButton: {
//     position: 'absolute',
//     left: 0,
//     top: 0,
//     padding: 10,
//     zIndex: 10,
//   },
//   welcomeText: {
//     fontSize: screenWidth > 400 ? 38 : 32,
//     fontWeight: '300',
//     color: '#fff',
//     letterSpacing: 1,
//     textAlign: 'center',
//   },
//   accountText: {
//     fontSize: screenWidth > 400 ? 38 : 32,
//     fontWeight: 'bold',
//     color: '#b366ff',
//     letterSpacing: 1,
//     marginTop: -8,
//     textAlign: 'center',
//   },
//   card: {
//     width: '100%',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 255, 255, 0.08)',
//     borderRadius: 15,
//     marginBottom: screenHeight > 700 ? 18 : 15,
//     paddingHorizontal: 15,
//     height: screenHeight > 700 ? 58 : 55,
//   },
//   inputIconContainer: {
//     marginRight: 10,
//   },
//   input: {
//     flex: 1,
//     backgroundColor: 'transparent',
//     fontSize: screenWidth > 400 ? 16 : 14,
//     color: '#fff',
//   },
//   eyeIcon: {
//     padding: 5,
//   },
//   dropdownContainer: {
//     marginBottom: screenHeight > 700 ? 18 : 15,
//   },
//   sectionTitle: {
//     fontSize: screenWidth > 400 ? 15 : 14,
//     fontWeight: '600',
//     color: '#fff',
//     marginBottom: 12,
//     letterSpacing: 0.5,
//   },
//   dropdownButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.08)',
//     borderRadius: 15,
//     paddingHorizontal: 15,
//     height: screenHeight > 700 ? 58 : 55,
//     justifyContent: 'center',
//   },
//   dropdownButtonContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   dropdownSelectedText: {
//     flex: 1,
//     fontSize: screenWidth > 400 ? 16 : 14,
//     color: '#fff',
//     marginLeft: 10,
//   },
//   dropdownPlaceholder: {
//     flex: 1,
//     fontSize: screenWidth > 400 ? 16 : 14,
//     color: '#999',
//     marginLeft: 10,
//   },
//   dropdownList: {
//     backgroundColor: 'rgba(40, 40, 70, 0.95)',
//     borderRadius: 15,
//     marginTop: 10,
//     overflow: 'hidden',
//     elevation: 8,
//     maxHeight: screenHeight * 0.5,
//   },
//   dropdownItem: {
//     padding: screenHeight > 700 ? 15 : 12,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   dropdownItemSelected: {
//     backgroundColor: 'rgba(179, 102, 255, 0.2)',
//   },
//   dropdownItemContent: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//   },
//   dropdownItemText: {
//     flex: 1,
//     marginLeft: 12,
//   },
//   dropdownItemLabel: {
//     fontSize: screenWidth > 400 ? 16 : 14,
//     fontWeight: '600',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   dropdownItemLabelSelected: {
//     color: '#b366ff',
//   },
//   dropdownItemDescription: {
//     fontSize: screenWidth > 400 ? 13 : 12,
//     color: '#999',
//     lineHeight: 18,
//   },
//   signUpButton: {
//     width: '100%',
//     height: screenHeight > 700 ? 60 : 55,
//     borderRadius: 30,
//     overflow: 'hidden',
//     marginTop: screenHeight > 700 ? 25 : 20,
//     elevation: 8,
//     shadowColor: '#b366ff',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.5,
//     shadowRadius: 8,
//   },
//   buttonGradient: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   signUpText: {
//     fontSize: screenWidth > 400 ? 18 : 16,
//     fontWeight: 'bold',
//     color: '#fff',
//     letterSpacing: 2,
//   },
//   loginLink: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: screenHeight > 700 ? 25 : 20,
//     flexWrap: 'wrap',
//   },
//   linkText: {
//     color: '#999',
//     fontSize: screenWidth > 400 ? 14 : 13,
//   },
//   linkTextBold: {
//     color: '#b366ff',
//     fontSize: screenWidth > 400 ? 14 : 13,
//     fontWeight: 'bold',
//   },
// });
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

const ROLE_OPTIONS = [
  { value: USER_ROLES.GOVERNMENT_OFFICIAL, label: 'Government Official', description: 'Policy makers, administrators, and government employees', icon: 'business-outline' },
  { value: USER_ROLES.RESEARCHER, label: 'Researcher', description: 'Scientists, academicians, and research professionals', icon: 'flask-outline' },
  { value: USER_ROLES.ENTREPRENEUR, label: 'Entrepreneur', description: 'Start-up founders and business innovators', icon: 'rocket-outline' },
  { value: USER_ROLES.INVESTOR, label: 'Investor', description: 'Angel investors, VCs, and funding organizations', icon: 'trending-up-outline' },
  { value: USER_ROLES.PUBLIC_USER, label: 'Public User', description: 'General public and interested individuals', icon: 'people-outline' }
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

  // custom scrolling state
  const [contentHeight, setContentHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const { signUp } = useAuth();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
    ]).start();
  }, []);

  useEffect(() => {
    // Listen for keyboard events so we can add bottom padding and scroll to end
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardOpen(true);
      // give the keyboard a moment to appear then scroll
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 120);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardOpen(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
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

  // enable scroll only when content taller than container
  const scrollEnabled = contentHeight > containerHeight;

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#1a1a3e', '#2d2d5f', '#1a1a3e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >

        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContainer, keyboardOpen ? { paddingBottom: 120 } : {}]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          scrollEnabled={scrollEnabled}
          onContentSizeChange={(w, h) => setContentHeight(h)}
          onLayout={e => setContainerHeight(e.nativeEvent.layout.height)}
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

              {/* Input fields */}
              {[
                { icon: 'person-outline', placeholder: 'Full Name *', key: 'name' },
                { icon: 'mail-outline', placeholder: 'Email Address *', key: 'email', keyboardType: 'email-address' },
              ].map((item, i) => (
                <View key={i} style={styles.inputContainer}>
                  <Ionicons name={item.icon} size={22} color="#999" style={styles.inputIconContainer} />
                  <TextInput
                    placeholder={item.placeholder}
                    value={formData[item.key]}
                    onChangeText={t => updateFormData(item.key, t)}
                    style={styles.input}
                    mode="flat"
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    keyboardType={item.keyboardType || 'default'}
                    placeholderTextColor="#999"
                    theme={{ colors: { text: '#fff' } }}
                    onFocus={() => {
                      // when focusing, ensure scroll if needed
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120);
                    }}
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
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  placeholderTextColor="#999"
                  theme={{ colors: { text: '#fff' } }}
                  onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120)}
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
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  placeholderTextColor="#999"
                  theme={{ colors: { text: '#fff' } }}
                  onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120)}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Role Dropdown */}
              <View style={styles.dropdownContainer}>
                <Text style={styles.sectionTitle}>Select Your Role *</Text>

                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => {
                    setShowRoleDropdown(!showRoleDropdown);
                    // ensure dropdown fits on screen
                    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                  }}
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
                          <Text
                            style={[
                              styles.dropdownItemLabel,
                              formData.role === role.value && styles.dropdownItemLabelSelected
                            ]}
                          >
                            {role.label}
                          </Text>
                          <Text style={styles.dropdownItemDescription}>{role.description}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Additional fields */}
              {[
                { icon: 'business-outline', placeholder: 'Organization', key: 'organization' },
                { icon: 'ribbon-outline', placeholder: 'Designation', key: 'designation' },
                { icon: 'call-outline', placeholder: 'Phone Number', key: 'phone', keyboardType: 'phone-pad' }
              ].map((item, i) => (
                <View key={i} style={styles.inputContainer}>
                  <Ionicons name={item.icon} size={22} color="#999" style={styles.inputIconContainer} />
                  <TextInput
                    placeholder={item.placeholder}
                    value={formData[item.key]}
                    onChangeText={t => updateFormData(item.key, t)}
                    style={styles.input}
                    mode="flat"
                    keyboardType={item.keyboardType || 'default'}
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                    placeholderTextColor="#999"
                    theme={{ colors: { text: '#fff' } }}
                    onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120)}
                  />
                </View>
              ))}

              {/* Sign Up Button */}
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },

  // NOTE: no flexGrow here — content height is measured instead
  scrollContainer: {
    paddingHorizontal: screenWidth > 400 ? 25 : 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 60,   // important for scroll
  },

  header: {
    marginBottom: screenHeight > 700 ? 40 : 30,
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
    height: 55
  },
  inputIconContainer: { marginRight: 10 },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#fff'
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
    maxHeight: screenHeight * 0.5
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
    marginTop: 25,
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
  linkText: { color: '#999', fontSize: 14 },
  linkTextBold: { color: '#b366ff', fontSize: 14, fontWeight: 'bold' }
});
