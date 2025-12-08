// FundingApplicationTrackerScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isTablet = width > 600;

const initialApplications = [
  {
    id: '1',
    opportunity: 'Startup India Seed Fund',
    status: 'Submitted',
    deadline: '2025-12-31',
    notes: 'Waiting for response.',
  },
  {
    id: '2',
    opportunity: 'DST Young Scientist Scheme',
    status: 'Draft',
    deadline: '2026-01-15',
    notes: 'Need to complete application.',
  },
];

export default function FundingApplicationTrackerScreen() {
  const [applications, setApplications] = useState(initialApplications);
  const [modalVisible, setModalVisible] = useState(false);
  const [newApp, setNewApp] = useState({
    opportunity: '',
    status: '',
    deadline: '',
    notes: '',
  });

  const addApplication = () => {
    if (!newApp.opportunity.trim()) return; // simple validation
    const nextId = (applications.length + 1).toString();
    setApplications([{ ...newApp, id: nextId }, ...applications]);
    setNewApp({ opportunity: '', status: '', deadline: '', notes: '' });
    setModalVisible(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Ionicons name="document-text-outline" size={18} color="#b366ff" />
        </View>
        <Text style={styles.opportunity}>{item.opportunity}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.badge}>{item.status}</Text>
        <Text style={styles.deadline}>Deadline: {item.deadline}</Text>
      </View>
      {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Application Tracker</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          accessibilityLabel="Add application"
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={applications}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 12 }}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Application</Text>
            <TextInput
              style={styles.input}
              placeholder="Opportunity"
              placeholderTextColor="#999"
              value={newApp.opportunity}
              onChangeText={(t) => setNewApp({ ...newApp, opportunity: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Status (Draft / Submitted)"
              placeholderTextColor="#999"
              value={newApp.status}
              onChangeText={(t) => setNewApp({ ...newApp, status: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Deadline (YYYY-MM-DD)"
              placeholderTextColor="#999"
              value={newApp.deadline}
              onChangeText={(t) => setNewApp({ ...newApp, deadline: t })}
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Notes"
              placeholderTextColor="#999"
              value={newApp.notes}
              onChangeText={(t) => setNewApp({ ...newApp, notes: t })}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveBtn} onPress={addApplication}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1020' },
  header: {
    paddingTop: isTablet ? 46 : 36,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: { flex: 1, fontSize: isTablet ? 26 : 20, color: '#fff', fontWeight: '700' },
  addButton: {
    backgroundColor: '#b366ff',
    padding: isTablet ? 12 : 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: isTablet ? 18 : 14,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#b366ff',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(179,102,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  opportunity: { color: '#fff', fontSize: isTablet ? 18 : 16, fontWeight: '700' },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  badge: {
    color: '#b366ff',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: isTablet ? 12 : 11,
  },
  deadline: { color: '#ccc', fontSize: isTablet ? 13 : 12 },

  notes: { color: '#cfcfcf', marginTop: 8, fontSize: isTablet ? 13 : 12 },

  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContent: {
    backgroundColor: '#0f1020',
    padding: 18,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    color: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  modalButtons: { flexDirection: 'row', marginTop: 6 },
  saveBtn: {
    flex: 1,
    backgroundColor: '#b366ff',
    padding: 12,
    borderRadius: 8,
    marginRight: 6,
    alignItems: 'center',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    borderRadius: 8,
    marginLeft: 6,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700' },
  cancelText: { color: '#fff' },
});
