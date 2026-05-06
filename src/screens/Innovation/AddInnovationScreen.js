import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity
} from 'react-native';
import { Title, Button, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
              <FormInput
                label="Innovation Title"
                placeholder="Enter a catchy title"
                value={formData.title}
                onChangeText={(val) => updateFormData('title', val)}
                error={errors.title}
                required
              />
              <FormInput
                label="Brief Description"
                placeholder="Short summary of your idea"
                value={formData.description}
                onChangeText={(val) => updateFormData('description', val)}
                multiline
                numberOfLines={3}
                error={errors.description}
                required
              />
              <DropdownPicker
                label="Category"
                value={formData.category}
                onValueChange={(val) => updateFormData('category', val)}
                items={INNOVATION_CATEGORIES}
                error={errors.category}
                required
              />
              <DropdownPicker
                label="Priority Level"
                value={formData.priority}
                onValueChange={(val) => updateFormData('priority', val)}
                items={PRIORITY_LEVELS}
              />
              <TagInput
                label="Tags/Keywords"
                tags={formData.tags}
                onTagsChange={(tags) => updateFormData('tags', tags)}
              />
            </FormSection>

            {/* Problem & Solution */}
            <FormSection title="Problem & Solution" icon="bulb-outline">
              <FormInput
                label="Problem Statement"
                placeholder="What problem does this solve?"
                value={formData.problemStatement}
                onChangeText={(val) => updateFormData('problemStatement', val)}
                multiline
                numberOfLines={4}
                error={errors.problemStatement}
                required
              />
              <FormInput
                label="Proposed Solution"
                placeholder="How does your innovation solve it?"
                value={formData.solution}
                onChangeText={(val) => updateFormData('solution', val)}
                multiline
                numberOfLines={4}
                error={errors.solution}
                required
              />
              <FormInput
                label="Unique Value Proposition"
                placeholder="What makes your solution different/better?"
                value={formData.uniqueValue}
                onChangeText={(val) => updateFormData('uniqueValue', val)}
                multiline
                numberOfLines={3}
              />
            </FormSection>

            {/* Market Analysis */}
            <FormSection title="Market Analysis" icon="trending-up-outline">
              <FormInput
                label="Market Potential"
                placeholder="Size and characteristics of the market"
                value={formData.marketPotential}
                onChangeText={(val) => updateFormData('marketPotential', val)}
                multiline
                numberOfLines={3}
              />
              <FormInput
                label="Target Audience"
                placeholder="Who will use this?"
                value={formData.targetAudience}
                onChangeText={(val) => updateFormData('targetAudience', val)}
              />
              <FormInput
                label="Business Model"
                placeholder="How will this operate?"
                value={formData.businessModel}
                onChangeText={(val) => updateFormData('businessModel', val)}
                multiline
                numberOfLines={3}
              />
              <FormInput
                label="Revenue Model"
                placeholder="How will this generate income?"
                value={formData.revenueModel}
                onChangeText={(val) => updateFormData('revenueModel', val)}
              />
            </FormSection>

            {/* Submitter Information */}
            <FormSection title="Submitter Information" icon="person-outline">
              <FormInput
                label="Submitter Name"
                value={formData.submitterName}
                onChangeText={(val) => updateFormData('submitterName', val)}
                error={errors.submitterName}
                required
              />
              <FormInput
                label="Organization/Institution"
                value={formData.organization}
                onChangeText={(val) => updateFormData('organization', val)}
                error={errors.organization}
                required
              />
              <FormInput
                label="Contact Email"
                value={formData.contactEmail}
                onChangeText={(val) => updateFormData('contactEmail', val)}
                keyboardType="email-address"
                error={errors.contactEmail}
                required
              />
              <FormInput
                label="Contact Phone"
                value={formData.contactPhone}
                onChangeText={(val) => updateFormData('contactPhone', val)}
                keyboardType="phone-pad"
              />
            </FormSection>

            {/* Team Members */}
            <FormSection title="Team Members" icon="people-outline">
              {teamMembers.map((member, index) => (
                <View key={index} style={styles.memberContainer}>
                  <View style={styles.memberHeader}>
                    <Text style={styles.memberTitle}>Member {index + 1}</Text>
                    {teamMembers.length > 1 && (
                      <TouchableOpacity onPress={() => removeTeamMember(index)}>
                        <Ionicons name="trash-outline" size={20} color="#f44336" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <FormInput
                    label="Name"
                    value={member.name}
                    onChangeText={(val) => updateTeamMember(index, 'name', val)}
                  />
                  <FormInput
                    label="Role"
                    value={member.role}
                    onChangeText={(val) => updateTeamMember(index, 'role', val)}
                  />
                  <FormInput
                    label="Expertise"
                    value={member.expertise}
                    onChangeText={(val) => updateTeamMember(index, 'expertise', val)}
                  />
                </View>
              ))}
              <Button mode="outlined" onPress={addTeamMember} style={styles.addButton} textColor="#b366ff">
                + Add Team Member
              </Button>
            </FormSection>

            {/* Funding Requirements */}
            <FormSection title="Funding Requirements (Optional)" icon="cash-outline">
              <FormInput
                label="Funding Requested (₹)"
                value={formData.fundingRequested}
                onChangeText={(val) => updateFormData('fundingRequested', val)}
                keyboardType="numeric"
                error={errors.fundingRequested}
              />
              <FormInput
                label="Funding Purpose"
                placeholder="How will the funds be used?"
                value={formData.fundingPurpose}
                onChangeText={(val) => updateFormData('fundingPurpose', val)}
                multiline
                numberOfLines={3}
              />
            </FormSection>

            {/* Implementation Details */}
            <FormSection title="Implementation Details" icon="construct-outline">
              <DropdownPicker
                label="Current Stage"
                value={formData.currentStage}
                onValueChange={(val) => updateFormData('currentStage', val)}
                items={DEVELOPMENT_STAGES}
              />
              <FormInput
                label="Timeline/Roadmap"
                placeholder="Expected milestones and timeline"
                value={formData.timeline}
                onChangeText={(val) => updateFormData('timeline', val)}
                multiline
                numberOfLines={3}
              />
              <FormInput
                label="Required Resources"
                placeholder="What resources do you need?"
                value={formData.resources}
                onChangeText={(val) => updateFormData('resources', val)}
                multiline
                numberOfLines={2}
              />
              <FormInput
                label="Potential Risks"
                placeholder="What are the risks and your mitigation plan?"
                value={formData.risks}
                onChangeText={(val) => updateFormData('risks', val)}
                multiline
                numberOfLines={3}
              />
            </FormSection>

            {/* Links */}
            <FormSection title="Relevant Links (Optional)" icon="link-outline">
              {links.map((link, index) => (
                <View key={index} style={styles.linkContainer}>
                  <View style={styles.linkHeader}>
                    <Text style={styles.linkTitle}>Link {index + 1}</Text>
                    {links.length > 1 && (
                      <TouchableOpacity onPress={() => removeLink(index)}>
                        <Ionicons name="trash-outline" size={20} color="#f44336" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <FormInput
                    label="Title"
                    placeholder="e.g., Pitch Deck, Demo Video"
                    value={link.title}
                    onChangeText={(val) => updateLink(index, 'title', val)}
                  />
                  <FormInput
                    label="URL"
                    placeholder="https://"
                    value={link.url}
                    onChangeText={(val) => updateLink(index, 'url', val)}
                    keyboardType="url"
                  />
                </View>
              ))}
              <Button mode="outlined" onPress={addLink} style={styles.addButton} textColor="#b366ff">
                + Add Link
              </Button>
            </FormSection>

            {/* Documents */}
            <FormSection title="Supporting Documents" icon="folder-outline">
              <FileUpload
                label="Upload Documents"
                files={formData.documents}
                onFileSelect={(files) => updateFormData('documents', files)}
                multiple
              />
              <Text style={styles.helpText}>
                Supported formats: PDF, DOCX, PPTX (Max 10MB per file)
              </Text>
            </FormSection>

            {/* Privacy Settings */}
            <FormSection title="Privacy Settings" icon="shield-outline">
              <View style={styles.switchContainer}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Public Innovation Idea</Text>
                  <Text style={styles.switchDescription}>
                    Allow other users to view your idea and request collaboration
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => updateFormData('isPublic', !formData.isPublic)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: formData.isPublic ? '#b366ff' : 'rgba(255,255,255,0.1)',
                    justifyContent: 'center',
                    padding: 2
                  }}
                >
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: '#fff',
                    alignSelf: formData.isPublic ? 'flex-end' : 'flex-start'
                  }} />
                </TouchableOpacity>
              </View>
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
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionCard: {
    backgroundColor: 'transparent',
    marginBottom: 40,
  },
  memberContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  linkContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    marginTop: 8,
    borderColor: '#b366ff',
  },
  helpText: {
    fontSize: 13,
    color: '#a0a0b0',
    marginTop: 8,
    lineHeight: 18,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#a0a0b0',
  },
});