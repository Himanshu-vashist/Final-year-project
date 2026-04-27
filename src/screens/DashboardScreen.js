// DashboardScreen.js (Analytics-focused redesign - Style D)
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
  Platform,
  Animated,
} from 'react-native';
import { Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, USER_ROLES } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import EventCalendar from '../components/EventCalendarComponent';


const { width } = Dimensions.get('window');
const isTablet = width > 600;

// Small util: safe number
const safeNum = (v) => (isNaN(Number(v)) ? 0 : Number(v));

/* -----------------------
  Simple Sparkline component (no external libs)
  Accepts small array of numbers and renders vertical bars
------------------------*/
const Sparkline = ({ data = [], color = '#b366ff', height = 28, width = 64 }) => {
  // normalize data
  const vals = (data && data.length) ? data : [0, 0, 0, 0, 0];
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals, 0);
  const range = max - min === 0 ? 1 : max - min;

  return (
    <View style={{ width, height, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      {vals.map((v, i) => {
        const h = ((v - min) / range) * height;
        return (
          <View
            key={i}
            style={{
              width: Math.max(2, (width / vals.length) - 4),
              height: Math.max(2, h),
              backgroundColor: color,
              borderRadius: 2,
              opacity: 0.95,
            }}
          />
        );
      })}
    </View>
  );
};

/* -----------------------
  Mini trend bars for performance row
  Accepts array of historic monthly numbers
------------------------*/
const TrendBars = ({ data = [], color = '#36D1DC', height = 40 }) => {
  const max = Math.max(...data, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
      {data.map((v, i) => {
        const h = (v / max) * height;
        return <View key={i} style={{ width: 8, height: Math.max(4, h), backgroundColor: color, borderRadius: 4, marginRight: 6 }} />;
      })}
    </View>
  );
};

export default function DashboardScreen({ navigation }) {
  const { userProfile, hasPermission, isRole } = useAuth();
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

      if (hasPermission('view_analytics')) {
        const researchSnapshot = await getDocs(collection(db, 'research'));
        const iprSnapshot = await getDocs(collection(db, 'ipr'));
        const startupsSnapshot = await getDocs(collection(db, 'startups'));

        stats.totalResearch = researchSnapshot.size;
        stats.totalIPR = iprSnapshot.size;
        stats.totalStartups = startupsSnapshot.size;

        startupsSnapshot.forEach((doc) => {
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

  const loadRecent = async (col, opts = {}) => {
    try {
      const { roleRestrictField } = opts;
      let q;
      // simple default: public latest 5
      q = query(collection(db, col), where('isPublic', '==', true), orderBy('createdAt', 'desc'), limit(5));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('loadRecent error', col, e);
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
      console.error('loadDashboardData error', err);
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${greeting}, ${userProfile?.name || 'User'}`;
  };

  // Small stat card used in analytics strip
  const AnalyticsStat = ({ icon, label, value, delta = 0, spark = [] }) => {
    const positive = delta >= 0;
    return (
      <View style={styles.analyticsCard}>
        <View style={styles.analyticsTop}>
          <Ionicons name={icon} size={22} color="#fff" />
          <Text style={styles.analyticsLabel}>{label}</Text>
          <View style={{ flex: 1 }} />
          <View style={[styles.deltaBadge, { backgroundColor: positive ? 'rgba(40,200,120,0.12)' : 'rgba(255,80,80,0.12)' }]}>
            <Text style={[styles.deltaText, { color: positive ? '#28C878' : '#FF5050' }]}>{positive ? `+${delta}%` : `${delta}%`}</Text>
          </View>
        </View>

        <View style={styles.analyticsBottom}>
          <View>
            <Text style={styles.analyticsValue}>{value}</Text>
            <Text style={styles.analyticsMini}>This month</Text>
          </View>
          <Sparkline data={spark} color="#ffffff" height={30} width={84} />
        </View>
      </View>
    );
  };

  // Create small synthetic trends for sparklines (if real historical not available)
  const synthTrend = (count = 6, base = 10) => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(Math.max(0, Math.round(base + (Math.sin(i + base) * 4) + (Math.random() * 6))));
    }
    return arr;
  };

  // Build analytics strip values
  const analyticsItems = useMemo(() => {
    const s = dashboardData.stats || {};
    return [
      {
        key: 'research',
        icon: 'flask-outline',
        label: 'Research',
        value: s.totalResearch || 0,
        delta: Math.round((Math.random() * 8) - 3), // placeholder delta
        spark: synthTrend(6, s.totalResearch ? Math.max(6, s.totalResearch / 2) : 8),
      },
      {
        key: 'ipr',
        icon: 'shield-checkmark-outline',
        label: 'IPR',
        value: s.totalIPR || 0,
        delta: Math.round((Math.random() * 8) - 3),
        spark: synthTrend(6, s.totalIPR ? Math.max(3, s.totalIPR / 2) : 5),
      },
      {
        key: 'startups',
        icon: 'rocket-outline',
        label: 'Startups',
        value: s.totalStartups || 0,
        delta: Math.round((Math.random() * 12) - 4),
        spark: synthTrend(6, s.totalStartups ? Math.max(6, s.totalStartups / 2) : 10),
      },
      {
        key: 'funding',
        icon: 'cash-outline',
        label: 'Funding (₹)',
        value: `₹${(safeNum(s.totalFunding)).toLocaleString()}`,
        delta: Math.round((Math.random() * 15) - 6),
        spark: synthTrend(6, Math.round(s.totalFunding ? Math.max(100, s.totalFunding / 100000) : 120)),
      },
    ];
  }, [dashboardData.stats]);

  // Recent item card used for research/ipr/startups lists
  const RecentItem = ({ item, type }) => {
    const title = item.title || item.name || 'Untitled';
    const subtitle = (item.description || '').slice(0, 80);
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.recentListItem}
        onPress={() => {
          if (type === 'ipr') navigation.navigate('IPRDetail', { iprId: item.id });
          if (type === 'startup') navigation.navigate('Startups', { screen: 'StartupDetail', params: { startupId: item.id } });
          if (type === 'research') navigation.navigate('Research', { screen: 'ResearchDetail', params: { researchId: item.id } });
        }}
      >
        <View style={styles.itemLeft}>
          <View style={styles.itemIcon}>
            <Ionicons name={type === 'ipr' ? 'shield-checkmark' : type === 'startup' ? 'rocket' : 'flask'} size={18} color="#b366ff" />
          </View>
        </View>
        <View style={styles.itemBody}>
          <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.itemSubtitle} numberOfLines={2}>{subtitle || 'No description available'}</Text>
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemDate}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Scroll indicator logic
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(1);
  const [containerHeight, setContainerHeight] = useState(1);
  const indicatorHeight = containerHeight / contentHeight * containerHeight;
  const indicatorTranslateY = Animated.multiply(scrollY, containerHeight / contentHeight);

  return (
    <LinearGradient colors={['#0f1226', '#171735']} style={styles.screen}>
      <View style={styles.scrollIndicatorContainer}>
        <Animated.View
          style={[
            styles.scrollIndicator,
            {
              height: indicatorHeight,
              transform: [{ translateY: indicatorTranslateY }],
            },
          ]}
        />
      </View>
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onContentSizeChange={(w, h) => setContentHeight(h)}
        onLayout={e => setContainerHeight(e.nativeEvent.layout.height)}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Header / Welcome */}
        <View style={styles.header}>
          <View style={styles.welcome}>
            <Text style={styles.greeting}>{getWelcomeMessage()}</Text>
            <Text style={styles.subGreeting}>Startup Analytics · Overview</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => navigation.navigate('GlobalSearch')}
            >
              <Ionicons name="search" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Avatar.Text size={54} label={(userProfile?.name || 'U').charAt(0)} style={styles.avatar} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Analytics strip */}
        <View style={styles.analyticsStrip}>
          {analyticsItems.map((it) => (
            <AnalyticsStat
              key={it.key}
              icon={it.icon}
              label={it.label}
              value={it.value}
              delta={it.delta}
              spark={it.spark}
            />
          ))}
        </View>

        {/* Event Calendar - Upcoming Events */}
        <View style={{ marginHorizontal: isTablet ? 36 : 16, marginTop: 18, marginBottom: 18, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 14, borderLeftWidth: 4, borderLeftColor: '#b366ff' }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 8 }}>Upcoming Events</Text>
          <EventCalendar
            source={{
              type: 'static',
              events: [
                { id: '1', title: 'Startup Pitch Day', description: 'Pitch your startup to investors.', start: '2025-12-15T10:00:00Z', end: '2025-12-15T12:00:00Z', location: 'Auditorium', url: 'https://example.com/rsvp', tags: ['pitch', 'startups'] },
                { id: '2', title: 'Research Webinar', description: 'Join our webinar on innovation in research.', start: '2025-12-20T15:00:00Z', end: '2025-12-20T16:30:00Z', location: 'Online', url: 'https://example.com/webinar', tags: ['webinar', 'research'] },
              ],
            }}
            maxResults={5}
            showPast={false}
            style={{ backgroundColor: 'transparent' }}
          />
        </View>



        {/* Performance panel */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Performance</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AnalyticsDetail')}>
              <Text style={styles.viewAll}>View full</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.performanceRow}>
            <View style={styles.performanceLeft}>
              <Text style={styles.performanceLabel}>Monthly active startups</Text>
              {/* TrendBars uses simple views */}
              <TrendBars data={synthTrend(8, 35)} color="#36D1DC" height={48} />
              <Text style={styles.performanceValue}>+12% MoM</Text>
            </View>

            <View style={styles.performanceRight}>
              <Text style={styles.performanceLabel}>Funding velocity</Text>
              <TrendBars data={synthTrend(8, 120)} color="#b366ff" height={48} />
              <Text style={styles.performanceValue}>₹{Math.round(safeNum(dashboardData.stats.totalFunding)).toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Recent lists */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Startups</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Startups', { screen: 'StartupList' })}>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={dashboardData.recentStartups}
            horizontal
            keyExtractor={(i) => i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 20 }}
            renderItem={({ item }) => <RecentItem item={item} type="startup" />}
          />
        </View>

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent IPR</Text>
            <TouchableOpacity onPress={() => navigation.navigate('IPR', { screen: 'IPRList' })}>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={dashboardData.recentIPR}
            horizontal
            keyExtractor={(i) => i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 20 }}
            renderItem={({ item }) => <RecentItem item={item} type="ipr" />}
          />
        </View>

        <View style={[styles.recentSection, { marginBottom: 40 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Research</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Research', { screen: 'ResearchList' })}>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={dashboardData.recentResearch}
            horizontal
            keyExtractor={(i) => i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 20 }}
            renderItem={({ item }) => <RecentItem item={item} type="research" />}
          />
        </View>
      </Animated.ScrollView>
    </LinearGradient>
  );
}

/* -----------------------
  Styles for Analytics D Dashboard
------------------------*/
const styles = StyleSheet.create({
    scrollIndicatorContainer: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 10,
      backgroundColor: 'rgba(255,255,255,0.04)',
      zIndex: 10,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    scrollIndicator: {
      width: 4,
      backgroundColor: '#b366ff',
      borderRadius: 2,
      marginTop: 2,
    },
  screen: {
    flex: 1,
    backgroundColor: '#0f1226',
  },

  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 36,
    paddingHorizontal: isTablet ? 36 : 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcome: {
    flex: 1,
  },
  greeting: {
    color: '#fff',
    fontSize: isTablet ? 26 : 20,
    fontWeight: '800',
  },
  subGreeting: {
    color: '#cfcfe6',
    marginTop: 4,
    fontSize: isTablet ? 14 : 12,
  },
  avatar: {
    backgroundColor: 'rgba(179,102,255,0.14)',
    elevation: 6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(179,102,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Analytics strip */
  analyticsStrip: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: isTablet ? 36 : 16,
    marginTop: 8,
    justifyContent: 'space-between',
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 6,
    minWidth: isTablet ? 220 : 150,
    borderLeftWidth: 3,
    borderLeftColor: '#b366ff',
  },
  analyticsTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  analyticsLabel: { color: '#cfcfe6', marginLeft: 8, fontWeight: '700', fontSize: 13 },
  deltaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deltaText: { fontSize: 11, fontWeight: '700' },

  analyticsBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  analyticsValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  analyticsMini: { color: '#cfcfe6', fontSize: 11 },

  /* Performance panel */
  panel: {
    marginTop: 18,
    marginHorizontal: isTablet ? 36 : 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#36D1DC',
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  viewAll: { color: '#b366ff', fontWeight: '700' },

  performanceRow: { flexDirection: isTablet ? 'row' : 'column', marginTop: 12, gap: 12 },
  performanceLeft: { flex: 1, paddingRight: 8 },
  performanceRight: { flex: 1, paddingLeft: 8 },
  performanceLabel: { color: '#cfcfe6', fontWeight: '700', marginBottom: 8 },
  performanceValue: { color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 8 },

  /* Recent lists */
  recentSection: {
    marginTop: 16,
    paddingTop: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    paddingHorizontal: isTablet ? 36 : 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  recentListItem: {
    width: isTablet ? 320 : width * 0.72,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    marginRight: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#b366ff',
  },
  itemLeft: { marginRight: 10 },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(179,102,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: { flex: 1 },
  itemTitle: { color: '#fff', fontWeight: '800', fontSize: 14 },
  itemSubtitle: { color: '#cfcfe6', fontSize: 12, marginTop: 6 },
  itemRight: { alignItems: 'flex-end', marginLeft: 12 },
  itemDate: { color: '#999', fontSize: 11 },

});
