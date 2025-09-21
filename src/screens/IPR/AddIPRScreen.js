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

const IPR_TYPES = [
  { label: 'Patent', value: 'Patent' },
  { label: 'Trademark', value: 'Trademark' },
  { label: 'Copyright', value: 'Copyright' },
  { label: 'Industrial Design', value: 'Design' },
  { label: 'Geographical Indication', value: 'Geographical Indication' },
  { label: 'Trade Secret', value: 'Trade Secret' }
];

const IPR_CATEGORIES = [
  { label: 'Technology', value: 'Technology' },
  { label: 'Pharmaceuticals', value: 'Pharmaceuticals' },
  { label: 'Engineering', value: 'Engineering' },
  { label: 'Software', value: 'Software' },
  { label: 'Biotechnology', value: 'Biotechnology' },
  { label: 'Agriculture', value: 'Agriculture' },
  { label: 'Textiles', value: 'Textiles' },
  { label: 'Manufacturing', value: 'Manufacturing' },
  { label: 'Energy', value: 'Energy' },
  { label: 'Chemical', value: 'Chemical' }
];

const APPLICATION_ROUTES = [
  { label: 'National (India)', value: 'national' },
  { label: 'PCT (International)', value: 'pct' },
  { label: 'Direct Filing (Foreign)', value: 'foreign' },
  { label: 'Paris Convention', value: 'paris' }
];

