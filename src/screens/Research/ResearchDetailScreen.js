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
import { Card, Title, Paragraph, Button, Chip, Avatar, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, InfoCard } from '../../components/UIComponents';
import moment from 'moment';

export default function ResearchDetailScreen({ route, navigation }) {
  const { researchId } = route.params;
  const { userProfile, hasPermission } = useAuth();
  const [research, setResearch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collaborators, setCollaborators] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [publications, setPublications] = useState([]);

  useEffect(() => {
    loadResearchDetails();
  }, [researchId]);

  const loadResearchDetails = async () => {
    try {
      // Load research details
      const researchDoc = await getDoc(doc(db, 'research', researchId));
      if (researchDoc.exists()) {
        const researchData = { id: researchDoc.id, ...researchDoc.data() };
        setResearch(researchData);

        // Load related data
        await Promise.all([
          loadCollaborators(researchData.collaboratorIds || []),
          loadMilestones(researchId),
          loadPublications(researchId)
        ]);
      } else {
        Alert.alert('Error', 'Research project not found.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading research details:', error);
      Alert.alert('Error', 'Failed to load research details.');
    } finally {
      setLoading(false);
    }
  };

  const loadCollaborators = async (collaboratorIds) => {
    if (collaboratorIds.length === 0) return;
    
    try {
      const collaboratorPromises = collaboratorIds.map(id => 
        getDoc(doc(db, 'users', id))
      );
      const collaboratorDocs = await Promise.all(collaboratorPromises);
      const collaboratorData = collaboratorDocs
        .filter(doc => doc.exists())
        .map(doc => ({ id: doc.id, ...doc.data() }));
      
      setCollaborators(collaboratorData);
    } catch (error) {
      console.error('Error loading collaborators:', error);
    }
  };

  const loadMilestones = async (researchId) => {
    try {
      const q = query(
        collection(db, 'research_milestones'),
        where('researchId', '==', researchId)
      );
      const snapshot = await getDocs(q);
      const milestonesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setMilestones(milestonesData.sort((a, b) => 
        new Date(a.targetDate) - new Date(b.targetDate)
      ));
    } catch (error) {
      console.error('Error loading milestones:', error);
    }
  };

  const loadPublications = async (researchId) => {
    try {
      const q = query(
        collection(db, 'publications'),
        where('researchId', '==', researchId)
      );
      const snapshot = await getDocs(q);
      const publicationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPublications(publicationsData);
    } catch (error) {
      console.error('Error loading publications:', error);
    }
  };

  const handleJoinCollaboration = async () => {
    try {
      const updatedCollaborators = [...(research.collaboratorIds || []), userProfile.uid];
      await updateDoc(doc(db, 'research', researchId), {
        collaboratorIds: updatedCollaborators
      });
      
      // Add collaboration request notification
      await addDoc(collection(db, 'notifications'), {
        userId: research.userId,
        type: 'collaboration_request',
        title: 'New Collaboration Request',
        message: `${userProfile.name} wants to collaborate on ${research.title}`,
        data: { researchId, requesterId: userProfile.uid },
        read: false,
        createdAt: new Date().toISOString()
      });

      Alert.alert('Success', 'Collaboration request sent successfully!');
      loadResearchDetails();
    } catch (error) {
      console.error('Error sending collaboration request:', error);
      Alert.alert('Error', 'Failed to send collaboration request.');
    }
  };

  const openWebsite = (url) => {
    if (url) {
      Linking.openURL(url.startsWith('http') ? url : `https://${url}`);
    }
  };

  const canCollaborate = () => {
    return hasPermission('collaborate') && 
           research.userId !== userProfile.uid && 
           !research.collaboratorIds?.includes(userProfile.uid) &&
           research.status === 'ongoing';
  };

  const isOwner = () => {
    return research.userId === userProfile.uid;
  };

  const isCollaborator = () => {
    return research.collaboratorIds?.includes(userProfile.uid);
  };

  if (loading || !research) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Title style={styles.title}>{research.title}</Title>
          <View style={styles.headerMeta}>
            <StatusBadge status={research.status} type="research" />
            <Text style={styles.categoryText}>{research.category}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Basic Information */}
        <InfoCard title="Project Overview" icon="information-circle-outline">
          <Paragraph style={styles.description}>{research.description}</Paragraph>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Principal Investigator</Text>
              <Text style={styles.infoValue}>{research.principalInvestigator}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Institution</Text>
              <Text style={styles.infoValue}>{research.institution}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Start Date</Text>
              <Text style={styles.infoValue}>
                {moment(research.startDate).format('DD/MM/YYYY')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>End Date</Text>
              <Text style={styles.infoValue}>
                {moment(research.endDate).format('DD/MM/YYYY')}
              </Text>
            </View>
          </View>

          {research.fundingAmount && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Funding Amount</Text>
                <Text style={styles.infoValue}>
                  ₹{(research.fundingAmount / 100000).toFixed(2)} Lakhs
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Funding Agency</Text>
                <Text style={styles.infoValue}>{research.fundingAgency || 'Not specified'}</Text>
              </View>
            </View>
          )}
        </InfoCard>

        {/* Tags */}
        {research.tags && research.tags.length > 0 && (
          <InfoCard title="Research Areas" icon="pricetags-outline">
            <View style={styles.tagsContainer}>
              {research.tags.map((tag, index) => (
                <Chip key={index} mode="outlined" style={styles.tag}>
                  {tag}
                </Chip>
              ))}
            </View>
          </InfoCard>
        )}

        {/* Objectives */}
        {research.objectives && (
          <InfoCard title="Objectives" icon="target-outline">
            <Text style={styles.objectivesText}>{research.objectives}</Text>
          </InfoCard>
        )}

        {/* Methodology */}
        {research.methodology && (
          <InfoCard title="Methodology" icon="flask-outline">
            <Text style={styles.methodologyText}>{research.methodology}</Text>
          </InfoCard>
        )}

        {/* Expected Outcomes */}
        {research.expectedOutcomes && (
          <InfoCard title="Expected Outcomes" icon="trending-up-outline">
            <Text style={styles.outcomesText}>{research.expectedOutcomes}</Text>
          </InfoCard>
        )}

        {/* Collaborators */}
        {collaborators.length > 0 && (
          <InfoCard title="Collaborators" icon="people-outline">
            {collaborators.map((collaborator, index) => (
              <View key={index} style={styles.collaboratorItem}>
                <Avatar.Text 
                  size={40} 
                  label={collaborator.name.charAt(0)} 
                  style={styles.collaboratorAvatar}
                />
                <View style={styles.collaboratorInfo}>
                  <Text style={styles.collaboratorName}>{collaborator.name}</Text>
                  <Text style={styles.collaboratorRole}>{collaborator.designation}</Text>
                  <Text style={styles.collaboratorOrg}>{collaborator.organization}</Text>
                </View>
              </View>
            ))}
          </InfoCard>
        )}

        {/* Milestones */}
        {milestones.length > 0 && (
          <InfoCard title="Milestones" icon="flag-outline">
            {milestones.map((milestone, index) => (
              <View key={index} style={styles.milestoneItem}>
                <View style={styles.milestoneHeader}>
                  <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                  <StatusBadge status={milestone.status} />
                </View>
                <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                <Text style={styles.milestoneDate}>
                  Target: {moment(milestone.targetDate).format('DD/MM/YYYY')}
                </Text>
                {milestone.completedDate && (
                  <Text style={styles.completedDate}>
                    Completed: {moment(milestone.completedDate).format('DD/MM/YYYY')}
                  </Text>
                )}
              </View>
            ))}
          </InfoCard>
        )}

        {/* Publications */}
        {publications.length > 0 && (
          <InfoCard title="Publications" icon="document-text-outline">
            {publications.map((publication, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.publicationItem}
                onPress={() => openWebsite(publication.url)}
              >
                <Text style={styles.publicationTitle}>{publication.title}</Text>
                <Text style={styles.publicationJournal}>{publication.journal}</Text>
                <Text style={styles.publicationDate}>
                  Published: {moment(publication.publishedDate).format('DD/MM/YYYY')}
                </Text>
                {publication.url && (
                  <View style={styles.publicationLink}>
                    <Ionicons name="link-outline" size={14} color="#667eea" />
                    <Text style={styles.linkText}>View Publication</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </InfoCard>
        )}

        {/* Contact Information */}
        {research.contactEmail && (
          <InfoCard title="Contact Information" icon="mail-outline">
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => Linking.openURL(`mailto:${research.contactEmail}`)}
            >
              <Ionicons name="mail-outline" size={20} color="#667eea" />
              <Text style={styles.contactText}>{research.contactEmail}</Text>
            </TouchableOpacity>
            
            {research.website && (
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={() => openWebsite(research.website)}
              >
                <Ionicons name="globe-outline" size={20} color="#667eea" />
                <Text style={styles.contactText}>{research.website}</Text>
              </TouchableOpacity>
            )}
          </InfoCard>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {canCollaborate() && (
            <Button
              mode="contained"
              onPress={handleJoinCollaboration}
              style={styles.actionButton}
              icon="handshake"
            >
              Request Collaboration
            </Button>
          )}
          
          {(isOwner() || isCollaborator()) && (
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('AddResearch', { 
                researchId: research.id, 
                editMode: true 
              })}
              style={styles.actionButton}
              icon="pencil"
            >
              Edit Project
            </Button>
          )}
          
          {hasPermission('view_all_data') && (
            <Button
              mode="outlined"
              onPress={() => {
                // Generate report functionality
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
  categoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    marginBottom: 4,
  },
  objectivesText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  methodologyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  outcomesText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  collaboratorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  collaboratorAvatar: {
    backgroundColor: '#667eea',
    marginRight: 12,
  },
  collaboratorInfo: {
    flex: 1,
  },
  collaboratorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  collaboratorRole: {
    fontSize: 14,
    color: '#666',
  },
  collaboratorOrg: {
    fontSize: 12,
    color: '#999',
  },
  milestoneItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  milestoneDate: {
    fontSize: 12,
    color: '#999',
  },
  completedDate: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  publicationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  publicationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  publicationJournal: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  publicationDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  publicationLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 12,
    color: '#667eea',
    marginLeft: 4,
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