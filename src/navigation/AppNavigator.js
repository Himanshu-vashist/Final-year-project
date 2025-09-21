// Import Firebase config
import '../config/firebaseConfig';

// React Navigation setup
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

// Import context
import { AuthProvider, useAuth } from '../context/AuthContext';

// Import screens
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

// Auth Stack (Login & SignUp)
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

// Research Stack
function ResearchStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ResearchList" 
        component={ResearchListScreen}
        options={{ title: 'Research Projects' }}
      />
      <Stack.Screen 
        name="ResearchDetail" 
        component={ResearchDetailScreen}
        options={{ title: 'Research Details' }}
      />
      <Stack.Screen 
        name="AddResearch" 
        component={AddResearchScreen}
        options={{ title: 'Add Research Project' }}
      />
    </Stack.Navigator>
  );
}

// IPR Stack
function IPRStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="IPRList" 
        component={IPRListScreen}
        options={{ title: 'IPR Applications' }}
      />
      <Stack.Screen 
        name="IPRDetail" 
        component={IPRDetailScreen}
        options={{ title: 'IPR Details' }}
      />
      <Stack.Screen 
        name="AddIPR" 
        component={AddIPRScreen}
        options={{ title: 'Submit IPR Application' }}
      />
    </Stack.Navigator>
  );
}

// Innovation Stack
function InnovationStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="InnovationList" 
        component={InnovationListScreen}
        options={{ title: 'Innovation Hub' }}
      />
      <Stack.Screen 
        name="InnovationDetail" 
        component={InnovationDetailScreen}
        options={{ title: 'Innovation Details' }}
      />
      <Stack.Screen 
        name="AddInnovation" 
        component={AddInnovationScreen}
        options={{ title: 'Submit Innovation' }}
      />
    </Stack.Navigator>
  );
}

// Startup Stack
function StartupStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="StartupList" 
        component={StartupListScreen}
        options={{ title: 'Start-ups' }}
      />
      <Stack.Screen 
        name="StartupDetail" 
        component={StartupDetailScreen}
        options={{ title: 'Start-up Details' }}
      />
      <Stack.Screen 
        name="RegisterStartup" 
        component={RegisterStartupScreen}
        options={{ title: 'Register Start-up' }}
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

    if (hasPermission('view_opportunities') || hasPermission('manage_profile')) {
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

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const screen = getTabScreens().find(s => s.name === route.name);
          return <Ionicons name={screen?.icon} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: 'gray',
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

// Main Drawer Navigator
function MainDrawer() {
  const { hasPermission } = useAuth();

  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: '#667eea',
        headerStyle: {
          backgroundColor: '#667eea',
        },
        headerTintColor: '#fff',
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ 
          title: 'Gujarat Innovation Hub',
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />
        }}
      />
      
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Profile',
          drawerIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />
        }}
      />
    </Drawer.Navigator>
  );
}

// Root Navigator
function RootNavigator() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return null; // You can add a loading screen here
  }

  return (
    <NavigationContainer>
      {currentUser ? <MainDrawer /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}