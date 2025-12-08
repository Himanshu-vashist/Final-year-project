// UnifiedAnnouncements.js
// React Native (Expo) — Announcements using MyGov + data.gov.in
// Tabs: MyGov | Research | Policy
// - MyGov: https://www.mygov.in/wp-json/wp/v2/posts/?per_page=20
// - data.gov.in resources (Research & Policy)
// - AsyncStorage caching, search, tag filters, pull-to-refresh

import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, RefreshControl, Linking, StyleSheet } from "react-native";
import { Card, Title, Paragraph, Button, Searchbar, Chip, ActivityIndicator, Text, Appbar } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// ---------- CONFIG ----------
const CONFIG = {
  mygovUrl: "https://www.mygov.in/wp-json/wp/v2/posts/?per_page=20",
  dataGovApiKey: "579b464db66ec23bdd00000140f951356f6449f97042e07dea9e83c4", // optional
  resources: {
    researchCalls: "3d43f06b-93bc-4d57-95d3-334d48a0364e",
    policies: "9ef84268-d588-465a-a308-a864a43d0070"
  },
  cacheTTLms: 1000 * 60 * 60 * 6 // 6 hours
};

// ---------- Helpers ----------
const nowMs = () => Date.now();
const cacheKey = (k) => `ua_cache_${k}`;

async function readCache(key) {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.ts && nowMs() - parsed.ts > CONFIG.cacheTTLms) return null;
    return parsed.data;
  } catch (e) {
    console.warn("readCache error", e);
    return null;
  }
}

async function writeCache(key, data) {
  try {
    await AsyncStorage.setItem(cacheKey(key), JSON.stringify({ ts: nowMs(), data }));
  } catch (e) {
    console.warn("writeCache error", e);
  }
}

// ---------- Fetchers ----------

/** MyGov posts fetcher (returns normalized items) */
async function fetchMyGov() {
  const res = await fetch(CONFIG.mygovUrl);
  if (!res.ok) throw new Error(`MyGov fetch failed (HTTP ${res.status})`);
  const json = await res.json();
  return (json || []).map((post, idx) => ({
    id: post.id ? `mygov-${post.id}` : `mygov-${idx}`,
    title: (post.title?.rendered || "").replace(/<[^>]+>/g, "") || "MyGov Update",
    description: (post.excerpt?.rendered || "").replace(/<[^>]+>/g, "") || "",
    date: post.date || "",
    url: post.link || "",
    source: "MyGov",
    tags: ["govt"]
  }));
}

