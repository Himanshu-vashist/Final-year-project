// FundingApplicationTracker.js
// React Native (Expo) component to visualize and manage funding application progress
// Features:
// - Kanban-style columns for stages
// - Compact list + detailed card view
// - Visual progress indicator per application
// - Filters (by stage, investor, tag) and search
// - Add / edit application modal (local state)
// - Export CSV (creates a downloadable CSV string and shares via Expo Sharing if available)
// - Easy to drop into an existing app using react-native-paper

import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, TextInput, Modal, Portal, Chip, IconButton, ProgressBar, Searchbar, Text, FAB } from 'react-native-paper';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import EventCalendar from '../components/EventCalendarComponent';

const STAGES = ['Draft', 'Submitted', 'Under Review', 'Interview', 'Term Sheet', 'Funded', 'Rejected'];

// Sample data: replace with real data / fetch from backend
const SAMPLE = [
  { id: 'a1', name: 'Jabsz Studios Seed', stage: 'Submitted', investor: 'Knowledge-Bubble', amount: 50000, submitted: '2025-10-12', tags: ['seed','india'], notes: 'Pitch deck sent. Follow up 2 weeks.' },
  { id: 'a2', name: 'Envisage Beta Grant', stage: 'Under Review', investor: 'Envisage Foundation', amount: 10000, submitted: '2025-11-01', tags: ['grant'], notes: 'Technical evaluation ongoing.' },
  { id: 'a3', name: 'Mobile App Accelerator', stage: 'Interview', investor: 'Innomatics VC', amount: 150000, submitted: '2025-09-20', tags: ['accelerator','product-market-fit'], notes: 'Interview scheduled Dec 8, 2025.' },
  { id: 'a4', name: 'Bridge Loan', stage: 'Draft', investor: '', amount: 20000, submitted: null, tags: ['loan'], notes: '' },
];

function formatCurrency(n) { if (!n && n !== 0) return '-'; return `₹${Number(n).toLocaleString()}`; }

function estimateProgress(stage) {
  // Rough mapping from stage to progress fraction
  const map = { Draft: 0.05, Submitted: 0.25, 'Under Review': 0.5, Interview: 0.7, 'Term Sheet': 0.9, Funded: 1.0, Rejected: 1.0 };
  return map[stage] ?? 0;
}

