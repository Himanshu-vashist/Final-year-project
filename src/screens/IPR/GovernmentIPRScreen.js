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
  addDoc,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LoadingCard, EmptyState } from '../../components/UIComponents';
import moment from 'moment';

const IPR_STATUS = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'filed' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Published', value: 'published' },
  { label: 'Examined', value: 'examined' },
  { label: 'Granted', value: 'granted' },
  { label: 'Rejected', value: 'rejected' }
];

export default function GovernmentIPRScreen({ navigation }) {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [statusUpdateModal, setStatusUpdateModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [newStatus, setNewStatus] = useState('under_review');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    granted: 0,
    rejected: 0
  });

  // Fetch IPR applications
  const fetchApplications = async () => {
    try {
      const iprRef = collection(db, 'ipr');
      const q = query(iprRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const apps = [];
      querySnapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() });
      });
      
      setApplications(apps);
      updateStats(apps);
      filterApplications(apps, selectedStatus, searchQuery);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert('Error', 'Failed to load IPR applications');
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Update application status
  const updateApplicationStatus = async (statusToSet) => {
    if (!selectedApplication) {
      Alert.alert('Error', 'No application selected');
      return;
    }

    try {
      setLoading(true);
      console.log('Updating application status to:', statusToSet);
      const applicationRef = doc(db, 'ipr', selectedApplication.id);
      
      const finalNote = statusNote.trim() || `Application status updated to ${statusToSet} by Government Reviewer.`;
      
      const statusUpdate = {
        status: statusToSet,
        notes: finalNote,
        timestamp: new Date().toISOString(),
        updatedBy: userProfile?.name || currentUser?.email || 'Government Official'
      };

      const updateData = {
        status: statusToSet,
        isVerified: statusToSet === 'granted',
        isPublic: statusToSet === 'granted' || statusToSet === 'published' || (selectedApplication.isPublic || false),
        lastUpdated: new Date().toISOString(),
        statusUpdates: [...(selectedApplication.statusUpdates || []), statusUpdate]
      };

      await updateDoc(applicationRef, updateData);
      
      setStatusUpdateModal(false);
      setStatusNote('');
      setSelectedApplication(null);
      await fetchApplications();

      Alert.alert('Success', 'Application status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update application status');
    } finally {
      setLoading(false);
    }
  };

  // Filter applications
  const filterApplications = (apps, status, search) => {
    let filtered = [...apps];
    
    if (status !== 'all') {
      filtered = filtered.filter(app => app.status === status);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(app => 
        app.title.toLowerCase().includes(searchLower) ||
        app.applicationNumber?.toLowerCase().includes(searchLower) ||
        app.applicantName?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredApplications(filtered);
  };

  // Update statistics
  const updateStats = (apps) => {
    const stats = {
      total: apps.length,
      pending: apps.filter(app => ['filed', 'under_review', 'published', 'examined'].includes(app.status)).length,
      granted: apps.filter(app => app.status === 'granted').length,
      rejected: apps.filter(app => app.status === 'rejected').length
    };
    setStats(stats);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications(applications, selectedStatus, searchQuery);
  }, [selectedStatus, searchQuery]);

  const renderStatusModal = () => (
    <Portal>
      <Modal
        visible={statusUpdateModal}
        onDismiss={() => setStatusUpdateModal(false)}
        contentContainerStyle={styles.modal}
      >
        <Title>Update Application Status</Title>
        <Divider style={styles.divider} />
        
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalLabel}>Select New Status</Text>
          <View style={styles.selectionContainer}>
            {[
              { label: 'Pending', value: 'under_review', color: '#FF9800' },
              { label: 'Approved', value: 'granted', color: '#4CAF50' },
              { label: 'Rejected', value: 'rejected', color: '#F44336' }
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
                  color={newStatus === option.value ? option.color : '#999'} 
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
            label="Decision Notes / Remarks"
            value={statusNote}
            onChangeText={setStatusNote}
            multiline
            numberOfLines={4}
            mode="outlined"
            style={styles.noteInput}
            placeholder="Provide details about your decision..."
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
            onPress={() => updateApplicationStatus(newStatus)}
            style={[styles.modalActionBtn, { backgroundColor: '#b366ff' }]}
          >
            Confirm Update
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  const renderApplicationCard = (application) => (
    <Card
      key={application.id}
      style={styles.card}
      onPress={() => navigation.navigate('IPRTracking', { applicationId: application.id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Title numberOfLines={2} style={styles.cardTitle}>
            {application.title}
          </Title>
          <Chip
            mode="outlined"
            textStyle={styles.statusChipText}
            style={[
              styles.statusChip,
              { borderColor: getStatusColor(application.status) }
            ]}
          >
            {getStatusLabel(application.status)}
          </Chip>
        </View>

        <Paragraph numberOfLines={2} style={styles.cardDescription}>
          {application.description}
        </Paragraph>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="id-card-outline" size={16} color="#666" />
            <Text style={styles.metaText}>ID: {application.id?.substring(0, 8).toUpperCase()}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{application.applicantName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.metaText}>
              {application.filingDate ? moment(application.filingDate).format('MMM DD, YYYY') : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <Button
            mode="contained"
            onPress={() => {
              setSelectedApplication(application);
              setNewStatus('under_review');
              setStatusNote('');
              setStatusUpdateModal(true);
            }}
            style={styles.actionButton}
          >
            Update Status
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('IPRTracking', { applicationId: application.id })}
            style={styles.actionButton}
          >
            View Details
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <LinearGradient colors={theme.gradients.dark} style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchApplications} tintColor="#fff" />
        }
      >
        {/* Premium Header */}
        <LinearGradient
          colors={theme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={{ flex: 1 }}>
              <Title style={styles.headerTitle}>IPR Review Portal</Title>
              <Text style={styles.headerSubtitle}>Official Government Verification Dashboard</Text>
            </View>
            <Avatar.Icon size={48} icon="shield-check" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          </View>
        </LinearGradient>

        {/* Statistics Section */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Apps"
            value={stats.total}
            icon="document-text"
            color={theme.colors.primary}
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon="time"
            color={theme.colors.warning}
          />
          <StatCard
            title="Approved"
            value={stats.granted}
            icon="checkmark-circle"
            color={theme.colors.success}
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon="close-circle"
            color={theme.colors.error}
          />
        </View>

        {/* Search & Filters */}
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Search by title or applicant..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={{ color: '#fff' }}
            placeholderTextColor="rgba(255,255,255,0.4)"
            iconColor={theme.colors.primary}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            {IPR_STATUS.map((status) => (
              <Chip
                key={status.value}
                selected={selectedStatus === status.value}
                onPress={() => setSelectedStatus(status.value)}
                style={[
                  styles.filterChip,
                  selectedStatus === status.value ? { backgroundColor: theme?.colors?.primary || '#6366f1' } : {}
                ]}
                textStyle={[
                  styles.filterChipText,
                  selectedStatus === status.value && { color: '#fff' }
                ]}
                mode="outlined"
                selectedColor="#fff"
              >
                {status.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Applications List */}
        <View style={styles.listContainer}>
          {loading ? (
            <LoadingCard />
          ) : filteredApplications.length === 0 ? (
            <EmptyState
              icon="documents-outline"
              title="No Applications Found"
              description={searchQuery ? 
                "No applications match your search criteria" :
                "No IPR applications to review"
              }
            />
          ) : (
            filteredApplications.map(renderApplicationCard)
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 48,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
    marginTop: -20,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  searchSection: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingVertical: 12,
    zIndex: 100,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    elevation: 0,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterContent: {
    paddingRight: 32,
  },
  filterChip: {
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
    marginRight: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusChip: {
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 6,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  modal: {
    backgroundColor: '#1e293b',
    margin: 20,
    borderRadius: 24,
    padding: 24,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalContent: {
    marginVertical: 16,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  noteInput: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
  },
  selectionContainer: {
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  optionLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalActionBtn: {
    flex: 1,
    borderRadius: 12,
  },
});

// Helper functions
const getStatusColor = (status) => {
  switch (status) {
    case 'filed': return '#818cf8';
    case 'under_review': return '#fbbf24';
    case 'published': return '#a78bfa';
    case 'examined': return '#60a5fa';
    case 'granted': return '#34d399';
    case 'rejected': return '#f87171';
    default: return '#94a3b8';
  }
};

const getStatusLabel = (status) => {
  return IPR_STATUS.find(s => s.value === status)?.label || 'Unknown';
};