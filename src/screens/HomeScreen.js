import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
   >
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Scroll to explore content</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Getting Started</Text>
          <Text style={styles.cardText}>
            This page is scrollable. Add your home widgets and sections here.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>News & Updates</Text>
          <Text style={styles.cardText}>Coming soon...</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});




