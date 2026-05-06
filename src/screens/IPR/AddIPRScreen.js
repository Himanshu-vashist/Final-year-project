import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import { Title, Button, Chip, Switch } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { doc, addDoc, updateDoc, getDoc, collection } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  FormSection, 
  FormInput, 
  DatePicker, 
  DropdownPicker, 
  TagInput, 
  FileUpload, 
  FormActions 
} from '../../components/FormComponents';

const { width } = Dimensions.get('window');

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
  const { theme } = useTheme();
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
    status: 'filed',
    isVerified: false,
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
    if (!formData.type) newErrors.type = 'IPR type is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.applicantName.trim()) newErrors.applicantName = 'Applicant name is required';
    if (!formData.organization.trim()) newErrors.organization = 'Organization is required';
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    const validInventors = inventors.filter(inv => inv.name.trim());
    if (validInventors.length === 0) newErrors.inventors = 'At least one inventor is required';

    if (formData.type === 'Patent') {
      const validClaims = claims.filter(claim => claim.trim());
      if (validClaims.length === 0) newErrors.claims = 'At least one claim is required for patents';
      if (!formData.technicalField.trim()) newErrors.technicalField = 'Technical field is required for patents';
      if (!formData.invention.trim()) newErrors.invention = 'Summary of invention is required for patents';
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={theme.gradients.dark} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Premium Header */}
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Title style={styles.headerTitle}>
                {editMode ? 'Edit IPR Application' : 'New IPR Filing'}
              </Title>
              <Text style={styles.headerSubtitle}>
                {editMode ? 'Update your intellectual property details' : 'Secure your innovation with official filing'}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.content}>
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
                placeholder="Title of your IPR"
                required
                error={errors.title}
              />
              <FormInput
                label="Description"
                value={formData.description}
                onChangeText={(value) => updateFormData('description', value)}
                placeholder="Brief description"
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
                label="Tags / Keywords"
                tags={formData.tags}
                onTagsChange={(tags) => updateFormData('tags', tags)}
                placeholder="Add keywords..."
              />
            </FormSection>

            {isPatent && (
              <FormSection title="Technical Details" icon="flask-outline">
                <FormInput
                  label="Technical Field"
                  value={formData.technicalField}
                  onChangeText={(value) => updateFormData('technicalField', value)}
                  placeholder="Describe the technical field"
                  multiline
                  numberOfLines={2}
                  required
                  error={errors.technicalField}
                />
                <FormInput
                  label="Background Art"
                  value={formData.backgroundArt}
                  onChangeText={(value) => updateFormData('backgroundArt', value)}
                  placeholder="Prior art and background"
                  multiline
                  numberOfLines={3}
                />
                <FormInput
                  label="Summary of Invention"
                  value={formData.invention}
                  onChangeText={(value) => updateFormData('invention', value)}
                  placeholder="Summary of invention"
                  multiline
                  numberOfLines={3}
                  required
                  error={errors.invention}
                />
              </FormSection>
            )}

            <FormSection title="Applicant Information" icon="person-outline">
              <FormInput
                label="Applicant Name"
                value={formData.applicantName}
                onChangeText={(value) => updateFormData('applicantName', value)}
                required
                error={errors.applicantName}
              />
              <FormInput
                label="Organization"
                value={formData.organization}
                onChangeText={(value) => updateFormData('organization', value)}
                required
                error={errors.organization}
              />
              <FormInput
                label="Contact Email"
                value={formData.contactEmail}
                onChangeText={(value) => updateFormData('contactEmail', value)}
                keyboardType="email-address"
                required
                error={errors.contactEmail}
              />
            </FormSection>

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
                        textColor={theme.colors.error}
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
                  />
                  <FormInput
                    label="Designation"
                    value={inventor.designation}
                    onChangeText={(value) => updateInventor(index, 'designation', value)}
                  />
                </View>
              ))}
              <Button
                mode="outlined"
                onPress={addInventor}
                style={styles.addButton}
                icon="plus"
                textColor={theme.colors.primary}
              >
                Add Inventor
              </Button>
            </FormSection>

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
                          textColor={theme.colors.error}
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
                      placeholder="Enter claim statement"
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
                  textColor={theme.colors.primary}
                >
                  Add Claim
                </Button>
              </FormSection>
            )}

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
              />
            </FormSection>

            <FormSection title="Privacy Settings" icon="shield-outline">
              <View style={styles.switchContainer}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Make Application Public</Text>
                  <Text style={styles.switchDescription}>
                    Allow public access to basic information
                  </Text>
                </View>
                <Switch
                  value={formData.isPublic}
                  onValueChange={(value) => updateFormData('isPublic', value)}
                  color={theme.colors.primary}
                />
              </View>
            </FormSection>

            <FormActions
              onSave={handleSave}
              onCancel={handleCancel}
              saveText={editMode ? 'Update Application' : 'Submit Application'}
              loading={loading}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    paddingTop: 48,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  content: {
    padding: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginBottom: 8,
  },
  inventorContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inventorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inventorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  claimContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  claimTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    marginTop: 12,
    borderRadius: 12,
  },
  helpText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
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
    color: '#fff',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
});