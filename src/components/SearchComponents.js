import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  Dimensions,
  TextInput,
  Platform,
} from 'react-native';
import { Searchbar, Chip, Surface, Button, IconButton, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useTheme } from '../context/ThemeContext';
import { useSearch, FILTER_OPTIONS } from '../context/SearchContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==============================
// Highlighted Text Component
// ==============================
export const HighlightedText = ({ text, highlight, style, highlightStyle }) => {
  const { theme } = useTheme();

  if (!highlight || !text) {
    return <Text style={style}>{text}</Text>;
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(highlight)})`, 'gi'));

  return (
    <Text style={style}>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Text
            key={index}
            style={[
              highlightStyle || {
                backgroundColor: theme?.colors?.warning || '#FFF3CD',
                color: theme?.colors?.text || '#333',
                fontWeight: 'bold',
                borderRadius: 2,
              },
            ]}
          >
            {part}
          </Text>
        ) : (
          <Text key={index}>{part}</Text>
        )
      )}
    </Text>
  );
};

// Helper function to escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==============================
// Global Search Bar Component
// ==============================
export const GlobalSearchBar = ({
  onSearch,
  onFocus,
  placeholder = 'Search startups, research, innovations...',
  showHistory = true,
  autoFocus = false,
}) => {
  const { theme } = useTheme();
  const {
    searchQuery,
    setSearchQuery,
    recentSearches,
    removeFromSearchHistory,
    clearSearchHistory,
    performGlobalSearch,
  } = useSearch();

  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      performGlobalSearch(searchQuery);
      onSearch?.(searchQuery);
      setShowSuggestions(false);
    }
  };

  const handleSelectHistory = (query) => {
    setSearchQuery(query);
    performGlobalSearch(query);
    onSearch?.(query);
    setShowSuggestions(false);
  };

  const styles = getSearchBarStyles(theme);

  return (
    <View style={styles.container}>
      <Surface style={styles.searchSurface}>
        <View style={styles.searchRow}>
          <Ionicons
            name="search"
            size={22}
            color={theme?.colors?.primary || '#667eea'}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={placeholder}
            placeholderTextColor={theme?.colors?.placeholder || '#999'}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
              onFocus?.();
            }}
            onBlur={() => {
              setIsFocused(false);
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus={autoFocus}
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setShowSuggestions(true);
              }}
              style={styles.clearIcon}
            >
              <Ionicons name="close-circle" size={20} color={theme?.colors?.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </Surface>

      {/* Search History Dropdown */}
      {showHistory && showSuggestions && recentSearches.length > 0 && !searchQuery && (
        <Surface style={styles.suggestionsSurface}>
          <View style={styles.suggestionsHeader}>
            <Text style={styles.suggestionsTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={clearSearchHistory}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <Divider />
          {recentSearches.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.suggestionItem}
              onPress={() => handleSelectHistory(item.query)}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={theme?.colors?.textSecondary}
              />
              <Text style={styles.suggestionText}>{item.query}</Text>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  removeFromSearchHistory(item.id);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close"
                  size={16}
                  color={theme?.colors?.textSecondary}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </Surface>
      )}
    </View>
  );
};

// ==============================
// Module Filter Tabs
// ==============================
export const ModuleFilterTabs = ({ onModuleChange }) => {
  const { theme } = useTheme();
  const { filters, updateFilter } = useSearch();
  const scrollRef = useRef(null);

  const styles = getModuleTabsStyles(theme);

  const handleModuleSelect = (moduleKey) => {
    updateFilter('module', moduleKey);
    onModuleChange?.(moduleKey);
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTER_OPTIONS.modules.map((module) => (
        <TouchableOpacity
          key={module.key}
          style={[
            styles.tab,
            filters.module === module.key && styles.activeTab,
          ]}
          onPress={() => handleModuleSelect(module.key)}
        >
          <Ionicons
            name={module.icon}
            size={20}
            color={
              filters.module === module.key
                ? '#fff'
                : theme?.colors?.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              filters.module === module.key && styles.activeTabText,
            ]}
          >
            {module.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ==============================
// Filter Chip Component
// ==============================
export const FilterChip = ({
  label,
  selected,
  onPress,
  icon,
  color,
  showCount,
  count,
}) => {
  const { theme } = useTheme();
  const styles = getFilterChipStyles(theme);

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && [styles.selectedChip, color && { borderColor: color }],
      ]}
      onPress={onPress}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? theme?.colors?.primary : theme?.colors?.textSecondary}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.label,
          selected && [styles.selectedLabel, color && { color }],
        ]}
      >
        {label}
      </Text>
      {showCount && count > 0 && (
        <View style={[styles.countBadge, selected && styles.selectedCountBadge]}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ==============================
// Multi-Select Filter Component
// ==============================
export const MultiSelectFilter = ({
  title,
  options,
  selectedValues,
  onToggle,
  horizontal = true,
}) => {
  const { theme } = useTheme();
  const styles = getMultiSelectStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        horizontal={horizontal}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionsContainer}
      >
        {options.map((option) => (
          <FilterChip
            key={option.key}
            label={option.label}
            selected={selectedValues.includes(option.key)}
            onPress={() => onToggle(option.key)}
            icon={option.icon}
            color={option.color}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// ==============================
// Sort Options Component
// ==============================
export const SortOptions = ({ onSortChange }) => {
  const { theme } = useTheme();
  const { sortBy, setSortBy } = useSearch();
  const [showModal, setShowModal] = useState(false);

  const styles = getSortOptionsStyles(theme);

  const handleSortSelect = (sortKey) => {
    setSortBy(sortKey);
    onSortChange?.(sortKey);
    setShowModal(false);
  };

  const currentSort = FILTER_OPTIONS.sortOptions.find((s) => s.key === sortBy);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setShowModal(true)}
      >
        <Ionicons
          name={currentSort?.icon || 'funnel'}
          size={18}
          color={theme?.colors?.primary}
        />
        <Text style={styles.sortLabel}>{currentSort?.label || 'Sort'}</Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={theme?.colors?.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <Surface style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <Divider />
            {FILTER_OPTIONS.sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortItem,
                  sortBy === option.key && styles.selectedSortItem,
                ]}
                onPress={() => handleSortSelect(option.key)}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={
                    sortBy === option.key
                      ? theme?.colors?.primary
                      : theme?.colors?.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.sortItemText,
                    sortBy === option.key && styles.selectedSortItemText,
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.key && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={theme?.colors?.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </Surface>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ==============================
// Advanced Filters Modal
// ==============================
export const AdvancedFiltersModal = ({ visible, onClose, moduleType = 'all' }) => {
  const { theme } = useTheme();
  const {
    filters,
    updateFilter,
    toggleMultiFilter,
    clearFilters,
    getActiveFilterCount,
    performGlobalSearch,
    searchQuery,
  } = useSearch();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState('start');

  const styles = getAdvancedFiltersStyles(theme);

  const handleApply = () => {
    performGlobalSearch(searchQuery);
    onClose();
  };

  const statusOptions = filters.module !== 'all'
    ? FILTER_OPTIONS.statuses[filters.module] || FILTER_OPTIONS.statuses.startup
    : [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent
    >
      <View style={styles.modalContainer}>
        <Surface style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filters</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
              <IconButton icon="close" onPress={onClose} size={24} />
            </View>
          </View>
          <Divider />

          <ScrollView style={styles.scrollContent}>
            {/* Categories */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.chipContainer}>
                {FILTER_OPTIONS.categories.slice(1).map((cat) => (
                  <FilterChip
                    key={cat.key}
                    label={cat.label}
                    selected={filters.categories.includes(cat.key)}
                    onPress={() => toggleMultiFilter('categories', cat.key)}
                  />
                ))}
              </View>
            </View>

            {/* Locations */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Locations</Text>
              <View style={styles.chipContainer}>
                {FILTER_OPTIONS.locations.slice(1).map((loc) => (
                  <FilterChip
                    key={loc.key}
                    label={loc.label}
                    selected={filters.locations.includes(loc.key)}
                    onPress={() => toggleMultiFilter('locations', loc.key)}
                  />
                ))}
              </View>
            </View>

            {/* Status - Only show when specific module is selected */}
            {statusOptions.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Status</Text>
                <View style={styles.chipContainer}>
                  {statusOptions.slice(1).map((status) => (
                    <FilterChip
                      key={status.key}
                      label={status.label}
                      selected={filters.statuses.includes(status.key)}
                      onPress={() => toggleMultiFilter('statuses', status.key)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Funding Range */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Funding Range</Text>
              <View style={styles.chipContainer}>
                {FILTER_OPTIONS.fundingRanges.map((range) => (
                  <FilterChip
                    key={range.key}
                    label={range.label}
                    selected={filters.fundingRange === range.key}
                    onPress={() => updateFilter('fundingRange', range.key)}
                  />
                ))}
              </View>
            </View>

            {/* Funding Stage */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Funding Stage</Text>
              <View style={styles.chipContainer}>
                {FILTER_OPTIONS.fundingStages.map((stage) => (
                  <FilterChip
                    key={stage.key}
                    label={stage.label}
                    selected={filters.fundingStage === stage.key}
                    onPress={() => updateFilter('fundingStage', stage.key)}
                  />
                ))}
              </View>
            </View>

            {/* Date Range */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Date Range</Text>
              <View style={styles.chipContainer}>
                {FILTER_OPTIONS.dateRanges.map((date) => (
                  <FilterChip
                    key={date.key}
                    label={date.label}
                    selected={filters.dateRange === date.key}
                    onPress={() => {
                      updateFilter('dateRange', date.key);
                      if (date.key === 'custom') {
                        setShowDatePicker(true);
                      }
                    }}
                  />
                ))}
              </View>

              {/* Custom Date Picker */}
              {filters.dateRange === 'custom' && (
                <View style={styles.customDateContainer}>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      setDatePickerType('start');
                      setShowDatePicker(true);
                    }}
                  >
                    <Ionicons name="calendar" size={18} color={theme?.colors?.primary} />
                    <Text style={styles.dateButtonText}>
                      {filters.customDateStart
                        ? filters.customDateStart.toLocaleDateString()
                        : 'Start Date'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.dateRangeSeparator}>to</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      setDatePickerType('end');
                      setShowDatePicker(true);
                    }}
                  >
                    <Ionicons name="calendar" size={18} color={theme?.colors?.primary} />
                    <Text style={styles.dateButtonText}>
                      {filters.customDateEnd
                        ? filters.customDateEnd.toLocaleDateString()
                        : 'End Date'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button mode="outlined" onPress={clearFilters} style={styles.footerButton}>
              Clear
            </Button>
            <Button mode="contained" onPress={handleApply} style={styles.footerButton}>
              Apply Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
            </Button>
          </View>
        </Surface>
      </View>

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={
          datePickerType === 'start'
            ? filters.customDateStart || new Date()
            : filters.customDateEnd || new Date()
        }
        onConfirm={(date) => {
          setShowDatePicker(false);
          if (date) {
            updateFilter(
              datePickerType === 'start' ? 'customDateStart' : 'customDateEnd',
              date
            );
          }
        }}
        onCancel={() => setShowDatePicker(false)}
      />
    </Modal>
  );
};

// ==============================
// Pagination Component
// ==============================
export const Pagination = ({ totalItems, onPageChange }) => {
  const { theme } = useTheme();
  const { currentPage, setCurrentPage, pageSize } = useSearch();

  const totalPages = Math.ceil(totalItems / pageSize);

  const styles = getPaginationStyles(theme);

  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <TouchableOpacity
          key={i}
          style={[styles.pageButton, currentPage === i && styles.activePageButton]}
          onPress={() => {
            setCurrentPage(i);
            onPageChange?.(i);
          }}
        >
          <Text
            style={[
              styles.pageButtonText,
              currentPage === i && styles.activePageButtonText,
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>
      );
    }

    return pages;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.navButton, currentPage === 1 && styles.disabledButton]}
        onPress={handlePrevious}
        disabled={currentPage === 1}
      >
        <Ionicons
          name="chevron-back"
          size={20}
          color={currentPage === 1 ? theme?.colors?.disabled : theme?.colors?.primary}
        />
      </TouchableOpacity>

      {renderPageNumbers()}

      <TouchableOpacity
        style={[
          styles.navButton,
          currentPage === totalPages && styles.disabledButton,
        ]}
        onPress={handleNext}
        disabled={currentPage === totalPages}
      >
        <Ionicons
          name="chevron-forward"
          size={20}
          color={
            currentPage === totalPages
              ? theme?.colors?.disabled
              : theme?.colors?.primary
          }
        />
      </TouchableOpacity>
    </View>
  );
};

// ==============================
// Empty State Component
// ==============================
export const SearchEmptyState = ({ searchQuery, hasFilters, onClearFilters }) => {
  const { theme } = useTheme();
  const styles = getEmptyStateStyles(theme);

  return (
    <View style={styles.container}>
      <Ionicons
        name={searchQuery ? 'search-outline' : 'filter-outline'}
        size={80}
        color={theme?.colors?.disabled}
      />
      <Text style={styles.title}>
        {searchQuery ? 'No Results Found' : 'Start Searching'}
      </Text>
      <Text style={styles.description}>
        {searchQuery
          ? `We couldn't find anything matching "${searchQuery}".`
          : 'Search across startups, research, innovations, and more.'}
        {hasFilters && ' Try adjusting your filters.'}
      </Text>
      {hasFilters && (
        <TouchableOpacity style={styles.clearButton} onPress={onClearFilters}>
          <Text style={styles.clearButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
      {!searchQuery && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Popular Searches:</Text>
          <View style={styles.suggestions}>
            {['AI Startups', 'Healthcare', 'Funding', 'Patents'].map((term) => (
              <Chip key={term} style={styles.suggestionChip} textStyle={styles.suggestionChipText}>
                {term}
              </Chip>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

// ==============================
// Search Result Card Component
// ==============================
export const SearchResultCard = ({ item, searchQuery, type, onPress }) => {
  const { theme } = useTheme();
  const styles = getResultCardStyles(theme);

  const getTypeIcon = () => {
    switch (type) {
      case 'startups':
        return 'rocket';
      case 'research':
        return 'flask';
      case 'innovations':
        return 'bulb';
      case 'ipr':
        return 'shield-checkmark';
      case 'profiles':
        return 'person';
      case 'funding':
        return 'cash';
      default:
        return 'document';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'startups':
        return '#4CAF50';
      case 'research':
        return '#2196F3';
      case 'innovations':
        return '#FF9800';
      case 'ipr':
        return '#9C27B0';
      case 'profiles':
        return '#607D8B';
      case 'funding':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const title = item.title || item.name || 'Untitled';
  const description = item.description || item.bio || '';
  const status = item.status || item.stage || '';
  const category = item.category || item.sector || item.type || '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Surface style={styles.cardSurface}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeIcon, { backgroundColor: getTypeColor() + '15' }]}>
            <Ionicons name={getTypeIcon()} size={22} color={getTypeColor()} />
          </View>
          <View style={styles.headerText}>
            <View style={styles.typeStatusRow}>
              <Text style={[styles.typeLabel, { color: getTypeColor() }]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
              {status && (
                <View style={[styles.statusBadge, { backgroundColor: getTypeColor() + '15' }]}>
                  <Text style={[styles.statusText, { color: getTypeColor() }]}>
                    {status.replace(/_/g, ' ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.cardContent}>
          <HighlightedText
            text={title}
            highlight={searchQuery}
            style={styles.title}
          />
          <HighlightedText
            text={description.length > 120 ? description.slice(0, 120) + '...' : description}
            highlight={searchQuery}
            style={styles.description}
          />

          <View style={styles.cardFooter}>
            {category && (
              <View style={[styles.categoryChip, { backgroundColor: theme?.colors?.background || '#f0f0f0' }]}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            )}
            {item.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={14} color={theme?.colors?.primary} />
                <Text style={styles.locationText}>{item.location}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.chevronContainer}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme?.colors?.textSecondary}
          />
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

// ==============================
// Active Filters Display
// ==============================
export const ActiveFiltersDisplay = ({ onRemoveFilter }) => {
  const { theme } = useTheme();
  const { filters, toggleMultiFilter, updateFilter, sortBy, setSortBy, getActiveFilterCount } = useSearch();

  const styles = getActiveFiltersStyles(theme);

  if (getActiveFilterCount() === 0) return null;

  const activeFilters = [];

  // Module filter
  if (filters.module !== 'all') {
    const module = FILTER_OPTIONS.modules.find(m => m.key === filters.module);
    activeFilters.push({ key: 'module', label: module?.label, type: 'module' });
  }

  // Category filters
  filters.categories.forEach(cat => {
    const category = FILTER_OPTIONS.categories.find(c => c.key === cat);
    activeFilters.push({ key: cat, label: category?.label, type: 'categories' });
  });

  // Location filters
  filters.locations.forEach(loc => {
    const location = FILTER_OPTIONS.locations.find(l => l.key === loc);
    activeFilters.push({ key: loc, label: location?.label, type: 'locations' });
  });

  // Status filters
  filters.statuses.forEach(status => {
    activeFilters.push({ key: status, label: status.replace(/_/g, ' '), type: 'statuses' });
  });

  // Funding range
  if (filters.fundingRange !== 'all') {
    const range = FILTER_OPTIONS.fundingRanges.find(r => r.key === filters.fundingRange);
    activeFilters.push({ key: filters.fundingRange, label: range?.label, type: 'fundingRange' });
  }

  // Funding stage
  if (filters.fundingStage !== 'all') {
    const stage = FILTER_OPTIONS.fundingStages.find(s => s.key === filters.fundingStage);
    activeFilters.push({ key: filters.fundingStage, label: stage?.label, type: 'fundingStage' });
  }

  // Date range
  if (filters.dateRange !== 'all') {
    const date = FILTER_OPTIONS.dateRanges.find(d => d.key === filters.dateRange);
    activeFilters.push({ key: filters.dateRange, label: date?.label, type: 'dateRange' });
  }

  // Sort
  if (sortBy !== 'relevance') {
    const sort = FILTER_OPTIONS.sortOptions.find(s => s.key === sortBy);
    activeFilters.push({ key: sortBy, label: `Sort: ${sort?.label}`, type: 'sort' });
  }

  const handleRemove = (filter) => {
    switch (filter.type) {
      case 'module':
        updateFilter('module', 'all');
        break;
      case 'categories':
      case 'locations':
      case 'statuses':
        toggleMultiFilter(filter.type, filter.key);
        break;
      case 'fundingRange':
        updateFilter('fundingRange', 'all');
        break;
      case 'fundingStage':
        updateFilter('fundingStage', 'all');
        break;
      case 'dateRange':
        updateFilter('dateRange', 'all');
        break;
      case 'sort':
        setSortBy('relevance');
        break;
    }
    onRemoveFilter?.();
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {activeFilters.map((filter, index) => (
        <View key={`${filter.type}-${filter.key}-${index}`} style={styles.filterChip}>
          <Text style={styles.filterLabel}>{filter.label}</Text>
          <TouchableOpacity
            onPress={() => handleRemove(filter)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color={theme?.colors?.primary} />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

// ==============================
// Styles
// ==============================

const getSearchBarStyles = (theme) =>
  StyleSheet.create({
    container: {
      zIndex: 1000,
    },
    searchSurface: {
      borderRadius: 12,
      elevation: 2,
      backgroundColor: theme?.colors?.surface || '#fff',
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 48,
      fontSize: 16,
      color: theme?.colors?.text || '#333',
    },
    suggestionsSurface: {
      position: 'absolute',
      top: 56,
      left: 0,
      right: 0,
      borderRadius: 12,
      elevation: 4,
      backgroundColor: theme?.colors?.surface || '#fff',
      zIndex: 1001,
    },
    suggestionsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
    },
    suggestionsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme?.colors?.textSecondary || '#666',
    },
    clearText: {
      fontSize: 14,
      color: theme?.colors?.primary || '#667eea',
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      gap: 12,
    },
    suggestionText: {
      flex: 1,
      fontSize: 14,
      color: theme?.colors?.text || '#333',
    },
  });

const getModuleTabsStyles = (theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginHorizontal: 4,
      borderRadius: 20,
      backgroundColor: theme?.colors?.surface || '#fff',
      borderWidth: 1,
      borderColor: theme?.colors?.border || '#e0e0e0',
    },
    activeTab: {
      backgroundColor: theme?.colors?.primary + '15' || '#667eea15',
      borderColor: theme?.colors?.primary || '#667eea',
    },
    tabText: {
      marginLeft: 6,
      fontSize: 14,
      color: theme?.colors?.textSecondary || '#666',
    },
    activeTabText: {
      color: theme?.colors?.primary || '#667eea',
      fontWeight: '600',
    },
  });

const getFilterChipStyles = (theme) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      marginBottom: 8,
      borderRadius: 16,
      backgroundColor: theme?.colors?.surface || '#fff',
      borderWidth: 1,
      borderColor: theme?.colors?.border || '#e0e0e0',
    },
    selectedChip: {
      backgroundColor: theme?.colors?.primary + '15' || '#667eea15',
      borderColor: theme?.colors?.primary || '#667eea',
    },
    icon: {
      marginRight: 6,
    },
    label: {
      fontSize: 13,
      color: theme?.colors?.textSecondary || '#666',
    },
    selectedLabel: {
      color: theme?.colors?.primary || '#667eea',
      fontWeight: '500',
    },
    countBadge: {
      marginLeft: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: theme?.colors?.border || '#e0e0e0',
    },
    selectedCountBadge: {
      backgroundColor: theme?.colors?.primary || '#667eea',
    },
    countText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#fff',
    },
  });

const getMultiSelectStyles = (theme) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: theme?.colors?.text || '#333',
      marginBottom: 8,
    },
    optionsContainer: {
      flexWrap: 'wrap',
    },
  });

const getSortOptionsStyles = (theme) =>
  StyleSheet.create({
    container: {},
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: theme?.colors?.surface || '#fff',
      borderWidth: 1,
      borderColor: theme?.colors?.border || '#e0e0e0',
    },
    sortLabel: {
      marginHorizontal: 8,
      fontSize: 14,
      color: theme?.colors?.text || '#333',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: SCREEN_WIDTH * 0.85,
      maxWidth: 320,
      borderRadius: 16,
      backgroundColor: theme?.colors?.surface || '#fff',
      padding: 8,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme?.colors?.text || '#333',
      padding: 16,
    },
    sortItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
    },
    selectedSortItem: {
      backgroundColor: theme?.colors?.primary + '10' || '#667eea10',
    },
    sortItemText: {
      flex: 1,
      fontSize: 15,
      color: theme?.colors?.text || '#333',
    },
    selectedSortItemText: {
      color: theme?.colors?.primary || '#667eea',
      fontWeight: '500',
    },
  });

const getAdvancedFiltersStyles = (theme) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      maxHeight: SCREEN_HEIGHT * 0.85,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: theme?.colors?.surface || '#fff',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme?.colors?.text || '#333',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    clearText: {
      fontSize: 14,
      color: theme?.colors?.primary || '#667eea',
      marginRight: 8,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    filterSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme?.colors?.text || '#333',
      marginBottom: 12,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    customDateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: theme?.colors?.background || '#f5f5f5',
      borderWidth: 1,
      borderColor: theme?.colors?.border || '#e0e0e0',
    },
    dateButtonText: {
      marginLeft: 8,
      fontSize: 14,
      color: theme?.colors?.text || '#333',
    },
    dateRangeSeparator: {
      marginHorizontal: 12,
      color: theme?.colors?.textSecondary || '#666',
    },
    footer: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: theme?.colors?.border || '#e0e0e0',
    },
    footerButton: {
      flex: 1,
    },
  });

const getPaginationStyles = (theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 16,
      gap: 8,
    },
    navButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme?.colors?.surface || '#fff',
      borderWidth: 1,
      borderColor: theme?.colors?.border || '#e0e0e0',
    },
    disabledButton: {
      backgroundColor: theme?.colors?.disabled || '#f0f0f0',
      borderColor: theme?.colors?.disabled || '#f0f0f0',
    },
    pageButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme?.colors?.surface || '#fff',
      borderWidth: 1,
      borderColor: theme?.colors?.border || '#e0e0e0',
    },
    activePageButton: {
      backgroundColor: theme?.colors?.primary || '#667eea',
      borderColor: theme?.colors?.primary || '#667eea',
    },
    pageButtonText: {
      fontSize: 14,
      color: theme?.colors?.text || '#333',
    },
    activePageButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
  });

const getEmptyStateStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme?.colors?.text || '#333',
      marginTop: 20,
      marginBottom: 8,
    },
    description: {
      fontSize: 14,
      color: theme?.colors?.textSecondary || '#666',
      textAlign: 'center',
      lineHeight: 22,
    },
    clearButton: {
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: theme?.colors?.primary || '#667eea',
    },
    clearButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
    suggestionsContainer: {
      marginTop: 32,
      alignItems: 'center',
    },
    suggestionsTitle: {
      fontSize: 13,
      color: theme?.colors?.textSecondary || '#666',
      marginBottom: 12,
    },
    suggestions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    suggestionChip: {
      backgroundColor: theme?.colors?.surface || '#fff',
    },
    suggestionChipText: {
      fontSize: 13,
    },
  });

const getResultCardStyles = (theme) =>
  StyleSheet.create({
    card: {
      marginBottom: 12,
    },
    cardSurface: {
      borderRadius: 20,
      padding: 20,
      backgroundColor: theme?.colors?.surface || '#fff',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      flexDirection: 'column',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    typeIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerText: {
      flex: 1,
    },
    typeStatusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    typeLabel: {
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'capitalize',
    },
    cardContent: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: theme?.colors?.text || '#333',
      marginBottom: 8,
      lineHeight: 24,
    },
    description: {
      fontSize: 15,
      color: theme?.colors?.textSecondary || '#666',
      lineHeight: 22,
      marginBottom: 16,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 10,
    },
    categoryChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    categoryText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme?.colors?.textSecondary || '#666',
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme?.colors?.primary + '10',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
    },
    locationText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme?.colors?.primary,
    },
    chevronContainer: {
      position: 'absolute',
      right: 16,
      bottom: 20,
    },
  });

const getActiveFiltersStyles = (theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 12,
      paddingRight: 6,
      paddingVertical: 6,
      marginRight: 8,
      borderRadius: 16,
      backgroundColor: theme?.colors?.primary + '15' || '#667eea15',
      borderWidth: 1,
      borderColor: theme?.colors?.primary || '#667eea',
    },
    filterLabel: {
      fontSize: 13,
      color: theme?.colors?.primary || '#667eea',
      marginRight: 4,
    },
  });
