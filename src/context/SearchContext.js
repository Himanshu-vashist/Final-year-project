import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const SearchContext = createContext();

const SEARCH_HISTORY_KEY = '@search_history';
const MAX_SEARCH_HISTORY = 20;

// Filter options for all modules
export const FILTER_OPTIONS = {
  categories: [
    { key: 'all', label: 'All Categories' },
    { key: 'technology', label: 'Technology' },
    { key: 'healthcare', label: 'Healthcare' },
    { key: 'education', label: 'Education' },
    { key: 'agriculture', label: 'Agriculture' },
    { key: 'fintech', label: 'FinTech' },
    { key: 'energy', label: 'Clean Energy' },
    { key: 'manufacturing', label: 'Manufacturing' },
    { key: 'environment', label: 'Environment' },
    { key: 'social', label: 'Social Innovation' },
    { key: 'transportation', label: 'Transportation' },
    { key: 'ecommerce', label: 'E-commerce' },
    { key: 'media', label: 'Media & Entertainment' },
    { key: 'logistics', label: 'Logistics' },
  ],
  sectors: [
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
    { key: 'media', label: 'Media & Entertainment' },
  ],
  locations: [
    { key: 'all', label: 'All Locations' },
    { key: 'andhra_pradesh', label: 'Andhra Pradesh' },
    { key: 'karnataka', label: 'Karnataka' },
    { key: 'maharashtra', label: 'Maharashtra' },
    { key: 'telangana', label: 'Telangana' },
    { key: 'tamil_nadu', label: 'Tamil Nadu' },
    { key: 'delhi', label: 'Delhi NCR' },
    { key: 'gujarat', label: 'Gujarat' },
    { key: 'kerala', label: 'Kerala' },
    { key: 'west_bengal', label: 'West Bengal' },
    { key: 'rajasthan', label: 'Rajasthan' },
  ],
  statuses: {
    startup: [
      { key: 'all', label: 'All Statuses' },
      { key: 'ideation', label: 'Ideation' },
      { key: 'validation', label: 'Validation' },
      { key: 'early_stage', label: 'Early Stage' },
      { key: 'growth', label: 'Growth' },
      { key: 'expansion', label: 'Expansion' },
      { key: 'mature', label: 'Mature' },
      { key: 'exit', label: 'Exit/IPO' },
    ],
    research: [
      { key: 'all', label: 'All Statuses' },
      { key: 'ongoing', label: 'Ongoing' },
      { key: 'completed', label: 'Completed' },
      { key: 'paused', label: 'Paused' },
      { key: 'cancelled', label: 'Cancelled' },
    ],
    innovation: [
      { key: 'all', label: 'All Statuses' },
      { key: 'submitted', label: 'Submitted' },
      { key: 'under_review', label: 'Under Review' },
      { key: 'approved', label: 'Approved' },
      { key: 'in_incubation', label: 'In Incubation' },
      { key: 'prototype', label: 'Prototype' },
      { key: 'pilot', label: 'Pilot Testing' },
      { key: 'market_ready', label: 'Market Ready' },
      { key: 'rejected', label: 'Rejected' },
    ],
    ipr: [
      { key: 'all', label: 'All Statuses' },
      { key: 'draft', label: 'Draft' },
      { key: 'filed', label: 'Filed' },
      { key: 'published', label: 'Published' },
      { key: 'examined', label: 'Examined' },
      { key: 'granted', label: 'Granted' },
      { key: 'rejected', label: 'Rejected' },
      { key: 'abandoned', label: 'Abandoned' },
    ],
  },
  fundingRanges: [
    { key: 'all', label: 'All Ranges' },
    { key: '0-100000', label: 'Below ₹1 Lakh', min: 0, max: 100000 },
    { key: '100000-500000', label: '₹1-5 Lakhs', min: 100000, max: 500000 },
    { key: '500000-1000000', label: '₹5-10 Lakhs', min: 500000, max: 1000000 },
    { key: '1000000-5000000', label: '₹10-50 Lakhs', min: 1000000, max: 5000000 },
    { key: '5000000-10000000', label: '₹50 Lakhs - 1 Cr', min: 5000000, max: 10000000 },
    { key: '10000000-50000000', label: '₹1-5 Crores', min: 10000000, max: 50000000 },
    { key: '50000000+', label: 'Above ₹5 Crores', min: 50000000, max: Infinity },
  ],
  fundingStages: [
    { key: 'all', label: 'All Stages' },
    { key: 'bootstrapped', label: 'Bootstrapped' },
    { key: 'pre_seed', label: 'Pre-Seed' },
    { key: 'seed', label: 'Seed' },
    { key: 'series_a', label: 'Series A' },
    { key: 'series_b', label: 'Series B' },
    { key: 'series_c', label: 'Series C+' },
  ],
  dateRanges: [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'quarter', label: 'This Quarter' },
    { key: 'year', label: 'This Year' },
    { key: 'custom', label: 'Custom Range' },
  ],
  sortOptions: [
    { key: 'relevance', label: 'Relevance', icon: 'star' },
    { key: 'date_desc', label: 'Newest First', icon: 'time' },
    { key: 'date_asc', label: 'Oldest First', icon: 'time-outline' },
    { key: 'popularity', label: 'Most Popular', icon: 'trending-up' },
    { key: 'rating', label: 'Highest Rated', icon: 'star' },
    { key: 'name_asc', label: 'Name (A-Z)', icon: 'text' },
    { key: 'name_desc', label: 'Name (Z-A)', icon: 'text-outline' },
  ],
  modules: [
    { key: 'all', label: 'All', icon: 'apps' },
    { key: 'startups', label: 'Startups', icon: 'rocket' },
    { key: 'research', label: 'Research', icon: 'flask' },
    { key: 'innovations', label: 'Innovations', icon: 'bulb' },
    { key: 'ipr', label: 'IPR', icon: 'shield-checkmark' },
    { key: 'profiles', label: 'Profiles', icon: 'people' },
    { key: 'funding', label: 'Funding', icon: 'cash' },
  ],
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
};

