// AppNavigator.js (fixed)

// Funding screens
import FundingApplicationTrackerScreen from '../screens/FundingApplicationTrackerScreen';
import FundingOpportunitiesScreen from '../screens/FundingOpportunitiesScreen';
import '../config/firebaseConfig';

// React / Navigation
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useWindowDimensions, View, ActivityIndicator } from 'react-native';

// Contexts / components
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import DesktopLayoutWrapper from '../components/DesktopLayoutWrapper'; // adjust path if needed
// import Sidebar if used elsewhere
import Sidebar from '../components/Sidebar';

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StartupNewsScreen from '../screens/StartupNewsScreen';
import UnifiedAnnouncements from '../screens/UnifiedAnnouncements';

// Research
import ResearchListScreen from '../screens/Research/ResearchListScreen';
import ResearchDetailScreen from '../screens/Research/ResearchDetailScreen';
import AddResearchScreen from '../screens/Research/AddResearchScreen';

// IPR
import IPRListScreen from '../screens/IPR/IPRListScreen';
import IPRDetailScreen from '../screens/IPR/IPRDetailScreen';
import AddIPRScreen from '../screens/IPR/AddIPRScreen';
import IPRTrackingScreen from '../screens/IPR/IPRTrackingScreen';
import GovernmentIPRScreen from '../screens/IPR/GovernmentIPRScreen';

// Innovation
import InnovationListScreen from '../screens/Innovation/InnovationListScreen';
import InnovationDetailScreen from '../screens/Innovation/InnovationDetailScreen';
import AddInnovationScreen from '../screens/Innovation/AddInnovationScreen';

// Startup
import StartupListScreen from '../screens/Startup/StartupListScreen';
import StartupDetailScreen from '../screens/Startup/StartupDetailScreen';
import RegisterStartupScreen from '../screens/Startup/RegisterStartupScreen';

// Funding
import FundingScreen from '../screens/FundingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

/* ----------------------
   Auth stack
   ---------------------- */
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

/* ----------------------
   Research stack
   ---------------------- */
function ResearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ResearchList" component={ResearchListScreen} />
      <Stack.Screen name="ResearchDetail" component={ResearchDetailScreen} />
      <Stack.Screen name="AddResearch" component={AddResearchScreen} />
    </Stack.Navigator>
  );
}

/* ----------------------
   IPR stacks
   ---------------------- */
function IPRStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="IPRList" component={IPRListScreen} />
      <Stack.Screen name="IPRDetail" component={IPRDetailScreen} />
      <Stack.Screen name="AddIPR" component={AddIPRScreen} />
      <Stack.Screen name="IPRTracking" component={IPRTrackingScreen} />
    </Stack.Navigator>
  );
}

function GovernmentIPRStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GovernmentIPRList" component={GovernmentIPRScreen} />
      <Stack.Screen name="IPRDetail" component={IPRDetailScreen} />
      <Stack.Screen name="IPRTracking" component={IPRTrackingScreen} />
    </Stack.Navigator>
  );
}

/* ----------------------
   Innovation stack
   ---------------------- */
function InnovationStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InnovationList" component={InnovationListScreen} />
      <Stack.Screen name="InnovationDetail" component={InnovationDetailScreen} />
      <Stack.Screen name="AddInnovation" component={AddInnovationScreen} />
    </Stack.Navigator>
  );
}

/* ----------------------
   Startup stack
   ---------------------- */
function StartupStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StartupList" component={StartupListScreen} />
      <Stack.Screen name="StartupDetail" component={StartupDetailScreen} />
      <Stack.Screen name="RegisterStartup" component={RegisterStartupScreen} />
    </Stack.Navigator>
  );
}

/* ----------------------
   Main tab navigator (fixed)
   ---------------------- */
