import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions
} from 'react-native';
import { Searchbar, FAB, Chip, Title } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth, USER_ROLES } from '../../context/AuthContext';
import { StatCard, EmptyState, LoadingCard, StatusBadge } from '../../components/UIComponents';
import { useTheme } from '../../context/ThemeContext';
import moment from 'moment';

const { width } = Dimensions.get('window');

const IPR_TYPES = [
  'All',
  'Patent',
  'Trademark',
  'Copyright',
  'Design',
  'Geographical Indication'
];

const IPR_STATUS = [
  'All',
  'draft',
  'filed',
  'published',
  'examined',
  'granted',
  'rejected',
  'abandoned'
];

const IPR_CATEGORIES = [
  'All',
  'Technology',
  'Pharmaceuticals',
  'Engineering',
  'Software',
  'Biotechnology',
  'Agriculture',
  'Textiles',
  'Manufacturing'
];

export default function IPRListScreen({ navigation }) {
  const { userProfile, hasPermission, isRole } = useAuth();
  const { isDarkMode } = useTheme();
  const [iprApplications, setIprApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stats, setStats] = useState({
    totalApplications: 0,
    granted: 0,
    pending: 0,
    patents: 0
  });
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadIPRApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [iprApplications, searchQuery, selectedType, selectedStatus, selectedCategory]);

  const loadIPRApplications = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
        setLastDoc(null);
        setHasMore(true);
      }

      let q;
      
      // Build query based on user role and permissions
      if (isRole(USER_ROLES.RESEARCHER) || isRole(USER_ROLES.ENTREPRENEUR)) {
        // Show user's own applications and public ones
        q = query(
          collection(db, 'ipr'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
      } else if (hasPermission('view_all_data')) {
        // Government officials see all applications
        q = query(
          collection(db, 'ipr'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
      } else {
        // Public users see only public/granted applications
        q = query(
          collection(db, 'ipr'),
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
      }

      if (isLoadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const applicationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (isLoadMore) {
        setIprApplications(prev => [...prev, ...applicationsData]);
      } else {
        setIprApplications(applicationsData);
        calculateStats(applicationsData);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 10);

    } catch (error) {
      console.error('Error loading IPR applications:', error);
      Alert.alert('Error', 'Failed to load IPR applications. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (applicationsData) => {
    const stats = applicationsData.reduce((acc, app) => {
      acc.totalApplications++;
      if (app.status === 'granted') {
        acc.granted++;
      }
      if (['filed', 'published', 'examined'].includes(app.status)) {
        acc.pending++;
      }
      if (app.type === 'Patent') {
        acc.patents++;
      }
      return acc;
    }, { totalApplications: 0, granted: 0, pending: 0, patents: 0 });
    
    setStats(stats);
  };

  const filterApplications = () => {
    let filtered = iprApplications;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.applicationNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'All') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Filter by status
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredApplications(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIPRApplications();
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadIPRApplications(true);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: '#6C757D',
      filed: '#17A2B8',
      published: '#007BFF',
      examined: '#FFC107',
      granted: '#28A745',
      rejected: '#DC3545',
      abandoned: '#6C757D'
    };
    return colors[status] || '#6C757D';
  };

  const renderIPRCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.iprCard}
      onPress={() => navigation.navigate('IPRDetail', { iprId: item.id })}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              {item.isVerified && (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={styles.verifiedIcon} />
              )}
            </View>
            <View style={styles.badges}>
              <StatusBadge status={item.type} color="#b366ff" />
              <StatusBadge status={item.status} color={getStatusColor(item.status)} />
            </View>
          </View>
        </View>
        
        <Text style={styles.cardDescription} numberOfLines={3}>
          {item.description}
        </Text>
        
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#b366ff" />
            <Text style={styles.applicantName}>{item.applicantName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={16} color="#b366ff" />
            <Text style={styles.organization}>{item.organization || 'N/A'}</Text>
          </View>
          {item.applicationNumber && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={16} color="#b366ff" />
              <Text style={styles.applicationNumber}>{item.applicationNumber}</Text>
            </View>
          )}
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricBox}>
            <Ionicons name="calendar-outline" size={18} color="#b366ff" />
            <Text style={styles.metricValue}>
              {moment(item.filingDate || item.createdAt).format('DD/MM/YY')}
            </Text>
            <Text style={styles.metricLabel}>Filed</Text>
          </View>
          <View style={styles.metricBox}>
            <Ionicons name="folder-outline" size={18} color="#b366ff" />
            <Text style={styles.metricValue}>{item.category}</Text>
            <Text style={styles.metricLabel}>Category</Text>
          </View>
          {item.grantDate && (
            <View style={styles.metricBox}>
              <Ionicons name="trophy-outline" size={18} color="#4CAF50" />
              <Text style={[styles.metricValue, { color: '#4CAF50' }]}>
                {moment(item.grantDate).format('DD/MM/YY')}
              </Text>
              <Text style={styles.metricLabel}>Granted</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {IPR_TYPES.map((type) => (
          <Chip
            key={type}
            mode={selectedType === type ? 'flat' : 'outlined'}
            selected={selectedType === type}
            selectedColor={selectedType === type ? '#fff' : '#b366ff'}
            onPress={() => setSelectedType(type)}
            style={[
              styles.filterChip,
              selectedType === type && styles.filterChipSelected
            ]}
            textStyle={styles.filterChipText}
          >
            {type}
          </Chip>
        ))}
      </ScrollView>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {IPR_STATUS.map((status) => (
          <Chip
            key={status}
            mode={selectedStatus === status ? 'flat' : 'outlined'}
            selected={selectedStatus === status}
            selectedColor={selectedStatus === status ? '#fff' : '#b366ff'}
            onPress={() => setSelectedStatus(status)}
            style={[
              styles.filterChip,
              selectedStatus === status && styles.filterChipSelected
            ]}
            textStyle={styles.filterChipText}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Chip>
        ))}
      </ScrollView>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {IPR_CATEGORIES.map((category) => (
          <Chip
            key={category}
            mode={selectedCategory === category ? 'flat' : 'outlined'}
            selected={selectedCategory === category}
            selectedColor={selectedCategory === category ? '#fff' : '#b366ff'}
            onPress={() => setSelectedCategory(category)}
            style={[
              styles.filterChip,
              selectedCategory === category && styles.filterChipSelected
            ]}
            textStyle={styles.filterChipText}
          >
            {category}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

  if (loading && iprApplications.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f1419']}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <Title style={styles.headerTitle}>IPR Applications</Title>
          </View>
          <Searchbar
            placeholder="Search IPR applications..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            iconColor="#b366ff"
            placeholderTextColor="#999"
          />
          {renderFilters()}
          <ScrollView style={styles.loadingContainer}>
            {[...Array(5)].map((_, index) => (
              <LoadingCard key={index} />
            ))}
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f1419']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Title style={styles.headerTitle}>IPR Applications</Title>
          <Text style={styles.resultsCount}>
            {filteredApplications.length} {filteredApplications.length === 1 ? 'result' : 'results'}
          </Text>
        </View>

        <Searchbar
          placeholder="Search IPR applications..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor="#b366ff"
          placeholderTextColor="#999"
        />
        
        {renderFilters()}
        
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#b366ff"
              colors={['#b366ff']}
            />
          }
          onMomentumScrollEnd={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
            if (isCloseToBottom) {
              loadMore();
            }
          }}
        >
          {/* Summary Stats */}
          <View style={styles.statsContainer}>
            <StatCard
              title="Total"
              value={stats.totalApplications.toString()}
              icon="shield-checkmark-outline"
            />
            <StatCard
              title="Granted"
              value={stats.granted.toString()}
              icon="checkmark-circle-outline"
            />
            <StatCard
              title="Pending"
              value={stats.pending.toString()}
              icon="time-outline"
            />
            <StatCard
              title="Patents"
              value={stats.patents.toString()}
              icon="document-text-outline"
            />
          </View>

          {filteredApplications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark-outline" size={80} color="#666" />
              <Text style={styles.emptyText}>No IPR Applications Found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 
                  "No applications match your search criteria. Try adjusting your filters." :
                  "No IPR applications available. Be the first to submit an application!"
                }
              </Text>
            </View>
          ) : (
            <>
              {filteredApplications.map(renderIPRCard)}
              
              {loading && hasMore && (
                <View style={styles.loadMoreContainer}>
                  <LoadingCard />
                </View>
              )}
              
              {hasMore && !loading && (
                <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
                  <Text style={styles.loadMoreText}>Load More</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>

        {(userProfile?.role === USER_ROLES.ENTREPRENEUR || userProfile?.role === USER_ROLES.RESEARCHER || hasPermission('submit_ipr')) && (
          <FAB
            style={styles.fab}
            icon="plus"
            color="#fff"
            onPress={() => navigation.navigate('AddIPR')}
          />
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1419',
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  resultsCount: {
    fontSize: 14,
    color: '#ddd',
  },
  searchbar: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    elevation: 0,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterScroll: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  filterChip: {
    marginRight: 8,
    height: 36,
    backgroundColor: 'rgba(179, 102, 255, 0.15)',
    borderColor: 'rgba(179, 102, 255, 0.3)',
  },
  filterChipSelected: {
    backgroundColor: '#b366ff',
  },
  filterChipText: {
    fontSize: 12,
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  loadingContainer: {
    padding: 20,
  },
  iprCard: {
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#b366ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(179, 102, 255, 0.2)',
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    color: '#fff',
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
    color: '#ccc',
  },
  cardDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  applicantName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  organization: {
    fontSize: 12,
    color: '#ddd',
  },
  applicationNumber: {
    fontSize: 12,
    color: '#b366ff',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    minWidth: '30%',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(179, 102, 255, 0.15)',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 2,
    color: '#fff',
  },
  metricLabel: {
    fontSize: 9,
    textAlign: 'center',
    color: '#ddd',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b366ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  viewDetailsText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  loadMoreContainer: {
    padding: 20,
  },
  loadMoreButton: {
    backgroundColor: '#b366ff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#b366ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loadMoreText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#b366ff',
    elevation: 8,
    shadowColor: '#b366ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});