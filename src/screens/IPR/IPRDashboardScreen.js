import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { Title } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { StatCard, LoadingSpinner } from '../../components/UIComponents';
import { useTheme } from '../../context/ThemeContext';
import moment from 'moment';

const { width } = Dimensions.get('window');

export default function IPRDashboardScreen({ navigation }) {
  const { userProfile, hasPermission } = useAuth();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalApplications: 0,
    granted: 0,
    pending: 0,
    patents: 0,
    trademarks: 0,
    copyrights: 0
  });
  const [recentIPR, setRecentIPR] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadRecentIPR()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      let q;
      if (hasPermission('view_all_data')) {
        q = query(collection(db, 'ipr'));
      } else {
        q = query(
          collection(db, 'ipr'),
          where('userId', '==', userProfile.uid)
        );
      }

      const snapshot = await getDocs(q);
      const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const newStats = {
        totalApplications: applications.length,
        granted: applications.filter(app => app.status === 'granted').length,
        pending: applications.filter(app => ['filed', 'published', 'examined'].includes(app.status)).length,
        patents: applications.filter(app => app.type === 'Patent').length,
        trademarks: applications.filter(app => app.type === 'Trademark').length,
        copyrights: applications.filter(app => app.type === 'Copyright').length
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentIPR = async () => {
    try {
      let q;
      if (hasPermission('view_all_data')) {
        q = query(
          collection(db, 'ipr'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
      } else {
        q = query(
          collection(db, 'ipr'),
          where('userId', '==', userProfile.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
      }

      const snapshot = await getDocs(q);
      const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentIPR(applications);
    } catch (error) {
      console.error('Error loading recent IPR:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
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

  const renderQuickAction = (title, icon, color, onPress) => (
    <TouchableOpacity
      key={title}
      style={styles.quickActionCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#b366ff', '#8b3dc7', '#6a2c96']}
        style={styles.quickActionGradient}
      >
        <Ionicons name={icon} size={28} color="#fff" />
        <Text style={styles.quickActionText}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderRecentCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.recentCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('IPRDetail', { iprId: item.id })}
    >
      <LinearGradient
        colors={['rgba(179, 102, 255, 0.15)', 'rgba(179, 102, 255, 0.05)']}
        style={styles.recentCardGradient}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.iconBadge}>
            <Ionicons 
              name={item.type === 'Patent' ? 'bulb' : item.type === 'Trademark' ? 'ribbon' : 'document-text'} 
              size={20} 
              color="#b366ff" 
            />
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>
        
        <Text style={styles.recentTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <Text style={styles.recentDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.cardBottomRow}>
          <Ionicons name="calendar-outline" size={14} color="#999" />
          <Text style={styles.recentDate}>
            {moment(item.filingDate || item.createdAt).format('DD MMM YYYY')}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f1419']}
          style={styles.gradient}
        >
          <LoadingSpinner />
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
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#b366ff"
              colors={['#b366ff']}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Title style={styles.headerTitle}>IPR Dashboard</Title>
            <Text style={styles.headerSubtitle}>
              Manage your intellectual property rights
            </Text>
          </View>

          {/* Stats Grid */}
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
              icon="bulb-outline"
            />
            <StatCard
              title="Trademarks"
              value={stats.trademarks.toString()}
              icon="ribbon-outline"
            />
            <StatCard
              title="Copyrights"
              value={stats.copyrights.toString()}
              icon="document-text-outline"
            />
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {hasPermission('submit_ipr') && renderQuickAction(
                'Submit IPR',
                'add-circle',
                ['#b366ff', '#8b3dc7'],
                () => navigation.navigate('AddIPR')
              )}
              {renderQuickAction(
                'View All',
                'list',
                ['#b366ff', '#8b3dc7'],
                () => navigation.navigate('IPRList')
              )}
              {renderQuickAction(
                'Track Status',
                'analytics',
                ['#b366ff', '#8b3dc7'],
                () => navigation.navigate('IPRTracking')
              )}
              {hasPermission('view_all_data') && renderQuickAction(
                'Government IPR',
                'shield',
                ['#b366ff', '#8b3dc7'],
                () => navigation.navigate('GovernmentIPR')
              )}
            </View>
          </View>

          {/* Recent Applications */}
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Applications</Text>
              <TouchableOpacity onPress={() => navigation.navigate('IPRList')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {recentIPR.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="shield-checkmark-outline" size={60} color="#666" />
                <Text style={styles.emptyStateText}>No IPR applications yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Submit your first application to get started
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {recentIPR.map(renderRecentCard)}
              </ScrollView>
            )}
          </View>
        </ScrollView>
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
  headerSubtitle: {
    fontSize: 14,
    color: '#ddd',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  quickActionsContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#b366ff',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  quickActionGradient: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  recentSection: {
    marginTop: 30,
    paddingLeft: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingRight: 20,
  },
  viewAllText: {
    color: '#b366ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  horizontalScroll: {
    paddingRight: 20,
  },
  recentCard: {
    width: width * 0.7,
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
    padding: 16,
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
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  recentDescription: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 10,
    lineHeight: 18,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  recentDate: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
