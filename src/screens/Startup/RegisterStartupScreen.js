import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Button, Title, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, addDoc, updateDoc, getDoc, collection } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

import {
  FormSection,
  FormInput,
  DatePicker,
  DropdownPicker,
  TagInput,
  FileUpload,
  FormActions,
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

export default function RegisterStartupScreen({ route, navigation }) {
  const { startupId, editMode } = route.params || {};
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sector: '',
    stage: 'ideation',
    foundingDate: new Date(),
    location: '',
    problemStatement: '',
    solution: '',
    targetMarket: '',
    currentRevenue: '',
    employeeCount: '',
    tags: [],
    documents: [],
    status: 'pending',
    isVerified: false,
  });

  useEffect(() => {
    if (editMode && startupId) loadStartupData();
  }, [editMode, startupId]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const loadStartupData = async () => {
    try {
      setLoading(true);
      const snapshot = await getDoc(doc(db, 'startups', startupId));
      if (snapshot.exists()) {
        const data = snapshot.data();
        setFormData({
          ...data,
          foundingDate: data.foundingDate ? new Date(data.foundingDate) : new Date(),
          tags: data.tags || [],
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load startup.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Startup name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.sector) newErrors.sector = 'Sector is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return Alert.alert('Error', 'Please fill all required fields.');

    setLoading(true);
    try {
      const data = {
        ...formData,
        userId: userProfile.uid,
        updatedAt: new Date().toISOString(),
      };

      if (editMode)
        await updateDoc(doc(db, 'startups', startupId), data);
      else
        await addDoc(collection(db, 'startups'), {
          ...data,
          createdAt: new Date().toISOString(),
        });

      Alert.alert('Success', editMode ? 'Startup updated!' : 'Startup registered!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Unable to save.');
    } finally {
      setLoading(false);
    }
  };

  const StepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[0, 1, 2].map((step) => (
        <View key={step} style={styles.stepWrapper}>
          <View style={[styles.stepDot, activeStep >= step && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, activeStep >= step && styles.stepDotTextActive]}>{step + 1}</Text>
          </View>
          {step < 2 && <View style={[styles.stepLine, activeStep > step && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a3e', '#12122b']} style={StyleSheet.absoluteFill} />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{editMode ? 'Edit Profile' : 'Register Startup'}</Text>
            <Text style={styles.headerSubtitle}>Complete the steps to showcase your innovation</Text>
          </View>
        </View>

        <StepIndicator />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeStep === 0 && (
            <Surface style={styles.formCard} elevation={2}>
              <FormSection title="Identity & Vision" icon="business-outline" dark>
                <FormInput
                  label="Startup Name"
                  value={formData.name}
                  onChangeText={(v) => updateFormData('name', v)}
                  required
                  error={errors.name}
                />
                <FormInput
                  label="Mission Description"
                  value={formData.description}
                  onChangeText={(v) => updateFormData('description', v)}
                  multiline
                  numberOfLines={4}
                  required
                  error={errors.description}
                />
                <DropdownPicker
                  label="Industry Sector"
                  items={INDUSTRY_SECTORS}
                  value={formData.sector}
                  onValueChange={(v) => updateFormData('sector', v)}
                  required
                  error={errors.sector}
                />
                <DropdownPicker
                  label="Current Growth Stage"
                  items={STARTUP_STAGES}
                  value={formData.stage}
                  onValueChange={(v) => updateFormData('stage', v)}
                />
              </FormSection>
              <Button mode="contained" onPress={() => setActiveStep(1)} style={styles.nextButton}>
                Continue to Problems
              </Button>
            </Surface>
          )}

          {activeStep === 1 && (
            <Surface style={styles.formCard} elevation={2}>
              <FormSection title="Product & Market" icon="bulb-outline" dark>
                <FormInput
                  label="Problem Statement"
                  value={formData.problemStatement}
                  onChangeText={(v) => updateFormData('problemStatement', v)}
                  multiline
                  placeholder="What gap are you filling?"
                />
                <FormInput
                  label="Your Solution"
                  value={formData.solution}
                  onChangeText={(v) => updateFormData('solution', v)}
                  multiline
                  placeholder="How does your tech solve it?"
                />
                <FormInput
                  label="Location (HQ)"
                  value={formData.location}
                  onChangeText={(v) => updateFormData('location', v)}
                  required
                  error={errors.location}
                />
                <TagInput
                  label="Expertise Tags"
                  tags={formData.tags}
                  onTagsChange={(t) => updateFormData('tags', t)}
                />
              </FormSection>
              <View style={styles.rowActions}>
                <Button mode="outlined" onPress={() => setActiveStep(0)} style={styles.flexButton}>
                  Back
                </Button>
                <Button mode="contained" onPress={() => setActiveStep(2)} style={[styles.nextButton, styles.flexButton]}>
                  Next
                </Button>
              </View>
            </Surface>
          )}

          {activeStep === 2 && (
            <Surface style={styles.formCard} elevation={2}>
              <FormSection title="Final Details" icon="analytics-outline" dark>
                <FormInput
                  label="Current Revenue (₹)"
                  value={formData.currentRevenue}
                  onChangeText={(v) => updateFormData('currentRevenue', v)}
                  keyboardType="numeric"
                />
                <FormInput
                  label="Team Size"
                  value={formData.employeeCount}
                  onChangeText={(v) => updateFormData('employeeCount', v)}
                  keyboardType="numeric"
                />
                <DatePicker
                  label="Founding Date"
                  value={formData.foundingDate}
                  onDateChange={(d) => updateFormData('foundingDate', d)}
                />
                <FileUpload
                  label="Pitch Deck / Docs"
                  files={formData.documents}
                  onFileSelect={(files) => updateFormData('documents', files)}
                />
              </FormSection>
              <View style={styles.rowActions}>
                <Button mode="outlined" onPress={() => setActiveStep(1)} style={styles.flexButton}>
                  Back
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleSave} 
                  loading={loading} 
                  style={[styles.saveButton, styles.flexButton]}
                  buttonColor="#4CAF50"
                >
                  Finish & Save
                </Button>
              </View>
            </Surface>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 40,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  stepDotActive: {
    backgroundColor: '#b366ff',
    borderColor: '#b366ff',
  },
  stepDotText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepDotTextActive: {
    color: '#fff',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 5,
  },
  stepLineActive: {
    backgroundColor: '#b366ff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  nextButton: {
    marginTop: 20,
    backgroundColor: '#b366ff',
    paddingVertical: 6,
    borderRadius: 12,
  },
  saveButton: {
    marginTop: 20,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  flexButton: {
    flex: 1,
  }
});
