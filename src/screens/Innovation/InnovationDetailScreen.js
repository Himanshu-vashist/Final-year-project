import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking
} from 'react-native';
import { Title, Button, Chip, Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, LoadingSpinner } from '../../components/UIComponents';

const STAGE_TRANSITIONS = {
  submitted: ['under_review', 'rejected'],
  under_review: ['approved', 'rejected'],
  approved: ['in_incubation', 'rejected'],
  in_incubation: ['prototype', 'rejected'],
  prototype: ['pilot', 'rejected'],
  pilot: ['market_ready', 'rejected'],
  market_ready: [],
  rejected: ['under_review']
};

const COLLABORATION_TYPES = [
  'Technical Expertise',
  'Funding Support',
  'Market Research',
  'Business Development',
  'Legal Guidance',
  'Mentorship',
  'Partnership'
];

export default function InnovationDetailScreen({ route, navigation }) {
  const { ideaId } = route.params;
  const { userProfile, hasPermission } = useAuth();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadIdeaDetails();
  }, [ideaId]);

  const loadIdeaDetails = async () => {
    try {
      setLoading(true);
      
      // Load idea details
      const ideaDoc = await getDoc(doc(db, 'innovations', ideaId));
      if (ideaDoc.exists()) {
        const ideaData = { id: ideaDoc.id, ...ideaDoc.data() };
        setIdea(ideaData);
        
        // Load related data
        await Promise.all([
          loadMentors(ideaData),
          loadCollaborators(ideaData),
          loadTimeline(ideaData)
        ]);
      } else {
        Alert.alert('Error', 'Innovation idea not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading idea details:', error);
      Alert.alert('Error', 'Failed to load idea details');
    } finally {
      setLoading(false);
    }
  };

  const loadMentors = async (ideaData) => {
    if (ideaData.mentorIds && ideaData.mentorIds.length > 0) {
      try {
        const mentorPromises = ideaData.mentorIds.map(async (mentorId) => {
          const mentorDoc = await getDoc(doc(db, 'users', mentorId));
          return mentorDoc.exists() ? { id: mentorDoc.id, ...mentorDoc.data() } : null;
        });
        const mentorData = await Promise.all(mentorPromises);
        setMentors(mentorData.filter(mentor => mentor !== null));
      } catch (error) {
        console.error('Error loading mentors:', error);
      }
    }
  };

  const loadCollaborators = async (ideaData) => {
    if (ideaData.collaboratorIds && ideaData.collaboratorIds.length > 0) {
      try {
        const collaboratorPromises = ideaData.collaboratorIds.map(async (collaboratorId) => {
          const collaboratorDoc = await getDoc(doc(db, 'users', collaboratorId));
          return collaboratorDoc.exists() ? { id: collaboratorDoc.id, ...collaboratorDoc.data() } : null;
        });
        const collaboratorData = await Promise.all(collaboratorPromises);
        setCollaborators(collaboratorData.filter(collab => collab !== null));
      } catch (error) {
        console.error('Error loading collaborators:', error);
      }
    }
  };

  const loadTimeline = async (ideaData) => {
    try {
      const timelineQuery = query(
        collection(db, 'innovation_timeline'),
        where('innovationId', '==', ideaId)
      );
      const timelineSnapshot = await getDocs(timelineQuery);
      const timelineData = timelineSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setTimeline(timelineData);
    } catch (error) {
      console.error('Error loading timeline:', error);
    }
  };

  const canEdit = () => {
    return hasPermission('manage_innovations') || idea?.userId === userProfile.uid;
  };

  const canUpdateStatus = () => {
    return hasPermission('manage_innovations');
  };

  const canCollaborate = () => {
    return userProfile.uid !== idea?.userId && hasPermission('collaborate_innovation');
  };

  const getStageColor = (stage) => {
    const colors = {
      submitted: '#2196F3',
      under_review: '#FF9800',
      approved: '#4CAF50',
      in_incubation: '#9C27B0',
      prototype: '#607D8B',
      pilot: '#795548',
      market_ready: '#4CAF50',
      rejected: '#f44336'
    };
    return colors[stage] || '#666';
  };

  const updateStage = async (newStage) => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'innovations', ideaId), {
        stage: newStage,
        updatedAt: new Date().toISOString()
      });

      // Add timeline entry
      await addDoc(collection(db, 'innovation_timeline'), {
        innovationId: ideaId,
        action: 'stage_updated',
        description: `Stage updated to ${newStage.replace('_', ' ')}`,
        userId: userProfile.uid,
        userName: userProfile.name,
        createdAt: new Date().toISOString(),
        metadata: { oldStage: idea.stage, newStage }
      });

      setIdea(prev => ({ ...prev, stage: newStage }));
      loadTimeline(idea);
      Alert.alert('Success', 'Stage updated successfully');
    } catch (error) {
      console.error('Error updating stage:', error);
      Alert.alert('Error', 'Failed to update stage');
    } finally {
      setUpdating(false);
    }
  };

  const requestCollaboration = async (type) => {
    try {
      await addDoc(collection(db, 'collaboration_requests'), {
        innovationId: ideaId,
        innovationTitle: idea.title,
        requesterId: userProfile.uid,
        requesterName: userProfile.name,
        ownerId: idea.userId,
        type,
        status: 'pending',
        message: `I would like to collaborate on your innovation "${idea.title}" with ${type}.`,
        createdAt: new Date().toISOString()
      });

      Alert.alert('Success', 'Collaboration request sent!');
    } catch (error) {
      console.error('Error sending collaboration request:', error);
      Alert.alert('Error', 'Failed to send collaboration request');
    }
  };

  const openURL = (url) => {
    Linking.openURL(url);
  };

  if (loading) {
    return <LoadingSpinner message="Loading innovation details..." />;
  }

  if (!idea) {
    return (
      <View style={styles.container}>
        <Text>Innovation idea not found</Text>
      </View>
    );
  }

  const availableTransitions = STAGE_TRANSITIONS[idea.stage] || [];

  return (
    <LinearGradient
      colors={["#1a1a3e", "#2d2d5f", "#1a1a3e"]}
      style={styles.container}
    >
      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Title style={styles.headerTitle}>{idea.title}</Title>
            <StatusBadge status={idea.stage} color={getStageColor(idea.stage)} />
          </View>
          <View style={styles.headerRight}>
            {idea.priority === "high" && (
              <View style={styles.priorityBadge}>
                <Ionicons name="flag" size={16} color="#fff" />
                <Text style={styles.priorityText}>High Priority</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Modern Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="bulb" size={20} color="#b366ff" style={styles.statIcon} />
            <Text style={styles.statValue}>{idea.stage}</Text>
            <Text style={styles.statLabel}>Current Stage</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash" size={20} color="#b366ff" style={styles.statIcon} />
            <Text style={styles.statValue}>{idea.fundingRequested ? `₹${(idea.fundingRequested / 100000).toFixed(2)}L` : "-"}</Text>
            <Text style={styles.statLabel}>Funding Requested</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={20} color="#b366ff" style={styles.statIcon} />
            <Text style={styles.statValue}>{idea.teamMembers ? idea.teamMembers.length : 0}</Text>
            <Text style={styles.statLabel}>Team Members</Text>
          </View>
        </View>

        {/* Modern Card Sections */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{idea.description}</Text>
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={16} color="#b366ff" />
              <Text style={styles.metaText}>{idea.submitterName}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="business-outline" size={16} color="#b366ff" />
              <Text style={styles.metaText}>{idea.organization}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="folder-outline" size={16} color="#b366ff" />
              <Text style={styles.metaText}>{idea.category}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#b366ff" />
              <Text style={styles.metaText}>
                Submitted: {new Date(idea.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Tags */}
        {idea.tags && idea.tags.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {idea.tags.map((tag, index) => (
                <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
                  {tag}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {/* Problem Statement */}
        {idea.problemStatement && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Problem Statement</Text>
            <Text style={styles.content}>{idea.problemStatement}</Text>
          </View>
        )}

        {/* Solution */}
        {idea.solution && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Proposed Solution</Text>
            <Text style={styles.content}>{idea.solution}</Text>
          </View>
        )}

        {/* Market Potential */}
        {idea.marketPotential && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Market Potential</Text>
            <Text style={styles.content}>{idea.marketPotential}</Text>
          </View>
        )}

        {/* Funding Information */}
        {idea.fundingRequested && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Funding Information</Text>
            <View style={styles.fundingInfo}>
              <View style={styles.fundingItem}>
                <Text style={styles.fundingLabel}>Requested Amount</Text>
                <Text style={styles.fundingValue}>
                  ₹{(idea.fundingRequested / 100000).toFixed(2)} Lakhs
                </Text>
              </View>
              {idea.fundingPurpose && (
                <View style={styles.fundingItem}>
                  <Text style={styles.fundingLabel}>Purpose</Text>
                  <Text style={styles.fundingDescription}>{idea.fundingPurpose}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Team Members */}
        {idea.teamMembers && idea.teamMembers.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Team Members</Text>
            {idea.teamMembers.map((member, index) => (
              <View key={index} style={styles.teamMember}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                  {member.expertise && (
                    <Text style={styles.memberExpertise}>{member.expertise}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Mentors */}
        {mentors.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Assigned Mentors</Text>
            {mentors.map((mentor) => (
              <View key={mentor.id} style={styles.mentorCard}>
                <Avatar.Text
                  size={40}
                  label={mentor.name.charAt(0)}
                  style={styles.mentorAvatar}
                />
                <View style={styles.mentorInfo}>
                  <Text style={styles.mentorName}>{mentor.name}</Text>
                  <Text style={styles.mentorTitle}>{mentor.title}</Text>
                  <Text style={styles.mentorOrg}>{mentor.organization}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Collaborators */}
        {collaborators.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Collaborators</Text>
            {collaborators.map((collaborator) => (
              <View key={collaborator.id} style={styles.collaboratorCard}>
                <Avatar.Text
                  size={36}
                  label={collaborator.name.charAt(0)}
                  style={styles.collaboratorAvatar}
                />
                <View style={styles.collaboratorInfo}>
                  <Text style={styles.collaboratorName}>{collaborator.name}</Text>
                  <Text style={styles.collaboratorOrg}>{collaborator.organization}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Documents */}
        {idea.documents && idea.documents.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Supporting Documents</Text>
            {idea.documents.map((doc, index) => (
              <TouchableOpacity
                key={index}
                style={styles.documentItem}
                onPress={() => openURL(doc.url)}
              >
                <Ionicons name="document-outline" size={20} color="#9C27B0" />
                <Text style={styles.documentName}>{doc.name}</Text>
                <Ionicons name="open-outline" size={16} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Links */}
        {idea.links && idea.links.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Relevant Links</Text>
            {idea.links.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.linkItem}
                onPress={() => openURL(link.url)}
              >
                <Ionicons name="link-outline" size={20} color="#2196F3" />
                <View style={styles.linkInfo}>
                  <Text style={styles.linkTitle}>{link.title}</Text>
                  <Text style={styles.linkUrl}>{link.url}</Text>
                </View>
                <Ionicons name="open-outline" size={16} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Activity Timeline</Text>
            {timeline.map((event) => (
              <View key={event.id} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDescription}>{event.description}</Text>
                  <View style={styles.timelineMeta}>
                    <Text style={styles.timelineUser}>{event.userName}</Text>
                    <Text style={styles.timelineDate}>
                      {new Date(event.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {/* Edit Button */}
          {canEdit() && (
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('AddInnovation', { ideaId, editMode: true })}
              style={styles.actionButton}
              icon="pencil-outline"
            >
              Edit Idea
            </Button>
          )}

          {/* Stage Update Buttons */}
          {canUpdateStatus() && availableTransitions.length > 0 && (
            <View style={styles.stageActions}>
              <Text style={styles.actionLabel}>Update Stage:</Text>
              <View style={styles.stageButtons}>
                {availableTransitions.map((stage) => (
                  <Button
                    key={stage}
                    mode="contained"
                    onPress={() => updateStage(stage)}
                    style={[styles.stageButton, { backgroundColor: getStageColor(stage) }]}
                    loading={updating}
                    disabled={updating}
                    compact
                  >
                    {stage.replace('_', ' ')}
                  </Button>
                ))}
              </View>
            </View>
          )}

          {/* Collaboration Button */}
          {canCollaborate() && (
            <View style={styles.collaborationActions}>
              <Text style={styles.actionLabel}>Request Collaboration:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {COLLABORATION_TYPES.map((type) => (
                  <Button
                    key={type}
                    mode="outlined"
                    onPress={() => requestCollaboration(type)}
                    style={styles.collaborationButton}
                    compact
                  >
                    {type}
                  </Button>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a3e',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  priorityText: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '31%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#a0a0b0',
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#a0a0b0',
    lineHeight: 24,
    marginBottom: 16,
  },
  metaInfo: {
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#a0a0b0',
    marginLeft: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    height: 28,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagText: {
    fontSize: 12,
    color: '#fff',
  },
  fundingInfo: {
    gap: 16,
  },
  fundingItem: {
    gap: 6,
  },
  fundingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0a0b0',
  },
  fundingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  fundingDescription: {
    fontSize: 14,
    color: '#a0a0b0',
    lineHeight: 20,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  memberRole: {
    fontSize: 13,
    color: '#b366ff',
    marginTop: 4,
  },
  memberExpertise: {
    fontSize: 13,
    color: '#a0a0b0',
    marginTop: 4,
  },
  mentorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  mentorAvatar: {
    backgroundColor: '#b366ff',
  },
  mentorInfo: {
    marginLeft: 16,
    flex: 1,
  },
  mentorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  mentorTitle: {
    fontSize: 13,
    color: '#a0a0b0',
    marginTop: 4,
  },
  mentorOrg: {
    fontSize: 13,
    color: '#b366ff',
    marginTop: 4,
  },
  collaboratorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  collaboratorAvatar: {
    backgroundColor: '#4CAF50',
  },
  collaboratorInfo: {
    marginLeft: 16,
    flex: 1,
  },
  collaboratorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  collaboratorOrg: {
    fontSize: 13,
    color: '#a0a0b0',
    marginTop: 4,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  documentName: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    marginLeft: 12,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  linkInfo: {
    flex: 1,
    marginLeft: 12,
  },
  linkTitle: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  linkUrl: {
    fontSize: 13,
    color: '#a0a0b0',
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#b366ff',
    marginTop: 6,
    marginRight: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDescription: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 6,
  },
  timelineMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineUser: {
    fontSize: 13,
    color: '#b366ff',
    fontWeight: '600',
  },
  timelineDate: {
    fontSize: 13,
    color: '#a0a0b0',
  },
  actionSection: {
    marginBottom: 40,
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 16,
    borderColor: '#b366ff',
  },
  stageActions: {
    marginBottom: 24,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  stageButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stageButton: {
    marginRight: 12,
    marginBottom: 12,
  },
  collaborationActions: {
    marginBottom: 24,
  },
  collaborationButton: {
    marginRight: 12,
    borderColor: '#4CAF50',
  },
});