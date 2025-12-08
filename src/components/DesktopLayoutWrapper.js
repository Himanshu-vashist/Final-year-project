import React from 'react';
import { View } from 'react-native';
import Sidebar from './Sidebar';

// Simple desktop layout wrapper for navigation
// Shows sidebar and main content side by side
const DesktopLayoutWrapper = ({ children, navigation, route }) => {
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <Sidebar navigation={navigation} currentRoute={route?.name} />
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
};

export default DesktopLayoutWrapper;
