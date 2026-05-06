import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Searchbar,
  Chip,
  Button,
  Portal,
  Modal,
  TextInput,
  Divider,
  Text,
  Avatar
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LoadingCard, EmptyState } from '../../components/UIComponents';
import moment from 'moment';

const STARTUP_STATUS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Verified', value: 'verified' },
  { label: 'Rejected', value: 'rejected' }
];

export default function GovernmentStartupScreen({ navigation }) {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const [startups, setStartups] = useState([]);
  const [filteredStartups, setFilteredStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [statusUpdateModal, setStatusUpdateModal] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [newStatus, setNewStatus] = useState('under_review');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0
  });

  const fetchStartups = async () => {
    try {
      const startupRef = collection(db, 'startups');
      const q = query(startupRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const list = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      
      setStartups(list);
      updateStats(list);
      filterStartups(list, selectedStatus, searchQuery);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching startups:', error);
      Alert.alert('Error', 'Failed to load startups');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateStartupStatus = async (statusToSet) => {
    if (!selectedStartup) return;

    try {
      setLoading(true);
      const startupRef = doc(db, 'startups', selectedStartup.id);
      
      const finalNote = statusNote.trim() || `Startup status updated to ${statusToSet} by Government Reviewer.`;
      
      const statusUpdate = {
        status: statusToSet,
        notes: finalNote,
        timestamp: new Date().toISOString(),
        updatedBy: userProfile?.name || currentUser?.email || 'Government Official'
      };

      const updateData = {
        status: statusToSet,
        isVerified: statusToSet === 'verified',
        lastUpdated: new Date().toISOString(),
        statusUpdates: [...(selectedStartup.statusUpdates || []), statusUpdate]
      };

      await updateDoc(startupRef, updateData);
      
      setStatusUpdateModal(false);
      setStatusNote('');
      setSelectedStartup(null);
      await fetchStartups();

      Alert.alert('Success', 'Startup status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update startup status');
    } finally {
      setLoading(false);
    }
  };

  const filterStartups = (list, status, search) => {
    let filtered = [...list];
    
    if (status !== 'all') {
      filtered = filtered.filter(s => s.status === status);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(searchLower) ||
        s.founderName?.toLowerCase().includes(searchLower) ||
        s.sector?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredStartups(filtered);
  };

  const updateStats = (list) => {
    const stats = {
      total: list.length,
      pending: list.filter(s => s.status === 'pending' || s.status === 'under_review').length,
      verified: list.filter(s => s.status === 'verified').length,
      rejected: list.filter(s => s.status === 'rejected').length
    };
    setStats(stats);
  };

  useEffect(() => {
    fetchStartups();
  }, []);

  useEffect(() => {
    filterStartups(startups, selectedStatus, searchQuery);
  }, [selectedStatus, searchQuery]);

  const renderStatusModal = () => (
    <Portal>
      <Modal
        visible={statusUpdateModal}
        onDismiss={() => setStatusUpdateModal(false)}
        contentContainerStyle={styles.modal}
      >
        <Title>Startup Verification</Title>
        <Divider style={styles.divider} />
        
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalLabel}>Decision</Text>
          <View style={styles.selectionContainer}>
            {[
              { label: 'Under Review', value: 'under_review', color: '#fbbf24' },
              { label: 'Verify/Approve', value: 'verified', color: '#34d399' },
              { label: 'Reject', value: 'rejected', color: '#f87171' }
            ].map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  newStatus === option.value && { backgroundColor: option.color + '20', borderColor: option.color }
                ]}
                onPress={() => setNewStatus(option.value)}
              >
                <Ionicons 
                  name={newStatus === option.value ? 'radio-button-on' : 'radio-button-off'} 
                  size={20} 
                  color={newStatus === option.value ? option.color : '#94a3b8'} 
                />
                <Text style={[
                  styles.optionLabel,
                  newStatus === option.value && { color: option.color, fontWeight: 'bold' }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            label="Verification Remarks"
            value={statusNote}
            onChangeText={setStatusNote}
            multiline
            numberOfLines={4}
            mode="outlined"
            style={styles.noteInput}
            placeholder="Provide feedback to the entrepreneur..."
          />
        </ScrollView>

        <View style={styles.modalActions}>
          <Button
            mode="outlined"
            onPress={() => setStatusUpdateModal(false)}
            style={styles.modalActionBtn}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={() => updateStartupStatus(newStatus)}
            style={[styles.modalActionBtn, { backgroundColor: theme.colors.primary }]}
          >
            Confirm Decision
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  const renderStartupCard = (startup) => (
    <Card key={startup.id} style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Title numberOfLines={1} style={styles.cardTitle}>
            {startup.name}
          </Title>
          <Chip
            mode="outlined"
            textStyle={styles.statusChipText}
            style={[
              styles.statusChip,
              { borderColor: getStatusColor(startup.status) }
            ]}
          >
            {getStatusLabel(startup.status)}
          </Chip>
        </View>

        <Paragraph numberOfLines={2} style={styles.cardDescription}>
          {startup.description}
        </Paragraph>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={16} color="rgba(255,255,255,0.5)" />
            <Text style={styles.metaText}>{startup.founderName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="business-outline" size={16} color="rgba(255,255,255,0.5)" />
            <Text style={styles.metaText}>{startup.sector}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.5)" />
            <Text style={styles.metaText}>
              {startup.createdAt ? moment(startup.createdAt).format('MMM DD, YYYY') : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <Button
            mode="contained"
            onPress={() => {
              setSelectedStartup(startup);
              setNewStatus('under_review');
              setStatusNote('');
              setStatusUpdateModal(true);
            }}
            style={styles.actionButton}
          >
            Verify Startup
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Startups', { screen: 'StartupDetail', params: { startupId: startup.id } })}
            style={styles.actionButton}
            textColor="#fff"
          >
            Details
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <LinearGradient colors={theme.gradients.dark} style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchStartups} tintColor="#fff" />
        }
      >
        <LinearGradient
          colors={theme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={{ flex: 1 }}>
              <Title style={styles.headerTitle}>Startup Verification</Title>
              <Text style={styles.headerSubtitle}>Government Accreditation Panel</Text>
            </View>
            <Avatar.Icon size={48} icon="rocket-launch" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          </View>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <StatCard title="Total" value={stats.total} icon="rocket" color={theme.colors.primary} />
          <StatCard title="Pending" value={stats.pending} icon="time" color={theme.colors.warning} />
          <StatCard title="Verified" value={stats.verified} icon="checkmark-shield" color={theme.colors.success} />
          <StatCard title="Rejected" value={stats.rejected} icon="close-circle" color={theme.colors.error} />
        </View>

        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Search startups or founders..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={{ color: '#fff' }}
            placeholderTextColor="rgba(255,255,255,0.4)"
            iconColor={theme.colors.primary}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {STARTUP_STATUS.map((status) => (
              <Chip
                key={status.value}
                selected={selectedStatus === status.value}
                onPress={() => setSelectedStatus(status.value)}
                style={[
                  styles.filterChip,
                  selectedStatus === status.value ? { backgroundColor: theme.colors.primary } : {}
                ]}
                textStyle={[
                  styles.filterChipText,
                  selectedStatus === status.value && { color: '#fff' }
                ]}
                mode="outlined"
              >
                {status.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        <View style={styles.listContainer}>
          {loading ? (
            <LoadingCard />
          ) : filteredStartups.length === 0 ? (
            <EmptyState
              icon="rocket-outline"
              title="No Startups Found"
              description="All caught up! No startups are currently waiting for verification."
            />
          ) : (
            filteredStartups.map(renderStartupCard)
          )}
        </View>
      </ScrollView>

      {renderStatusModal()}
    </LinearGradient>
  );
}

const StatCard = ({ title, value, icon, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statIconContainer}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  </View>
);

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return '#fbbf24';
    case 'under_review': return '#818cf8';
    case 'verified': return '#34d399';
    case 'rejected': return '#f87171';
    default: return '#94a3b8';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending': return 'New';
    case 'under_review': return 'In Review';
    case 'verified': return 'Verified';
    case 'rejected': return 'Rejected';
    default: return status;
  }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingTop: 48, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, justifyContent: 'space-between', marginTop: -20 },
  statCard: { width: '48%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4 },
  statIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  statTitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  searchSection: { backgroundColor: 'rgba(15, 23, 42, 0.4)', paddingVertical: 12 },
  searchBar: { marginHorizontal: 16, marginBottom: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', elevation: 0 },
  filterScroll: { paddingHorizontal: 16 },
  filterChip: { marginRight: 8, borderRadius: 20, backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.1)' },
  filterChipText: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  listContainer: { padding: 16 },
  card: { marginBottom: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#fff' },
  statusChip: { height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  statusChipText: { fontSize: 10, fontWeight: 'bold' },
  cardDescription: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 16, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  metaText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginLeft: 6 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  actionButton: { flex: 1, borderRadius: 12 },
  modal: { backgroundColor: '#1e293b', margin: 20, borderRadius: 24, padding: 24, maxHeight: '80%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalContent: { marginVertical: 16 },
  divider: { marginVertical: 16, backgroundColor: 'rgba(255,255,255,0.1)' },
  noteInput: { marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)' },
  modalLabel: { fontSize: 14, fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  selectionContainer: { marginBottom: 24 },
  optionButton: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.02)' },
  optionLabel: { marginLeft: 12, fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalActionBtn: { flex: 1, borderRadius: 12 },
});