function MainTabs() {
  const { userProfile, hasPermission } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Build tab screens deterministically
  const tabScreens = [];

  // Always: Dashboard
  tabScreens.push({
    name: 'Dashboard',
    component: DashboardScreen,
    icon: 'home',
    label: 'Dashboard',
  });

  // Research
  if (hasPermission('view_research') || hasPermission('submit_research')) {
    tabScreens.push({
      name: 'Research',
      component: ResearchStack,
      icon: 'flask',
      label: 'Research',
    });
  }

  // IPR: government vs regular
  if (userProfile?.role === 'government_official') {
    tabScreens.push({
      name: 'IPRManagement',
      component: GovernmentIPRStack,
      icon: 'shield-checkmark',
      label: 'IPR Management',
    });
  } else if (hasPermission('view_opportunities') || hasPermission('manage_profile') || hasPermission('view_ipr')) {
    // fallback to normal IPR stack if appropriate
    tabScreens.push({
      name: 'IPR',
      component: IPRStack,
      icon: 'shield-checkmark',
      label: 'IPR',
    });
  }

  // Innovation
  if (hasPermission('view_opportunities') || hasPermission('submit_startup')) {
    tabScreens.push({
      name: 'Innovation',
      component: InnovationStack,
      icon: 'bulb',
      label: 'Innovation',
    });
  }

  // Startups
  if (hasPermission('view_startups') || hasPermission('submit_startup')) {
    tabScreens.push({
      name: 'Startups',
      component: StartupStack,
      icon: 'rocket',
      label: 'Start-ups',
    });
  }

  // Funding related tabs (appear for most users)
  tabScreens.push({
    name: 'Funding',
    component: FundingScreen,
    icon: 'cash',
    label: 'Funding',
  });
  tabScreens.push({
    name: 'FundingOpportunities',
    component: FundingOpportunitiesScreen,
    icon: 'gift',
    label: 'Opportunities',
  });
  tabScreens.push({
    name: 'FundingTracker',
    component: FundingApplicationTrackerScreen,
    icon: 'clipboard',
    label: 'Tracker',
  });
  tabScreens.push({
    name: 'StartupNews',
    component: StartupNewsScreen,
    icon: 'newspaper',
    label: 'Startup News',
  });
  tabScreens.push({
    name: 'Announcements',
    component: UnifiedAnnouncements,
    icon: 'megaphone',
    label: 'Announcements',
  });

  // If desktop we might hide tab bar (you already do this elsewhere)
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const screen = tabScreens.find((s) => s.name === route.name) || {};
        return {
          tabBarIcon: ({ color, size }) => <Ionicons name={screen.icon || 'ellipse'} size={size} color={color} />,
          tabBarActiveTintColor: theme?.colors?.primary,
          tabBarInactiveTintColor: theme?.colors?.textSecondary,
          tabBarStyle: isDesktop
            ? { display: 'none' }
            : {
                backgroundColor: theme?.colors?.surface,
                borderTopColor: theme?.colors?.border,
              },
          headerShown: false,
        };
      }}
    >
      {tabScreens.map((s) => (
        <Tab.Screen key={s.name} name={s.name} component={s.component} options={{ tabBarLabel: s.label }} />
      ))}
    </Tab.Navigator>
  );
}

/* ----------------------
   Main Drawer (mobile) and Desktop stack wrapper
   ---------------------- */
function MainDrawer() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Desktop: use Stack & DesktopLayoutWrapper to show sidebar + content
  if (isDesktop) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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

        <Stack.Screen name="Funding">
          {(props) => (
            <DesktopLayoutWrapper {...props}>
              <FundingScreen {...props} />
            </DesktopLayoutWrapper>
          )}
        </Stack.Screen>

        <Stack.Screen name="FundingOpportunities">
          {(props) => (
            <DesktopLayoutWrapper {...props}>
              <FundingOpportunitiesScreen {...props} />
            </DesktopLayoutWrapper>
          )}
        </Stack.Screen>

        <Stack.Screen name="FundingTracker">
          {(props) => (
            <DesktopLayoutWrapper {...props}>
              <FundingApplicationTrackerScreen {...props} />
            </DesktopLayoutWrapper>
          )}
        </Stack.Screen>

        <Stack.Screen name="StartupNews">
          {(props) => (
            <DesktopLayoutWrapper {...props}>
              <StartupNewsScreen {...props} />
            </DesktopLayoutWrapper>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  // Mobile Drawer
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: theme?.colors?.primary,
        drawerInactiveTintColor: theme?.colors?.textSecondary,
        drawerStyle: { backgroundColor: theme?.colors?.surface },
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={MainTabs}
        options={{
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Funding"
        component={FundingScreen}
        options={{
          drawerIcon: ({ color }) => <Ionicons name="cash" size={22} color={color} />,
          drawerLabel: 'Funding',
        }}
      />
      <Drawer.Screen
        name="FundingOpportunities"
        component={FundingOpportunitiesScreen}
        options={{
          drawerIcon: ({ color }) => <Ionicons name="gift" size={22} color={color} />,
          drawerLabel: 'Opportunities',
        }}
      />
      <Drawer.Screen
        name="FundingTracker"
        component={FundingApplicationTrackerScreen}
        options={{
          drawerIcon: ({ color }) => <Ionicons name="clipboard" size={22} color={color} />,
          drawerLabel: 'Tracker',
        }}
      />
      <Drawer.Screen
        name="StartupNews"
        component={StartupNewsScreen}
        options={{
          drawerIcon: ({ color }) => <Ionicons name="newspaper" size={22} color={color} />,
          drawerLabel: 'Startup News',
        }}
      />
      <Drawer.Screen
        name="Announcements"
        component={UnifiedAnnouncements}
        options={{
          drawerIcon: ({ color }) => <Ionicons name="megaphone" size={22} color={color} />,
          drawerLabel: 'Announcements',
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}

/* ----------------------
   Root navigator
   ---------------------- */
function RootNavigator() {
  const { currentUser, loading } = useAuth();
  const { theme, isDarkMode, isLoading: themeLoading } = useTheme();

  if (loading || themeLoading || !theme) {
    // simple loading indicator while contexts initialize
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
      {currentUser ? <MainDrawer /> : <AuthStack />}
    </NavigationContainer>
  );
}

/* ----------------------
   Exported navigator with providers
   ---------------------- */
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
