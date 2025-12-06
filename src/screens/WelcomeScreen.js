// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   Dimensions
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import { useTheme } from '../context/ThemeContext';

// const { width, height } = Dimensions.get('window');

// export default function WelcomeScreen({ navigation }) {
//   const { theme } = useTheme();

//   return (
//     <LinearGradient
//       colors={['#1a1a3e', '#2d2d5f', '#1a1a3e']}
//       style={styles.container}
//     >
//       {/* World Map Background - Optional */}
//       {/* Uncomment when you add world-map.png to assets folder */}
//       {/* <Image 
//         source={require('../../assets/world-map.png')} 
//         style={styles.worldMap}
//         resizeMode="cover"
//       /> */}

//       {/* Logo and Brand */}
//       <View style={styles.header}>
//         <View style={styles.logoContainer}>
//           <Ionicons name="cube-outline" size={60} color="#b366ff" />
//         </View>
//         {/* <Text style={styles.brandName}>Studio</Text>
//         <Text style={styles.brandSubtitle}>Shodwe</Text> */}
//       </View>

//       {/* Main Content */}
//       <View style={styles.content}>
//         <Text style={styles.welcomeText}>Let's Get</Text>
//         <Text style={styles.startedText}>Started!</Text>
//       </View>

//       {/* Sign In Button */}
//       <TouchableOpacity
//         style={styles.signInButton}
//         onPress={() => navigation.navigate('Login')}
//         activeOpacity={0.8}
//       >
//         <LinearGradient
//           colors={['#b366ff', '#8b3dc7', '#6a2c96']}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 0 }}
//           style={styles.buttonGradient}
//         >
//           <Text style={styles.signInText}>SIGN IN</Text>
//         </LinearGradient>
//       </TouchableOpacity>

//       {/* Social Sign In Options */}
//       {/* <Text style={styles.orText}>OR SIGN IN WITH</Text>
      
//       <View style={styles.socialButtons}>
//         <TouchableOpacity style={styles.socialButton}>
//           <Ionicons name="mail-outline" size={28} color="#fff" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.socialButton}>
//           <Ionicons name="phone-portrait-outline" size={28} color="#fff" />
//         </TouchableOpacity>
//       </View> */}

