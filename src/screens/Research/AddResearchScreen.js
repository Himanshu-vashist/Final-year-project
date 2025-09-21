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
import { Title } from 'react-native-paper';
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

const RESEARCH_CATEGORIES = [
  { label: 'Agriculture', value: 'Agriculture' },
  { label: 'Technology', value: 'Technology' },
  { label: 'Healthcare', value: 'Healthcare' },
  { label: 'Education', value: 'Education' },
  { label: 'Environment', value: 'Environment' },
  { label: 'Manufacturing', value: 'Manufacturing' },
  { label: 'Energy', value: 'Energy' },
  { label: 'Transportation', value: 'Transportation' },
  { label: 'Space & Defense', value: 'Space & Defense' },
  { label: 'Biotechnology', value: 'Biotechnology' }
];

const RESEARCH_STATUS = [
  { label: 'Planning', value: 'planning' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Paused', value: 'paused' },
  { label: 'Cancelled', value: 'cancelled' }
];

const FUNDING_TYPES = [
  { label: 'Government Grant', value: 'government_grant' },
  { label: 'Private Funding', value: 'private_funding' },
  { label: 'Self Funded', value: 'self_funded' },
  { label: 'International Grant', value: 'international_grant' },
  { label: 'Industry Sponsored', value: 'industry_sponsored' }
];

export default function AddResearchScreen({ route, navigation }) {
  const { researchId, editMode } = route.params || {};
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    objectives: '',
    methodology: '',
    expectedOutcomes: '',
    category: '',
    status: 'planning',
    principalInvestigator: userProfile?.name || '',
    institution: userProfile?.organization || '',
    startDate: new Date(),
    endDate: null,
    fundingAmount: '',
    fundingAgency: '',
    fundingType: '',
    contactEmail: userProfile?.email || '',
    website: '',
    tags: [],
    isPublic: true,
    documents: []
  });

  useEffect(() => {
    if (editMode && researchId) {
      loadResearchData();
    }
  }, [editMode, researchId]);

  const loadResearchData = async () => {
    try {
      setLoading(true);
      const researchDoc = await getDoc(doc(db, 'research', researchId));
      if (researchDoc.exists()) {
        const data = researchDoc.data();
        setFormData({
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          endDate: data.endDate ? new Date(data.endDate) : null,
          tags: data.tags || [],
          documents: data.documents || []
        });
      }
    } catch (error) {
      console.error('Error loading research data:', error);
      Alert.alert('Error', 'Failed to load research data');
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.objectives.trim()) {
      newErrors.objectives = 'Objectives are required';
    }

    if (!formData.methodology.trim()) {
      newErrors.methodology = 'Methodology is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.principalInvestigator.trim()) {
      newErrors.principalInvestigator = 'Principal investigator is required';
    }

    if (!formData.institution.trim()) {
      newErrors.institution = 'Institution is required';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    if (formData.endDate && formData.endDate <= formData.startDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (formData.fundingAmount && isNaN(parseFloat(formData.fundingAmount))) {
      newErrors.fundingAmount = 'Please enter a valid amount';
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
      const researchData = {
        ...formData,
        userId: userProfile.uid,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate ? formData.endDate.toISOString() : null,
        fundingAmount: formData.fundingAmount ? parseFloat(formData.fundingAmount) : null,
        updatedAt: new Date().toISOString()
      };

      if (editMode && researchId) {
        await updateDoc(doc(db, 'research', researchId), researchData);
        Alert.alert('Success', 'Research project updated successfully!');
      } else {
        researchData.createdAt = new Date().toISOString();
        researchData.collaboratorIds = [];
        await addDoc(collection(db, 'research'), researchData);
        Alert.alert('Success', 'Research project submitted successfully!');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving research:', error);
      Alert.alert('Error', 'Failed to save research project. Please try again.');
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
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Title style={styles.headerTitle}>
          {editMode ? 'Edit Research Project' : 'Submit Research Project'}
        </Title>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Basic Information */}
        <FormSection title="Basic Information" icon="information-circle-outline">
          <FormInput
            label="Project Title"
            value={formData.title}
            onChangeText={(value) => updateFormData('title', value)}
            placeholder="Enter the research project title"
            required
            error={errors.title}
          />

          <FormInput
            label="Description"
            value={formData.description}
            onChangeText={(value) => updateFormData('description', value)}
            placeholder="Provide a detailed description of your research"
            multiline
            numberOfLines={4}
            required
            error={errors.description}
          />

          <DropdownPicker
            label="Research Category"
            value={formData.category}
            onValueChange={(value) => updateFormData('category', value)}
            items={RESEARCH_CATEGORIES}
            required
            error={errors.category}
          />

          <DropdownPicker
            label="Project Status"
            value={formData.status}
            onValueChange={(value) => updateFormData('status', value)}
            items={RESEARCH_STATUS}
            required
          />

          <TagInput
            label="Research Tags"
            tags={formData.tags}
            onTagsChange={(tags) => updateFormData('tags', tags)}
            placeholder="Add relevant tags (e.g., AI, Machine Learning)"
          />
        </FormSection>

        {/* Research Details */}
        <FormSection title="Research Details" icon="flask-outline">
          <FormInput
            label="Research Objectives"
            value={formData.objectives}
            onChangeText={(value) => updateFormData('objectives', value)}
            placeholder="Describe the main objectives of your research"
            multiline
            numberOfLines={3}
            required
            error={errors.objectives}
          />

          <FormInput
            label="Methodology"
            value={formData.methodology}
            onChangeText={(value) => updateFormData('methodology', value)}
            placeholder="Explain the research methodology and approach"
            multiline
            numberOfLines={3}
            required
            error={errors.methodology}
          />

          <FormInput
            label="Expected Outcomes"
            value={formData.expectedOutcomes}
            onChangeText={(value) => updateFormData('expectedOutcomes', value)}
            placeholder="Describe the expected outcomes and impact"
            multiline
            numberOfLines={3}
          />
        </FormSection>

        {/* Principal Investigator */}
        <FormSection title="Principal Investigator" icon="person-outline">
          <FormInput
            label="Name"
            value={formData.principalInvestigator}
            onChangeText={(value) => updateFormData('principalInvestigator', value)}
            placeholder="Principal investigator name"
            required
            error={errors.principalInvestigator}
          />

          <FormInput
            label="Institution/Organization"
            value={formData.institution}
            onChangeText={(value) => updateFormData('institution', value)}
            placeholder="Institution or organization name"
            required
            error={errors.institution}
          />

          <FormInput
            label="Contact Email"
            value={formData.contactEmail}
            onChangeText={(value) => updateFormData('contactEmail', value)}
            placeholder="Email for project inquiries"
            keyboardType="email-address"
            required
            error={errors.contactEmail}
          />

          <FormInput
            label="Project Website"
            value={formData.website}
            onChangeText={(value) => updateFormData('website', value)}
            placeholder="Project website or homepage (optional)"
          />
        </FormSection>

        {/* Timeline */}
        <FormSection title="Project Timeline" icon="calendar-outline">
          <DatePicker
            label="Start Date"
            value={formData.startDate}
            onDateChange={(date) => updateFormData('startDate', date)}
            required
          />

          <DatePicker
            label="Expected End Date"
            value={formData.endDate}
            onDateChange={(date) => updateFormData('endDate', date)}
            error={errors.endDate}
          />
        </FormSection>

        {/* Funding Information */}
        <FormSection title="Funding Information" icon="cash-outline">
          <FormInput
            label="Funding Amount (₹)"
            value={formData.fundingAmount}
            onChangeText={(value) => updateFormData('fundingAmount', value)}
            placeholder="Total funding amount in rupees"
            keyboardType="numeric"
            error={errors.fundingAmount}
          />

          <FormInput
            label="Funding Agency"
            value={formData.fundingAgency}
            onChangeText={(value) => updateFormData('fundingAgency', value)}
            placeholder="Name of funding agency or organization"
          />

          <DropdownPicker
            label="Funding Type"
            value={formData.fundingType}
            onValueChange={(value) => updateFormData('fundingType', value)}
            items={FUNDING_TYPES}
          />
        </FormSection>

        {/* Documents */}
        <FormSection title="Supporting Documents" icon="document-text-outline">
          <FileUpload
            label="Upload Documents"
            files={formData.documents}
            onFileSelect={(files) => updateFormData('documents', files)}
            acceptedTypes={['application/pdf', 'image/*', 'application/msword']}
            multiple={true}
          />
          <Text style={styles.helpText}>
            You can upload research proposals, presentations, or other relevant documents
          </Text>
        </FormSection>

        {/* Privacy Settings */}
        <FormSection title="Privacy Settings" icon="shield-outline">
          <View style={styles.switchContainer}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Make Project Public</Text>
              <Text style={styles.switchDescription}>
                Allow other researchers and public to view this project
              </Text>
            </View>
            {/* Switch would be implemented here */}
          </View>
        </FormSection>

        {/* Action Buttons */}
        <FormActions
          onSave={handleSave}
          onCancel={handleCancel}
          saveText={editMode ? 'Update Project' : 'Submit Project'}
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