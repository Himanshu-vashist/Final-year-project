import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions
} from 'react-native';
import { Title, Searchbar, Chip, FAB, Card } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { StatCard, ActionCard, StatusBadge, LoadingSpinner } from '../../components/UIComponents';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

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
  const { isDarkMode } = useTheme();
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
      // If user doesn't have view_all_data AND doesn't have view_startups (like Entrepreneur), 
      // they only see their own startups.
      if (!hasPermission('view_all_data') && !hasPermission('view_startups')) {
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
    return hasPermission('submit_startup') || hasPermission('manage_startups');
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
      style={[
        styles.startupCard,
        { opacity: canViewDetails(startup) ? 1 : 0.7 }
      ]}
      onPress={() => canViewDetails(startup) && navigation.navigate('StartupDetail', { startupId: startup.id })}
      disabled={!canViewDetails(startup)}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
        style={styles.cardGradient}
      >
        <View style={styles.startupHeader}>
          <View style={styles.startupTitleSection}>
            <View style={styles.nameRow}>
              <Text style={styles.startupName} numberOfLines={1}>
                {startup.name}
              </Text>
              {startup.isVerified && (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={styles.verifiedIcon} />
              )}
            </View>
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
        </View>

        <Text style={styles.startupDescription} numberOfLines={2}>
          {startup.description}
        </Text>

        <View style={styles.startupDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="person-circle-outline" size={16} color="#b366ff" />
            <Text style={styles.founderName}>{startup.founderName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="briefcase-outline" size={16} color="#b366ff" />
            <Text style={styles.sector}>{startup.sector}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#b366ff" />
            <Text style={styles.location}>{startup.location}</Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          {startup.employeeCount && (
            <View style={styles.metricBox}>
              <Ionicons name="people" size={18} color="#b366ff" />
              <Text style={styles.metricValue}>{startup.employeeCount}</Text>
              <Text style={styles.metricLabel}>Employees</Text>
            </View>
          )}
          {startup.revenue && (
            <View style={styles.metricBox}>
              <Ionicons name="trending-up" size={18} color="#b366ff" />
              <Text style={styles.metricValue}>{formatFunding(startup.revenue)}</Text>
              <Text style={styles.metricLabel}>Revenue</Text>
            </View>
          )}
          {startup.totalFunding && (
            <View style={styles.metricBox}>
              <Ionicons name="cash" size={18} color="#b366ff" />
              <Text style={styles.metricValue}>{formatFunding(startup.totalFunding)}</Text>
              <Text style={styles.metricLabel}>Raised</Text>
            </View>
          )}
          <View style={styles.metricBox}>
            <Ionicons name="calendar" size={18} color="#b366ff" />
            <Text style={styles.metricValue}>{new Date(startup.foundingDate).getFullYear()}</Text>
            <Text style={styles.metricLabel}>Founded</Text>
          </View>
        </View>

        {startup.tags && startup.tags.length > 0 && (
          <View style={styles.startupTags}>
            {startup.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {startup.tags.length > 3 && (
              <Text style={styles.moreTags}>+{startup.tags.length - 3}</Text>
            )}
          </View>
        )}

        {startup.currentFundraising && (
          <View style={styles.fundraisingBanner}>
            <Ionicons name="megaphone" size={16} color="#FF9800" />
            <Text style={styles.fundraisingText}>Currently Fundraising</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.viewDetailsButton}
          onPress={() => canViewDetails(startup) && navigation.navigate('StartupDetail', { startupId: startup.id })}
          disabled={!canViewDetails(startup)}
        >
          <Text style={styles.viewDetailsText}>View Full Details</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>

        {!canViewDetails(startup) && (
          <View style={styles.restrictedOverlay}>
            <Ionicons name="lock-closed" size={24} color="#666" />
            <Text style={styles.restrictedText}>Private Profile</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner message="Loading startup ecosystem..." />;
  }

  return (
    <LinearGradient
      colors={['#1a1a3e', '#2d2d5f', '#1a1a3e']}
      style={styles.container}
    >
      {/* Modern Header with Back Button */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Title style={styles.headerTitle}>Startup Ecosystem</Title>
            <Text style={styles.headerSubtitle}>
              Discover & Connect with Innovation
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconButton}>
              <Ionicons name="filter-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
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
            <Ionicons name="rocket" size={20} color="#b366ff" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.totalStartups}</Text>
            <Text style={styles.statLabel}>Total Startups</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={20} color="#b366ff" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.earlyStage}</Text>
            <Text style={styles.statLabel}>Early Stage</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash" size={20} color="#b366ff" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.funded}</Text>
            <Text style={styles.statLabel}>Funded</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={20} color="#b366ff" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.jobsCreated}</Text>
            <Text style={styles.statLabel}>Jobs Created</Text>
          </View>
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

        {/* Modern Search and Filters */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search startups, founders, or sectors..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
              iconColor="#b366ff"
              placeholderTextColor="#888"
              inputStyle={{ color: '#fff' }}
            />
          </View>

          <Text style={styles.filterTitle}>Stage</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            {STARTUP_STAGES.map((stage) => (
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(179, 102, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.95,
  },
  headerRight: {
    width: 40,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(179, 102, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#b366ff',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#ddd',
    textAlign: 'center',
    opacity: 0.9,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  searchSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  searchContainer: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  searchbar: {
    elevation: 0,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#fff',
  },
  filterContainer: {
    marginBottom: 12,
  },
  modernFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipText: {
    fontSize: 12,
    color: '#ddd',
  },
  startupsSection: {
    marginBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultsCount: {
    fontSize: 14,
    color: '#ddd',
  },
  startupCard: {
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
  startupHeader: {
    marginBottom: 12,
  },
  startupTitleSection: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  startupName: {
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
  startupDescription: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
    color: '#ccc',
  },
  startupDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  founderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  sector: {
    fontSize: 12,
    color: '#b366ff',
    fontWeight: '600',
  },
  location: {
    fontSize: 12,
    color: '#ddd',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    minWidth: '22%',
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
  startupTags: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(179, 102, 255, 0.2)',
  },
  tagText: {
    fontSize: 10,
    color: '#b366ff',
  },
  moreTags: {
    fontSize: 10,
    color: '#999',
  },
  fundraisingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  fundraisingText: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
    marginLeft: 6,
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
  restrictedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  restrictedText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    fontWeight: '600',
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
  loadMoreButton: {
    backgroundColor: '#E91E63',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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