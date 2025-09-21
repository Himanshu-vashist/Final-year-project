import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Card, Title, Paragraph, Button, Avatar, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, USER_ROLES } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const { userProfile, hasPermission, isRole } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    recentResearch: [],
    recentIPR: [],
    recentStartups: [],
    stats: {
      totalResearch: 0,
      totalIPR: 0,
      totalStartups: 0,
      totalFunding: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load recent data based on user role
      const recentResearch = await loadRecentResearch();
      const recentIPR = await loadRecentIPR();
      const recentStartups = await loadRecentStartups();
      const stats = await loadStats();

      setDashboardData({
        recentResearch,
        recentIPR,
        recentStartups,
        stats
      });
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
        // Show researcher's own projects
        q = query(
          collection(db, 'research'),
          where('userId', '==', userProfile.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
      } else if (hasPermission('view_all_data')) {
        // Show all recent research for government officials
        q = query(
          collection(db, 'research'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
      } else {
        // Show public research
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
        q = query(
          collection(db, 'ipr'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
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
        q = query(
          collection(db, 'startups'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
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

  const loadStats = async () => {
    try {
      // This would typically be cached or computed server-side for performance
      const stats = {
        totalResearch: 0,
        totalIPR: 0,
        totalStartups: 0,
        totalFunding: 0
      };

      if (hasPermission('view_analytics')) {
        // Load aggregated statistics
        const researchSnapshot = await getDocs(collection(db, 'research'));
        const iprSnapshot = await getDocs(collection(db, 'ipr'));
        const startupsSnapshot = await getDocs(collection(db, 'startups'));

        stats.totalResearch = researchSnapshot.size;
        stats.totalIPR = iprSnapshot.size;
        stats.totalStartups = startupsSnapshot.size;
      }

      return stats;
    } catch (error) {
      console.error('Error loading stats:', error);
      return {
        totalResearch: 0,
        totalIPR: 0,
        totalStartups: 0,
        totalFunding: 0
      };
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${greeting}, ${userProfile?.name || 'User'}!`;
  };

  const getRoleSpecificActions = () => {
    const actions = [];

    if (hasPermission('submit_research')) {
      actions.push({
        title: 'Submit Research',
        icon: 'flask-outline',
        color: '#4CAF50',
        onPress: () => navigation.navigate('Research', { screen: 'AddResearch' })
      });
    }

    if (hasPermission('submit_ipr')) {
      actions.push({
        title: 'Apply for IPR',
        icon: 'shield-checkmark-outline',
        color: '#FF9800',
        onPress: () => navigation.navigate('IPR', { screen: 'AddIPR' })
      });
    }

    if (hasPermission('submit_idea')) {
      actions.push({
        title: 'Submit Idea',
        icon: 'bulb-outline',
        color: '#2196F3',
        onPress: () => navigation.navigate('Innovation', { screen: 'IdeaSubmission' })
      });
    }

    if (hasPermission('submit_startup')) {
      actions.push({
        title: 'Register Startup',
        icon: 'rocket-outline',
        color: '#9C27B0',
        onPress: () => navigation.navigate('Startups', { screen: 'RegisterStartup' })
      });
    }

    return actions;
  };

  const QuickStatsCard = ({ title, value, icon, color }) => (
    <Surface style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <Ionicons name={icon} size={24} color={color} />
      </View>
    </Surface>
  );

  const ActionButton = ({ title, icon, color, onPress }) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <LinearGradient
        colors={[color, `${color}80`]}
        style={styles.actionGradient}
      >
        <Ionicons name={icon} size={24} color="#fff" />
        <Text style={styles.actionText}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>{getWelcomeMessage()}</Text>
            <Text style={styles.roleText}>{userProfile?.role?.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <Avatar.Text 
            size={50} 
            label={userProfile?.name?.charAt(0) || 'U'} 
            style={styles.avatar}
          />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Quick Stats */}
        {hasPermission('view_analytics') && (
          <View style={styles.section}>
            <Title style={styles.sectionTitle}>Overview</Title>
            <View style={styles.statsGrid}>
              <QuickStatsCard
                title="Research Projects"
                value={dashboardData.stats.totalResearch}
                icon="flask-outline"
                color="#4CAF50"
              />
              <QuickStatsCard
                title="IPR Applications"
                value={dashboardData.stats.totalIPR}
                icon="shield-checkmark-outline"
                color="#FF9800"
              />
              <QuickStatsCard
                title="Start-ups"
                value={dashboardData.stats.totalStartups}
                icon="rocket-outline"
                color="#2196F3"
              />
              <QuickStatsCard
                title="Total Funding"
                value={`₹${(dashboardData.stats.totalFunding / 10000000).toFixed(1)}Cr`}
                icon="cash-outline"
                color="#9C27B0"
              />
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Quick Actions</Title>
          <View style={styles.actionsGrid}>
            {getRoleSpecificActions().map((action, index) => (
              <ActionButton
                key={index}
                title={action.title}
                icon={action.icon}
                color={action.color}
                onPress={action.onPress}
              />
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        {dashboardData.recentResearch.length > 0 && (
          <View style={styles.section}>
            <Title style={styles.sectionTitle}>Recent Research</Title>
            {dashboardData.recentResearch.map((research) => (
              <Card key={research.id} style={styles.activityCard}>
                <Card.Content>
                  <Title style={styles.cardTitle}>{research.title}</Title>
                  <Paragraph numberOfLines={2}>{research.description}</Paragraph>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardDate}>
                      {new Date(research.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={[styles.cardStatus, { color: research.status === 'completed' ? '#4CAF50' : '#FF9800' }]}>
                      {research.status}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Recent IPR */}
        {dashboardData.recentIPR.length > 0 && (
          <View style={styles.section}>
            <Title style={styles.sectionTitle}>Recent IPR Applications</Title>
            {dashboardData.recentIPR.map((ipr) => (
              <Card key={ipr.id} style={styles.activityCard}>
                <Card.Content>
                  <Title style={styles.cardTitle}>{ipr.title}</Title>
                  <Paragraph numberOfLines={2}>{ipr.description}</Paragraph>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardDate}>
                      {new Date(ipr.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={[styles.cardStatus, { color: ipr.status === 'approved' ? '#4CAF50' : '#FF9800' }]}>
                      {ipr.status}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Recent Startups */}
        {dashboardData.recentStartups.length > 0 && (
          <View style={styles.section}>
            <Title style={styles.sectionTitle}>Recent Start-ups</Title>
            {dashboardData.recentStartups.map((startup) => (
              <Card key={startup.id} style={styles.activityCard}>
                <Card.Content>
                  <Title style={styles.cardTitle}>{startup.name}</Title>
                  <Paragraph numberOfLines={2}>{startup.description}</Paragraph>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardDate}>
                      {new Date(startup.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={[styles.cardStatus, { color: startup.stage === 'growth' ? '#4CAF50' : '#2196F3' }]}>
                      {startup.stage}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
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
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    elevation: 2,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 60) / 2,
    marginBottom: 15,
  },
  actionGradient: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  activityCard: {
    marginBottom: 15,
    elevation: 2,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  cardDate: {
    fontSize: 12,
    color: '#666',
  },
  cardStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});