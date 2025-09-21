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

const STARTUP_STAGES = [
  { key: 'all', label: 'All Startups', color: '#333' },
  { key: 'ideation', label: 'Ideation', color: '#2196F3' },
  { key: 'validation', label: 'Validation', color: '#FF9800' },
  { key: 'early_stage', label: 'Early Stage', color: '#9C27B0' },
  { key: 'growth', label: 'Growth', color: '#4CAF50' },
  { key: 'expansion', label: 'Expansion', color: '#607D8B' },
  { key: 'mature', label: 'Mature', color: '#795548' },
  { key: 'exit', label: 'Exit/IPO', color: '#E91E63' }
];

const INDUSTRY_SECTORS = [
  { key: 'all', label: 'All Sectors' },
  { key: 'technology', label: 'Technology' },
  { key: 'healthcare', label: 'Healthcare' },
  { key: 'fintech', label: 'FinTech' },
  { key: 'ecommerce', label: 'E-commerce' },
  { key: 'education', label: 'EdTech' },
  { key: 'agriculture', label: 'AgriTech' },
  { key: 'energy', label: 'Clean Energy' },
  { key: 'manufacturing', label: 'Manufacturing' },
  { key: 'logistics', label: 'Logistics' },
  { key: 'media', label: 'Media & Entertainment' }
];

const FUNDING_STAGES = [
  { key: 'bootstrapped', label: 'Bootstrapped', color: '#4CAF50' },
  { key: 'pre_seed', label: 'Pre-Seed', color: '#FF9800' },
  { key: 'seed', label: 'Seed', color: '#9C27B0' },
  { key: 'series_a', label: 'Series A', color: '#2196F3' },
  { key: 'series_b', label: 'Series B', color: '#607D8B' },
  { key: 'series_c', label: 'Series C+', color: '#795548' }
];

