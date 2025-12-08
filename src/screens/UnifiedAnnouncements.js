// UnifiedAnnouncements.js
// FINAL VERSION — DARK GRADIENT UI THEME + STATIC DATA + API FALLBACK
// Tabs: MyGov | Research | Policy

import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, RefreshControl, Linking, StyleSheet, TouchableOpacity, Dimensions, Platform } from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  Searchbar,
  Chip,
  ActivityIndicator,
  Text,
  Appbar
} from "react-native-paper";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');
const isTablet = width > 600;

// ------------------------------------------------------------
// STATIC FALLBACK DATA
// ------------------------------------------------------------
const STATIC_DATA = {
  MyGov: [
    {
      id: "mygov-1",
      title: "PM launches National Innovation Drive to boost startup ecosystem",
      description:
        "Government launches the National Innovation Drive to support young entrepreneurs with grants and incubation.",
      date: "2025-01-15",
      url: "https://www.mygov.in/",
      source: "MyGov",
      tags: ["innovation", "startup"]
    },
    {
      id: "mygov-2",
      title: "Digital India completes 10 years, new digital services announced",
      description:
        "New AI-based digital infrastructure rolled out under Digital India for citizen services.",
      date: "2025-01-10",
      url: "https://www.mygov.in/",
      source: "MyGov",
      tags: ["digital", "technology"]
    },
    {
      id: "mygov-3",
      title: "National Research Funding Portal Launched",
      description:
        "A unified portal launched to simplify government-funded research grant applications.",
      date: "2025-01-08",
      url: "https://www.mygov.in/",
      source: "MyGov",
      tags: ["research", "funding"]
    }
  ],

  Research: [
    {
      id: "research-1",
      title: "DST invites proposals for AI-driven healthcare innovations",
      description:
        "DST announces a national call for healthcare artificial intelligence projects.",
      date: "2025-01-12",
      url: "https://dst.gov.in/",
      source: "Research",
      tags: ["ai", "healthcare"]
    },
    {
      id: "research-2",
      title: "DBT launches Biotechnology Fellowship Scheme 2025",
      description:
        "DBT introduces a funding and mentorship scheme for biotechnology researchers.",
      date: "2025-01-09",
      url: "https://dbtindia.gov.in/",
      source: "Research",
      tags: ["biotech", "dbt"]
    }
  ],

  Policy: [
    {
      id: "policy-1",
      title: "Government releases National Startup Policy 2025",
      description:
        "The updated policy includes tax relaxations, simplified compliance, and faster patent approvals.",
      date: "2025-01-18",
      url: "https://www.india.gov.in/",
      source: "Policy",
      tags: ["startup", "policy"]
    },
    {
      id: "policy-2",
      title: "National AI Governance & Ethics Framework published",
      description:
        "A new AI ethics framework establishes responsible use guidelines across sectors.",
      date: "2025-01-11",
      url: "https://www.india.gov.in/",
      source: "Policy",
      tags: ["ai", "ethics"]
    }
  ]
};

// ------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------
const CONFIG = {
  mygovUrl: "https://www.mygov.in/wp-json/wp/v2/posts/?per_page=20",
  dataGovApiKey: "579b464db66ec23bdd00000140f951356f6449f97042e07dea9e83c4",
  resources: {
    researchCalls: "3d43f06b-93bc-4d57-95d3-334d48a0364e",
    policies: "9ef84268-d588-465a-a308-a864a43d0070"
  },
  cacheTTLms: 1000 * 60 * 60 * 6
};

// ------------------------------------------------------------
// CACHE HELPERS
// ------------------------------------------------------------
const nowMs = () => Date.now();
const cacheKey = (k) => `ua_cache_${k}`;

