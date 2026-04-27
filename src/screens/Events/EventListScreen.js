import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Searchbar, FAB, Chip, Surface, Badge } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useEvents, EVENT_CATEGORIES } from '../../context/EventContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

export default function EventListScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { userProfile, hasPermission } = useAuth();
  const {
    events,
    upcomingEvents,
    loading,
    fetchEvents,
    categories,
  } = useEvents();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  const styles = getStyles(theme, isDarkMode);

  useEffect(() => {
    fetchEvents({});
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents({});
    setRefreshing(false);
  }, [fetchEvents]);

  // Filter events
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      !searchQuery ||
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || event.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const canCreateEvent = true; // Allow all users to create events

  const formatEventDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getCategoryInfo = (categoryKey) => {
    return categories.find((c) => c.key === categoryKey) || categories[0];
  };

  const renderEventCard = (event) => {
    const category = getCategoryInfo(event.category);
    const spotsLeft = event.maxCapacity
      ? event.maxCapacity - (event.registrationCount || 0)
      : null;
    const isAlmostFull = spotsLeft !== null && spotsLeft <= 5;
    const isFull = spotsLeft !== null && spotsLeft <= 0;

    return (
      <TouchableOpacity
        key={event.id}
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
        activeOpacity={0.8}
      >
        <Surface style={styles.cardSurface}>
          {/* Banner */}
          {event.bannerUrl ? (
            <Image source={{ uri: event.bannerUrl }} style={styles.banner} />
          ) : (
            <LinearGradient
              colors={[category.color, category.color + '80']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.banner}
            >
              <Ionicons name={category.icon} size={40} color="#fff" />
            </LinearGradient>
          )}

          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
            <Ionicons name={category.icon} size={12} color="#fff" />
            <Text style={styles.categoryBadgeText}>{category.label}</Text>
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {event.title}
            </Text>

            <View style={styles.eventMeta}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={theme?.colors?.textSecondary}
                />
                <Text style={styles.metaText}>
                  {formatEventDate(event.startDate)}
                </Text>
              </View>

              {event.location && (
                <View style={styles.metaItem}>
                  <Ionicons
                    name={event.isOnline ? 'videocam-outline' : 'location-outline'}
                    size={14}
                    color={theme?.colors?.textSecondary}
                  />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {event.isOnline ? 'Online' : event.location}
                  </Text>
                </View>
              )}
            </View>

            {/* Registration Status */}
            <View style={styles.cardFooter}>
              {spotsLeft !== null && (
                <View
                  style={[
                    styles.spotsBadge,
                    isFull && styles.spotsFull,
                    isAlmostFull && !isFull && styles.spotsAlmostFull,
                  ]}
                >
                  <Text
                    style={[
                      styles.spotsText,
                      isFull && styles.spotsTextFull,
                      isAlmostFull && !isFull && styles.spotsTextAlmostFull,
                    ]}
                  >
                    {isFull ? 'Full' : `${spotsLeft} spots left`}
                  </Text>
                </View>
              )}

              <View style={styles.attendeesInfo}>
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={theme?.colors?.textSecondary}
                />
                <Text style={styles.attendeesText}>
                  {event.registrationCount || 0} registered
                </Text>
              </View>
            </View>
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme?.colors?.background}
      />

      {/* Header */}
      <LinearGradient
        colors={theme?.gradients?.primary || ['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Events</Text>
            <Text style={styles.headerSubtitle}>
              Workshops & Webinars
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('CalendarView')}
            >
              <Ionicons name="calendar-clear" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            >
              <Ionicons
                name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search workshops, meetups..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor={theme?.colors?.primary}
            placeholderTextColor={theme?.colors?.textSecondary + '80'}
          />
        </View>
      </LinearGradient>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryChip,
              selectedCategory === cat.key && styles.categoryChipActive,
              selectedCategory === cat.key && { borderColor: cat.color },
            ]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Ionicons
              name={cat.icon}
              size={16}
              color={selectedCategory === cat.key ? cat.color : theme?.colors?.textSecondary}
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat.key && { color: cat.color },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Events List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme?.colors?.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming Events Section */}
        {selectedCategory === 'all' && upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CalendarView')}>
                <Text style={styles.seeAllText}>See Calendar</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.upcomingContainer}
            >
              {upcomingEvents.slice(0, 5).map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.upcomingCard}
                  onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                >
                  <LinearGradient
                    colors={[
                      getCategoryInfo(event.category).color,
                      getCategoryInfo(event.category).color + '80',
                    ]}
                    style={styles.upcomingGradient}
                  >
                    <Ionicons
                      name={getCategoryInfo(event.category).icon}
                      size={24}
                      color="#fff"
                    />
                    <Text style={styles.upcomingTitle} numberOfLines={2}>
                      {event.title}
                    </Text>
                    <Text style={styles.upcomingDate}>
                      {formatEventDate(event.startDate)}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'All Events' : getCategoryInfo(selectedCategory).label}
          </Text>
          <Text style={styles.resultCount}>
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={theme?.colors?.disabled} />
            <Text style={styles.emptyTitle}>No Events Found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? `No events match "${searchQuery}"`
                : 'Check back later for upcoming events'}
            </Text>
          </View>
        ) : (
          <View style={[styles.eventsGrid, viewMode === 'grid' && styles.gridLayout]}>
            {filteredEvents.map(renderEventCard)}
          </View>
        )}
      </ScrollView>

      {/* FAB for creating events (admin only) */}
      {canCreateEvent && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme?.colors?.primary }]}
          onPress={() => navigation.navigate('CreateEvent')}
          color="#fff"
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (theme, isDarkMode) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#f8f9fc',
    },
    header: {
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 25,
      paddingBottom: 30,
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
      overflow: 'hidden',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 28,
      paddingTop: 10,
    },
    headerTitle: {
      fontSize: 36,
      fontWeight: '900',
      color: '#fff',
      letterSpacing: -1.2,
    },
    headerSubtitle: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.85)',
      marginTop: 4,
      fontWeight: '600',
    },
    headerActions: {
      flexDirection: 'row',
      gap: 14,
    },
    headerButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.4)',
    },
    searchContainer: {
      paddingHorizontal: 28,
      marginTop: 28,
    },
    searchBar: {
      borderRadius: 16,
      elevation: 6,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      height: 56,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    searchInput: {
      fontSize: 16,
      fontWeight: '600',
    },
    categoriesContainer: {
      paddingHorizontal: 24,
      paddingVertical: 20,
      gap: 12,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 12,
      marginRight: 10,
      borderRadius: 16,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#333' : '#edf2f7',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    categoryChipActive: {
      backgroundColor: theme?.colors?.primary,
      borderColor: theme?.colors?.primary,
      elevation: 6,
    },
    categoryChipText: {
      marginLeft: 8,
      fontSize: 15,
      color: isDarkMode ? '#aaa' : '#64748b',
      fontWeight: '800',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 24,
      paddingBottom: 120,
    },
    section: {
      marginBottom: 36,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: isDarkMode ? '#fff' : '#1e293b',
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    seeAllText: {
      fontSize: 15,
      color: theme?.colors?.primary || '#667eea',
      fontWeight: '800',
    },
    resultCount: {
      fontSize: 15,
      color: isDarkMode ? '#888' : '#64748b',
      fontWeight: '600',
    },
    upcomingContainer: {
      paddingVertical: 8,
    },
    upcomingCard: {
      width: 260,
      height: 180,
      marginRight: 20,
      borderRadius: 28,
      overflow: 'hidden',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    upcomingGradient: {
      flex: 1,
      padding: 24,
      justifyContent: 'space-between',
      borderRadius: 28,
    },
    upcomingTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: '#fff',
      marginTop: 8,
      lineHeight: 26,
    },
    upcomingDate: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.95)',
      fontWeight: '700',
    },
    eventsGrid: {
      gap: 24,
    },
    gridLayout: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    eventCard: {
      marginBottom: 24,
      width: isDesktop ? '48%' : '100%',
      borderRadius: 28,
    },
    cardSurface: {
      borderRadius: 28,
      overflow: 'hidden',
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    banner: {
      height: 170,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryBadge: {
      position: 'absolute',
      top: 18,
      left: 18,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.95)',
    },
    categoryBadgeText: {
      fontSize: 12,
      fontWeight: '900',
      color: '#1e293b',
      marginLeft: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    cardContent: {
      padding: 24,
    },
    eventTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: isDarkMode ? '#fff' : '#1e293b',
      marginBottom: 12,
      lineHeight: 28,
      letterSpacing: -0.5,
    },
    eventMeta: {
      marginBottom: 20,
      gap: 8,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    metaText: {
      fontSize: 15,
      color: isDarkMode ? '#aaa' : '#64748b',
      marginLeft: 10,
      fontWeight: '600',
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1.5,
      borderTopColor: isDarkMode ? '#333' : '#f1f5f9',
      paddingTop: 20,
    },
    spotsBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: isDarkMode ? 'rgba(46, 125, 50, 0.2)' : '#E8F5E9',
    },
    spotsAlmostFull: {
      backgroundColor: isDarkMode ? 'rgba(239, 108, 0, 0.2)' : '#FFF3E0',
    },
    spotsFull: {
      backgroundColor: isDarkMode ? 'rgba(198, 40, 40, 0.2)' : '#FFEBEE',
    },
    spotsText: {
      fontSize: 13,
      fontWeight: '900',
      color: isDarkMode ? '#81C784' : '#2E7D32',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    spotsTextAlmostFull: {
      color: isDarkMode ? '#FFB74D' : '#EF6C00',
    },
    spotsTextFull: {
      color: isDarkMode ? '#E57373' : '#C62828',
    },
    attendeesInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    attendeesText: {
      fontSize: 14,
      color: isDarkMode ? '#ccc' : '#475569',
      marginLeft: 6,
      fontWeight: '700',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: isDarkMode ? '#fff' : '#1e293b',
      marginTop: 24,
      letterSpacing: -0.5,
    },
    emptyDescription: {
      fontSize: 16,
      color: isDarkMode ? '#888' : '#64748b',
      marginTop: 12,
      textAlign: 'center',
      paddingHorizontal: 40,
      lineHeight: 24,
    },
    fab: {
      position: 'absolute',
      right: 24,
      bottom: 30,
      borderRadius: 20,
      width: 64,
      height: 64,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
  });