//       {/* Sign Up Link */}
//       <View style={styles.footer}>
//         <Text style={styles.footerText}>DIDN'T HAVE ACCOUNT?</Text>
//         <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
//           <Text style={styles.signUpText}>SIGN UP NOW</Text>
//         </TouchableOpacity>
//       </View>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingVertical: height > 700 ? 50 : 30,
//     paddingHorizontal: 20,
//   },
//   worldMap: {
//     position: 'absolute',
//     width: width,
//     height: height * 0.5,
//     top: height * 0.25,
//     opacity: 0.15,
//   },
//   header: {
//     alignItems: 'center',
//     marginTop: height > 700 ? 40 : 20,
//   },
//   logoContainer: {
//     marginBottom: height > 700 ? 15 : 10,
//   },
//   brandName: {
//     fontSize: width > 400 ? 36 : 30,
//     fontWeight: 'bold',
//     color: '#fff',
//     letterSpacing: 1,
//   },
//   brandSubtitle: {
//     fontSize: width > 400 ? 36 : 30,
//     fontWeight: 'bold',
//     color: '#fff',
//     letterSpacing: 1,
//   },
//   content: {
//     alignItems: 'center',
//     marginVertical: 20,
//     paddingHorizontal: 20,
//   },
//   welcomeText: {
//     fontSize: width > 400 ? 48 : 38,
//     fontWeight: '300',
//     color: '#fff',
//     letterSpacing: 1,
//     textAlign: 'center',
//   },
//   startedText: {
//     fontSize: width > 400 ? 48 : 38,
//     fontWeight: 'bold',
//     color: '#b366ff',
//     letterSpacing: 1,
//     marginTop: -10,
//     textAlign: 'center',
//   },
//   signInButton: {
//     width: width * 0.85,
//     maxWidth: 400,
//     height: height > 700 ? 60 : 55,
//     borderRadius: 30,
//     overflow: 'hidden',
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
//   signInText: {
//     fontSize: width > 400 ? 18 : 16,
//     fontWeight: 'bold',
//     color: '#fff',
//     letterSpacing: 2,
//   },
//   orText: {
//     fontSize: width > 400 ? 13 : 12,
//     color: '#999',
//     letterSpacing: 1.5,
//     marginTop: 25,
//   },
//   socialButtons: {
//     flexDirection: 'row',
//     gap: 20,
//     marginTop: 15,
//   },
//   socialButton: {
//     width: width > 400 ? 55 : 50,
//     height: width > 400 ? 55 : 50,
//     borderRadius: width > 400 ? 27.5 : 25,
//     backgroundColor: '#b366ff',
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 5,
//   },
//   footer: {
//     alignItems: 'center',
//     marginBottom: height > 700 ? 20 : 15,
//   },
//   footerText: {
//     fontSize: width > 400 ? 13 : 12,
//     color: '#999',
//     letterSpacing: 1,
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   signUpText: {
//     fontSize: width > 400 ? 15 : 14,
//     fontWeight: 'bold',
//     color: '#b366ff',
//     letterSpacing: 1.5,
//     textAlign: 'center',
//   },
// });

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const { theme } = useTheme();

  return (
    <LinearGradient
      colors={['#1a1a3e', '#2d2d5f', '#1a1a3e']}
      style={styles.container}
    >

      {/* LOGO */}
      <View style={styles.header}>
        <Ionicons name="cube-outline" size={60} color="#b366ff" />
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.content}>
        <Text style={styles.appName}>INNOVATE GUJARAT</Text>

        <Text style={styles.tagline}>
          Empowering Research, Innovation, IPR & Start-up Growth Across the State
        </Text>

        {/* <Text style={styles.description}>
          Gujarat continues to lead India in research excellence, technological development,
          and entrepreneurial growth. Yet, critical information on research activities,
          innovation progress, IPR filings, and start-up development remains scattered across
          departments. INNOVATE GUJARAT unifies these systems into a transparent and 
          efficient digital ecosystem to accelerate the state's innovation journey.
        </Text> */}

        {/* FEATURES */}
        <View style={styles.featureBox}>
          <Ionicons name="bulb-outline" size={26} color="#b366ff" />
          <Text style={styles.featureText}>Innovation & Research Tracking</Text>
        </View>

        <View style={styles.featureBox}>
          <Ionicons name="document-lock-outline" size={26} color="#b366ff" />
          <Text style={styles.featureText}>Centralized IPR Filing & Insights</Text>
        </View>

        <View style={styles.featureBox}>
          <Ionicons name="rocket-outline" size={26} color="#b366ff" />
          <Text style={styles.featureText}>Start-up Growth Monitoring</Text>
        </View>
      </View>

      {/* SIGN IN BUTTON */}
      <TouchableOpacity
        style={styles.signInButton}
        onPress={() => navigation.navigate('Login')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#b366ff', '#8b3dc7', '#6a2c96']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <Text style={styles.signInText}>SIGN IN</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* SIGN UP LINK */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>DON'T HAVE AN ACCOUNT?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.signUpText}>SIGN UP NOW</Text>
        </TouchableOpacity>
      </View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: height > 700 ? 50 : 30,
    paddingHorizontal: 20,
  },

  header: {
    marginTop: height > 700 ? 40 : 20,
    alignItems: 'center',
  },

  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    
  },

  appName: {
    fontSize: width > 400 ? 40 : 32,
    fontWeight: 'bold',
    color: '#b366ff',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 10,
  },

  tagline: {
    fontSize: width > 400 ? 16 : 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 15,
    paddingHorizontal: 10,
  },

  description: {
    fontSize: width > 400 ? 14 : 13,
    color: '#ddd',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
    marginBottom: 25,
  },

  featureBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 8,
  },

  featureText: {
    fontSize: width > 400 ? 15 : 14,
    color: '#fff',
    opacity: 0.9,
  },

  signInButton: {
    width: width * 0.85,
    maxWidth: 400,
    height: height > 700 ? 60 : 55,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#b366ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    margin:5,
  },

  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  signInText: {
    fontSize: width > 400 ? 18 : 16,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },

  footer: {
    alignItems: 'center',
    marginBottom: height > 700 ? 20 : 15,
  },

  footerText: {
    fontSize: width > 400 ? 13 : 12,
    color: '#999',
    letterSpacing: 1,
    marginBottom: 8,
  },

  signUpText: {
    fontSize: width > 400 ? 15 : 14,
    fontWeight: 'bold',
    color: '#b366ff',
    letterSpacing: 1.5,
  },
});