async function readCache(key) {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (nowMs() - parsed.ts > CONFIG.cacheTTLms) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

async function writeCache(key, data) {
  try {
    await AsyncStorage.setItem(cacheKey(key), JSON.stringify({ ts: nowMs(), data }));
  } catch {}
}

// ------------------------------------------------------------
// FETCH FUNCTIONS WITH FALLBACK
// ------------------------------------------------------------
async function fetchMyGov() {
  try {
    const res = await fetch(CONFIG.mygovUrl);
    if (!res.ok) throw new Error();

    const json = await res.json();
    return json.map((post, i) => ({
      id: `mygov-${post.id || i}`,
      title: (post.title?.rendered || "").replace(/<[^>]+>/g, ""),
      description: (post.excerpt?.rendered || "").replace(/<[^>]+>/g, ""),
      date: post.date || "",
      url: post.link || "",
      source: "MyGov",
      tags: ["govt"]
    }));
  } catch {
    return STATIC_DATA.MyGov;
  }
}

async function fetchDataGov(resourceId, fallback) {
  try {
    const url = `https://api.data.gov.in/resource/${resourceId}?api-key=${CONFIG.dataGovApiKey}&format=json&limit=50`;
    const res = await fetch(url);
    if (!res.ok) throw new Error();

    const json = await res.json();
    return (json.records || []).map((r, i) => ({
      id: r.id || `dg-${i}`,
      title: r.title || r.resource_title || "Govt Update",
      description: r.description || "",
      date: r.published_on || r.date || "",
      url: r.url || "",
      source: "Policy",
      tags: r.tags || []
    }));
  } catch {
    return fallback;
  }
}

// ------------------------------------------------------------
// MAIN UI
// ------------------------------------------------------------
export default function UnifiedAnnouncements() {
  const [tab, setTab] = useState("MyGov");
  const [items, setItems] = useState({
    MyGov: STATIC_DATA.MyGov,
    Research: STATIC_DATA.Research,
    Policy: STATIC_DATA.Policy
  });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);

    const mygov = await fetchMyGov();
    const research = await fetchDataGov(CONFIG.resources.researchCalls, STATIC_DATA.Research);
    const policy = await fetchDataGov(CONFIG.resources.policies, STATIC_DATA.Policy);

    setItems({ MyGov: mygov, Research: research, Policy: policy });
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, []);

  const allTags = Array.from(new Set(items[tab].flatMap((i) => i.tags || [])));

  const visible = items[tab].filter((i) => {
    if (activeTag && !i.tags?.includes(activeTag)) return false;
    const q = query.toLowerCase();
    return (
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q)
    );
  });

  const renderCard = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => item.url && Linking.openURL(item.url)}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={tab === "MyGov" ? "megaphone" : tab === "Research" ? "flask" : "document-text"} 
            size={20} 
            color="#b366ff" 
          />
        </View>
        <View style={styles.sourceContainer}>
          <Text style={styles.sourceText}>{item.source}</Text>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
      </View>
      
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.cardDescription} numberOfLines={3}>{item.description}</Text>
      
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {item.tags.slice(0, 3).map((tag, idx) => (
            <View key={idx} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
      
      {item.url && (
        <View style={styles.cardFooter}>
          <Ionicons name="open-outline" size={16} color="#b366ff" />
          <Text style={styles.openText}>Open Link</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#0f1226', '#171735']} style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="megaphone" size={28} color="#b366ff" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Announcements</Text>
            <Text style={styles.headerSubtitle}>Stay updated with latest news</Text>
          </View>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabRow}>
        {["MyGov", "Research", "Policy"].map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabButton, tab === t && styles.tabButtonActive]}
          >
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SEARCH + CLEAR */}
      <View style={styles.controls}>
        <Searchbar
          placeholder={`Search ${tab}`}
          value={query}
          onChangeText={setQuery}
          style={styles.searchbar}
          iconColor="#b366ff"
          placeholderTextColor="#999"
          theme={{ colors: { text: '#fff' } }}
        />
        {(query || activeTag) && (
          <TouchableOpacity 
            onPress={() => { setQuery(""); setActiveTag(null); }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={24} color="#b366ff" />
          </TouchableOpacity>
        )}
      </View>

      {/* TAGS */}
      {allTags.length > 0 && (
        <View style={styles.chipWrap}>
          <TouchableOpacity 
            onPress={() => setActiveTag(null)}
            style={[styles.chip, !activeTag && styles.chipActive]}
          >
            <Text style={[styles.chipText, !activeTag && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {allTags.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setActiveTag((p) => (p === t ? null : t))}
              style={[styles.chip, activeTag === t && styles.chipActive]}
            >
              <Text style={[styles.chipText, activeTag === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* LIST */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#b366ff" />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(i) => i.id}
          renderItem={renderCard}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={loadAll}
              tintColor="#b366ff"
              colors={["#b366ff"]}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color="#666" />
              <Text style={styles.emptyText}>No announcements found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          }
        />
      )}
    </LinearGradient>
  );
}

// ------------------------------------------------------------
// DARK GRADIENT THEME STYLES (Matching Dashboard)
// ------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
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

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    color: '#fff',
    fontSize: isTablet ? 26 : 20,
    fontWeight: '800',
  },

  headerSubtitle: {
    color: '#cfcfe6',
    marginTop: 2,
    fontSize: isTablet ? 14 : 12,
  },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: isTablet ? 36 : 20,
    marginTop: 12,
    marginBottom: 12,
    gap: 12,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(179,102,255,0.2)',
  },

  tabButtonActive: {
    backgroundColor: 'rgba(179,102,255,0.15)',
    borderColor: '#b366ff',
    borderLeftWidth: 3,
  },

  tabLabel: {
    color: '#cfcfe6',
    fontWeight: '600',
    fontSize: 14,
  },

  tabLabelActive: {
    color: '#b366ff',
    fontWeight: '800',
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isTablet ? 36 : 20,
    marginBottom: 12,
    gap: 10,
  },

  searchbar: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    elevation: 0,
  },

  clearButton: {
    padding: 8,
  },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: isTablet ? 36 : 20,
    marginBottom: 12,
    gap: 8,
  },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(179,102,255,0.3)',
  },

  chipActive: {
    backgroundColor: 'rgba(179,102,255,0.2)',
    borderColor: '#b366ff',
  },

  chipText: {
    color: '#cfcfe6',
    fontSize: 12,
    fontWeight: '600',
  },

  chipTextActive: {
    color: '#b366ff',
    fontWeight: '800',
  },

  listContent: {
    paddingHorizontal: isTablet ? 36 : 20,
    paddingBottom: 80,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#b366ff',
    ...Platform.select({
      ios: {
        shadowColor: '#b366ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(179,102,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  sourceContainer: {
    flex: 1,
  },

  sourceText: {
    color: '#b366ff',
    fontSize: 13,
    fontWeight: '700',
  },

  dateText: {
    color: '#999',
    fontSize: 11,
    marginTop: 2,
  },

  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 22,
  },

  cardDescription: {
    color: '#cfcfe6',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },

  tag: {
    backgroundColor: 'rgba(179,102,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(179,102,255,0.3)',
  },

  tagText: {
    color: '#b366ff',
    fontSize: 11,
    fontWeight: '600',
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },

  openText: {
    color: '#b366ff',
    fontSize: 13,
    fontWeight: '700',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },

  loadingText: {
    color: '#cfcfe6',
    fontSize: 14,
    marginTop: 16,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },

  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
  },

  emptySubtext: {
    color: '#cfcfe6',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
