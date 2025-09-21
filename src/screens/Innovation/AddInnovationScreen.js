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
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient
        colors={['#9C27B0', '#673AB7']}
        style={styles.header}
      >
        <Title style={styles.headerTitle}>
          {editMode ? 'Edit Innovation Idea' : 'Submit Innovation Idea'}
        </Title>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Basic Information */}
        <FormSection title="Basic Information" icon="information-circle-outline">
          <FormInput
            label="Innovation Title"
            value={formData.title}
            onChangeText={(value) => updateFormData('title', value)}
            placeholder="Enter a compelling title for your innovation"
            required
            error={errors.title}
          />

          <FormInput
            label="Description"
            value={formData.description}
            onChangeText={(value) => updateFormData('description', value)}
            placeholder="Provide a comprehensive description of your innovation"
            multiline
            numberOfLines={4}
            required
            error={errors.description}
          />

          <DropdownPicker
            label="Category"
            value={formData.category}
            onValueChange={(value) => updateFormData('category', value)}
            items={INNOVATION_CATEGORIES}
            required
            error={errors.category}
          />

          <DropdownPicker
            label="Current Development Stage"
            value={formData.currentStage}
            onValueChange={(value) => updateFormData('currentStage', value)}
            items={DEVELOPMENT_STAGES}
          />

          <DropdownPicker
            label="Priority Level"
            value={formData.priority}
            onValueChange={(value) => updateFormData('priority', value)}
            items={PRIORITY_LEVELS}
          />

          <TagInput
            label="Tags"
            tags={formData.tags}
            onTagsChange={(tags) => updateFormData('tags', tags)}
            placeholder="Add relevant keywords"
          />
        </FormSection>

        {/* Problem & Solution */}
        <FormSection title="Problem & Solution" icon="bulb-outline">
          <FormInput
            label="Problem Statement"
            value={formData.problemStatement}
            onChangeText={(value) => updateFormData('problemStatement', value)}
            placeholder="Clearly describe the problem your innovation addresses"
            multiline
            numberOfLines={3}
            required
            error={errors.problemStatement}
          />

          <FormInput
            label="Proposed Solution"
            value={formData.solution}
            onChangeText={(value) => updateFormData('solution', value)}
            placeholder="Describe how your innovation solves the problem"
            multiline
            numberOfLines={3}
            required
            error={errors.solution}
          />

          <FormInput
            label="Unique Value Proposition"
            value={formData.uniqueValue}
            onChangeText={(value) => updateFormData('uniqueValue', value)}
            placeholder="What makes your solution unique?"
            multiline
            numberOfLines={2}
          />
        </FormSection>

        {/* Market Analysis */}
        <FormSection title="Market Analysis" icon="trending-up-outline">
          <FormInput
            label="Market Potential"
            value={formData.marketPotential}
            onChangeText={(value) => updateFormData('marketPotential', value)}
            placeholder="Describe the market size and potential for your innovation"
            multiline
            numberOfLines={3}
          />

          <FormInput
            label="Target Audience"
            value={formData.targetAudience}
            onChangeText={(value) => updateFormData('targetAudience', value)}
            placeholder="Who are your primary users/customers?"
            multiline
            numberOfLines={2}
          />

          <FormInput
            label="Business Model"
            value={formData.businessModel}
            onChangeText={(value) => updateFormData('businessModel', value)}
            placeholder="How will you deliver value to customers?"
            multiline
            numberOfLines={2}
          />

          <FormInput
            label="Revenue Model"
            value={formData.revenueModel}
            onChangeText={(value) => updateFormData('revenueModel', value)}
            placeholder="How will you generate revenue?"
            multiline
            numberOfLines={2}
          />
        </FormSection>

        {/* Submitter Information */}
        <FormSection title="Submitter Information" icon="person-outline">
          <FormInput
            label="Your Name"
            value={formData.submitterName}
            onChangeText={(value) => updateFormData('submitterName', value)}
            placeholder="Enter your full name"
            required
            error={errors.submitterName}
          />

          <FormInput
            label="Organization"
            value={formData.organization}
            onChangeText={(value) => updateFormData('organization', value)}
            placeholder="Your organization or company"
            required
            error={errors.organization}
          />

          <FormInput
            label="Contact Email"
            value={formData.contactEmail}
            onChangeText={(value) => updateFormData('contactEmail', value)}
            placeholder="Email for correspondence"
            keyboardType="email-address"
            required
            error={errors.contactEmail}
          />

          <FormInput
            label="Contact Phone"
            value={formData.contactPhone}
            onChangeText={(value) => updateFormData('contactPhone', value)}
            placeholder="Phone number for correspondence"
            keyboardType="phone-pad"
          />
        </FormSection>

        {/* Team Members */}
        <FormSection title="Team Members" icon="people-outline">
          {teamMembers.map((member, index) => (
            <View key={index} style={styles.memberContainer}>
              <View style={styles.memberHeader}>
                <Text style={styles.memberTitle}>Team Member {index + 1}</Text>
                {teamMembers.length > 1 && (
                  <Button
                    mode="text"
                    onPress={() => removeTeamMember(index)}
                    textColor="#f44336"
                    compact
                  >
                    Remove
                  </Button>
                )}
              </View>

              <FormInput
                label="Name"
                value={member.name}
                onChangeText={(value) => updateTeamMember(index, 'name', value)}
                placeholder="Team member name"
              />

              <FormInput
                label="Role"
                value={member.role}
                onChangeText={(value) => updateTeamMember(index, 'role', value)}
                placeholder="Role in the project"
              />

              <FormInput
                label="Expertise"
                value={member.expertise}
                onChangeText={(value) => updateTeamMember(index, 'expertise', value)}
                placeholder="Areas of expertise"
              />

              <FormInput
                label="Email"
                value={member.email}
                onChangeText={(value) => updateTeamMember(index, 'email', value)}
                placeholder="Email address"
                keyboardType="email-address"
              />
            </View>
          ))}

          <Button
            mode="outlined"
            onPress={addTeamMember}
            style={styles.addButton}
            icon="plus"
          >
            Add Team Member
          </Button>
        </FormSection>

        {/* Funding Requirements */}
        <FormSection title="Funding Requirements (Optional)" icon="cash-outline">
          <FormInput
            label="Funding Amount (₹)"
            value={formData.fundingRequested}
            onChangeText={(value) => updateFormData('fundingRequested', value)}
            placeholder="Enter amount in rupees"
            keyboardType="numeric"
            error={errors.fundingRequested}
          />

          <FormInput
            label="Purpose of Funding"
            value={formData.fundingPurpose}
            onChangeText={(value) => updateFormData('fundingPurpose', value)}
            placeholder="How will the funding be used?"
            multiline
            numberOfLines={3}
          />
        </FormSection>

        {/* Implementation Details */}
        <FormSection title="Implementation Details" icon="construct-outline">
          <FormInput
            label="Timeline"
            value={formData.timeline}
            onChangeText={(value) => updateFormData('timeline', value)}
            placeholder="Expected development timeline"
            multiline
            numberOfLines={2}
          />

          <FormInput
            label="Resources Required"
            value={formData.resources}
            onChangeText={(value) => updateFormData('resources', value)}
            placeholder="What resources do you need?"
            multiline
            numberOfLines={2}
          />

          <FormInput
            label="Intellectual Property"
            value={formData.intellectualProperty}
            onChangeText={(value) => updateFormData('intellectualProperty', value)}
            placeholder="Any patents, trademarks, or IP considerations"
            multiline
            numberOfLines={2}
          />

          <FormInput
            label="Risks & Challenges"
            value={formData.risks}
            onChangeText={(value) => updateFormData('risks', value)}
            placeholder="Potential risks and mitigation strategies"
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
                  <Button
                    mode="text"
                    onPress={() => removeLink(index)}
                    textColor="#f44336"
                    compact
                  >
                    Remove
                  </Button>
                )}
              </View>

              <FormInput
                label="Title"
                value={link.title}
                onChangeText={(value) => updateLink(index, 'title', value)}
                placeholder="Link description"
              />

              <FormInput
                label="URL"
                value={link.url}
                onChangeText={(value) => updateLink(index, 'url', value)}
                placeholder="https://example.com"
                keyboardType="url"
              />
            </View>
          ))}

          <Button
            mode="outlined"
            onPress={addLink}
            style={styles.addButton}
            icon="plus"
          >
            Add Link
          </Button>
        </FormSection>

        {/* Documents */}
        <FormSection title="Supporting Documents" icon="folder-outline">
          <FileUpload
            label="Upload Documents"
            files={formData.documents}
            onFileSelect={(files) => updateFormData('documents', files)}
            acceptedTypes={['application/pdf', 'image/*', 'application/msword']}
            multiple={true}
          />
          <Text style={styles.helpText}>
            Upload business plans, prototypes, research papers, or other relevant documents
          </Text>
        </FormSection>

        {/* Privacy Settings */}
        <FormSection title="Privacy Settings" icon="shield-outline">
          <View style={styles.switchContainer}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Make Idea Public</Text>
              <Text style={styles.switchDescription}>
                Allow others to view and potentially collaborate on this idea
              </Text>
            </View>
            {/* Switch component would go here */}
          </View>
        </FormSection>

        {/* Action Buttons */}
        <FormActions
          onSave={handleSave}
          onCancel={handleCancel}
          saveText={editMode ? 'Update Idea' : 'Submit Innovation'}
          loading={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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