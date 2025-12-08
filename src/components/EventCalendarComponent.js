// EventCalendarComponent.js
// React Native component (works with Expo / react-native-paper)
// Features:
// - Supports 3 data sources: Google Calendar (public or with API key), Eventbrite (token), or a static events array
// - Shows upcoming events, search, tag filter, RSVP/link button, pull-to-refresh
// - Easy to drop into an existing app (uses react-native-paper for UI)
// Usage examples are below in the comments.

import React, { useEffect, useState, useMemo } from 'react';
import { View, FlatList, RefreshControl, Linking, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, Searchbar, Chip, ActivityIndicator, Text } from 'react-native-paper';

// ---------- Helper utilities ----------
const isoNow = () => new Date().toISOString();

function formatDateRange(start, end) {
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const opts = { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
  if (!e) return s.toLocaleString(undefined, opts);
  // If same day, show "Aug 12, 10:00 — 12:00"
  if (s.toDateString() === e.toDateString()) {
    const datePart = s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const timePart = `${s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return `${datePart}, ${timePart}`;
  }
  return `${s.toLocaleString(undefined, opts)} — ${e.toLocaleString(undefined, opts)}`;
}

// Normalize events to a common shape used by the component
// { id, title, description, start, end, location, url, tags: [] }

// ---------- Fetchers / Integrations ----------

async function fetchGoogleCalendarEvents({ apiKey, calendarId, timeMin = isoNow(), maxResults = 50 }) {
  // calendarId can be a public calendar email (e.g. en.usa#holiday@group.v.calendar.google.com) or a user's calendar
  // Make sure the calendar is public if you don't use OAuth.
  const encodedCal = encodeURIComponent(calendarId);
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodedCal}/events?key=${apiKey}&timeMin=${encodeURIComponent(timeMin)}&singleEvents=true&orderBy=startTime&maxResults=${maxResults}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Google Calendar fetch failed: ${r.status}`);
  const json = await r.json();
  const items = (json.items || []).map((it) => {
    const start = it.start?.dateTime || it.start?.date; // all-day events may have date
    const end = it.end?.dateTime || it.end?.date;
    const tags = [];
    if (it.summary) {
      // rudimentary tag extraction: words in [] or hashtags
      const bracket = it.summary.match(/\[(.*?)\]/);
      if (bracket) tags.push(bracket[1]);
      const hashtags = it.description ? Array.from(it.description.matchAll(/#(\w+)/g)).map(m => m[1]) : [];
      tags.push(...hashtags);
    }
    return {
      id: it.id,
      title: it.summary || 'Untitled',
      description: it.description || '',
      start,
      end,
      location: it.location || null,
      url: it.htmlLink || null,
      tags,
    };
  });
  return items;
}

async function fetchEventbriteEvents({ token, organizationId, timeMin = isoNow(), pageSize = 50 }) {
  // This uses Eventbrite's Organizer/Organization events endpoint. You need a personal token with appropriate scopes.
  // For a public organizer you can use the /organizations/:id/events endpoint.
  const url = `https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/?status=live&expand=venue&order_by=start_desc&page=1&page_size=${pageSize}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`Eventbrite fetch failed: ${r.status}`);
  const json = await r.json();
  const items = (json.events || []).map((ev) => ({
    id: ev.id,
    title: ev.name?.text || 'Untitled',
    description: ev.description?.text || '',
    start: ev.start?.utc || ev.start?.local,
    end: ev.end?.utc || ev.end?.local,
    location: ev.venue ? `${ev.venue.name || ''} ${ev.venue.address?.localized_address_display || ''}`.trim() : null,
    url: ev.url || null,
    tags: (ev.category_id ? [String(ev.category_id)] : []).concat(ev.tags || []),
  }));
  return items;
}

// ---------- Component ----------

export default function EventCalendar({
  source = { type: 'static', events: [] },
  maxResults = 50,
  showPast = false,
  style,
}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      let items = [];
      if (source.type === 'google') {
        items = await fetchGoogleCalendarEvents({ apiKey: source.apiKey, calendarId: source.calendarId, maxResults });
      } else if (source.type === 'eventbrite') {
        items = await fetchEventbriteEvents({ token: source.token, organizationId: source.organizationId, pageSize: maxResults });
      } else if (source.type === 'static') {
        items = (source.events || []).map((it, idx) => ({ id: it.id || `static-${idx}`, ...it }));
      } else {
        throw new Error('Unknown source type');
      }

      // Optionally filter out past events
      const now = new Date();
      const filtered = items.filter(ev => showPast || new Date(ev.start) >= now).sort((a,b)=> new Date(a.start) - new Date(b.start));
      setEvents(filtered);
    } catch (err) {
      console.error(err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, [source]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const tags = useMemo(() => {
    const s = new Set();
    events.forEach(ev => (ev.tags || []).forEach(t => s.add(t)));
    return Array.from(s).slice(0, 12);
  }, [events]);

  const visibleEvents = events.filter(ev => {
    const q = query.trim().toLowerCase();
    if (activeTag && !(ev.tags || []).includes(activeTag)) return false;
    if (!q) return true;
    return (ev.title || '').toLowerCase().includes(q) || (ev.description || '').toLowerCase().includes(q) || (ev.location || '').toLowerCase().includes(q);
  });

  function renderEvent({ item }) {
    return (
      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <Title>{item.title}</Title>
          <Paragraph>{formatDateRange(item.start, item.end)}</Paragraph>
          {item.location ? <Paragraph style={{ marginTop: 6 }}>{item.location}</Paragraph> : null}
          {item.description ? <Paragraph numberOfLines={3} style={{ marginTop: 8 }}>{item.description}</Paragraph> : null}
        </Card.Content>
        <Card.Actions>
          {item.url ? <Button onPress={() => Linking.openURL(item.url)}>View / RSVP</Button> : null}
          {item.location ? <Button onPress={() => { /* optionally open Maps with query */ Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`); }}>Open map</Button> : null}
        </Card.Actions>
      </Card>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Searchbar placeholder="Search events, descriptions, location..." value={query} onChangeText={setQuery} style={styles.search} />

      <View style={styles.pillsRow}>
        <Chip onPress={() => setActiveTag(null)} selected={!activeTag} style={styles.chip}>All</Chip>
        {tags.map(t => (
          <Chip key={t} onPress={() => setActiveTag(prev => prev === t ? null : t)} selected={activeTag === t} style={styles.chip}>{t}</Chip>
        ))}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator animating={true} style={{ marginTop: 20 }} />
      ) : error ? (
        <View style={{ padding: 20 }}>
          <Text style={{ color: 'red' }}>Error: {error}</Text>
          <Button mode="contained" onPress={fetchAll} style={{ marginTop: 12 }}>Retry</Button>
        </View>
      ) : (
        <FlatList
          data={visibleEvents}
          keyExtractor={(i) => i.id}
          renderItem={renderEvent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<View style={{ padding: 20 }}><Text>No upcoming events found.</Text></View>}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  card: { marginVertical: 8 },
  search: { marginBottom: 8 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { marginRight: 6, marginBottom: 6 },
});

