import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Avatar } from 'react-native-paper';
import { useNavigationState } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const isDesktop = width >= 1024;

export default function Sidebar({ navigation, currentRoute }) {
  const { userProfile, hasPermission, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeRoute, setActiveRoute] = useState(currentRoute || 'Dashboard');
  
  // Get current navigation state
  const navState = useNavigationState(state => state);
  
  useEffect(() => {
    if (currentRoute) {
      setActiveRoute(currentRoute);
    }
  }, [currentRoute]);
  
  useEffect(() => {
    // Update active route based on navigation state
    if (navState) {
      const getCurrentRoute = (state) => {
        if (!state || !state.routes) return null;
        const route = state.routes[state.index];
        if (route.state) {
          return getCurrentRoute(route.state);
        }
        return route.name;
      };
      
      const current = getCurrentRoute(navState);
      if (current) {
        setActiveRoute(current);
      }
    }
  }, [navState]);

  const getNavigationItems = () => {
    const items = [
      {
        name: 'Announcements',
        icon: 'megaphone',
        label: 'Announcements',
        route: 'Announcements',
        screen: 'Announcements',
        show: true
      },
            {
              name: 'StartupNews',
              icon: 'newspaper',
              label: 'Startup News',
              route: 'StartupNews',
              screen: 'StartupNews',
              show: true
            },
      {
        name: 'Dashboard',
        icon: 'home',
        label: 'Dashboard',
        route: 'Dashboard',
        screen: 'Dashboard',
        show: true
      },
      {
        name: 'Research',
        icon: 'flask',
        label: 'Research',
        route: 'Research',
        screen: 'ResearchList',
        show: hasPermission('view_research') || hasPermission('submit_research')
      },
      {
        name: 'IPR',
        icon: 'shield-checkmark',
        label: 'IPR',
        route: userProfile?.role === 'government_official' ? 'IPRManagement' : 'IPR',
        screen: 'IPRList',
        show: hasPermission('view_opportunities') || hasPermission('manage_profile') || userProfile?.role === 'government_official'
      },
      {
        name: 'Innovation',
        icon: 'bulb',
        label: 'Innovation',
        route: 'Innovation',
        screen: 'InnovationList',
        show: hasPermission('view_opportunities') || hasPermission('submit_startup')
      },
      {
        name: 'Startups',
        icon: 'rocket',
        label: 'Start-ups',
        route: 'Startups',
        screen: 'StartupList',
        show: hasPermission('view_startups') || hasPermission('submit_startup')
      },
      {
        name: 'Funding',
        icon: 'cash',
        label: 'Funding',
        route: 'Funding',
        screen: 'Funding',
        show: true
      },
      {
        name: 'FundingOpportunities',
        icon: 'gift',
        label: 'Opportunities',
        route: 'FundingOpportunities',
        screen: 'FundingOpportunities',
        show: true
      },
      {
        name: 'FundingTracker',
        icon: 'clipboard',
        label: 'Tracker',
        route: 'FundingTracker',
        screen: 'FundingTracker',
        show: true
      },
      {
        name: 'Profile',
        icon: 'person',
        label: 'Profile',
        route: 'Profile',
        screen: 'Profile',
        show: true
      }
    ];

    return items.filter(item => item.show);
  };

  const handleNavigation = (item) => {
    setActiveRoute(item.route);
    if (navigation) {
      try {
        // For main tabs (Dashboard), navigate to MainTabs then to the specific screen
        if (item.route === 'Dashboard') {
          navigation.navigate('MainTabs', { screen: 'Dashboard' });
        } else if (item.route === 'Profile') {
          navigation.navigate('Profile');
        } else {
          // For other tabs, navigate to MainTabs with the nested route
          navigation.navigate('MainTabs', { 
            screen: item.route,
            params: { screen: item.screen }
          });
        }
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isDesktop) return null;

  const sidebarWidth = isCollapsed ? 80 : 280;

  return (
    <LinearGradient
      colors={['#1a1a3e', '#2d2d5f']}
      style={[styles.sidebar, { width: sidebarWidth }]}
    >
      <View style={styles.sidebarContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {!isCollapsed && (
              <View style={styles.brandContainer}>
                <LinearGradient
                  colors={['#b366ff', '#8b3dff']}
                  style={styles.brandIconContainer}
                >
                  <Ionicons name="rocket" size={24} color="#fff" />
                </LinearGradient>
                <View style={styles.brandTextContainer}>
                  <Text style={styles.brandTitle}>Innovate Gujarat</Text>
                  <Text style={styles.brandSubtitle}>Innovation Hub</Text>
                </View>
              </View>
            )}
            {isCollapsed && (
              <LinearGradient
                colors={['#b366ff', '#8b3dff']}
                style={styles.brandIconCollapsed}
              >
                <Ionicons name="rocket" size={24} color="#fff" />
              </LinearGradient>
            )}
          </View>
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={() => setIsCollapsed(!isCollapsed)}
          >
            <Ionicons
              name={isCollapsed ? 'chevron-forward' : 'chevron-back'}
              size={20}
              color="#b366ff"
            />
          </TouchableOpacity>
        </View>

        {/* User Profile Section */}
        <View style={styles.userSection}>
          <TouchableOpacity
            style={styles.userProfile}
            onPress={() => handleNavigation('Profile')}
          >
            <Avatar.Text
              size={isCollapsed ? 40 : 50}
              label={userProfile?.name?.charAt(0) || 'U'}
              style={styles.avatar}
            />
            {!isCollapsed && (
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {userProfile?.name || 'User'}
                </Text>
                <Text style={styles.userRole} numberOfLines={1}>
                  {userProfile?.role?.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Navigation Items */}
        <ScrollView
          style={styles.navContainer}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.navSection}>
            {!isCollapsed && <Text style={styles.sectionTitle}>MAIN MENU</Text>}
            {getNavigationItems().map((item, index) => {
              const isActive = activeRoute === item.route || currentRoute === item.route;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.navItem,
                    isActive && styles.navItemActive,
                    isCollapsed && styles.navItemCollapsed
                  ]}
                  onPress={() => handleNavigation(item)}
                  activeOpacity={0.7}
                >
                  {isActive && <View style={styles.activeIndicator} />}
                  <View style={[styles.navIconContainer, isCollapsed && styles.navIconCentered]}>
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={isActive ? '#fff' : '#b3b3ff'}
                    />
                  </View>
                  {!isCollapsed && (
                    <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                      {item.label}
                    </Text>
                  )}
                  {!isCollapsed && isActive && (
                    <Ionicons name="chevron-forward" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Logout Section */}
          <View style={styles.navSection}>
            {!isCollapsed && <Text style={styles.sectionTitle}>ACCOUNT</Text>}
            <TouchableOpacity
              style={[styles.navItem, isCollapsed && styles.navItemCollapsed]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={[styles.navIconContainer, isCollapsed && styles.navIconCentered]}>
                <Ionicons name="log-out" size={22} color="#ff5252" />
              </View>
              {!isCollapsed && <Text style={[styles.navLabel, { color: '#ff5252' }]}>Logout</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer - Optional branding or info */}
        <View style={styles.footer}>
          {!isCollapsed && (
            <Text style={styles.footerText}>© 2025 Innovate Gujarat</Text>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: 'rgba(179, 102, 255, 0.1)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  sidebarContent: {
    flex: 1,
    paddingVertical: 20,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 20,
    marginHorizontal: 8,
  },
  headerContent: {
    marginBottom: 10,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandIconCollapsed: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  brandTextContainer: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#b3b3ff',
    marginTop: 2,
  },
  collapseButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(179, 102, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  userSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
    paddingBottom: 20,
    marginHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(179, 102, 255, 0.1)',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'rgba(179, 102, 255, 0.3)',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 11,
    color: '#b3b3ff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  navContainer: {
    flex: 1,
  },
  navSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 10,
    borderRadius: 12,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: 'rgba(179, 102, 255, 0.15)',
  },
  navItemCollapsed: {
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 4,
    backgroundColor: '#b366ff',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  navIconContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconCentered: {
    width: '100%',
  },
  navLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#b3b3ff',
    marginLeft: 4,
  },
  navLabelActive: {
    color: '#fff',
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(179, 102, 255, 0.1)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
});
