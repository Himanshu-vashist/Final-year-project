import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Searchbar, FAB, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth, USER_ROLES } from '../../context/AuthContext';
import { StatCard, EmptyState, LoadingCard, StatusBadge } from '../../components/UIComponents';
import moment from 'moment';

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
  const [iprApplications, setIprApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
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
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Chip mode="outlined" compact style={styles.typeChip}>
            {item.type}
          </Chip>
        </View>
        <StatusBadge status={item.status} type="ipr" />
      </View>
      
      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="person-outline" size={14} color="#666" />
          <Text style={styles.metaText}>{item.applicantName}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="business-outline" size={14} color="#666" />
          <Text style={styles.metaText}>{item.organization}</Text>
        </View>
      </View>

      {item.applicationNumber && (
        <View style={styles.applicationNumber}>
          <Ionicons name="document-text-outline" size={14} color="#667eea" />
          <Text style={styles.applicationNumberText}>{item.applicationNumber}</Text>
        </View>
      )}
      
      <View style={styles.cardFooter}>
        <View style={styles.cardDates}>
          <Text style={styles.dateText}>
            Filed: {moment(item.filingDate || item.createdAt).format('DD/MM/YYYY')}
          </Text>
          {item.grantDate && (
            <Text style={styles.grantDateText}>
              Granted: {moment(item.grantDate).format('DD/MM/YYYY')}
            </Text>
          )}
        </View>
        
        <View style={styles.cardActions}>
          <Chip mode="outlined" compact style={styles.categoryChip}>
            {item.category}
          </Chip>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <Text style={styles.filterLabel}>Type:</Text>
        {IPR_TYPES.map((type) => (
          <Chip
            key={type}
            mode={selectedType === type ? 'flat' : 'outlined'}
            selected={selectedType === type}
            onPress={() => setSelectedType(type)}
            style={styles.filterChip}
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
        <Text style={styles.filterLabel}>Status:</Text>
        {IPR_STATUS.map((status) => (
          <Chip
            key={status}
            mode={selectedStatus === status ? 'flat' : 'outlined'}
            selected={selectedStatus === status}
            onPress={() => setSelectedStatus(status)}
            style={styles.filterChip}
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
        <Text style={styles.filterLabel}>Category:</Text>
        {IPR_CATEGORIES.map((category) => (
          <Chip
            key={category}
            mode={selectedCategory === category ? 'flat' : 'outlined'}
            selected={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
            style={styles.filterChip}
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
        <Searchbar
          placeholder="Search IPR applications..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        {renderFilters()}
        <ScrollView style={styles.loadingContainer}>
          {[...Array(5)].map((_, index) => (
            <LoadingCard key={index} />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search IPR applications..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      {renderFilters()}
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
            title="Total Applications"
            value={iprApplications.length.toString()}
            icon="shield-checkmark-outline"
            color="#FF9800"
          />
          <StatCard
            title="Granted"
            value={iprApplications.filter(app => app.status === 'granted').length.toString()}
            icon="checkmark-circle-outline"
            color="#4CAF50"
          />
          <StatCard
            title="Pending"
            value={iprApplications.filter(app => ['filed', 'published', 'examined'].includes(app.status)).length.toString()}
            icon="time-outline"
            color="#2196F3"
          />
        </View>

        {filteredApplications.length === 0 ? (
          <EmptyState
            icon="shield-checkmark-outline"
            title="No IPR Applications Found"
            description={searchQuery ? 
              "No applications match your search criteria. Try adjusting your filters." :
              "No IPR applications available. Be the first to submit an application!"
            }
            actionText={hasPermission('submit_ipr') ? "Submit Application" : null}
            onAction={() => navigation.navigate('AddIPR')}
          />
        ) : (
          <>
            {filteredApplications.map(renderIPRCard)}
            
            {loading && hasMore && (
              <View style={styles.loadMoreContainer}>
                <LoadingCard />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {hasPermission('submit_ipr') && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => navigation.navigate('AddIPR')}
          label="Submit IPR"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 16,
    elevation: 2,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  filterChip: {
    marginRight: 8,
    height: 32,
  },
  filterChipText: {
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  loadingContainer: {
    padding: 16,
  },
  iprCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  typeChip: {
    height: 24,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  applicationNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  applicationNumberText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDates: {
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  grantDateText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
  cardActions: {
    alignItems: 'flex-end',
  },
  categoryChip: {
    height: 24,
  },
  loadMoreContainer: {
    marginTop: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF9800',
  },
});