export default function StartupListScreen({ navigation }) {
  const { userProfile, hasPermission } = useAuth();
  const [startups, setStartups] = useState([]);
  const [filteredStartups, setFilteredStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedFunding, setSelectedFunding] = useState('all');
  const [stats, setStats] = useState({
    totalStartups: 0,
    earlyStage: 0,
    funded: 0,
    jobsCreated: 0
  });
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadStartups();
  }, []);

  useEffect(() => {
    filterStartups();
  }, [startups, searchQuery, selectedStage, selectedSector, selectedFunding]);

  const loadStartups = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
      }

      let q = query(
        collection(db, 'startups'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      // Add role-based filtering
      if (!hasPermission('view_all_data')) {
        q = query(
          collection(db, 'startups'),
          where('userId', '==', userProfile.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
      }

      if (loadMore && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const newStartups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (loadMore) {
        setStartups(prev => [...prev, ...newStartups]);
      } else {
        setStartups(newStartups);
        calculateStats(newStartups);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 20);
    } catch (error) {
      console.error('Error loading startups:', error);
      Alert.alert('Error', 'Failed to load startups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (startupsData) => {
    const stats = startupsData.reduce((acc, startup) => {
      acc.totalStartups++;
      if (['ideation', 'validation', 'early_stage'].includes(startup.stage)) {
        acc.earlyStage++;
      }
      if (startup.fundingStage && startup.fundingStage !== 'bootstrapped') {
        acc.funded++;
      }
      acc.jobsCreated += startup.employeeCount || 0;
      return acc;
    }, { totalStartups: 0, earlyStage: 0, funded: 0, jobsCreated: 0 });
    
    setStats(stats);
  };

  const filterStartups = () => {
    let filtered = startups;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(startup =>
        startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startup.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startup.founderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startup.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startup.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by stage
    if (selectedStage !== 'all') {
      filtered = filtered.filter(startup => startup.stage === selectedStage);
    }

    // Filter by sector
    if (selectedSector !== 'all') {
      filtered = filtered.filter(startup => startup.sector === selectedSector);
    }

    // Filter by funding stage
    if (selectedFunding !== 'all') {
      filtered = filtered.filter(startup => startup.fundingStage === selectedFunding);
    }

    setFilteredStartups(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStartups();
  };

  const getStageColor = (stage) => {
    const stageInfo = STARTUP_STAGES.find(s => s.key === stage);
    return stageInfo ? stageInfo.color : '#666';
  };

  const getFundingColor = (fundingStage) => {
    const fundingInfo = FUNDING_STAGES.find(f => f.key === fundingStage);
    return fundingInfo ? fundingInfo.color : '#666';
  };

  const canAddStartup = () => {
    return hasPermission('register_startup') || hasPermission('manage_startups');
  };

  const canViewDetails = (startup) => {
    return hasPermission('view_all_data') || startup.userId === userProfile.uid || startup.isPublic;
  };

  const formatFunding = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else {
      return `₹${(amount / 1000).toFixed(0)}K`;
    }
  };

  const renderStartupCard = (startup) => (
    <TouchableOpacity
      key={startup.id}
      style={styles.startupCard}
      onPress={() => canViewDetails(startup) && navigation.navigate('StartupDetail', { startupId: startup.id })}
      disabled={!canViewDetails(startup)}
    >
      <View style={styles.startupHeader}>
        <View style={styles.startupTitleSection}>
          <Text style={styles.startupName} numberOfLines={1}>{startup.name}</Text>
          <View style={styles.badges}>
            <StatusBadge status={startup.stage} color={getStageColor(startup.stage)} />
            {startup.fundingStage && (
              <StatusBadge 
                status={startup.fundingStage} 
                color={getFundingColor(startup.fundingStage)} 
              />
            )}
          </View>
        </View>
        {startup.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          </View>
        )}
      </View>

      <Text style={styles.startupDescription} numberOfLines={2}>
        {startup.description}
      </Text>

      <View style={styles.startupDetails}>
        <View style={styles.startupInfo}>
          <Text style={styles.founderName}>{startup.founderName}</Text>
          <Text style={styles.sector}>{startup.sector}</Text>
        </View>
        <Text style={styles.location}>{startup.location}</Text>
      </View>

      <View style={styles.startupMeta}>
        <View style={styles.metricsList}>
          {startup.employeeCount && (
            <View style={styles.metric}>
              <Ionicons name="people-outline" size={14} color="#666" />
              <Text style={styles.metricText}>{startup.employeeCount} employees</Text>
            </View>
          )}
          {startup.revenue && (
            <View style={styles.metric}>
              <Ionicons name="trending-up-outline" size={14} color="#4CAF50" />
              <Text style={styles.metricText}>{formatFunding(startup.revenue)} revenue</Text>
            </View>
          )}
          {startup.totalFunding && (
            <View style={styles.metric}>
              <Ionicons name="cash-outline" size={14} color="#9C27B0" />
              <Text style={styles.metricText}>{formatFunding(startup.totalFunding)} raised</Text>
            </View>
          )}
        </View>
        <Text style={styles.foundingDate}>
          Est. {new Date(startup.foundingDate).getFullYear()}
        </Text>
      </View>

      {startup.tags && startup.tags.length > 0 && (
        <View style={styles.startupTags}>
          {startup.tags.slice(0, 3).map((tag, index) => (
            <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
              {tag}
            </Chip>
          ))}
          {startup.tags.length > 3 && (
            <Text style={styles.moreTags}>+{startup.tags.length - 3} more</Text>
          )}
        </View>
      )}

      {startup.currentFundraising && (
        <View style={styles.fundraisingBanner}>
          <Ionicons name="megaphone-outline" size={16} color="#FF9800" />
          <Text style={styles.fundraisingText}>Currently Fundraising</Text>
        </View>
      )}

      {!canViewDetails(startup) && (
        <View style={styles.restrictedOverlay}>
          <Ionicons name="lock-closed" size={20} color="#666" />
          <Text style={styles.restrictedText}>Private Profile</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner message="Loading startup ecosystem..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#E91E63', '#9C27B0']}
        style={styles.header}
      >
        <Title style={styles.headerTitle}>Startup Ecosystem</Title>
        <Text style={styles.headerSubtitle}>
          Discover & Connect with Gujarat's Startups
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Startups"
            value={stats.totalStartups}
            icon="rocket-outline"
            color="#E91E63"
          />
          <StatCard
            title="Early Stage"
            value={stats.earlyStage}
            icon="trending-up-outline"
            color="#4CAF50"
          />
          <StatCard
            title="Funded"
            value={stats.funded}
            icon="cash-outline"
            color="#9C27B0"
          />
          <StatCard
            title="Jobs Created"
            value={stats.jobsCreated}
            icon="people-outline"
            color="#2196F3"
          />
        </View>

        {/* Quick Actions */}
        {hasPermission('manage_startups') && (
          <View style={styles.quickActions}>
            <ActionCard
              title="Funding Programs"
              description="Manage funding opportunities"
              icon="cash-outline"
              onPress={() => navigation.navigate('FundingPrograms')}
              color="#4CAF50"
            />
            <ActionCard
              title="Incubator Network"
              description="View incubator programs"
              icon="business-outline"
              onPress={() => navigation.navigate('IncubatorNetwork')}
              color="#FF9800"
            />
          </View>
        )}

        {/* Search and Filters */}
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Search startups, founders, or sectors..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            {STARTUP_STAGES.map((stage) => (
              <Chip
                key={stage.key}
                selected={selectedStage === stage.key}
                onPress={() => setSelectedStage(stage.key)}
                style={[
                  styles.filterChip,
                  selectedStage === stage.key && { backgroundColor: stage.color }
                ]}
                textStyle={[
                  styles.filterChipText,
                  selectedStage === stage.key && { color: '#fff' }
                ]}
              >
                {stage.label}
              </Chip>
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            {INDUSTRY_SECTORS.map((sector) => (
              <Chip
                key={sector.key}
                selected={selectedSector === sector.key}
                onPress={() => setSelectedSector(sector.key)}
                style={[
                  styles.filterChip,
                  selectedSector === sector.key && { backgroundColor: '#E91E63' }
                ]}
                textStyle={[
                  styles.filterChipText,
                  selectedSector === sector.key && { color: '#fff' }
                ]}
              >
                {sector.label}
              </Chip>
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            {FUNDING_STAGES.map((funding) => (
              <Chip
                key={funding.key}
                selected={selectedFunding === funding.key}
                onPress={() => setSelectedFunding(funding.key)}
                style={[
                  styles.filterChip,
                  selectedFunding === funding.key && { backgroundColor: funding.color }
                ]}
                textStyle={[
                  styles.filterChipText,
                  selectedFunding === funding.key && { color: '#fff' }
                ]}
              >
                {funding.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Startups List */}
        <View style={styles.startupsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Registered Startups</Text>
            <Text style={styles.resultsCount}>
              {filteredStartups.length} {filteredStartups.length === 1 ? 'startup' : 'startups'}
            </Text>
          </View>

          {filteredStartups.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="rocket-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No startups found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || selectedStage !== 'all' || selectedSector !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to register your startup!'}
              </Text>
            </View>
          ) : (
            filteredStartups.map(renderStartupCard)
          )}

          {hasMore && filteredStartups.length > 0 && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => loadStartups(true)}
            >
              <Text style={styles.loadMoreText}>Load More Startups</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {canAddStartup() && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => navigation.navigate('RegisterStartup')}
          label="Register Startup"
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
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
    color: '#fff',
    opacity: 0.9,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchbar: {
    marginBottom: 12,
    elevation: 2,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#fff',
  },
  filterChipText: {
    fontSize: 12,
  },
  startupsSection: {
    marginBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
  },
  startupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  startupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  startupTitleSection: {
    flex: 1,
    marginRight: 8,
  },
  startupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
  },
  startupDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  startupDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  startupInfo: {
    flex: 1,
  },
  founderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sector: {
    fontSize: 12,
    color: '#E91E63',
    fontWeight: '600',
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: '#666',
  },
  startupMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricsList: {
    flex: 1,
    gap: 4,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  foundingDate: {
    fontSize: 12,
    color: '#666',
  },
  startupTags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tag: {
    height: 24,
    marginRight: 6,
    backgroundColor: '#f0f0f0',
  },
  tagText: {
    fontSize: 10,
  },
  moreTags: {
    fontSize: 10,
    color: '#666',
  },
  fundraisingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  fundraisingText: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
    marginLeft: 4,
  },
  restrictedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  restrictedText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadMoreButton: {
    backgroundColor: '#E91E63',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  loadMoreText: {
    color: '#fff',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#E91E63',
  },
});