export function SearchProvider({ children }) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({
    startups: [],
    research: [],
    innovations: [],
    ipr: [],
    profiles: [],
    funding: [],
  });
  const [totalResults, setTotalResults] = useState(0);

  // Filter state
  const [filters, setFilters] = useState({
    module: 'all',
    categories: [],
    sectors: [],
    locations: [],
    statuses: [],
    fundingRange: 'all',
    fundingStage: 'all',
    dateRange: 'all',
    customDateStart: null,
    customDateEnd: null,
  });

  // Sort state
  const [sortBy, setSortBy] = useState('relevance');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [hasMore, setHasMore] = useState(true);

  // Load search history from storage
  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        const parsedHistory = JSON.parse(history);
        setSearchHistory(parsedHistory);
        setRecentSearches(parsedHistory.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveSearchHistory = async (newHistory) => {
    try {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const addToSearchHistory = useCallback(async (query) => {
    if (!query.trim()) return;

    const newEntry = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: new Date().toISOString(),
      filters: { ...filters },
    };

    setSearchHistory((prev) => {
      // Remove duplicate queries
      const filtered = prev.filter(
        (item) => item.query.toLowerCase() !== query.toLowerCase()
      );
      // Add new entry at the beginning and limit to max
      const newHistory = [newEntry, ...filtered].slice(0, MAX_SEARCH_HISTORY);
      setRecentSearches(newHistory.slice(0, 5));
      saveSearchHistory(newHistory);
      return newHistory;
    });
  }, [filters]);

  const removeFromSearchHistory = useCallback(async (id) => {
    setSearchHistory((prev) => {
      const newHistory = prev.filter((item) => item.id !== id);
      setRecentSearches(newHistory.slice(0, 5));
      saveSearchHistory(newHistory);
      return newHistory;
    });
  }, []);

  const clearSearchHistory = useCallback(async () => {
    setSearchHistory([]);
    setRecentSearches([]);
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  }, []);

  // Apply date filter
  const getDateFilter = () => {
    const now = new Date();
    switch (filters.dateRange) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      case 'quarter':
        return new Date(now.setMonth(now.getMonth() - 3));
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      case 'custom':
        return filters.customDateStart;
      default:
        return null;
    }
  };

  // Search across all modules
  const performGlobalSearch = async (searchTerm = searchQuery) => {
    if (!searchTerm.trim() && filters.module === 'all') {
      setSearchResults({
        startups: [],
        research: [],
        innovations: [],
        ipr: [],
        profiles: [],
        funding: [],
      });
      setTotalResults(0);
      return;
    }

    setIsSearching(true);
    const searchLower = searchTerm.toLowerCase().trim();

    try {
      const results = {
        startups: [],
        research: [],
        innovations: [],
        ipr: [],
        profiles: [],
        funding: [],
      };

      const searchPromises = [];

      // Search Startups
      if (filters.module === 'all' || filters.module === 'startups') {
        searchPromises.push(
          searchCollection('startups', searchLower).then((data) => {
            results.startups = data;
          })
        );
      }

      // Search Research
      if (filters.module === 'all' || filters.module === 'research') {
        searchPromises.push(
          searchCollection('research', searchLower).then((data) => {
            results.research = data;
          })
        );
      }

      // Search Innovations
      if (filters.module === 'all' || filters.module === 'innovations') {
        searchPromises.push(
          searchCollection('innovations', searchLower).then((data) => {
            results.innovations = data;
          })
        );
      }

      // Search IPR
      if (filters.module === 'all' || filters.module === 'ipr') {
        searchPromises.push(
          searchCollection('ipr', searchLower).then((data) => {
            results.ipr = data;
          })
        );
      }

      // Search Profiles
      if (filters.module === 'all' || filters.module === 'profiles') {
        searchPromises.push(
          searchCollection('users', searchLower).then((data) => {
            results.profiles = data;
          })
        );
      }

      await Promise.all(searchPromises);

      // Apply filters and sorting
      const filteredResults = applyFiltersAndSort(results, searchLower);
      setSearchResults(filteredResults);

      // Calculate total results
      const total = Object.values(filteredResults).reduce(
        (sum, arr) => sum + arr.length,
        0
      );
      setTotalResults(total);

      // Add to history if search term exists
      if (searchTerm.trim()) {
        addToSearchHistory(searchTerm);
      }
    } catch (error) {
      console.error('Error performing global search:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Search a single collection
  const searchCollection = async (collectionName, searchLower) => {
    try {
      const q = query(
        collection(db, collectionName),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        _collection: collectionName,
      }));

      // Client-side text search
      if (searchLower) {
        return data.filter((item) => {
          const searchableFields = [
            item.title,
            item.name,
            item.description,
            item.category,
            item.sector,
            item.stage,
            item.status,
            item.location,
            item.organization,
            ...(item.tags || []),
          ].filter(Boolean);

          return searchableFields.some((field) =>
            field.toString().toLowerCase().includes(searchLower)
          );
        });
      }

      return data;
    } catch (error) {
      console.error(`Error searching ${collectionName}:`, error);
      return [];
    }
  };

  // Apply filters and sorting to results
  const applyFiltersAndSort = (results, searchLower) => {
    const filtered = { ...results };
    const dateFilter = getDateFilter();

    Object.keys(filtered).forEach((key) => {
      let items = filtered[key];

      // Apply category filter
      if (filters.categories.length > 0) {
        items = items.filter(
          (item) =>
            filters.categories.includes(item.category) ||
            filters.categories.includes(item.sector)
        );
      }

      // Apply location filter
      if (filters.locations.length > 0) {
        items = items.filter((item) =>
          filters.locations.includes(item.location) ||
          filters.locations.includes(item.state)
        );
      }

      // Apply status filter
      if (filters.statuses.length > 0) {
        items = items.filter(
          (item) =>
            filters.statuses.includes(item.status) ||
            filters.statuses.includes(item.stage)
        );
      }

      // Apply funding range filter
      if (filters.fundingRange !== 'all') {
        const range = FILTER_OPTIONS.fundingRanges.find(
          (r) => r.key === filters.fundingRange
        );
        if (range) {
          items = items.filter((item) => {
            const funding = item.fundingAmount || item.budget || 0;
            return funding >= range.min && funding < range.max;
          });
        }
      }

      // Apply funding stage filter
      if (filters.fundingStage !== 'all') {
        items = items.filter(
          (item) => item.fundingStage === filters.fundingStage
        );
      }

      // Apply date filter
      if (dateFilter) {
        items = items.filter((item) => {
          const itemDate = item.createdAt?.toDate?.() || new Date(item.createdAt);
          return itemDate >= dateFilter;
        });
      }

      // Apply sorting
      items = sortResults(items, sortBy, searchLower);

      filtered[key] = items;
    });

    return filtered;
  };

  // Sort results
  const sortResults = (items, sortKey, searchLower) => {
    return [...items].sort((a, b) => {
      switch (sortKey) {
        case 'relevance':
          // Calculate relevance score based on search term match
          const scoreA = calculateRelevanceScore(a, searchLower);
          const scoreB = calculateRelevanceScore(b, searchLower);
          return scoreB - scoreA;

        case 'date_desc':
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB - dateA;

        case 'date_asc':
          const dateA2 = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB2 = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateA2 - dateB2;

        case 'popularity':
          return (b.views || b.popularity || 0) - (a.views || a.popularity || 0);

        case 'rating':
          return (b.rating || 0) - (a.rating || 0);

        case 'name_asc':
          return (a.title || a.name || '').localeCompare(b.title || b.name || '');

        case 'name_desc':
          return (b.title || b.name || '').localeCompare(a.title || a.name || '');

        default:
          return 0;
      }
    });
  };

  // Calculate relevance score for sorting
  const calculateRelevanceScore = (item, searchLower) => {
    if (!searchLower) return 0;

    let score = 0;
    const title = (item.title || item.name || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    const tags = (item.tags || []).map((t) => t.toLowerCase());

    // Exact title match gets highest score
    if (title === searchLower) score += 100;
    // Title starts with search term
    else if (title.startsWith(searchLower)) score += 80;
    // Title contains search term
    else if (title.includes(searchLower)) score += 60;

    // Tag exact match
    if (tags.includes(searchLower)) score += 40;

    // Description contains search term
    if (description.includes(searchLower)) score += 20;

    // Count occurrences
    const occurrences = (description.match(new RegExp(searchLower, 'g')) || []).length;
    score += occurrences * 5;

    return score;
  };

  // Update individual filter
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  }, []);

  // Toggle multi-select filter
  const toggleMultiFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const currentValues = prev[key] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return {
        ...prev,
        [key]: newValues,
      };
    });
    setCurrentPage(1);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      module: 'all',
      categories: [],
      sectors: [],
      locations: [],
      statuses: [],
      fundingRange: 'all',
      fundingStage: 'all',
      dateRange: 'all',
      customDateStart: null,
      customDateEnd: null,
    });
    setSortBy('relevance');
    setCurrentPage(1);
  }, []);

  // Reset search
  const resetSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults({
      startups: [],
      research: [],
      innovations: [],
      ipr: [],
      profiles: [],
      funding: [],
    });
    setTotalResults(0);
    clearFilters();
  }, [clearFilters]);

  // Get active filter count
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (filters.module !== 'all') count++;
    count += filters.categories.length;
    count += filters.sectors.length;
    count += filters.locations.length;
    count += filters.statuses.length;
    if (filters.fundingRange !== 'all') count++;
    if (filters.fundingStage !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    if (sortBy !== 'relevance') count++;
    return count;
  }, [filters, sortBy]);

  const value = {
    // Search state
    searchQuery,
    setSearchQuery,
    searchHistory,
    recentSearches,
    isSearching,
    searchResults,
    totalResults,

    // Search actions
    performGlobalSearch,
    addToSearchHistory,
    removeFromSearchHistory,
    clearSearchHistory,
    resetSearch,

    // Filter state
    filters,
    setFilters,
    updateFilter,
    toggleMultiFilter,
    clearFilters,
    getActiveFilterCount,

    // Sort state
    sortBy,
    setSortBy,

    // Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    hasMore,
    setHasMore,

    // Filter options
    filterOptions: FILTER_OPTIONS,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}
