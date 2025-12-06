
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Platform
} from 'react-native';
import { Card, Title, Paragraph, Avatar, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, USER_ROLES } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const { width, height } = Dimensions.get('window');
const STAT_CARD_WIDTH = width > 600 ? (width - 70) / 4 : (width - 50) / 2;
const isTablet = width > 600;

export default function DashboardScreen({ navigation }) {
  const { userProfile, hasPermission, isRole } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    recentResearch: [],
    recentIPR: [],
    recentStartups: [],
    stats: { totalResearch: 0, totalIPR: 0, totalStartups: 0, totalFunding: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  const loadStats = async () => {
    try {
      const stats = { totalResearch: 0, totalIPR: 0, totalStartups: 0, totalFunding: 0 };

      if (hasPermission('view_analytics')) {
        const researchSnapshot = await getDocs(collection(db, 'research'));
        const iprSnapshot = await getDocs(collection(db, 'ipr'));
        const startupsSnapshot = await getDocs(collection(db, 'startups'));

        stats.totalResearch = researchSnapshot.size;
        stats.totalIPR = iprSnapshot.size;
        stats.totalStartups = startupsSnapshot.size;

        startupsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data?.funding) {
            stats.totalFunding += parseFloat(data.funding) || 0;
          }
        });
      }

      return stats;
    } catch (error) {
      console.error('Error loading stats:', error);
      return { totalResearch: 0, totalIPR: 0, totalStartups: 0, totalFunding: 0 };
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [recentResearch, recentIPR, recentStartups, stats] = await Promise.all([
        loadRecentResearch(),
        loadRecentIPR(),
        loadRecentStartups(),
        loadStats()
      ]);

      setDashboardData({ recentResearch, recentIPR, recentStartups, stats });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentResearch = async () => {
    try {
      let q;
      if (isRole(USER_ROLES.RESEARCHER)) {
        q = query(
          collection(db, 'research'),
          where('userId', '==', userProfile.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
      } else if (hasPermission('view_all_data')) {
        q = query(collection(db, 'research'), orderBy('createdAt', 'desc'), limit(5));
      } else {
        q = query(
          collection(db, 'research'),
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error loading research data:', error);
      return [];
    }
  };

  const loadRecentIPR = async () => {
    try {
      let q;
      if (isRole(USER_ROLES.RESEARCHER) || isRole(USER_ROLES.ENTREPRENEUR)) {
        q = query(
          collection(db, 'ipr'),
          where('userId', '==', userProfile.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
      } else if (hasPermission('view_all_data')) {
        q = query(collection(db, 'ipr'), orderBy('createdAt', 'desc'), limit(5));
      } else {
        q = query(
          collection(db, 'ipr'),
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error loading IPR data:', error);
      return [];
    }
  };

  const loadRecentStartups = async () => {
    try {
      let q;
      if (isRole(USER_ROLES.ENTREPRENEUR)) {
        q = query(
          collection(db, 'startups'),
          where('userId', '==', userProfile.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
      } else if (hasPermission('view_all_data') || isRole(USER_ROLES.INVESTOR)) {
        q = query(collection(db, 'startups'), orderBy('createdAt', 'desc'), limit(5));
      } else {
        q = query(
          collection(db, 'startups'),
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error loading startup data:', error);
      return [];
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${greeting}, ${userProfile?.name || 'User'}!`;
  };

  const getRoleSpecificActions = () => {
    const actions = [];

    if (hasPermission('submit_research')) {
      actions.push({ title: 'Submit Research', icon: 'flask', color: ['#36D1DC', '#5B86E5'], onPress: () => navigation.navigate('Research', { screen: 'AddResearch' }) });
    }

    if (hasPermission('submit_ipr')) {
      actions.push({ title: 'Apply for IPR', icon: 'shield-checkmark', color: ['#F7971E', '#FFD200'], onPress: () => navigation.navigate('IPR', { screen: 'AddIPR' }) });
    }

    if (hasPermission('submit_idea')) {
      actions.push({ title: 'Submit Idea', icon: 'bulb', color: ['#7F00FF', '#E100FF'], onPress: () => navigation.navigate('Innovation', { screen: 'IdeaSubmission' }) });
    }

    if (hasPermission('submit_startup')) {
      actions.push({ title: 'Register Startup', icon: 'rocket', color: ['#FF5F6D', '#FFC371'], onPress: () => navigation.navigate('Startups', { screen: 'RegisterStartup' }) });
    }

    return actions;
  };

  const formatINR = (amount) => {
    if (!amount) return '₹0';
    // show in crores if large
    if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(1)} Cr`;
    if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(1)} L`;
    return `₹${amount}`;
  };

  const StatCard = ({ title, value, icon }) => (
    <View style={styles.statCard}>
      <View style={styles.statIconContainer}>
        <Ionicons name={icon} size={26} color="#b366ff" />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const ActionButton = ({ item }) => (
    <TouchableOpacity style={styles.actionButton} onPress={item.onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={['#b366ff', '#8b3dc7', '#6a2c96']}
        style={styles.actionGradient}
      >
        <Ionicons name={item.icon} size={24} color="#fff" />
        <Text style={styles.actionText}>{item.title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const RecentCard = ({ item, type }) => (
    <TouchableOpacity
      style={styles.recentCard}
      activeOpacity={0.7}
      onPress={() => {
        if (type === 'ipr') navigation.navigate('IPRDetail', { iprId: item.id });
        if (type === 'startup') navigation.navigate('Startups', { screen: 'StartupDetail', params: { startupId: item.id } });
      }}
    >
      <LinearGradient
        colors={['rgba(179, 102, 255, 0.15)', 'rgba(179, 102, 255, 0.05)']}
        style={styles.recentCardGradient}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.iconBadge}>
            <Ionicons 
              name={type === 'ipr' ? 'shield-checkmark' : type === 'startup' ? 'rocket' : 'flask'} 
              size={16} 
              color="#b366ff" 
            />
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{(item.status || item.stage || 'N/A')}</Text>
          </View>
        </View>
        
        <Text style={styles.recentTitle} numberOfLines={1}>{item.title || item.name}</Text>
        <Text style={styles.recentDescription} numberOfLines={2}>
          {(item.description || 'No description available').trim()}
        </Text>
        
        <View style={styles.cardBottomRow}>
          <Ionicons name="time-outline" size={11} color="#999" />
          <Text style={styles.recentDate}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const actions = useMemo(() => getRoleSpecificActions(), [userProfile]);

  return (
    <LinearGradient
      colors={['#1a1a3e', '#2d2d5f', '#1a1a3e']}
      style={styles.container}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>{getWelcomeMessage()}</Text>
              <Text style={styles.roleText}>{userProfile?.role?.replace('_', ' ').toUpperCase()}</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
              <Avatar.Text 
                size={50} 
                label={userProfile?.name?.charAt(0) || 'U'} 
                style={styles.avatar}
              />
            </TouchableOpacity>
          </View>
        </View>        {/* Stats Grid */}
        {hasPermission('view_analytics') && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard
                title="Research"
                value={dashboardData.stats.totalResearch}
                icon="flask-outline"
              />
              <StatCard
                title="IPR"
                value={dashboardData.stats.totalIPR}
                icon="shield-checkmark-outline"
              />
              <StatCard
                title="Start-ups"
                value={dashboardData.stats.totalStartups}
                icon="rocket-outline"
              />
              <StatCard
                title="Funding"
                value={formatINR(dashboardData.stats.totalFunding)}
                icon="cash-outline"
              />
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {actions.length > 0 && (
          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {actions.map((action, index) => (
                <ActionButton key={index} item={action} />
              ))}
            </View>
          </View>
        )}

        {/* Recent Research */}
        {dashboardData.recentResearch.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Recent Research</Text>
                <Ionicons name="arrow-forward-circle-outline" size={20} color="#b366ff" style={styles.scrollIcon} />
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Research', { screen: 'ResearchList' })}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {dashboardData.recentResearch.map((item) => (
                <RecentCard key={item.id} item={item} type="research" />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent IPR */}
        {dashboardData.recentIPR.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Recent IPR Applications</Text>
                <Ionicons name="arrow-forward-circle-outline" size={20} color="#b366ff" style={styles.scrollIcon} />
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('IPR', { screen: 'IPRList' })}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {dashboardData.recentIPR.map((item) => (
                <RecentCard key={item.id} item={item} type="ipr" />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Startups */}
        {dashboardData.recentStartups.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Recent Start-ups</Text>
                <Ionicons name="arrow-forward-circle-outline" size={20} color="#b366ff" style={styles.scrollIcon} />
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Startups', { screen: 'StartupList' })}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {dashboardData.recentStartups.map((item) => (
                <RecentCard key={item.id} item={item} type="startup" />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Empty State */}
        {!loading && actions.length === 0 && dashboardData.recentResearch.length === 0 && 
         dashboardData.recentIPR.length === 0 && dashboardData.recentStartups.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={60} color="#666" />
            <Text style={styles.emptyStateText}>No recent activity</Text>
            <Text style={styles.emptyStateSubtext}>Start by submitting your first project</Text>
          </View>
        )}

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: isTablet ? 40 : 20,
    paddingBottom: 20,
    marginHorizontal: isTablet ? 0 : 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeSection: {
    flex: 1,
    marginRight: 15,
  },
  welcomeText: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  roleText: {
    fontSize: isTablet ? 15 : 13,
    color: '#ddd',
    opacity: 0.9,
  },
  avatar: {
    backgroundColor: 'rgba(179, 102, 255, 0.3)',
    elevation: 4,
    shadowColor: '#b366ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },

  // Stats Section
  statsContainer: {
    paddingHorizontal: isTablet ? 40 : 20,
    marginTop: 20,
    marginHorizontal: isTablet ? 0 : 8,
  },
  sectionTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: STAT_CARD_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: isTablet ? 18 : 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#b366ff',
    elevation: 3,
    shadowColor: '#b366ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  statIconContainer: {
    marginBottom: 10,
  },
  statContent: {
    marginTop: 5,
  },
  statValue: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: isTablet ? 13 : 12,
    color: '#ddd',
    opacity: 0.9,
  },

  // Actions Section
  actionsContainer: {
    paddingHorizontal: isTablet ? 40 : 20,
    marginTop: 20,
    marginHorizontal: isTablet ? 0 : 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: isTablet ? (width - 100) / 3 : (width - 60) / 2,
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#b366ff',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  actionGradient: {
    paddingVertical: isTablet ? 25 : 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isTablet ? 120 : 100,
  },
  actionText: {
    color: '#fff',
    fontSize: isTablet ? 15 : 14,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Recent Sections
  recentSection: {
    marginTop: 25,
    paddingLeft: isTablet ? 40 : 20,
    marginLeft: isTablet ? 0 : 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingRight: isTablet ? 40 : 20,
    marginRight: isTablet ? 0 : 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollIcon: {
    marginLeft: 8,
    opacity: 0.7,
  },
  viewAllText: {
    color: '#b366ff',
    fontSize: isTablet ? 15 : 14,
    fontWeight: 'bold',
  },
  horizontalScroll: {
    paddingRight: isTablet ? 40 : 20,
    marginRight: isTablet ? 0 : 8,
  },
  recentCard: {
    width: isTablet ? width * 0.35 : width * 0.55,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#b366ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  recentCardGradient: {
    padding: isTablet ? 16 : 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(179, 102, 255, 0.2)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBadge: {
    backgroundColor: 'rgba(179, 102, 255, 0.2)',
    width: isTablet ? 36 : 32,
    height: isTablet ? 36 : 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentTitle: {
    fontSize: isTablet ? 15 : 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  recentDescription: {
    fontSize: isTablet ? 12 : 11,
    color: '#ccc',
    marginBottom: 10,
    lineHeight: isTablet ? 18 : 16,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  recentDate: {
    fontSize: isTablet ? 11 : 10,
    color: '#999',
    marginLeft: 4,
  },
  statusBadge: {
    backgroundColor: 'rgba(179, 102, 255, 0.25)',
    paddingHorizontal: isTablet ? 10 : 8,
    paddingVertical: isTablet ? 4 : 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: isTablet ? 10 : 9,
    fontWeight: '700',
    color: '#b366ff',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 80 : 60,
    paddingHorizontal: isTablet ? 60 : 32,
    marginHorizontal: isTablet ? 0 : 8,
  },
  emptyStateText: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: isTablet ? 15 : 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: isTablet ? 22 : 20,
  },
});
