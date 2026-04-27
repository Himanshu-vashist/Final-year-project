import React from 'react';
import { View, Platform } from 'react-native';
import Sidebar from './Sidebar';

// Simple desktop layout wrapper for navigation
// Shows sidebar and main content side by side
const DesktopLayoutWrapper = ({ children, navigation, route }) => {
  return (
    <View style={{ 
      flex: 1, 
      flexDirection: 'row', 
      height: Platform.OS === 'web' ? '100vh' : '100%', 
      maxHeight: Platform.OS === 'web' ? '100vh' : '100%',
      overflow: 'hidden' 
    }}>
      <View style={{ height: '100%', overflow: 'hidden' }}>
        <Sidebar navigation={navigation} currentRoute={route?.name} />
      </View>
      <View style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
};

export default DesktopLayoutWrapper;
