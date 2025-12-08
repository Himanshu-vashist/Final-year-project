// FundingOpportunitiesScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isTablet = width > 600;

const sampleOpportunities = [
  {
    id: '1',
    title: 'Startup India Seed Fund',
    description: 'Funding support for early-stage startups in India.',
    deadline: '2025-12-31',
    eligibility: 'Indian startups less than 2 years old',
    link: 'https://www.startupindia.gov.in/',
  },
  {
    id: '2',
    title: 'DST Young Scientist Scheme',
    description: 'Grants for young researchers in science and technology.',
    deadline: '2026-01-15',
    eligibility: 'Researchers under 35 years',
    link: 'https://dst.gov.in/',
  },
  {
    id: '3',
    title: 'Global Innovation Fund',
    description: 'Funding for innovative solutions to global challenges.',
    deadline: 'Rolling',
    eligibility: 'Startups, NGOs, and researchers worldwide',
    link: 'https://www.globalinnovation.fund/',
  },
];

export default function FundingOpportunitiesScreen() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a short API load
    const t = setTimeout(() => {
      setOpportunities(sampleOpportunities);
      setLoading(false);
    }, 700);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#b366ff" />
      </View>
    );
  }

  const openLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch (err) {
      console.warn('Failed to open link', err);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="ribbon-outline" size={20} color="#b366ff" />
        <Text style={styles.title}>{item.title}</Text>
      </View>
      <Text style={styles.desc}>{item.description}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>Deadline: {item.deadline}</Text>
        <Text style={styles.meta}>Eligibility: {item.eligibility}</Text>
      </View>

      <TouchableOpacity onPress={() => openLink(item.link)} style={styles.linkRow}>
        <Text style={styles.linkText}>{item.link}</Text>
        <Ionicons name="open-outline" size={16} color="#b366ff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Text style={styles.headerTitle}>Funding Opportunities</Text>
      </View>

      <FlatList
        data={opportunities}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1020' },
  headerWrap: {
    paddingTop: isTablet ? 50 : 36,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: isTablet ? 26 : 20 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: isTablet ? 18 : 14,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#b366ff',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  title: { color: '#fff', fontSize: isTablet ? 18 : 16, marginLeft: 8, fontWeight: '700' },
  desc: { color: '#cfcfcf', marginBottom: 10 },

  metaRow: { marginBottom: 8 },
  meta: { color: '#aaa', fontSize: isTablet ? 13 : 12 },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  linkText: { color: '#b366ff', textDecorationLine: 'underline' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1020' },
});