// ---------- How to use ----------
/*
1) Google Calendar (public calendar or API key)

<EventCalendar
  source={{ type: 'google', apiKey: 'YOUR_GOOGLE_API_KEY', calendarId: 'yourcalendar@group.calendar.google.com' }}
/>

- Make sure the calendar is "Make available to public" in Google Calendar settings if you use only an API key.
- For private calendars you must implement a backend using OAuth2 and pass events to the app.

2) Eventbrite

<EventCalendar
  source={{ type: 'eventbrite', token: 'EVENTBRITE_PERSONAL_OAUTH_TOKEN', organizationId: '123456789' }}
/>

3) Static (for testing or embedding curated events)

<EventCalendar
  source={{ type: 'static', events: [
    { id: '1', title: 'Startup Masterclass', description: 'How to build traction', start: '2025-12-20T10:00:00Z', end: '2025-12-20T12:00:00Z', location: 'Online', url: 'https://example.com/rsvp', tags: ['webinar','startups'] },
    // ...
  ] }}
/>

Extras & improvements you might add later:
- A month-grid calendar view (using a library or custom canvas) showing dots for days with events.
- Local caching (AsyncStorage) and offline support.
- Deep linking / calendar sync (add to device calendar) using expo-calendar or react-native-add-calendar-event.
- Better iCal parsing: fetch public .ics and parse on server or use a lightweight iCal parser library.
*/