/** data.gov.in generic fetcher (resourceId must be a valid resource) */
async function fetchDataGov(resourceId, limit = 50) {
  const apiKey = CONFIG.dataGovApiKey && CONFIG.dataGovApiKey !== "YOUR_DATA_GOV_API_KEY"
    ? CONFIG.dataGovApiKey
    : null;

  const url = apiKey
    ? `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=${limit}`
    : `https://api.data.gov.in/resource/${resourceId}?format=json&limit=${limit}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`data.gov.in fetch failed (HTTP ${res.status})`);
  const json = await res.json();
  const records = json.records || json.data || [];
  return (records || []).map((r, i) => ({
    id: r.id ? `dg-${r.id}` : `dg-${i}`,
    title: r.title || r.resource_title || r.name || "Announcement",
    description: r.description || r.summary || "",
    date: r.published_on || r.date || "",
    url: r.url || (r.metadata && r.metadata.url) || "",
    source: "Policy",
    tags: (r.tags || []).slice(0, 5)
  }));
}

// ---------- Component ----------
export default function UnifiedAnnouncements() {
  const [tab, setTab] = useState("MyGov"); // MyGov | Research | Policy
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState({ MyGov: [], Research: [], Policy: [] });
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);

    try {
      // MyGov
      const cachedMyGov = !force && await readCache("mygov");
      const mygov = cachedMyGov || await fetchMyGov();
      if (!cachedMyGov) writeCache("mygov", mygov);

      // Research (data.gov)
      const cachedResearch = !force && await readCache("research");
      let research = cachedResearch;
      try {
        if (!cachedResearch) research = await fetchDataGov(CONFIG.resources.researchCalls, 50);
      } catch (e) {
        research = cachedResearch || [];
      }
      if (!cachedResearch) writeCache("research", research);

      // Policy (data.gov)
      const cachedPolicy = !force && await readCache("policy");
      let policy = cachedPolicy;
      try {
        if (!cachedPolicy) policy = await fetchDataGov(CONFIG.resources.policies, 50);
      } catch (e) {
        policy = cachedPolicy || [];
      }
      if (!cachedPolicy) writeCache("policy", policy);

      setItems({ MyGov: mygov, Research: research, Policy: policy });
    } catch (e) {
      console.warn("loadAll error", e);
      setError(String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll(false);
  }, [loadAll]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll(true);
  };

  const allTags = Array.from(new Set(Object.values(items).flat().flatMap(i => i.tags || []))).slice(0, 20);

  const visible = (items[tab] || []).filter(it => {
    if (activeTag && !(it.tags || []).includes(activeTag)) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (it.title || "").toLowerCase().includes(q) ||
           (it.description || "").toLowerCase().includes(q) ||
           (it.tags || []).join(" ").toLowerCase().includes(q);
  });

  function renderCard({ item }) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title numberOfLines={2}>{item.title}</Title>
          {item.description ? <Paragraph numberOfLines={3} style={{ marginTop: 6 }}>{item.description}</Paragraph> : null}
          <Text style={{ marginTop: 8, color: "#666" }}>{item.source} {item.date ? `• ${item.date}` : ""}</Text>
        </Card.Content>
        {item.url ? (
          <Card.Actions>
            <Button onPress={() => Linking.openURL(item.url)}>Open</Button>
          </Card.Actions>
        ) : null}
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={{ backgroundColor: "#6c47ff" }}>
        <Ionicons name="megaphone" size={26} color="#fff" style={{ marginLeft: 12 }} />
        <Appbar.Content title="Announcements" titleStyle={{ color: "#fff" }} />
      </Appbar.Header>

      <View style={styles.tabRow}>
        {["MyGov", "Research", "Policy"].map(t => (
          <Button
            key={t}
            mode={tab === t ? "contained" : "outlined"}
            onPress={() => setTab(t)}
            style={[styles.tabButton, tab === t && styles.tabButtonActive]}
            labelStyle={tab === t ? styles.tabLabelActive : styles.tabLabel}
          >
            {t}
          </Button>
        ))}
      </View>

      <View style={styles.controls}>
        <Searchbar placeholder={`Search ${tab}`} value={query} onChangeText={setQuery} style={styles.searchbar} />
        <Button onPress={() => { setQuery(''); setActiveTag(null); }} style={styles.clearBtn}>Clear</Button>
      </View>

      <View style={styles.pillsRow}>
        <Chip onPress={() => setActiveTag(null)} selected={!activeTag} style={styles.chip}>All</Chip>
        {allTags.map(t => (
          <Chip key={t} onPress={() => setActiveTag(prev => prev === t ? null : t)} selected={activeTag === t} style={[styles.chip, activeTag === t && styles.chipActive]}>{t}</Chip>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator animating size="large" color="#6c47ff" />
          <Text style={{ marginTop: 12, color: "#6c47ff" }}>Loading announcements...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle" size={36} color="#ff5252" />
          <Text style={styles.errorText}>Error: {error}</Text>
          <Button mode="contained" onPress={() => loadAll(true)} style={{ marginTop: 12 }}>Retry</Button>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={i => i.id}
          renderItem={renderCard}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<View style={{ padding: 20 }}><Text>No announcements found for {tab}.</Text></View>}
          contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
        />
      )}
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7fa" },
  tabRow: { flexDirection: "row", justifyContent: "space-around", padding: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  tabButton: { flex: 1, marginHorizontal: 6, borderRadius: 20, elevation: 0 },
  tabButtonActive: { backgroundColor: "#6c47ff" },
  tabLabel: { fontWeight: "600", color: "#6c47ff" },
  tabLabelActive: { fontWeight: "700", color: "#fff" },
  controls: { flexDirection: "row", padding: 8, alignItems: "center", gap: 8, backgroundColor: "#fff" },
  searchbar: { flex: 1, backgroundColor: "#f3f3fa", borderRadius: 12 },
  clearBtn: { marginLeft: 8, backgroundColor: "#eee", borderRadius: 12 },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, marginBottom: 6 },
  chip: { marginRight: 8, marginBottom: 8, backgroundColor: "#eae6ff" },
  chipActive: { backgroundColor: "#6c47ff", color: "#fff" },
  card: { marginBottom: 10 },
  loadingWrap: { alignItems: "center", justifyContent: "center", marginTop: 40 },
  errorWrap: { alignItems: "center", justifyContent: "center", marginTop: 40 },
  errorText: { color: "#ff5252", fontSize: 15, marginTop: 8 }
});
