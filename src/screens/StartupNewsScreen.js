import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StartupNewsScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  const fetchNews = () => {
    setLoading(true);
    fetch("https://newsdata.io/api/1/latest?apikey=pub_a3e764fb63134ff2a740166907409b20&q=startup&country=in&language=en")
      .then(response => response.json())
      .then(data => {
        setData(data);
        setLoading(false);
        setFiltered(data.results || []);
      })
      .catch(error => {
        console.error('Error:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    if (!data || !data.results) return;
    if (!search.trim()) {
      setFiltered(data.results);
    } else {
      const s = search.toLowerCase();
      setFiltered(
        data.results.filter(
          item =>
            (item.title && item.title.toLowerCase().includes(s)) ||
            (item.description && item.description.toLowerCase().includes(s)) ||
            (item.source_id && item.source_id.toLowerCase().includes(s))
        )
      );
    }
  }, [search, data]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNews();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#b366ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Startup News</Text>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color="#b366ff" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search news..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
          <Ionicons name={refreshing ? 'refresh-circle' : 'refresh'} size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Text style={styles.noResults}>No news found.</Text>
        ) : (
          filtered.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.modernCard}
              activeOpacity={0.85}
              onPress={() => {
                setSelectedNews(item);
                setModalVisible(true);
              }}
            >
              <View style={styles.cardHeaderRow}>
                <Ionicons name="newspaper-outline" size={24} color="#b366ff" style={{ marginRight: 8 }} />
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              </View>
              <Text style={styles.cardDate}>{item.pubDate}</Text>
              <Text style={styles.cardSummary} numberOfLines={3}>{item.description}</Text>
              {item.source_id && (
                <View style={styles.cardSourceRow}>
                  <Ionicons name="globe-outline" size={16} color="#b366ff" style={{ marginRight: 4 }} />
                  <Text style={styles.cardSource}>{item.source_id}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      {/* News Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Ionicons name="newspaper-outline" size={28} color="#b366ff" style={{ marginRight: 10 }} />
              <Text style={styles.modalTitle}>{selectedNews?.title}</Text>
            </View>
            <Text style={styles.modalDate}>{selectedNews?.pubDate}</Text>
            <ScrollView style={{ maxHeight: 220 }}>
              <Text style={styles.modalDesc}>{selectedNews?.description}</Text>
            </ScrollView>
            {selectedNews?.link && (
              <Text style={styles.modalLink} onPress={() => {
                if (selectedNews.link) {
                  import('react-native').then(({ Linking }) => {
                    Linking.openURL(selectedNews.link);
                  });
                }
              }}>
                <Ionicons name="link-outline" size={16} color="#b366ff" /> Read Full Article
              </Text>
            )}
            <Pressable style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#22224a',
      borderRadius: 16,
      padding: 22,
      width: '85%',
      elevation: 8,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 8,
    },
    modalDate: {
      fontSize: 13,
      color: '#b366ff',
      marginBottom: 10,
    },
    modalDesc: {
      fontSize: 14,
      color: '#ccc',
      marginBottom: 12,
    },
    modalLink: {
      color: '#b366ff',
      fontWeight: 'bold',
      fontSize: 15,
      marginBottom: 18,
      textDecorationLine: 'underline',
    },
    closeBtn: {
      backgroundColor: '#b366ff',
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    closeBtnText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 15,
    },
  container: { flex: 1, backgroundColor: '#1a1a3e', padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    marginRight: 8,
  },
  refreshBtn: {
    backgroundColor: '#b366ff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  refreshText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noResults: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
  },
  modernCard: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderLeftWidth: 5,
    borderLeftColor: '#b366ff',
    elevation: 4,
    shadowColor: '#b366ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  cardDate: {
    fontSize: 13,
    color: '#b366ff',
    marginBottom: 6,
  },
  cardSummary: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  cardSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardSource: {
    fontSize: 13,
    color: '#b366ff',
  },
    modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
