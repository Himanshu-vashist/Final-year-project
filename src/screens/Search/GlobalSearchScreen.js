import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Surface, Divider, FAB, Badge } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSearch } from '../../context/SearchContext';
import {
  GlobalSearchBar,
  ModuleFilterTabs,
  SortOptions,
  AdvancedFiltersModal,
  Pagination,
  SearchEmptyState,
  SearchResultCard,
  ActiveFiltersDisplay,
  HighlightedText,
} from '../../components/SearchComponents';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

export default function GlobalSearchScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const {
    searchQuery,
    searchResults,
    totalResults,
    isSearching,
    filters,
    performGlobalSearch,
    clearFilters,
    getActiveFilterCount,
    currentPage,
    pageSize,
    recentSearches,
    searchHistory,
  } = useSearch();

  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  const styles = getStyles(theme, isDarkMode);

  // Perform initial search when component mounts
  useEffect(() => {
    if (searchQuery) {
      performGlobalSearch();
    }
  }, []);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await performGlobalSearch(searchQuery);
    setRefreshing(false);
  }, [searchQuery, performGlobalSearch]);

  // Navigate to detail screen based on item type
  const handleItemPress = (item, type) => {
    switch (type) {
      case 'startups':
        navigation.navigate('Startups', {
          screen: 'StartupDetail',
          params: { startup: item },
        });
        break;
      case 'research':
        navigation.navigate('Research', {
          screen: 'ResearchDetail',
          params: { research: item },
        });
        break;
      case 'innovations':
        navigation.navigate('Innovation', {
          screen: 'InnovationDetail',
          params: { idea: item },
        });
        break;
      case 'ipr':
        navigation.navigate('IPR', {
          screen: 'IPRDetail',
          params: { ipr: item },
        });
        break;
      case 'profiles':
        navigation.navigate('Profile', { userId: item.id });
        break;
      default:
        break;
    }
  };

  // Get paginated results
  const getPaginatedResults = () => {
    const allResults = [];

    // Combine results based on selected module
    if (filters.module === 'all') {
      Object.entries(searchResults).forEach(([type, items]) => {
        items.forEach((item) => {
          allResults.push({ ...item, _type: type });
        });
      });
    } else {
      const items = searchResults[filters.module] || [];
      items.forEach((item) => {
        allResults.push({ ...item, _type: filters.module });
      });
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allResults.slice(startIndex, endIndex);
  };

  // Get result counts by module
  const getModuleCounts = () => {
    return {
      all: totalResults,
      startups: searchResults.startups?.length || 0,
      research: searchResults.research?.length || 0,
      innovations: searchResults.innovations?.length || 0,
      ipr: searchResults.ipr?.length || 0,
      profiles: searchResults.profiles?.length || 0,
      funding: searchResults.funding?.length || 0,
    };
  };

  const paginatedResults = getPaginatedResults();
  const moduleCounts = getModuleCounts();
  const activeFilterCount = getActiveFilterCount();

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
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Explore</Text>
            <Text style={styles.headerSubtitle}>Discover the ecosystem</Text>
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            <Ionicons
              name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <GlobalSearchBar
            onSearch={() => performGlobalSearch()}
            placeholder="Search startups, research, innovations..."
            autoFocus={!searchQuery}
          />
        </View>
      </LinearGradient>

      {/* Module Filter Tabs */}
      <Surface style={styles.tabsContainer}>
        <ModuleFilterTabs
          onModuleChange={() => performGlobalSearch(searchQuery)}
        />
      </Surface>

      {/* Filters and Sort Row */}
      <View style={styles.filtersRow}>
        <View style={styles.filtersLeft}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilterCount > 0 && styles.activeFilterButton,
            ]}
            onPress={() => setShowFiltersModal(true)}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={
                activeFilterCount > 0
                  ? theme?.colors?.primary
                  : theme?.colors?.textSecondary
              }
            />
            <Text
              style={[
                styles.filterButtonText,
                activeFilterCount > 0 && styles.activeFilterButtonText,
              ]}
            >
              Filters
            </Text>
            {activeFilterCount > 0 && (
              <Badge size={18} style={styles.filterBadge}>
                {activeFilterCount}
              </Badge>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.filtersRight}>
          <SortOptions onSortChange={() => performGlobalSearch(searchQuery)} />
        </View>
      </View>

      {/* Active Filters */}
      <ActiveFiltersDisplay onRemoveFilter={() => performGlobalSearch(searchQuery)} />

      {/* Results Count */}
      {(searchQuery || activeFilterCount > 0) && !isSearching && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsCount}>
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
            {searchQuery && ` for "${searchQuery}"`}
          </Text>
          {filters.module !== 'all' && (
            <Text style={styles.moduleFilter}>
              in{' '}
              {filters.module.charAt(0).toUpperCase() + filters.module.slice(1)}
            </Text>
          )}
        </View>
      )}

      {/* Content */}
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
        {/* Loading State */}
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme?.colors?.primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {/* Empty State */}
        {!isSearching && paginatedResults.length === 0 && (
          <SearchEmptyState
            searchQuery={searchQuery}
            hasFilters={activeFilterCount > 0}
            onClearFilters={() => {
              clearFilters();
              performGlobalSearch(searchQuery);
            }}
          />
        )}

        {/* Search Results */}
        {!isSearching && paginatedResults.length > 0 && (
          <View style={styles.resultsContainer}>
            {/* Module Summary (when showing all) */}
            {filters.module === 'all' && searchQuery && (
              <View style={styles.moduleSummary}>
                {Object.entries(moduleCounts)
                  .filter(([key, count]) => key !== 'all' && count > 0)
                  .map(([key, count]) => (
                    <TouchableOpacity
                      key={key}
                      style={styles.summaryItem}
                      onPress={() => {
                        const { updateFilter } = useSearch();
                        updateFilter('module', key);
                        performGlobalSearch(searchQuery);
                      }}
                    >
                      <Ionicons
                        name={getModuleIcon(key)}
                        size={16}
                        color={theme?.colors?.primary}
                      />
                      <Text style={styles.summaryText}>
                        {count} {key}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}

            {/* Results List */}
            {paginatedResults.map((item, index) => (
              <SearchResultCard
                key={`${item._type}-${item.id}-${index}`}
                item={item}
                searchQuery={searchQuery}
                type={item._type}
                onPress={() => handleItemPress(item, item._type)}
              />
            ))}

            {/* Pagination */}
            {totalResults > pageSize && (
              <Pagination
                totalItems={totalResults}
                onPageChange={() => {
                  // Scroll to top when page changes
                }}
              />
            )}
          </View>
        )}

        {/* Recent Searches (when no search) */}
        {!searchQuery && !isSearching && searchHistory.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent Searches</Text>
            {searchHistory.slice(0, 10).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recentItem}
                onPress={() => {
                  const { setSearchQuery, performGlobalSearch } = useSearch();
                  setSearchQuery(item.query);
                  performGlobalSearch(item.query);
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={theme?.colors?.textSecondary}
                />
                <View style={styles.recentItemContent}>
                  <Text style={styles.recentItemQuery}>{item.query}</Text>
                  <Text style={styles.recentItemTime}>
                    {formatDate(item.timestamp)}
                  </Text>
                </View>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={theme?.colors?.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Search Suggestions */}
        {!searchQuery && !isSearching && searchHistory.length === 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.sectionTitle}>Explore</Text>
            <View style={styles.quickLinks}>
              <QuickSearchLink
                icon="rocket"
                title="Startups"
                subtitle="Browse registered startups"
                onPress={() => {
                  navigation.navigate('Startups');
                }}
                theme={theme}
              />
              <QuickSearchLink
                icon="flask"
                title="Research"
                subtitle="Discover research projects"
                onPress={() => {
                  navigation.navigate('Research');
                }}
                theme={theme}
              />
              <QuickSearchLink
                icon="bulb"
                title="Innovations"
                subtitle="Explore innovation ideas"
                onPress={() => {
                  navigation.navigate('Innovation');
                }}
                theme={theme}
              />
              <QuickSearchLink
                icon="shield-checkmark"
                title="IPR"
                subtitle="View intellectual property"
                onPress={() => {
                  navigation.navigate('IPR');
                }}
                theme={theme}
              />
            </View>

            <Text style={styles.sectionTitle}>Popular Searches</Text>
            <View style={styles.popularSearches}>
              {[
                'AI Startups',
                'Healthcare Innovation',
                'Green Technology',
                'FinTech',
                'Patents',
                'Series A Funding',
              ].map((term) => (
                <TouchableOpacity
                  key={term}
                  style={styles.popularTag}
                  onPress={() => {
                    const { setSearchQuery, performGlobalSearch } = useSearch();
                    setSearchQuery(term);
                    performGlobalSearch(term);
                  }}
                >
                  <Text style={styles.popularTagText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Advanced Filters Modal */}
      <AdvancedFiltersModal
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        moduleType={filters.module}
      />
    </SafeAreaView>
  );
}

// Helper Components
const QuickSearchLink = ({ icon, title, subtitle, onPress, theme }) => (
  <TouchableOpacity style={getQuickLinkStyles(theme).container} onPress={onPress}>
    <View style={[getQuickLinkStyles(theme).iconContainer, { backgroundColor: theme?.colors?.primary + '15' }]}>
      <Ionicons name={icon} size={24} color={theme?.colors?.primary} />
    </View>
    <View style={getQuickLinkStyles(theme).textContainer}>
      <Text style={getQuickLinkStyles(theme).title}>{title}</Text>
      <Text style={getQuickLinkStyles(theme).subtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={theme?.colors?.textSecondary} />
  </TouchableOpacity>
);

// Helper Functions
const getModuleIcon = (module) => {
  const icons = {
    startups: 'rocket',
    research: 'flask',
    innovations: 'bulb',
    ipr: 'shield-checkmark',
    profiles: 'people',
    funding: 'cash',
  };
  return icons[module] || 'apps';
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return date.toLocaleDateString();
};

// Styles
const getStyles = (theme, isDarkMode) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme?.colors?.background || '#f5f5f5',
    },
    header: {
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
      paddingBottom: 24,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 10,
    },
    headerButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.25)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    headerTitleContainer: {
      flex: 1,
      marginLeft: 16,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: '#fff',
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '500',
      marginTop: 2,
    },
    searchBarContainer: {
      paddingHorizontal: 24,
      marginTop: 24,
    },
    tabsContainer: {
      backgroundColor: theme?.colors?.surface || '#fff',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
    },
    filtersRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme?.colors?.background || '#f5f5f5',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 100,
      backgroundColor: theme?.colors?.surface || '#fff',
      borderWidth: 1,
      borderColor: theme?.colors?.border || '#eee',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    activeFilterButton: {
      backgroundColor: theme?.colors?.primary,
      borderColor: theme?.colors?.primary,
    },
    filterButtonText: {
      marginLeft: 8,
      fontSize: 14,
      color: theme?.colors?.textSecondary || '#666',
      fontWeight: '700',
    },
    activeFilterButtonText: {
      color: '#fff',
    },
    filterBadge: {
      marginLeft: 6,
      backgroundColor: '#fff',
      color: theme?.colors?.primary,
      fontWeight: '800',
    },
    resultsInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: 'transparent',
    },
    resultsCount: {
      fontSize: 14,
      color: theme?.colors?.textSecondary || '#666',
      fontWeight: '600',
    },
    moduleFilter: {
      fontSize: 14,
      color: theme?.colors?.primary || '#667eea',
      marginLeft: 6,
      fontWeight: '700',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 32,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme?.colors?.textSecondary || '#666',
    },
    resultsContainer: {
      padding: 16,
    },
    moduleSummary: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 16,
      gap: 8,
    },
    summaryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme?.colors?.primary + '10' || '#667eea10',
    },
    summaryText: {
      marginLeft: 6,
      fontSize: 13,
      color: theme?.colors?.primary || '#667eea',
      fontWeight: '500',
    },
    recentSection: {
      padding: 16,
    },
    recentTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme?.colors?.text || '#333',
      marginBottom: 16,
    },
    recentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme?.colors?.border || '#e0e0e0',
    },
    recentItemContent: {
      flex: 1,
      marginLeft: 12,
    },
    recentItemQuery: {
      fontSize: 15,
      color: theme?.colors?.text || '#333',
      fontWeight: '500',
    },
    recentItemTime: {
      fontSize: 12,
      color: theme?.colors?.textSecondary || '#666',
      marginTop: 2,
    },
    suggestionsSection: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme?.colors?.text || '#333',
      marginBottom: 16,
      marginTop: 8,
    },
    quickLinks: {
      gap: 12,
    },
    popularSearches: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    popularTag: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme?.colors?.surface || '#fff',
      borderWidth: 1,
      borderColor: theme?.colors?.border || '#e0e0e0',
    },
    popularTagText: {
      fontSize: 14,
      color: theme?.colors?.text || '#333',
    },
  });

const getQuickLinkStyles = (theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme?.colors?.surface || '#fff',
      marginBottom: 8,
      elevation: 1,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textContainer: {
      flex: 1,
      marginLeft: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme?.colors?.text || '#333',
    },
    subtitle: {
      fontSize: 13,
      color: theme?.colors?.textSecondary || '#666',
      marginTop: 2,
    },
  });
