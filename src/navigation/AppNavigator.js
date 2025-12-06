// Import Firebase config
import '../config/firebaseConfig';

// React Navigation setup
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions, View } from 'react-native';

// Import context
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Import Sidebar
import Sidebar from '../components/Sidebar';

const { width } = Dimensions.get('window');
const isDesktop = width >= 1024;

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Research Management Screens
import ResearchListScreen from '../screens/Research/ResearchListScreen';
import ResearchDetailScreen from '../screens/Research/ResearchDetailScreen';
import AddResearchScreen from '../screens/Research/AddResearchScreen';

// IPR Management Screens
import IPRListScreen from '../screens/IPR/IPRListScreen';
import IPRDetailScreen from '../screens/IPR/IPRDetailScreen';
import AddIPRScreen from '../screens/IPR/AddIPRScreen';
import IPRTrackingScreen from '../screens/IPR/IPRTrackingScreen';
import GovernmentIPRScreen from '../screens/IPR/GovernmentIPRScreen';

// Innovation Hub Screens
import InnovationListScreen from '../screens/Innovation/InnovationListScreen';
import InnovationDetailScreen from '../screens/Innovation/InnovationDetailScreen';
import AddInnovationScreen from '../screens/Innovation/AddInnovationScreen';

// Start-up Ecosystem Screens
import StartupListScreen from '../screens/Startup/StartupListScreen';
import StartupDetailScreen from '../screens/Startup/StartupDetailScreen';
import RegisterStartupScreen from '../screens/Startup/RegisterStartupScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Auth Stack (Welcome, Login & SignUp)
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

// Research Stack
function ResearchStack() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="ResearchList" 
        component={ResearchListScreen}
      />
      <Stack.Screen 
        name="ResearchDetail" 
        component={ResearchDetailScreen}
      />
      <Stack.Screen 
        name="AddResearch" 
        component={AddResearchScreen}
      />
    </Stack.Navigator>
  );
}

// IPR Stack for Regular Users
function IPRStack() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="IPRList" 
        component={IPRListScreen}
      />
      <Stack.Screen 
        name="IPRDetail" 
        component={IPRDetailScreen}
      />
      <Stack.Screen 
        name="AddIPR" 
        component={AddIPRScreen}
      />
      <Stack.Screen
        name="IPRTracking"
        component={IPRTrackingScreen}
      />
    </Stack.Navigator>
  );
}

// Government IPR Management Stack
function GovernmentIPRStack() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="GovernmentIPRList" 
        component={GovernmentIPRScreen}
      />
      <Stack.Screen 
        name="IPRDetail" 
        component={IPRDetailScreen}
      />
      <Stack.Screen
        name="IPRTracking"
        component={IPRTrackingScreen}
      />
    </Stack.Navigator>
  );
}

// Innovation Stack
function InnovationStack() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="InnovationList" 
        component={InnovationListScreen}
      />
      <Stack.Screen 
        name="InnovationDetail" 
        component={InnovationDetailScreen}
      />
      <Stack.Screen 
        name="AddInnovation" 
        component={AddInnovationScreen}
      />
    </Stack.Navigator>
  );
}

// Startup Stack
function StartupStack() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="StartupList" 
        component={StartupListScreen}
      />
      <Stack.Screen 
        name="StartupDetail" 
        component={StartupDetailScreen}
      />
      <Stack.Screen 
        name="RegisterStartup" 
        component={RegisterStartupScreen}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs() {
  const { userProfile, hasPermission } = useAuth();

  const getTabScreens = () => {
    const screens = [
      {
        name: 'Dashboard',
        component: DashboardScreen,
        icon: 'home',
        label: 'Dashboard'
      }
    ];

    // Add screens based on user role and permissions
    if (hasPermission('view_research') || hasPermission('submit_research')) {
      screens.push({
        name: 'Research',
        component: ResearchStack,
        icon: 'flask',
        label: 'Research'
      });
    }

    // Different IPR screens for government officials and regular users
    if (userProfile?.role === 'government_official') {
      screens.push({
        name: 'IPRManagement',
        component: GovernmentIPRStack,
        icon: 'shield-checkmark',
        label: 'IPR Management'
      });
    } else if (hasPermission('view_opportunities') || hasPermission('manage_profile')) {
      screens.push({
        name: 'IPR',
        component: IPRStack,
        icon: 'shield-checkmark',
        label: 'IPR'
      });
    }

    if (hasPermission('view_opportunities') || hasPermission('submit_startup')) {
      screens.push({
        name: 'Innovation',
        component: InnovationStack,
        icon: 'bulb',
        label: 'Innovation'
      });
    }

    if (hasPermission('view_startups') || hasPermission('submit_startup')) {
      screens.push({
        name: 'Startups',
        component: StartupStack,
        icon: 'rocket',
        label: 'Start-ups'
      });
    }

    return screens;
  };

  const { theme, isDarkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const screen = getTabScreens().find(s => s.name === route.name);
          return <Ionicons name={screen?.icon} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: isDesktop ? { display: 'none' } : {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        headerShown: false,
      })}
    >
      {getTabScreens().map((screen) => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={{
            tabBarLabel: screen.label,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

// Desktop Layout Wrapper
function DesktopLayoutWrapper({ children, navigation, route }) {
  if (!isDesktop) {
    return children;
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <Sidebar navigation={navigation} currentRoute={route?.name} />
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
}

// Main Drawer Navigator
function MainDrawer() {
  const { hasPermission } = useAuth();
  const { theme, isDarkMode } = useTheme();

  // For desktop, use Stack Navigator with Sidebar
  if (isDesktop) {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="MainTabs">
          {(props) => (
            <DesktopLayoutWrapper {...props}>
              <MainTabs {...props} />
            </DesktopLayoutWrapper>
          )}
        </Stack.Screen>
        <Stack.Screen name="Profile">
          {(props) => (
            <DesktopLayoutWrapper {...props}>
              <ProfileScreen {...props} />
            </DesktopLayoutWrapper>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  // For mobile, use Drawer Navigator
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary,
        drawerStyle: {
          backgroundColor: theme.colors.surface,
        },
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ 
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />
        }}
      />
      
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          drawerIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />
        }}
      />
    </Drawer.Navigator>
  );
}

// Root Navigator
function RootNavigator() {
  const { currentUser, loading } = useAuth();
  const { theme, isDarkMode, isLoading: themeLoading } = useTheme();
  
  console.log('RootNavigator - Current user:', currentUser ? 'exists' : 'null');
  console.log('RootNavigator - Loading:', loading);
  console.log('RootNavigator - Theme:', theme ? 'loaded' : 'null');

  if (loading || themeLoading || !theme) {
    return null; // You can add a loading screen here
  }

  // Custom navigation theme based on dark mode
  const navigationTheme = {
    dark: isDarkMode,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.primary,
    },
    spacing: theme.spacing,
    fonts: theme.fonts,
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      {currentUser ? (
        console.log('Rendering MainDrawer'),
        <MainDrawer />
      ) : (
        console.log('Rendering AuthStack'),
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

// Wrapper to ensure both Auth and Theme contexts are available
function NavigatorContent() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

export default function AppNavigator() {
  return <NavigatorContent />;
}