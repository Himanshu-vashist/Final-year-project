import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Platform, Dimensions, TouchableOpacity, Linking, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LocalBusinessDataScreen({ navigation }) {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://local-business-data.p.rapidapi.com/area-search-by-bounding-box?query=pizza&bottom_left=40.606549%2C-74.013892&top_right=40.691987%2C-73.904029&limit=20&language=en&region=us&extract_emails_and_contacts=false', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'local-business-data.p.rapidapi.com',
          'x-rapidapi-key': 'a7301d4997msh19167ea7c00162dp188d11jsne14adad6fd94',
        },
      });
      const result = await response.json();
      if (result.status === 'OK' && result.data) {
        setBusinesses(result.data);
      } else {
        setError('Failed to fetch valid data. Response status: ' + result.status);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const renderBusinessCard = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.businessName}>{item.name}</Text>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" color="#FFD700" size={14} />
              <Text style={styles.ratingText}>{item.rating} ({item.review_count || 0})</Text>
            </View>
          )}
        </View>

        {item.about?.summary && <Text style={styles.summary} numberOfLines={2}>{item.about.summary}</Text>}

        <View style={styles.infoRow}>
          <Ionicons name="location" color="#b3b3ff" size={16} />
          <Text style={styles.infoText} numberOfLines={1}>{item.full_address}</Text>
        </View>

        {item.phone_number && (
          <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${item.phone_number}`)}>
            <Ionicons name="call" color="#b3b3ff" size={16} />
            <Text style={[styles.infoText, { color: '#66ccff' }]}>{item.phone_number}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.tagContainer}>
          {item.price_level && (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{item.price_level}</Text>
            </View>
          )}
          {item.business_status && (
            <View style={[styles.tagBadge, { backgroundColor: item.business_status === 'OPEN' ? 'rgba(40,200,120,0.15)' : 'rgba(255,80,80,0.15)' }]}>
              <Text style={[styles.tagText, { color: item.business_status === 'OPEN' ? '#28C878' : '#FF5050' }]}>{item.business_status}</Text>
            </View>
          )}
          {item.type && (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{item.type}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f1226', '#171735']} style={styles.screen}>
         <View style={styles.center}>
           <ActivityIndicator size="large" color="#b366ff" />
           <Text style={{color: '#fff', marginTop: 12}}>Fetching local businesses...</Text>
         </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#0f1226', '#171735']} style={styles.screen}>
         <View style={styles.center}>
           <Ionicons name="warning-outline" size={48} color="#ff5252" style={{marginBottom: 12}} />
           <Text style={styles.errorText}>{error}</Text>
           <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
             <Text style={styles.retryBtnText}>Ready to Retry?</Text>
           </TouchableOpacity>
         </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f1226', '#171735']} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="business" size={24} color="#fff" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Local Businesses</Text>
          <Text style={styles.headerSubtitle}>Discover places around the area</Text>
        </View>
      </View>
      
      <FlatList
        data={businesses}
        keyExtractor={(item) => item.business_id || item.google_id || item._id}
        renderItem={renderBusinessCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 36,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(179,102,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#cfcfe6',
    fontSize: 13,
    marginTop: 2,
  },
  listContent: {
    padding: 20,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#36D1DC',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  businessName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  summary: {
    color: '#cfcfe6',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    color: '#a0a0b0',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(179,102,255,0.15)',
    borderRadius: 8,
  },
  tagText: {
    color: '#b3b3ff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  errorText: {
    color: '#ff5252',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(179,102,255,0.2)',
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
  }
});
