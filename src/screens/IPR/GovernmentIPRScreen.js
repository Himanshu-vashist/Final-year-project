import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert
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
  Divider
} from 'react-native-paper';
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
import { LoadingCard, EmptyState, StatCard } from '../../components/UIComponents';
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
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [statusUpdateModal, setStatusUpdateModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    granted: 0,
    rejected: 0
  });

  // Fetch IPR applications
  const fetchApplications = async () => {
    try {
      const iprRef = collection(db, 'ipr_applications');
      const q = query(iprRef, orderBy('filingDate', 'desc'));
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
  const updateApplicationStatus = async (newStatus) => {
    if (!selectedApplication || !statusNote.trim()) {
      Alert.alert('Error', 'Please provide status update notes');
      return;
    }

    try {
      const applicationRef = doc(db, 'ipr_applications', selectedApplication.id);
      
      const statusUpdate = {
        status: newStatus,
        notes: statusNote,
        timestamp: serverTimestamp(),
        updatedBy: userProfile.name || currentUser.email
      };

      await updateDoc(applicationRef, {
        status: newStatus,
        lastUpdated: serverTimestamp(),
        statusUpdates: [...(selectedApplication.statusUpdates || []), statusUpdate]
      });

      setStatusUpdateModal(false);
      setStatusNote('');
      setSelectedApplication(null);
      fetchApplications();

      Alert.alert('Success', 'Application status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update application status');
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
          <TextInput
            label="Status Update Notes"
            value={statusNote}
            onChangeText={setStatusNote}
            multiline
            numberOfLines={4}
            style={styles.noteInput}
          />
          
          <View style={styles.statusButtons}>
            {IPR_STATUS.filter(status => status.value !== 'all').map(status => (
              <Button
                key={status.value}
                mode="outlined"
                onPress={() => updateApplicationStatus(status.value)}
                style={styles.statusButton}
                labelStyle={styles.statusButtonLabel}
              >
                {status.label}
              </Button>
            ))}
          </View>
        </ScrollView>

        <Button
          mode="contained"
          onPress={() => setStatusUpdateModal(false)}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
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
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{application.applicantName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.metaText}>
              {moment(application.filingDate.toDate()).format('MMM DD, YYYY')}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <Button
            mode="contained"
            onPress={() => {
              setSelectedApplication(application);
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
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchApplications} />
        }
      >
        {/* Statistics Section */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Applications"
            value={stats.total.toString()}
            icon="documents-outline"
            color="#FF9800"
          />
          <StatCard
            title="Pending Review"
            value={stats.pending.toString()}
            icon="time-outline"
            color="#2196F3"
          />
          <StatCard
            title="Granted"
            value={stats.granted.toString()}
            icon="checkmark-circle-outline"
            color="#4CAF50"
          />
          <StatCard
            title="Rejected"
            value={stats.rejected.toString()}
            icon="close-circle-outline"
            color="#F44336"
          />
        </View>

        {/* Search and Filter Section */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search applications..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            {IPR_STATUS.map(status => (
              <Chip
                key={status.value}
                selected={selectedStatus === status.value}
                onPress={() => setSelectedStatus(status.value)}
                style={styles.filterChip}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  searchBar: {
    margin: 16,
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    marginRight: 8,
    fontSize: 16,
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    fontSize: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 8,
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    padding: 20,
    maxHeight: '80%',
  },
  modalContent: {
    marginVertical: 16,
  },
  divider: {
    marginVertical: 16,
  },
  noteInput: {
    marginBottom: 16,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  statusButton: {
    margin: 4,
  },
  statusButtonLabel: {
    fontSize: 12,
  },
  cancelButton: {
    marginTop: 16,
  },
});

// Helper functions
const getStatusColor = (status) => {
  switch (status) {
    case 'filed': return '#FF9800';
    case 'under_review': return '#2196F3';
    case 'published': return '#9C27B0';
    case 'examined': return '#00BCD4';
    case 'granted': return '#4CAF50';
    case 'rejected': return '#F44336';
    default: return '#9E9E9E';
  }
};

const getStatusLabel = (status) => {
  return IPR_STATUS.find(s => s.value === status)?.label || 'Unknown';
};