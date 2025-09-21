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

const STARTUP_STAGES = [
  { label: 'Ideation', value: 'ideation' },
  { label: 'Validation', value: 'validation' },
  { label: 'Early Stage', value: 'early_stage' },
  { label: 'Growth', value: 'growth' },
  { label: 'Expansion', value: 'expansion' },
  { label: 'Mature', value: 'mature' }
];

const INDUSTRY_SECTORS = [
  { label: 'Technology', value: 'technology' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'FinTech', value: 'fintech' },
  { label: 'E-commerce', value: 'ecommerce' },
  { label: 'EdTech', value: 'education' },
  { label: 'AgriTech', value: 'agriculture' },
  { label: 'Clean Energy', value: 'energy' },
  { label: 'Manufacturing', value: 'manufacturing' },
  { label: 'Logistics', value: 'logistics' },
  { label: 'Media & Entertainment', value: 'media' }
];

const FUNDING_STAGES = [
  { label: 'Bootstrapped', value: 'bootstrapped' },
  { label: 'Pre-Seed', value: 'pre_seed' },
  { label: 'Seed', value: 'seed' },
  { label: 'Series A', value: 'series_a' },
  { label: 'Series B', value: 'series_b' },
  { label: 'Series C+', value: 'series_c' }
];

const BUSINESS_MODELS = [
  { label: 'B2B', value: 'b2b' },
  { label: 'B2C', value: 'b2c' },
  { label: 'B2B2C', value: 'b2b2c' },
  { label: 'Marketplace', value: 'marketplace' },
  { label: 'SaaS', value: 'saas' },
  { label: 'E-commerce', value: 'ecommerce' },
  { label: 'Subscription', value: 'subscription' },
  { label: 'Freemium', value: 'freemium' }
];

