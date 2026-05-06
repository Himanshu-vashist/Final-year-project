import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import EventCalendar from '../components/EventCalendarComponent';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const { userProfile } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    recentResearch: [],
    recentIPR: [],
    recentStartups: [],
    stats: { totalResearch: 0, totalIPR: 0, totalStartups: 0, totalFunding: 0 },
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
      const [resSnap, iprSnap, startupSnap] = await Promise.all([
        getDocs(collection(db, 'research')),
        getDocs(collection(db, 'ipr')),
        getDocs(collection(db, 'startups'))
      ]);

      stats.totalResearch = resSnap.size;
      stats.totalIPR = iprSnap.size;
      stats.totalStartups = startupSnap.size;

      startupSnap.forEach((doc) => {
        const data = doc.data();
        if (data?.totalFunding) stats.totalFunding += Number(data.totalFunding) || 0;
      });

      return stats;
    } catch (error) {
      console.error('Error loading stats:', error);
      return { totalResearch: 0, totalIPR: 0, totalStartups: 0, totalFunding: 0 };
    }
  };

  const loadRecent = async (col) => {
    try {
      const q = query(collection(db, col), orderBy('createdAt', 'desc'), limit(5));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      return [];
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [recentResearch, recentIPR, recentStartups, stats] = await Promise.all([
        loadRecent('research'),
        loadRecent('ipr'),
        loadRecent('startups'),
        loadStats(),
      ]);
      setDashboardData({ recentResearch, recentIPR, recentStartups, stats });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString()}`;
  };

  const StatCard = ({ label, value, icon, color, trend }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {trend && <Text style={[styles.statTrend, { color: trend.startsWith('+') ? '#4CAF50' : '#FF5252' }]}>{trend}</Text>}
      </View>
    </View>
  );

  const QuickAction = ({ title, icon, color, onPress }) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <Text style={styles.actionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a3e', '#12122b']} style={StyleSheet.absoluteFill} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#b366ff" />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Hello,</Text>
            <Text style={styles.userName}>{userProfile?.name || 'Innovation Hub'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar.Text 
              size={50} 
              label={(userProfile?.name || 'U').charAt(0)} 
              style={styles.avatar} 
              labelStyle={{ color: '#fff', fontWeight: 'bold' }}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <StatCard 
            label="Total Startups" 
            value={dashboardData.stats.totalStartups} 
            icon="rocket" 
            color="#b366ff" 
            trend="+12%" 
          />
          <StatCard 
            label="Funding Raised" 
            value={formatCurrency(dashboardData.stats.totalFunding)} 
            icon="cash" 
            color="#4CAF50" 
            trend="+8%" 
          />
          <StatCard 
            label="IPR Filed" 
            value={dashboardData.stats.totalIPR} 
            icon="shield-checkmark" 
            color="#2196F3" 
            trend="+5%" 
          />
          <StatCard 
            label="Research Papers" 
            value={dashboardData.stats.totalResearch} 
            icon="flask" 
            color="#FF9800" 
            trend="+3%" 
          />
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickAction title="Add Startup" icon="add-circle" color="#b366ff" onPress={() => navigation.navigate('Startups', { screen: 'RegisterStartup' })} />
          <QuickAction title="Add Idea" icon="bulb" color="#FF9800" onPress={() => navigation.navigate('Innovation', { screen: 'AddInnovation' })} />
          <QuickAction title="File IPR" icon="document-text" color="#2196F3" onPress={() => navigation.navigate('IPR', { screen: 'IPRRegister' })} />
          <QuickAction title="Investors" icon="people" color="#4CAF50" onPress={() => navigation.navigate('Investors')} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Startups</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Startups', { screen: 'StartupList' })}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.listContainer}>
          {dashboardData.recentStartups.length === 0 ? (
            <Text style={styles.emptyText}>No recent startups found.</Text>
          ) : (
            dashboardData.recentStartups.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.listItem}
                onPress={() => navigation.navigate('Startups', { screen: 'StartupDetail', params: { startupId: item.id } })}
              >
                <View style={styles.listIcon}>
                  <Ionicons name="rocket" size={20} color="#b366ff" />
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>{item.name}</Text>
                  <Text style={styles.listSubtitle}>{item.sector || 'N/A'} • {item.stage || 'Ideation'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <View style={styles.eventsCard}>
          <EventCalendar
            source={{
              type: 'static',
              events: [
                { id: '1', title: 'Startup Pitch Day', start: '2025-12-15T10:00:00Z', end: '2025-12-15T12:00:00Z', location: 'Hall A' },
                { id: '2', title: 'Investor Meetup', start: '2025-12-20T15:00:00Z', end: '2025-12-20T16:30:00Z', location: 'Virtual' },
              ],
            }}
            maxResults={2}
          />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  welcomeText: {
    color: '#aaa',
    fontSize: 16,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  avatar: {
    backgroundColor: '#b366ff',
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  statTrend: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionItem: {
    alignItems: 'center',
    width: '22%',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
  },
  actionText: {
    color: '#ccc',
    fontSize: 11,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
  },
  viewAllText: {
    color: '#b366ff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  listContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(179,102,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  listSubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  eventsCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  }
});