export default function FundingApplicationTracker({ initial = SAMPLE, onOpenLink }) {
  const [applications, setApplications] = useState(initial);
  const [query, setQuery] = useState('');
  const [activeStage, setActiveStage] = useState(null);
  const [tagFilter, setTagFilter] = useState(null);
  const [selected, setSelected] = useState(null); // for detail modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', stage: 'Draft', investor: '', amount: '', submitted: '', tags: '', notes: '' });

  useEffect(() => {
    // ensure IDs exist
    setApplications(prev => prev.map((p, i) => ({ ...p, id: p.id || `app-${i}` })));
  }, []);

  const tags = useMemo(() => {
    const s = new Set();
    applications.forEach(a => (a.tags || []).forEach(t => s.add(t)));
    return Array.from(s);
  }, [applications]);

  function openDetail(item) {
    setSelected(item);
    setEditing(false);
    setForm({ id: item.id, name: item.name, stage: item.stage, investor: item.investor || '', amount: item.amount || '', submitted: item.submitted || '', tags: (item.tags||[]).join(','), notes: item.notes || '' });
    setModalVisible(true);
  }

  function saveForm() {
    if (!form.name) return Alert.alert('Name required');
    const payload = { id: form.id || `app-${Date.now()}`, name: form.name, stage: form.stage, investor: form.investor, amount: form.amount ? Number(form.amount) : null, submitted: form.submitted || null, tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [], notes: form.notes };
    setApplications(prev => {
      const exists = prev.find(p => p.id === payload.id);
      if (exists) return prev.map(p => p.id === payload.id ? payload : p);
      return [payload, ...prev];
    });
    setModalVisible(false);
  }

  function moveToStage(id, newStage) {
    setApplications(prev => prev.map(p => p.id === id ? ({ ...p, stage: newStage }) : p));
  }

  function exportCSV() {
    // create CSV string
    const header = ['id','name','stage','investor','amount','submitted','tags','notes'];
    const rows = applications.map(a => [a.id, a.name, a.stage, a.investor || '', a.amount ?? '', a.submitted || '', (a.tags||[]).join('|'), (a.notes||'').replace(/\n/g,' ') ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const path = FileSystem.documentDirectory + `funding_export_${Date.now()}.csv`;
    FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 }).then(() => {
      if (Sharing.isAvailableAsync()) {
        Sharing.shareAsync(path).catch(e => Alert.alert('Share failed', String(e)));
      } else {
        Alert.alert('CSV saved', `Saved to ${path}`);
      }
    }).catch(e => Alert.alert('Save failed', String(e)));
  }

  const visible = applications.filter(a => {
    const q = query.trim().toLowerCase();
    if (activeStage && a.stage !== activeStage) return false;
    if (tagFilter && !(a.tags||[]).includes(tagFilter)) return false;
    if (!q) return true;
    return (a.name||'').toLowerCase().includes(q) || (a.investor||'').toLowerCase().includes(q) || (a.tags||[]).join(' ').toLowerCase().includes(q);
  });

  function renderCard(item) {
    return (
      <TouchableOpacity onPress={() => openDetail(item)} style={{ marginBottom: 8 }}>
        <Card>
          <Card.Content>
            <Title numberOfLines={1}>{item.name}</Title>
            <Paragraph>{item.investor ? `${item.investor} • ${formatCurrency(item.amount)}` : formatCurrency(item.amount)}</Paragraph>
            <View style={{ marginTop: 8 }}>
              <ProgressBar progress={estimateProgress(item.stage)} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text variant="bodySmall">{item.stage}</Text>
                <Text variant="bodySmall">{item.submitted || '-'}</Text>
              </View>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => moveToStage(item.id, STAGES[Math.min(STAGES.indexOf(item.stage)+1, STAGES.length-1)])}>Advance</Button>
            <Button onPress={() => moveToStage(item.id, 'Rejected')}>Reject</Button>
          </Card.Actions>
        </Card>
      </TouchableOpacity>
    );
  }

  function renderColumn(stage) {
    const data = visible.filter(a => a.stage === stage);
    return (
      <View style={styles.column} key={stage}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title>{stage}</Title>
          <Chip>{data.length}</Chip>
        </View>
        <FlatList data={data} keyExtractor={i => i.id} renderItem={({ item }) => renderCard(item)} style={{ marginTop: 8 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Searchbar placeholder="Search by name, investor or tag" value={query} onChangeText={setQuery} style={{ flex: 1 }} />
        <IconButton icon="download" onPress={exportCSV} accessibilityLabel="Export" />
      </View>

      <View style={styles.filterRow}>
        <Chip onPress={() => setActiveStage(null)} selected={!activeStage} style={styles.chip}>All Stages</Chip>
        {STAGES.map(s => (
          <Chip key={s} onPress={() => setActiveStage(prev => prev === s ? null : s)} selected={activeStage === s} style={styles.chip}>{s}</Chip>
        ))}
      </View>

      <View style={styles.tagRow}>
        <Chip onPress={() => setTagFilter(null)} selected={!tagFilter} style={styles.chip}>All Tags</Chip>
        {tags.map(t => (<Chip key={t} onPress={() => setTagFilter(prev => prev === t ? null : t)} selected={tagFilter === t} style={styles.chip}>{t}</Chip>))}
      </View>


      {/* Event Calendar - Upcoming Funding Events */}
      <View style={{ marginVertical: 12, backgroundColor: 'rgba(179,102,255,0.04)', borderRadius: 10, padding: 10 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>Upcoming Funding Events</Text>
        <EventCalendar
          source={{
            type: 'static',
            events: [
              { id: 'f1', title: 'Seed Funding Webinar', description: 'Learn about seed funding opportunities.', start: '2025-12-18T14:00:00Z', end: '2025-12-18T15:00:00Z', location: 'Online', url: 'https://example.com/seed-webinar', tags: ['webinar', 'funding'] },
              { id: 'f2', title: 'Investor Q&A', description: 'Q&A session with top investors.', start: '2025-12-22T16:00:00Z', end: '2025-12-22T17:00:00Z', location: 'Conference Room B', url: 'https://example.com/investor-qa', tags: ['investor', 'qa'] },
            ],
          }}
          maxResults={3}
          showPast={false}
          style={{ backgroundColor: 'transparent' }}
        />
      </View>

      <View style={styles.kanbanWrap}>
        <FlatList horizontal data={STAGES} keyExtractor={s=>s} renderItem={({ item }) => renderColumn(item)} />
      </View>

      <FAB icon="plus" label="Add" style={styles.fab} onPress={() => { setForm({ id: '', name: '', stage: 'Draft', investor: '', amount: '', submitted: '', tags: '', notes: '' }); setEditing(true); setModalVisible(true); }} />

      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
          <Title>{editing ? 'Add / Edit Application' : (selected ? 'Application Details' : 'Details')}</Title>
          {!editing && selected ? (
            <View>
              <Paragraph style={{ marginTop: 8 }}>{selected.notes || 'No notes'}</Paragraph>
              <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Button onPress={() => { setEditing(true); setForm({ id: selected.id, name: selected.name, stage: selected.stage, investor: selected.investor, amount: selected.amount, submitted: selected.submitted, tags: (selected.tags||[]).join(','), notes: selected.notes }); }}>Edit</Button>
                <Button onPress={() => { setModalVisible(false); setSelected(null); }}>Close</Button>
              </View>
            </View>
          ) : (
            <View>
              <TextInput label="Name" value={form.name} onChangeText={(t)=>setForm({...form,name:t})} />
              <TextInput label="Investor" value={form.investor} onChangeText={(t)=>setForm({...form,investor:t})} />
              <TextInput label="Amount" value={String(form.amount||'')} onChangeText={(t)=>setForm({...form,amount:t})} keyboardType="numeric" />
              <TextInput label="Submitted (YYYY-MM-DD)" value={form.submitted} onChangeText={(t)=>setForm({...form,submitted:t})} />
              <TextInput label="Tags (comma separated)" value={form.tags} onChangeText={(t)=>setForm({...form,tags:t})} />
              <TextInput label="Notes" value={form.notes} onChangeText={(t)=>setForm({...form,notes:t})} multiline numberOfLines={4} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <Button mode="contained" onPress={saveForm}>Save</Button>
                <Button onPress={() => { setModalVisible(false); setEditing(false); }}>Cancel</Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: { marginRight: 6, marginBottom: 6 },
  kanbanWrap: { flex: 1 },
  column: { width: 300, paddingRight: 12, paddingLeft: 6 },
  modal: { backgroundColor: 'white', padding: 16, margin: 20, borderRadius: 8 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});

/*
USAGE:

<FundingApplicationTracker initial={yourApplicationsArray} />

Where each application has shape:
{
  id: 'unique',
  name: 'Application title',
  stage: one of STAGES,
  investor: 'Investor name',
  amount: 50000,
  submitted: 'YYYY-MM-DD',
  tags: ['seed','grant'],
  notes: '...'
}

IMPROVEMENTS YOU CAN ASK FOR:
- Backend sync (CRUD) with Firestore / REST API
- Drag-and-drop support between columns
- Gantt / timeline view for long pipelines
- Analytics: conversion rates per stage, average time in stage
- Reminders / calendar integration for follow-ups
- Email templates and automated outreach from each card
*/
