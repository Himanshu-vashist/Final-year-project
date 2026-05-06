import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { Title, Searchbar, Chip, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { StatCard, ActionCard, StatusBadge, LoadingSpinner } from '../../components/UIComponents';

const IDEA_STAGES = [
  { key: 'all', label: 'All Ideas', color: '#333' },
  { key: 'submitted', label: 'Submitted', color: '#2196F3' },
  { key: 'under_review', label: 'Under Review', color: '#FF9800' },
  { key: 'approved', label: 'Approved', color: '#4CAF50' },
  { key: 'in_incubation', label: 'In Incubation', color: '#9C27B0' },
  { key: 'prototype', label: 'Prototype Stage', color: '#607D8B' },
  { key: 'pilot', label: 'Pilot Testing', color: '#795548' },
  { key: 'market_ready', label: 'Market Ready', color: '#4CAF50' },
  { key: 'rejected', label: 'Rejected', color: '#f44336' }
];

const INNOVATION_CATEGORIES = [
  { key: 'all', label: 'All Categories' },
  { key: 'technology', label: 'Technology' },
  { key: 'healthcare', label: 'Healthcare' },
  { key: 'education', label: 'Education' },
  { key: 'agriculture', label: 'Agriculture' },
  { key: 'energy', label: 'Clean Energy' },
  { key: 'fintech', label: 'FinTech' },
  { key: 'social', label: 'Social Innovation' },
  { key: 'environment', label: 'Environment' },
  { key: 'manufacturing', label: 'Manufacturing' },
  { key: 'transportation', label: 'Transportation' }
];

export default function InnovationListScreen({ navigation }) {
  const { userProfile, hasPermission } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [filteredIdeas, setFilteredIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState({
    totalIdeas: 0,
    underReview: 0,
    inIncubation: 0,
    marketReady: 0
  });
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadIdeas();
  }, []);

  useEffect(() => {
    filterIdeas();
  }, [ideas, searchQuery, selectedStage, selectedCategory]);

  const loadIdeas = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
      }

      let q = query(
        collection(db, 'innovations'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      // Add role-based filtering
      if (!hasPermission('view_all_data')) {
        q = query(
          collection(db, 'innovations'),
          where('userId', '==', userProfile.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
      }

      if (loadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const newIdeas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (loadMore) {
        setIdeas(prev => [...prev, ...newIdeas]);
      } else {
        setIdeas(newIdeas);
        calculateStats(newIdeas);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 20);
    } catch (error) {
      console.error('Error loading ideas:', error);
      Alert.alert('Error', 'Failed to load innovation ideas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (ideasData) => {
    const stats = ideasData.reduce((acc, idea) => {
      acc.totalIdeas++;
      if (idea.stage === 'under_review') acc.underReview++;
      if (idea.stage === 'in_incubation') acc.inIncubation++;
      if (idea.stage === 'market_ready') acc.marketReady++;
      return acc;
    }, { totalIdeas: 0, underReview: 0, inIncubation: 0, marketReady: 0 });
    
    setStats(stats);
  };

  const filterIdeas = () => {
    let filtered = ideas;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(idea =>
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.submitterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by stage
    if (selectedStage !== 'all') {
      filtered = filtered.filter(idea => idea.stage === selectedStage);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(idea => idea.category === selectedCategory);
    }

    setFilteredIdeas(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadIdeas();
  };

  const getStageColor = (stage) => {
    const stageInfo = IDEA_STAGES.find(s => s.key === stage);
    return stageInfo ? stageInfo.color : '#666';
  };

  const canAddIdea = () => {
    return hasPermission('submit_innovation') || hasPermission('manage_innovations');
  };

  const canViewDetails = (idea) => {
    return hasPermission('view_all_data') || idea.userId === userProfile.uid || idea.isPublic;
  };

  const renderIdeaCard = (idea) => (
    <TouchableOpacity
      key={idea.id}
      style={styles.ideaCard}
      onPress={() => canViewDetails(idea) && navigation.navigate('InnovationDetail', { ideaId: idea.id })}
      disabled={!canViewDetails(idea)}
    >
      <View style={styles.ideaHeader}>
        <View style={styles.ideaTitle}>
          <Text style={styles.ideaTitleText} numberOfLines={2}>{idea.title}</Text>
          <StatusBadge status={idea.stage} color={getStageColor(idea.stage)} />
        </View>
        {idea.priority === 'high' && (
          <Ionicons name="flag" size={16} color="#f44336" />
        )}
      </View>

      <Text style={styles.ideaDescription} numberOfLines={3}>
        {idea.description}
      </Text>

      <View style={styles.ideaDetails}>
        <View style={styles.ideaInfo}>
          <Text style={styles.submitterName}>{idea.submitterName}</Text>
          <Text style={styles.organization}>{idea.organization}</Text>
        </View>
        <Text style={styles.category}>{idea.category}</Text>
      </View>

      <View style={styles.ideaMeta}>
        <View style={styles.ideaTags}>
          {idea.tags?.slice(0, 3).map((tag, index) => (
            <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
              {tag}
            </Chip>
          ))}
          {idea.tags?.length > 3 && (
            <Text style={styles.moreTags}>+{idea.tags.length - 3} more</Text>
          )}
        </View>
        <View style={styles.ideaMetaRight}>
          <Text style={styles.submissionDate}>
            {new Date(idea.createdAt).toLocaleDateString()}
          </Text>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => canViewDetails(idea) && navigation.navigate('InnovationDetail', { ideaId: idea.id })}
            disabled={!canViewDetails(idea)}
          >
            <Ionicons name="information-circle-outline" size={16} color="#9C27B0" />
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>

      {idea.fundingRequested && (
        <View style={styles.fundingInfo}>
          <Ionicons name="cash-outline" size={16} color="#4CAF50" />
          <Text style={styles.fundingText}>
            ₹{(idea.fundingRequested / 100000).toFixed(1)}L requested
          </Text>
        </View>
      )}

      {!canViewDetails(idea) && (
        <View style={styles.restrictedOverlay}>
          <Ionicons name="lock-closed" size={20} color="#666" />
          <Text style={styles.restrictedText}>Private Idea</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner message="Loading innovation ideas..." />;
  }

  return (
    <LinearGradient
      colors={["#1a1a3e", "#2d2d5f", "#1a1a3e"]}
      style={styles.container}
    >
      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Title style={styles.headerTitle}>Innovation Hub</Title>
            <Text style={styles.headerSubtitle}>
              Ideas, Incubation & Innovation Ecosystem
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Modern Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="bulb" size={20} color="#b366ff" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.totalIdeas}</Text>
            <Text style={styles.statLabel}>Total Ideas</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="hourglass" size={20} color="#b366ff" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.underReview}</Text>
            <Text style={styles.statLabel}>Under Review</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="rocket" size={20} color="#b366ff" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.inIncubation}</Text>
            <Text style={styles.statLabel}>In Incubation</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={20} color="#b366ff" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.marketReady}</Text>
            <Text style={styles.statLabel}>Market Ready</Text>
          </View>
        </View>

        {/* Modern Quick Actions */}
        {hasPermission('manage_innovations') && (
          <View style={styles.quickActions}>
            <ActionCard
              title="Review Applications"
              description="Review pending innovation ideas"
              icon="clipboard-outline"
              onPress={() => navigation.navigate('ReviewInnovations')}
              color="#FF9800"
            />
            <ActionCard
              title="Incubation Programs"
              description="Manage incubation programs"
              icon="school-outline"
              onPress={() => navigation.navigate('IncubationPrograms')}
              color="#9C27B0"
            />
          </View>
        )}

        {/* Modern Search and Filters */}
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Search ideas, innovators, or keywords..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            iconColor="#b366ff"
            placeholderTextColor="#888"
            inputStyle={{ color: '#fff' }}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            {IDEA_STAGES.map((stage) => (
              <TouchableOpacity
                key={stage.key}
                onPress={() => setSelectedStage(stage.key)}
                style={[
                  styles.modernFilterChip,
                  selectedStage === stage.key && { backgroundColor: stage.color }
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStage === stage.key && { color: '#fff', fontWeight: 'bold' }
                  ]}
                >
                  {stage.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            {INNOVATION_CATEGORIES.map((category) => (
              <Chip
                key={category.key}
                selected={selectedCategory === category.key}
                onPress={() => setSelectedCategory(category.key)}
                style={[
                  styles.filterChip,
                  selectedCategory === category.key && { backgroundColor: '#9C27B0' }
                ]}
                textStyle={[
                  styles.filterChipText,
                  selectedCategory === category.key && { color: '#fff' }
                ]}
              >
                {category.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Ideas List */}
        <View style={styles.ideasSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Innovation Ideas</Text>
            <Text style={styles.resultsCount}>
              {filteredIdeas.length} {filteredIdeas.length === 1 ? 'idea' : 'ideas'}
            </Text>
          </View>

          {filteredIdeas.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bulb-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No innovation ideas found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || selectedStage !== 'all' || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to submit an innovative idea!'}
              </Text>
            </View>
          ) : (
            filteredIdeas.map(renderIdeaCard)
          )}

          {hasMore && filteredIdeas.length > 0 && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => loadIdeas(true)}
            >
              <Text style={styles.loadMoreText}>Load More Ideas</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {canAddIdea() && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => navigation.navigate('AddInnovation')}
          label="Submit Idea"
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a3e',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a0a0b0',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#a0a0b0',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchbar: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
    borderRadius: 12,
  },
  filterContainer: {
    marginBottom: 12,
  },
  modernFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipText: {
    fontSize: 13,
    color: '#a0a0b0',
  },
  ideasSection: {
    marginBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultsCount: {
    fontSize: 14,
    color: '#a0a0b0',
  },
  ideaCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ideaTitle: {
    flex: 1,
    marginRight: 12,
  },
  ideaTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 24,
  },
  ideaDescription: {
    fontSize: 14,
    color: '#a0a0b0',
    lineHeight: 22,
    marginBottom: 16,
  },
  ideaDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  ideaInfo: {
    flex: 1,
  },
  submitterName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  organization: {
    fontSize: 13,
    color: '#a0a0b0',
    marginTop: 4,
  },
  category: {
    fontSize: 13,
    color: '#b366ff',
    fontWeight: '600',
  },
  ideaMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ideaMetaRight: {
    alignItems: 'flex-end',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(179, 102, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  viewDetailsText: {
    fontSize: 13,
    color: '#b366ff',
    marginLeft: 6,
    fontWeight: '600',
  },
  ideaTags: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  tag: {
    height: 26,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagText: {
    fontSize: 11,
    color: '#fff',
  },
  moreTags: {
    fontSize: 11,
    color: '#a0a0b0',
  },
  submissionDate: {
    fontSize: 12,
    color: '#a0a0b0',
  },
  fundingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  fundingText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
  },
  restrictedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 62, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  restrictedText: {
    fontSize: 14,
    color: '#a0a0b0',
    marginTop: 8,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#a0a0b0',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  loadMoreButton: {
    backgroundColor: 'rgba(179, 102, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(179, 102, 255, 0.3)',
  },
  loadMoreText: {
    color: '#b366ff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    margin: 20,
    right: 0,
    bottom: 0,
    backgroundColor: '#b366ff',
  },
});