export default function AddIPRScreen({ route, navigation }) {
  const { iprId, editMode } = route.params || {};
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [inventors, setInventors] = useState([
    { name: '', designation: '', organization: '', address: '' }
  ]);
  const [claims, setClaims] = useState(['']);
  
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    category: '',
    technicalField: '',
    backgroundArt: '',
    invention: '',
    applicantName: userProfile?.name || '',
    organization: userProfile?.organization || '',
    applicationRoute: 'national',
    priorityDate: new Date(),
    filingDate: new Date(),
    applicationNumber: '',
    publicationNumber: '',
    grantNumber: '',
    grantDate: null,
    status: 'draft',
    contactEmail: userProfile?.email || '',
    contactPhone: '',
    attorney: '',
    attorneyReference: '',
    tags: [],
    isPublic: false,
    documents: []
  });

  useEffect(() => {
    if (editMode && iprId) {
      loadIPRData();
    }
  }, [editMode, iprId]);

  const loadIPRData = async () => {
    try {
      setLoading(true);
      const iprDoc = await getDoc(doc(db, 'ipr', iprId));
      if (iprDoc.exists()) {
        const data = iprDoc.data();
        setFormData({
          ...data,
          priorityDate: data.priorityDate ? new Date(data.priorityDate) : new Date(),
          filingDate: data.filingDate ? new Date(data.filingDate) : new Date(),
          grantDate: data.grantDate ? new Date(data.grantDate) : null,
          tags: data.tags || [],
          documents: data.documents || []
        });
        setInventors(data.inventors || [{ name: '', designation: '', organization: '', address: '' }]);
        setClaims(data.claims || ['']);
      }
    } catch (error) {
      console.error('Error loading IPR data:', error);
      Alert.alert('Error', 'Failed to load IPR data');
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

  const addInventor = () => {
    setInventors([...inventors, { name: '', designation: '', organization: '', address: '' }]);
  };

  const updateInventor = (index, field, value) => {
    const updatedInventors = [...inventors];
    updatedInventors[index][field] = value;
    setInventors(updatedInventors);
  };

  const removeInventor = (index) => {
    if (inventors.length > 1) {
      setInventors(inventors.filter((_, i) => i !== index));
    }
  };

  const addClaim = () => {
    setClaims([...claims, '']);
  };

  const updateClaim = (index, value) => {
    const updatedClaims = [...claims];
    updatedClaims[index] = value;
    setClaims(updatedClaims);
  };

  const removeClaim = (index) => {
    if (claims.length > 1) {
      setClaims(claims.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = 'IPR type is required';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.applicantName.trim()) {
      newErrors.applicantName = 'Applicant name is required';
    }

    if (!formData.organization.trim()) {
      newErrors.organization = 'Organization is required';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    // Validate inventors
    const validInventors = inventors.filter(inv => inv.name.trim());
    if (validInventors.length === 0) {
      newErrors.inventors = 'At least one inventor is required';
    }

    // Validate claims for patents
    if (formData.type === 'Patent') {
      const validClaims = claims.filter(claim => claim.trim());
      if (validClaims.length === 0) {
        newErrors.claims = 'At least one claim is required for patents';
      }

      if (!formData.technicalField.trim()) {
        newErrors.technicalField = 'Technical field is required for patents';
      }

      if (!formData.invention.trim()) {
        newErrors.invention = 'Summary of invention is required for patents';
      }
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
      const iprData = {
        ...formData,
        userId: userProfile.uid,
        inventors: inventors.filter(inv => inv.name.trim()),
        claims: formData.type === 'Patent' ? claims.filter(claim => claim.trim()) : [],
        priorityDate: formData.priorityDate.toISOString(),
        filingDate: formData.filingDate.toISOString(),
        grantDate: formData.grantDate ? formData.grantDate.toISOString() : null,
        updatedAt: new Date().toISOString()
      };

      if (editMode && iprId) {
        await updateDoc(doc(db, 'ipr', iprId), iprData);
        Alert.alert('Success', 'IPR application updated successfully!');
      } else {
        iprData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'ipr'), iprData);
        Alert.alert('Success', 'IPR application submitted successfully!');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving IPR:', error);
      Alert.alert('Error', 'Failed to save IPR application. Please try again.');
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

  const isPatent = formData.type === 'Patent';

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient
        colors={['#FF9800', '#F57C00']}
        style={styles.header}
      >
        <Title style={styles.headerTitle}>
          {editMode ? 'Edit IPR Application' : 'Submit IPR Application'}
        </Title>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Basic Information */}
        <FormSection title="Basic Information" icon="information-circle-outline">
          <DropdownPicker
            label="IPR Type"
            value={formData.type}
            onValueChange={(value) => updateFormData('type', value)}
            items={IPR_TYPES}
            required
            error={errors.type}
          />

          <FormInput
            label="Title"
            value={formData.title}
            onChangeText={(value) => updateFormData('title', value)}
            placeholder="Enter the title of your intellectual property"
            required
            error={errors.title}
          />

          <FormInput
            label="Description"
            value={formData.description}
            onChangeText={(value) => updateFormData('description', value)}
            placeholder="Provide a detailed description"
            multiline
            numberOfLines={4}
            required
            error={errors.description}
          />

          <DropdownPicker
            label="Category"
            value={formData.category}
            onValueChange={(value) => updateFormData('category', value)}
            items={IPR_CATEGORIES}
            required
            error={errors.category}
          />

          <TagInput
            label="Tags"
            tags={formData.tags}
            onTagsChange={(tags) => updateFormData('tags', tags)}
            placeholder="Add relevant tags"
          />
        </FormSection>

        {/* Technical Details (for Patents) */}
        {isPatent && (
          <FormSection title="Technical Details" icon="settings-outline">
            <FormInput
              label="Technical Field"
              value={formData.technicalField}
              onChangeText={(value) => updateFormData('technicalField', value)}
              placeholder="Describe the technical field of the invention"
              multiline
              numberOfLines={2}
              required
              error={errors.technicalField}
            />

            <FormInput
              label="Background Art"
              value={formData.backgroundArt}
              onChangeText={(value) => updateFormData('backgroundArt', value)}
              placeholder="Describe the prior art and background"
              multiline
              numberOfLines={3}
            />

            <FormInput
              label="Summary of Invention"
              value={formData.invention}
              onChangeText={(value) => updateFormData('invention', value)}
              placeholder="Provide a summary of your invention"
              multiline
              numberOfLines={3}
              required
              error={errors.invention}
            />
          </FormSection>
        )}

        {/* Applicant Information */}
        <FormSection title="Applicant Information" icon="person-outline">
          <FormInput
            label="Applicant Name"
            value={formData.applicantName}
            onChangeText={(value) => updateFormData('applicantName', value)}
            placeholder="Name of the applicant"
            required
            error={errors.applicantName}
          />

          <FormInput
            label="Organization"
            value={formData.organization}
            onChangeText={(value) => updateFormData('organization', value)}
            placeholder="Organization or company name"
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

        {/* Inventors */}
        <FormSection title="Inventors" icon="people-outline">
          {errors.inventors && <Text style={styles.errorText}>{errors.inventors}</Text>}
          {inventors.map((inventor, index) => (
            <View key={index} style={styles.inventorContainer}>
              <View style={styles.inventorHeader}>
                <Text style={styles.inventorTitle}>Inventor {index + 1}</Text>
                {inventors.length > 1 && (
                  <Button
                    mode="text"
                    onPress={() => removeInventor(index)}
                    textColor="#f44336"
                    compact
                  >
                    Remove
                  </Button>
                )}
              </View>

              <FormInput
                label="Name"
                value={inventor.name}
                onChangeText={(value) => updateInventor(index, 'name', value)}
                placeholder="Inventor name"
              />

              <FormInput
                label="Designation"
                value={inventor.designation}
                onChangeText={(value) => updateInventor(index, 'designation', value)}
                placeholder="Designation or title"
              />

              <FormInput
                label="Organization"
                value={inventor.organization}
                onChangeText={(value) => updateInventor(index, 'organization', value)}
                placeholder="Organization or affiliation"
              />

              <FormInput
                label="Address"
                value={inventor.address}
                onChangeText={(value) => updateInventor(index, 'address', value)}
                placeholder="Full address"
                multiline
                numberOfLines={2}
              />
            </View>
          ))}

          <Button
            mode="outlined"
            onPress={addInventor}
            style={styles.addButton}
            icon="plus"
          >
            Add Inventor
          </Button>
        </FormSection>

        {/* Claims (for Patents) */}
        {isPatent && (
          <FormSection title="Claims" icon="list-outline">
            {errors.claims && <Text style={styles.errorText}>{errors.claims}</Text>}
            {claims.map((claim, index) => (
              <View key={index} style={styles.claimContainer}>
                <View style={styles.claimHeader}>
                  <Text style={styles.claimTitle}>Claim {index + 1}</Text>
                  {claims.length > 1 && (
                    <Button
                      mode="text"
                      onPress={() => removeClaim(index)}
                      textColor="#f44336"
                      compact
                    >
                      Remove
                    </Button>
                  )}
                </View>

                <FormInput
                  label=""
                  value={claim}
                  onChangeText={(value) => updateClaim(index, value)}
                  placeholder="Enter the claim statement"
                  multiline
                  numberOfLines={3}
                />
              </View>
            ))}

            <Button
              mode="outlined"
              onPress={addClaim}
              style={styles.addButton}
              icon="plus"
            >
              Add Claim
            </Button>
          </FormSection>
        )}

        {/* Application Details */}
        <FormSection title="Application Details" icon="document-text-outline">
          <DropdownPicker
            label="Application Route"
            value={formData.applicationRoute}
            onValueChange={(value) => updateFormData('applicationRoute', value)}
            items={APPLICATION_ROUTES}
          />

          <DatePicker
            label="Priority Date"
            value={formData.priorityDate}
            onDateChange={(date) => updateFormData('priorityDate', date)}
            required
          />

          <DatePicker
            label="Filing Date"
            value={formData.filingDate}
            onDateChange={(date) => updateFormData('filingDate', date)}
            required
          />

          <FormInput
            label="Application Number"
            value={formData.applicationNumber}
            onChangeText={(value) => updateFormData('applicationNumber', value)}
            placeholder="Enter if available"
          />

          <FormInput
            label="Publication Number"
            value={formData.publicationNumber}
            onChangeText={(value) => updateFormData('publicationNumber', value)}
            placeholder="Enter if available"
          />

          {formData.grantNumber && (
            <>
              <FormInput
                label="Grant Number"
                value={formData.grantNumber}
                onChangeText={(value) => updateFormData('grantNumber', value)}
                placeholder="Enter if granted"
              />

              <DatePicker
                label="Grant Date"
                value={formData.grantDate}
                onDateChange={(date) => updateFormData('grantDate', date)}
              />
            </>
          )}
        </FormSection>

        {/* Attorney Information */}
        <FormSection title="Attorney Information (Optional)" icon="briefcase-outline">
          <FormInput
            label="Attorney Name"
            value={formData.attorney}
            onChangeText={(value) => updateFormData('attorney', value)}
            placeholder="Patent attorney or agent name"
          />

          <FormInput
            label="Attorney Reference"
            value={formData.attorneyReference}
            onChangeText={(value) => updateFormData('attorneyReference', value)}
            placeholder="Attorney reference number"
          />
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
            Upload patent specifications, drawings, forms, or other relevant documents
          </Text>
        </FormSection>

        {/* Privacy Settings */}
        <FormSection title="Privacy Settings" icon="shield-outline">
          <View style={styles.switchContainer}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Make Application Public</Text>
              <Text style={styles.switchDescription}>
                Allow public access to basic information about this application
              </Text>
            </View>
            {/* Switch component would go here */}
          </View>
        </FormSection>

        {/* Action Buttons */}
        <FormActions
          onSave={handleSave}
          onCancel={handleCancel}
          saveText={editMode ? 'Update Application' : 'Submit Application'}
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
  inventorContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  inventorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inventorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  claimContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  claimTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    marginTop: 8,
    borderColor: '#667eea',
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