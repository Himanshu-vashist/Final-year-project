import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Title, Button, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, addDoc, updateDoc, getDoc, collection } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { 
  FormSection, 
  FormInput, 
  DatePicker, 
  DropdownPicker, 
  TagInput, 
  FileUpload, 
  FormActions 
} from '../../components/FormComponents';

const INNOVATION_CATEGORIES = [
  { label: 'Technology', value: 'technology' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Education', value: 'education' },
  { label: 'Agriculture', value: 'agriculture' },
  { label: 'Clean Energy', value: 'energy' },
  { label: 'FinTech', value: 'fintech' },
  { label: 'Social Innovation', value: 'social' },
  { label: 'Environment', value: 'environment' },
  { label: 'Manufacturing', value: 'manufacturing' },
  { label: 'Transportation', value: 'transportation' }
];

const PRIORITY_LEVELS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' }
];

const DEVELOPMENT_STAGES = [
  { label: 'Ideation', value: 'ideation' },
  { label: 'Research', value: 'research' },
  { label: 'Prototype', value: 'prototype' },
  { label: 'Testing', value: 'testing' },
  { label: 'Ready to Launch', value: 'ready' }
];

export default function AddInnovationScreen({ route, navigation }) {
  const { ideaId, editMode } = route.params || {};
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [teamMembers, setTeamMembers] = useState([
    { name: '', role: '', expertise: '', email: '' }
  ]);
  const [links, setLinks] = useState([{ title: '', url: '' }]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    problemStatement: '',
    solution: '',
    marketPotential: '',
    targetAudience: '',
    uniqueValue: '',
    businessModel: '',
    revenueModel: '',
    currentStage: 'ideation',
    priority: 'medium',
    timeline: '',
    resources: '',
    submitterName: userProfile?.name || '',
    organization: userProfile?.organization || '',
    contactEmail: userProfile?.email || '',
    contactPhone: '',
    fundingRequested: '',
    fundingPurpose: '',
    intellectualProperty: '',
    risks: '',
    tags: [],
    isPublic: true,
    documents: []
  });

  useEffect(() => {
    if (editMode && ideaId) {
      loadIdeaData();
    }
  }, [editMode, ideaId]);

  const loadIdeaData = async () => {
    try {
      setLoading(true);
      const ideaDoc = await getDoc(doc(db, 'innovations', ideaId));
      if (ideaDoc.exists()) {
        const data = ideaDoc.data();
        setFormData({
          ...data,
          tags: data.tags || [],
          documents: data.documents || []
        });
        setTeamMembers(data.teamMembers || [{ name: '', role: '', expertise: '', email: '' }]);
        setLinks(data.links || [{ title: '', url: '' }]);
      }
    } catch (error) {
      console.error('Error loading idea data:', error);
      Alert.alert('Error', 'Failed to load idea data');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: '', role: '', expertise: '', email: '' }]);
  };

  const updateTeamMember = (index, field, value) => {
    const updatedMembers = [...teamMembers];
    updatedMembers[index][field] = value;
    setTeamMembers(updatedMembers);
  };

  const removeTeamMember = (index) => {
    if (teamMembers.length > 1) {
      setTeamMembers(teamMembers.filter((_, i) => i !== index));
    }
  };

  const addLink = () => {
    setLinks([...links, { title: '', url: '' }]);
  };

  const updateLink = (index, field, value) => {
    const updatedLinks = [...links];
    updatedLinks[index][field] = value;
    setLinks(updatedLinks);
  };

  const removeLink = (index) => {
    if (links.length > 1) {
      setLinks(links.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.problemStatement.trim()) {
      newErrors.problemStatement = 'Problem statement is required';
    }

    if (!formData.solution.trim()) {
      newErrors.solution = 'Solution description is required';
    }

    if (!formData.submitterName.trim()) {
      newErrors.submitterName = 'Submitter name is required';
    }

    if (!formData.organization.trim()) {
      newErrors.organization = 'Organization is required';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    // Validate funding amount if provided
    if (formData.fundingRequested && isNaN(Number(formData.fundingRequested))) {
      newErrors.fundingRequested = 'Please enter a valid funding amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again.');
      return;
    }

    setLoading(true);
    try {
      const innovationData = {
        ...formData,
        userId: userProfile.uid,
        teamMembers: teamMembers.filter(member => member.name.trim()),
        links: links.filter(link => link.title.trim() && link.url.trim()),
        fundingRequested: formData.fundingRequested ? Number(formData.fundingRequested) : null,
        stage: editMode ? formData.stage : 'submitted',
        updatedAt: new Date().toISOString()
      };

      if (editMode && ideaId) {
        await updateDoc(doc(db, 'innovations', ideaId), innovationData);
        Alert.alert('Success', 'Innovation idea updated successfully!');
      } else {
        innovationData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'innovations'), innovationData);
        Alert.alert('Success', 'Innovation idea submitted successfully!');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving innovation:', error);
      Alert.alert('Error', 'Failed to save innovation idea. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  };

  return (
    <LinearGradient
      colors={["#1a1a3e", "#2d2d5f", "#1a1a3e"]}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              <Title style={styles.headerTitle}>
                {editMode ? 'Edit Innovation Idea' : 'Submit Innovation Idea'}
              </Title>
            </View>
            <View style={styles.headerRight} />
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* Modern Card Sections */}
          <View style={styles.sectionCard}>
            {/* Basic Information */}
            <FormSection title="Basic Information" icon="information-circle-outline">
              {/* ...existing code... */}
            </FormSection>

            {/* Problem & Solution */}
            <FormSection title="Problem & Solution" icon="bulb-outline">
              {/* ...existing code... */}
            </FormSection>

            {/* Market Analysis */}
            <FormSection title="Market Analysis" icon="trending-up-outline">
              {/* ...existing code... */}
            </FormSection>

            {/* Submitter Information */}
            <FormSection title="Submitter Information" icon="person-outline">
              {/* ...existing code... */}
            </FormSection>

            {/* Team Members */}
            <FormSection title="Team Members" icon="people-outline">
              {/* ...existing code... */}
            </FormSection>

            {/* Funding Requirements */}
            <FormSection title="Funding Requirements (Optional)" icon="cash-outline">
              {/* ...existing code... */}
            </FormSection>

            {/* Implementation Details */}
            <FormSection title="Implementation Details" icon="construct-outline">
              {/* ...existing code... */}
            </FormSection>

            {/* Links */}
            <FormSection title="Relevant Links (Optional)" icon="link-outline">
              {/* ...existing code... */}
            </FormSection>

            {/* Documents */}
            <FormSection title="Supporting Documents" icon="folder-outline">
              {/* ...existing code... */}
            </FormSection>

            {/* Privacy Settings */}
            <FormSection title="Privacy Settings" icon="shield-outline">
              {/* ...existing code... */}
            </FormSection>

            {/* Action Buttons */}
            <FormActions
              onSave={handleSave}
              onCancel={handleCancel}
              saveText={editMode ? 'Update Idea' : 'Submit Innovation'}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  memberContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  linkContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    marginTop: 8,
    borderColor: '#9C27B0',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    lineHeight: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
  },
});