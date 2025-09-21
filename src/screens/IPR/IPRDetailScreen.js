import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking
} from 'react-native';
import { Card, Title, Paragraph, Button, Chip, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, InfoCard } from '../../components/UIComponents';
import moment from 'moment';

export default function IPRDetailScreen({ route, navigation }) {
  const { iprId } = route.params;
  const { userProfile, hasPermission } = useAuth();
  const [ipr, setIpr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState([]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    loadIPRDetails();
  }, [iprId]);

  const loadIPRDetails = async () => {
    try {
      // Load IPR details
      const iprDoc = await getDoc(doc(db, 'ipr', iprId));
      if (iprDoc.exists()) {
        const iprData = { id: iprDoc.id, ...iprDoc.data() };
        setIpr(iprData);

        // Load related data
        await Promise.all([
          loadTimeline(iprId),
          loadDocuments(iprId)
        ]);
      } else {
        Alert.alert('Error', 'IPR application not found.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading IPR details:', error);
      Alert.alert('Error', 'Failed to load IPR details.');
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async (iprId) => {
    try {
      const q = query(
        collection(db, 'ipr_timeline'),
        where('iprId', '==', iprId)
      );
      const snapshot = await getDocs(q);
      const timelineData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTimeline(timelineData.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      ));
    } catch (error) {
      console.error('Error loading timeline:', error);
    }
  };

  const loadDocuments = async (iprId) => {
    try {
      const q = query(
        collection(db, 'ipr_documents'),
        where('iprId', '==', iprId)
      );
      const snapshot = await getDocs(q);
      const documentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setDocuments(documentsData);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateDoc(doc(db, 'ipr', iprId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Add timeline entry
      await addDoc(collection(db, 'ipr_timeline'), {
        iprId,
        status: newStatus,
        date: new Date().toISOString(),
        description: `Status updated to ${newStatus}`,
        updatedBy: userProfile.uid
      });

      Alert.alert('Success', 'Status updated successfully!');
      loadIPRDetails();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const openDocument = (document) => {
    if (document.url) {
      Linking.openURL(document.url);
    }
  };

  const getStatusActions = () => {
    if (!hasPermission('approve_applications')) return [];

    const currentStatus = ipr.status;
    const actions = [];

    switch (currentStatus) {
      case 'filed':
        actions.push({ label: 'Publish', value: 'published' });
        actions.push({ label: 'Reject', value: 'rejected' });
        break;
      case 'published':
        actions.push({ label: 'Send for Examination', value: 'examined' });
        break;
      case 'examined':
        actions.push({ label: 'Grant', value: 'granted' });
        actions.push({ label: 'Reject', value: 'rejected' });
        break;
    }

    return actions;
  };

  const isOwner = () => {
    return ipr.userId === userProfile.uid;
  };

  const getValidityPeriod = () => {
    if (!ipr.grantDate) return null;
    
    const grantDate = moment(ipr.grantDate);
    let validityYears = 20; // Default for patents
    
    switch (ipr.type) {
      case 'Trademark':
        validityYears = 10;
        break;
      case 'Design':
        validityYears = 10;
        break;
      case 'Copyright':
        validityYears = 60;
        break;
    }
    
    const expiryDate = grantDate.add(validityYears, 'years');
    return {
      validityYears,
      expiryDate: expiryDate.format('DD/MM/YYYY'),
      daysRemaining: expiryDate.diff(moment(), 'days')
    };
  };

  if (loading || !ipr) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const validity = getValidityPeriod();
  const statusActions = getStatusActions();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FF9800', '#F57C00']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Title style={styles.title}>{ipr.title}</Title>
          <View style={styles.headerMeta}>
            <StatusBadge status={ipr.status} type="ipr" />
            <Chip mode="outlined" style={styles.typeChip} textStyle={styles.typeChipText}>
              {ipr.type}
            </Chip>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Basic Information */}
        <InfoCard title="Application Details" icon="document-text-outline">
          <Paragraph style={styles.description}>{ipr.description}</Paragraph>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Applicant</Text>
              <Text style={styles.infoValue}>{ipr.applicantName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Organization</Text>
              <Text style={styles.infoValue}>{ipr.organization}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{ipr.category}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Priority Date</Text>
              <Text style={styles.infoValue}>
                {moment(ipr.priorityDate || ipr.filingDate).format('DD/MM/YYYY')}
              </Text>
            </View>
          </View>

          {ipr.applicationNumber && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Application Number</Text>
                <Text style={styles.infoValue}>{ipr.applicationNumber}</Text>
              </View>
              {ipr.publicationNumber && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Publication Number</Text>
                  <Text style={styles.infoValue}>{ipr.publicationNumber}</Text>
                </View>
              )}
            </View>
          )}

          {ipr.grantNumber && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Grant Number</Text>
                <Text style={styles.infoValue}>{ipr.grantNumber}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Grant Date</Text>
                <Text style={styles.infoValue}>
                  {moment(ipr.grantDate).format('DD/MM/YYYY')}
                </Text>
              </View>
            </View>
          )}
        </InfoCard>

        {/* Technical Details */}
        {(ipr.technicalField || ipr.backgroundArt || ipr.invention) && (
          <InfoCard title="Technical Information" icon="settings-outline">
            {ipr.technicalField && (
              <View style={styles.technicalSection}>
                <Text style={styles.technicalLabel}>Technical Field</Text>
                <Text style={styles.technicalText}>{ipr.technicalField}</Text>
              </View>
            )}
            
            {ipr.backgroundArt && (
              <View style={styles.technicalSection}>
                <Text style={styles.technicalLabel}>Background Art</Text>
                <Text style={styles.technicalText}>{ipr.backgroundArt}</Text>
              </View>
            )}
            
            {ipr.invention && (
              <View style={styles.technicalSection}>
                <Text style={styles.technicalLabel}>Summary of Invention</Text>
                <Text style={styles.technicalText}>{ipr.invention}</Text>
              </View>
            )}
          </InfoCard>
        )}

        {/* Claims */}
        {ipr.claims && ipr.claims.length > 0 && (
          <InfoCard title="Claims" icon="list-outline">
            {ipr.claims.map((claim, index) => (
              <View key={index} style={styles.claimItem}>
                <Text style={styles.claimNumber}>Claim {index + 1}:</Text>
                <Text style={styles.claimText}>{claim}</Text>
              </View>
            ))}
          </InfoCard>
        )}

        {/* Inventors */}
        {ipr.inventors && ipr.inventors.length > 0 && (
          <InfoCard title="Inventors" icon="people-outline">
            {ipr.inventors.map((inventor, index) => (
              <View key={index} style={styles.inventorItem}>
                <Text style={styles.inventorName}>{inventor.name}</Text>
                <Text style={styles.inventorDetails}>
                  {inventor.designation} - {inventor.organization}
                </Text>
                {inventor.address && (
                  <Text style={styles.inventorAddress}>{inventor.address}</Text>
                )}
              </View>
            ))}
          </InfoCard>
        )}

        {/* Validity Information */}
        {validity && (
          <InfoCard title="Validity Information" icon="time-outline">
            <View style={styles.validityContainer}>
              <View style={styles.validityItem}>
                <Text style={styles.validityLabel}>Validity Period</Text>
                <Text style={styles.validityValue}>{validity.validityYears} years</Text>
              </View>
              <View style={styles.validityItem}>
                <Text style={styles.validityLabel}>Expiry Date</Text>
                <Text style={styles.validityValue}>{validity.expiryDate}</Text>
              </View>
              <View style={styles.validityItem}>
                <Text style={styles.validityLabel}>Days Remaining</Text>
                <Text style={[
                  styles.validityValue,
                  { color: validity.daysRemaining < 365 ? '#f44336' : '#4CAF50' }
                ]}>
                  {validity.daysRemaining}
                </Text>
              </View>
            </View>
          </InfoCard>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <InfoCard title="Application Timeline" icon="git-commit-outline">
            {timeline.map((event, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <Ionicons 
                    name={event.status === 'granted' ? 'checkmark-circle' : 'radio-button-on'} 
                    size={16} 
                    color="#667eea" 
                  />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStatus}>{event.status.toUpperCase()}</Text>
                  <Text style={styles.timelineDescription}>{event.description}</Text>
                  <Text style={styles.timelineDate}>
                    {moment(event.date).format('DD/MM/YYYY HH:mm')}
                  </Text>
                </View>
              </View>
            ))}
          </InfoCard>
        )}

        {/* Documents */}
        {documents.length > 0 && (
          <InfoCard title="Documents" icon="folder-outline">
            {documents.map((document, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.documentItem}
                onPress={() => openDocument(document)}
              >
                <Ionicons name="document-text-outline" size={20} color="#667eea" />
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>{document.name}</Text>
                  <Text style={styles.documentType}>{document.type}</Text>
                </View>
                <Ionicons name="download-outline" size={16} color="#666" />
              </TouchableOpacity>
            ))}
          </InfoCard>
        )}

        {/* Contact Information */}
        {ipr.contactEmail && (
          <InfoCard title="Contact Information" icon="mail-outline">
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => Linking.openURL(`mailto:${ipr.contactEmail}`)}
            >
              <Ionicons name="mail-outline" size={20} color="#667eea" />
              <Text style={styles.contactText}>{ipr.contactEmail}</Text>
            </TouchableOpacity>
            
            {ipr.contactPhone && (
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={() => Linking.openURL(`tel:${ipr.contactPhone}`)}
              >
                <Ionicons name="call-outline" size={20} color="#667eea" />
                <Text style={styles.contactText}>{ipr.contactPhone}</Text>
              </TouchableOpacity>
            )}
          </InfoCard>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {isOwner() && (
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('AddIPR', { 
                iprId: ipr.id, 
                editMode: true 
              })}
              style={styles.actionButton}
              icon="pencil"
            >
              Edit Application
            </Button>
          )}

          {statusActions.map((action, index) => (
            <Button
              key={index}
              mode="contained"
              onPress={() => handleStatusUpdate(action.value)}
              style={[styles.actionButton, { 
                backgroundColor: action.value === 'granted' ? '#4CAF50' : '#f44336' 
              }]}
              icon={action.value === 'granted' ? 'checkmark' : 'close'}
            >
              {action.label}
            </Button>
          ))}
          
          {hasPermission('view_all_data') && (
            <Button
              mode="outlined"
              onPress={() => {
                Alert.alert('Info', 'Report generation feature coming soon!');
              }}
              style={styles.actionButton}
              icon="document-text"
            >
              Generate Report
            </Button>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: '#fff',
  },
  typeChipText: {
    color: '#fff',
    fontSize: 12,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  technicalSection: {
    marginBottom: 16,
  },
  technicalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  technicalText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  claimItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  claimNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  claimText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  inventorItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  inventorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  inventorDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  inventorAddress: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  validityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  validityItem: {
    flex: 1,
    alignItems: 'center',
  },
  validityLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  validityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timelineItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timelineIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  timelineDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  timelineDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  documentType: {
    fontSize: 12,
    color: '#666',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#667eea',
    marginLeft: 8,
  },
  actionsContainer: {
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    borderRadius: 8,
  },
});