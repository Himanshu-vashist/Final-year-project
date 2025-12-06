import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Sidebar from './Sidebar';

const { width } = Dimensions.get('window');
const isDesktop = width >= 1024;

export default function DesktopLayout({ children, navigation, currentRoute }) {
  if (!isDesktop) {
    return children;
  }

  return (
    <View style={styles.container}>
      <Sidebar navigation={navigation} currentRoute={currentRoute} />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
});