export default function RegisterStartupScreen({ route, navigation }) {
  const { startupId, editMode } = route.params || {};
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [founders, setFounders] = useState([
    { name: userProfile?.name || '', email: userProfile?.email || '', role: 'CEO', equity: '', bio: '' }
  ]);
  const [links, setLinks] = useState([{ title: '', url: '' }]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sector: '',
    stage: 'ideation',
    fundingStage: 'bootstrapped',
    businessModel: '',
    foundingDate: new Date(),
    location: '',
    website: '',
    problemStatement: '',
    solution: '',
    targetMarket: '',
    marketSize: '',
    competitors: '',
    revenueModel: '',
    currentRevenue: '',
    projectedRevenue: '',
    employeeCount: '',
    totalFunding: '',
    valuation: '',
    currentFundraising: false,
    currentFundraisingType: '',
    targetAmount: '',
    fundraisingDescription: '',
    founderName: userProfile?.name || '',
    contactEmail: userProfile?.email || '',
    contactPhone: '',
    linkedinProfile: '',
    twitterHandle: '',
    tags: [],
    isPublic: true,
    documents: []
  });

  useEffect(() => {
    if (editMode && startupId) {
      loadStartupData();
    }
  }, [editMode, startupId]);

  const loadStartupData = async () => {
    try {
      setLoading(true);
      const startupDoc = await getDoc(doc(db, 'startups', startupId));
      if (startupDoc.exists()) {
        const data = startupDoc.data();
        setFormData({
          ...data,
          foundingDate: data.foundingDate ? new Date(data.foundingDate) : new Date(),
          tags: data.tags || [],
          documents: data.documents || []
        });
        setFounders(data.founders || [
          { name: userProfile?.name || '', email: userProfile?.email || '', role: 'CEO', equity: '', bio: '' }
        ]);
        setLinks(data.links || [{ title: '', url: '' }]);
      }
    } catch (error) {
      console.error('Error loading startup data:', error);
      Alert.alert('Error', 'Failed to load startup data');
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

  const addFounder = () => {
    setFounders([...founders, { name: '', email: '', role: '', equity: '', bio: '' }]);
  };

  const updateFounder = (index, field, value) => {
    const updatedFounders = [...founders];
    updatedFounders[index][field] = value;
    setFounders(updatedFounders);
  };

  const removeFounder = (index) => {
    if (founders.length > 1) {
      setFounders(founders.filter((_, i) => i !== index));
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

    if (!formData.name.trim()) {
      newErrors.name = 'Startup name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.sector) {
      newErrors.sector = 'Industry sector is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.problemStatement.trim()) {
      newErrors.problemStatement = 'Problem statement is required';
    }

    if (!formData.solution.trim()) {
      newErrors.solution = 'Solution description is required';
    }

    if (!formData.founderName.trim()) {
      newErrors.founderName = 'Founder name is required';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    // Validate website URL if provided
    if (formData.website && !formData.website.includes('http')) {
      newErrors.website = 'Please enter a valid website URL';
    }

    // Validate numeric fields
    const numericFields = ['currentRevenue', 'projectedRevenue', 'employeeCount', 'totalFunding', 'valuation', 'targetAmount'];
    numericFields.forEach(field => {
      if (formData[field] && isNaN(Number(formData[field]))) {
        newErrors[field] = 'Please enter a valid number';
      }
    });

    // Validate founders
    const validFounders = founders.filter(founder => founder.name.trim() && founder.email.trim());
    if (validFounders.length === 0) {
      newErrors.founders = 'At least one founder is required';
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
      const startupData = {
        ...formData,
        userId: userProfile.uid,
        founders: founders.filter(founder => founder.name.trim() && founder.email.trim()),
        links: links.filter(link => link.title.trim() && link.url.trim()),
        foundingDate: formData.foundingDate.toISOString(),
        currentRevenue: formData.currentRevenue ? Number(formData.currentRevenue) : null,
        projectedRevenue: formData.projectedRevenue ? Number(formData.projectedRevenue) : null,
        employeeCount: formData.employeeCount ? Number(formData.employeeCount) : null,
        totalFunding: formData.totalFunding ? Number(formData.totalFunding) : null,
        valuation: formData.valuation ? Number(formData.valuation) : null,
        targetAmount: formData.targetAmount ? Number(formData.targetAmount) : null,
        isVerified: false,
        updatedAt: new Date().toISOString()
      };

      if (editMode && startupId) {
        await updateDoc(doc(db, 'startups', startupId), startupData);
        Alert.alert('Success', 'Startup profile updated successfully!');
      } else {
        startupData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'startups'), startupData);
        Alert.alert('Success', 'Startup registered successfully!');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving startup:', error);
      Alert.alert('Error', 'Failed to save startup profile. Please try again.');
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
        colors={['#E91E63', '#9C27B0']}
        style={styles.header}
      >
        <Title style={styles.headerTitle}>
          {editMode ? 'Edit Startup Profile' : 'Register Your Startup'}
        </Title>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Basic Information */}
        <FormSection title="Basic Information" icon="information-circle-outline">
          <FormInput
            label="Startup Name"
            value={formData.name}
            onChangeText={(value) => updateFormData('name', value)}
            placeholder="Enter your startup name"
            required
            error={errors.name}
          />

          <FormInput
            label="Description"
            value={formData.description}
            onChangeText={(value) => updateFormData('description', value)}
            placeholder="Describe what your startup does"
            multiline
            numberOfLines={4}
            required
            error={errors.description}
          />

          <DropdownPicker
            label="Industry Sector"
            value={formData.sector}
            onValueChange={(value) => updateFormData('sector', value)}
            items={INDUSTRY_SECTORS}
            required
            error={errors.sector}
          />

          <DropdownPicker
            label="Current Stage"
            value={formData.stage}
            onValueChange={(value) => updateFormData('stage', value)}
            items={STARTUP_STAGES}
          />

          <DropdownPicker
            label="Funding Stage"
            value={formData.fundingStage}
            onValueChange={(value) => updateFormData('fundingStage', value)}
            items={FUNDING_STAGES}
          />

          <DropdownPicker
            label="Business Model"
            value={formData.businessModel}
            onValueChange={(value) => updateFormData('businessModel', value)}
            items={BUSINESS_MODELS}
          />

          <DatePicker
            label="Founding Date"
            value={formData.foundingDate}
            onDateChange={(date) => updateFormData('foundingDate', date)}
            required
          />

          <FormInput
            label="Location"
            value={formData.location}
            onChangeText={(value) => updateFormData('location', value)}
            placeholder="City, State"
            required
            error={errors.location}
          />

          <FormInput
            label="Website"
            value={formData.website}
            onChangeText={(value) => updateFormData('website', value)}
            placeholder="https://yourwebsite.com"
            keyboardType="url"
            error={errors.website}
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
            placeholder="What problem does your startup solve?"
            multiline
            numberOfLines={3}
            required
            error={errors.problemStatement}
          />

          <FormInput
            label="Solution"
            value={formData.solution}
            onChangeText={(value) => updateFormData('solution', value)}
            placeholder="How does your startup solve this problem?"
            multiline
            numberOfLines={3}
            required
            error={errors.solution}
          />

          <FormInput
            label="Target Market"
            value={formData.targetMarket}
            onChangeText={(value) => updateFormData('targetMarket', value)}
            placeholder="Who are your target customers?"
            multiline
            numberOfLines={2}
          />

          <FormInput
            label="Market Size"
            value={formData.marketSize}
            onChangeText={(value) => updateFormData('marketSize', value)}
            placeholder="Describe the market size and opportunity"
            multiline
            numberOfLines={2}
          />

          <FormInput
            label="Competitive Landscape"
            value={formData.competitors}
            onChangeText={(value) => updateFormData('competitors', value)}
            placeholder="Who are your main competitors?"
            multiline
            numberOfLines={2}
          />
        </FormSection>

        {/* Business Metrics */}
        <FormSection title="Business Metrics" icon="analytics-outline">
          <FormInput
            label="Revenue Model"
            value={formData.revenueModel}
            onChangeText={(value) => updateFormData('revenueModel', value)}
            placeholder="How do you generate revenue?"
            multiline
            numberOfLines={2}
          />

          <FormInput
            label="Current Monthly Revenue (₹)"
            value={formData.currentRevenue}
            onChangeText={(value) => updateFormData('currentRevenue', value)}
            placeholder="Enter amount in rupees"
            keyboardType="numeric"
            error={errors.currentRevenue}
          />

          <FormInput
            label="Projected Annual Revenue (₹)"
            value={formData.projectedRevenue}
            onChangeText={(value) => updateFormData('projectedRevenue', value)}
            placeholder="Enter projected amount"
            keyboardType="numeric"
            error={errors.projectedRevenue}
          />

          <FormInput
            label="Number of Employees"
            value={formData.employeeCount}
            onChangeText={(value) => updateFormData('employeeCount', value)}
            placeholder="Total team size"
            keyboardType="numeric"
            error={errors.employeeCount}
          />
        </FormSection>

        {/* Funding Information */}
        <FormSection title="Funding Information" icon="cash-outline">
          <FormInput
            label="Total Funding Raised (₹)"
            value={formData.totalFunding}
            onChangeText={(value) => updateFormData('totalFunding', value)}
            placeholder="Total amount raised to date"
            keyboardType="numeric"
            error={errors.totalFunding}
          />

          <FormInput
            label="Current Valuation (₹)"
            value={formData.valuation}
            onChangeText={(value) => updateFormData('valuation', value)}
            placeholder="Current company valuation"
            keyboardType="numeric"
            error={errors.valuation}
          />

          <View style={styles.switchContainer}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Currently Fundraising</Text>
              <Text style={styles.switchDescription}>
                Are you actively raising funds?
              </Text>
            </View>
            {/* Switch component would go here */}
          </View>

          {formData.currentFundraising && (
            <>
              <DropdownPicker
                label="Fundraising Round Type"
                value={formData.currentFundraisingType}
                onValueChange={(value) => updateFormData('currentFundraisingType', value)}
                items={FUNDING_STAGES}
              />

              <FormInput
                label="Target Amount (₹)"
                value={formData.targetAmount}
                onChangeText={(value) => updateFormData('targetAmount', value)}
                placeholder="How much are you raising?"
                keyboardType="numeric"
                error={errors.targetAmount}
              />

              <FormInput
                label="Fundraising Description"
                value={formData.fundraisingDescription}
                onChangeText={(value) => updateFormData('fundraisingDescription', value)}
                placeholder="What will you use the funds for?"
                multiline
                numberOfLines={3}
              />
            </>
          )}
        </FormSection>

        {/* Founder Information */}
        <FormSection title="Founder Information" icon="person-outline">
          <FormInput
            label="Primary Contact Name"
            value={formData.founderName}
            onChangeText={(value) => updateFormData('founderName', value)}
            placeholder="Main founder/contact person"
            required
            error={errors.founderName}
          />

          <FormInput
            label="Contact Email"
            value={formData.contactEmail}
            onChangeText={(value) => updateFormData('contactEmail', value)}
            placeholder="Email for business correspondence"
            keyboardType="email-address"
            required
            error={errors.contactEmail}
          />

          <FormInput
            label="Contact Phone"
            value={formData.contactPhone}
            onChangeText={(value) => updateFormData('contactPhone', value)}
            placeholder="Phone number"
            keyboardType="phone-pad"
          />

          <FormInput
            label="LinkedIn Profile"
            value={formData.linkedinProfile}
            onChangeText={(value) => updateFormData('linkedinProfile', value)}
            placeholder="LinkedIn URL"
            keyboardType="url"
          />

          <FormInput
            label="Twitter Handle"
            value={formData.twitterHandle}
            onChangeText={(value) => updateFormData('twitterHandle', value)}
            placeholder="@username"
          />
        </FormSection>

        {/* Co-Founders */}
        <FormSection title="Co-Founders & Team" icon="people-outline">
          {errors.founders && <Text style={styles.errorText}>{errors.founders}</Text>}
          {founders.map((founder, index) => (
            <View key={index} style={styles.founderContainer}>
              <View style={styles.founderHeader}>
                <Text style={styles.founderTitle}>
                  {index === 0 ? 'Primary Founder' : `Co-Founder ${index}`}
                </Text>
                {founders.length > 1 && index > 0 && (
                  <Button
                    mode="text"
                    onPress={() => removeFounder(index)}
                    textColor="#f44336"
                    compact
                  >
                    Remove
                  </Button>
                )}
              </View>

              <FormInput
                label="Name"
                value={founder.name}
                onChangeText={(value) => updateFounder(index, 'name', value)}
                placeholder="Founder name"
              />

              <FormInput
                label="Email"
                value={founder.email}
                onChangeText={(value) => updateFounder(index, 'email', value)}
                placeholder="Email address"
                keyboardType="email-address"
              />

              <FormInput
                label="Role/Title"
                value={founder.role}
                onChangeText={(value) => updateFounder(index, 'role', value)}
                placeholder="CEO, CTO, etc."
              />

              <FormInput
                label="Equity Percentage"
                value={founder.equity}
                onChangeText={(value) => updateFounder(index, 'equity', value)}
                placeholder="Ownership percentage"
                keyboardType="numeric"
              />

              <FormInput
                label="Bio"
                value={founder.bio}
                onChangeText={(value) => updateFounder(index, 'bio', value)}
                placeholder="Background and experience"
                multiline
                numberOfLines={2}
              />
            </View>
          ))}

          <Button
            mode="outlined"
            onPress={addFounder}
            style={styles.addButton}
            icon="plus"
          >
            Add Co-Founder
          </Button>
        </FormSection>

        {/* Links */}
        <FormSection title="Additional Links (Optional)" icon="link-outline">
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
                placeholder="e.g., Demo Video, Product Page"
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
            Upload pitch deck, business plan, financial projections, or other relevant documents
          </Text>
        </FormSection>

        {/* Privacy Settings */}
        <FormSection title="Privacy Settings" icon="shield-outline">
          <View style={styles.switchContainer}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Make Profile Public</Text>
              <Text style={styles.switchDescription}>
                Allow others to discover and connect with your startup
              </Text>
            </View>
            {/* Switch component would go here */}
          </View>
        </FormSection>

        {/* Action Buttons */}
        <FormActions
          onSave={handleSave}
          onCancel={handleCancel}
          saveText={editMode ? 'Update Profile' : 'Register Startup'}
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
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginBottom: 8,
  },
  founderContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  founderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  founderTitle: {
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
    borderColor: '#E91E63',
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