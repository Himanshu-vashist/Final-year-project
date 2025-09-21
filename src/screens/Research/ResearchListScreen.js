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

const RESEARCH_CATEGORIES = [
  'All',
  'Agriculture',
  'Technology',
  'Healthcare',
  'Education',
  'Environment',
  'Manufacturing',
  'Energy',
  'Transportation'
];

const RESEARCH_STATUS = [
  'All',
  'ongoing',
  'completed',
  'paused',
  'cancelled'
];

export default function ResearchListScreen({ navigation }) {
  const { userProfile, hasPermission, isRole } = useAuth();
  const [research, setResearch] = useState([]);
  const [filteredResearch, setFilteredResearch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadResearch();
  }, []);

  useEffect(() => {
    filterResearch();
  }, [research, searchQuery, selectedCategory, selectedStatus]);

  const loadResearch = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
        setLastDoc(null);
        setHasMore(true);
      }

      let q;
      
      // Build query based on user role and permissions
      if (isRole(USER_ROLES.RESEARCHER)) {
        // Show researcher's own projects and public ones
        q = query(
          collection(db, 'research'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
      } else if (hasPermission('view_all_data')) {
        // Government officials see all research
        q = query(
          collection(db, 'research'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
      } else {
        // Public users see only public research
        q = query(
          collection(db, 'research'),
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
      }

      if (isLoadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const researchData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (isLoadMore) {
        setResearch(prev => [...prev, ...researchData]);
      } else {
        setResearch(researchData);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 10);

    } catch (error) {
      console.error('Error loading research:', error);
      Alert.alert('Error', 'Failed to load research projects. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterResearch = () => {
    let filtered = research;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by status
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    setFilteredResearch(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResearch();
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadResearch(true);
    }
  };

  const renderResearchCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.researchCard}
      onPress={() => navigation.navigate('ResearchDetail', { researchId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <StatusBadge status={item.status} type="research" />
      </View>
      
      <Text style={styles.cardDescription} numberOfLines={3}>
        {item.description}
      </Text>
      
      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="person-outline" size={14} color="#666" />
          <Text style={styles.metaText}>{item.principalInvestigator}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="business-outline" size={14} color="#666" />
          <Text style={styles.metaText}>{item.institution}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.tagContainer}>
          <Chip mode="outlined" compact style={styles.categoryChip}>
            {item.category}
          </Chip>
          {item.tags?.slice(0, 2).map((tag, index) => (
            <Chip key={index} mode="outlined" compact style={styles.tagChip}>
              {tag}
            </Chip>
          ))}
        </View>
        
        <View style={styles.cardActions}>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          {item.fundingAmount && (
            <Text style={styles.fundingText}>
              ₹{(item.fundingAmount / 100000).toFixed(1)}L
            </Text>
          )}
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
        <Text style={styles.filterLabel}>Category:</Text>
        {RESEARCH_CATEGORIES.map((category) => (
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
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <Text style={styles.filterLabel}>Status:</Text>
        {RESEARCH_STATUS.map((status) => (
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
    </View>
  );

  if (loading && research.length === 0) {
    return (
      <View style={styles.container}>
        <Searchbar
          placeholder="Search research projects..."
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
        placeholder="Search research projects..."
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
            title="Total Projects"
            value={research.length.toString()}
            icon="flask-outline"
            color="#4CAF50"
          />
          <StatCard
            title="Ongoing"
            value={research.filter(r => r.status === 'ongoing').length.toString()}
            icon="play-circle-outline"
            color="#2196F3"
          />
          <StatCard
            title="Completed"
            value={research.filter(r => r.status === 'completed').length.toString()}
            icon="checkmark-circle-outline"
            color="#FF9800"
          />
        </View>

        {filteredResearch.length === 0 ? (
          <EmptyState
            icon="flask-outline"
            title="No Research Projects Found"
            description={searchQuery ? 
              "No projects match your search criteria. Try adjusting your filters." :
              "No research projects available. Be the first to submit a project!"
            }
            actionText={hasPermission('submit_research') ? "Submit Research" : null}
            onAction={() => navigation.navigate('AddResearch')}
          />
        ) : (
          <>
            {filteredResearch.map(renderResearchCard)}
            
            {loading && hasMore && (
              <View style={styles.loadMoreContainer}>
                <LoadingCard />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {hasPermission('submit_research') && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => navigation.navigate('AddResearch')}
          label="Add Research"
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
  researchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
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
    marginBottom: 12,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
  },
  categoryChip: {
    marginRight: 6,
    marginBottom: 4,
    height: 24,
  },
  tagChip: {
    marginRight: 6,
    marginBottom: 4,
    height: 24,
  },
  cardActions: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  fundingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 2,
  },
  loadMoreContainer: {
    marginTop: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#667eea',
  },
});