import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import {
  TextInput,
  Button,
  Surface,
  Switch,
  HelperText,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useEvents, EVENT_CATEGORIES } from '../../context/EventContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CreateEventScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { userProfile, currentUser } = useAuth();
  const { createEvent, updateEvent, categories } = useEvents();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('workshop');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000));
  const [isOnline, setIsOnline] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  // UI State
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const styles = getStyles(theme, isDarkMode);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleStartDateConfirm = (date) => {
    setShowStartDatePicker(false);
    const newDate = new Date(startDate);
    newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    setStartDate(newDate);

    // Adjust end date if needed
    if (newDate > endDate) {
      setEndDate(new Date(newDate.getTime() + 2 * 60 * 60 * 1000));
    }
  };

  const handleStartTimeConfirm = (date) => {
    setShowStartTimePicker(false);
    const newDate = new Date(startDate);
    newDate.setHours(date.getHours(), date.getMinutes());
    setStartDate(newDate);

    // Adjust end time if needed
    if (newDate >= endDate) {
      setEndDate(new Date(newDate.getTime() + 2 * 60 * 60 * 1000));
    }
  };

  const handleEndDateConfirm = (date) => {
    setShowEndDatePicker(false);
    const newDate = new Date(endDate);
    newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (newDate < startDate) {
      Alert.alert('Invalid Date', 'End date cannot be before start date');
      return;
    }
    setEndDate(newDate);
  };

  const handleEndTimeConfirm = (date) => {
    setShowEndTimePicker(false);
    const newDate = new Date(endDate);
    newDate.setHours(date.getHours(), date.getMinutes());
    
    if (newDate <= startDate) {
      Alert.alert('Invalid Time', 'End time must be after start time');
      return;
    }
    setEndDate(newDate);
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Event title is required';
    } else if (title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    if (!isOnline && !location.trim()) {
      newErrors.location = 'Location is required for in-person events';
    }

    if (isOnline && !meetingLink.trim()) {
      newErrors.meetingLink = 'Meeting link is required for online events';
    }

    if (endDate <= startDate) {
      newErrors.endDate = 'End time must be after start time';
    }

    if (maxCapacity && (isNaN(maxCapacity) || parseInt(maxCapacity) < 1)) {
      newErrors.maxCapacity = 'Capacity must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    setSubmitting(true);

    const eventData = {
      title: title.trim(),
      description: description.trim(),
      category,
      location: isOnline ? 'Online' : location.trim(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isOnline,
      meetingLink: isOnline ? meetingLink.trim() : null,
      maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
      tags,
      bannerUrl: bannerUrl.trim() || null,
      organizer: {
        id: currentUser?.uid,
        name: userProfile?.name || 'Unknown',
        email: currentUser?.email,
      },
      status: 'active',
      registrationCount: 0,
      registrations: [],
      waitlist: [],
    };

    const result = await createEvent(eventData, currentUser?.uid);

    setSubmitting(false);

    if (result.success) {
      Alert.alert('Success', 'Event created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to create event');
    }
  };

  const selectedCategory = categories.find((c) => c.key === category) || categories[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <LinearGradient
          colors={[selectedCategory.color, selectedCategory.color + '80']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryItem,
                    category === cat.key && {
                      backgroundColor: cat.color + '20',
                      borderColor: cat.color,
                    },
                  ]}
                  onPress={() => setCategory(cat.key)}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: cat.color },
                    ]}
                  >
                    <Ionicons name={cat.icon} size={20} color="#fff" />
                  </View>
                  <Text
                    style={[
                      styles.categoryLabel,
                      category === cat.key && { color: cat.color },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <TextInput
              mode="outlined"
              label="Event Title *"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              error={!!errors.title}
              placeholder="Enter event title"
            />
            {errors.title && <HelperText type="error">{errors.title}</HelperText>}

            <TextInput
              mode="outlined"
              label="Description *"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              multiline
              numberOfLines={4}
              error={!!errors.description}
              placeholder="Describe your event"
            />
            {errors.description && (
              <HelperText type="error">{errors.description}</HelperText>
            )}

            <TextInput
              mode="outlined"
              label="Banner Image URL (optional)"
              value={bannerUrl}
              onChangeText={setBannerUrl}
              style={styles.input}
              placeholder="https://example.com/image.jpg"
            />
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date & Time</Text>

            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeItem}>
                <Text style={styles.dateTimeLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateTimePicker}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={selectedCategory.color}
                  />
                  <Text style={styles.dateTimeValue}>{formatDate(startDate)}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateTimeItem}>
                <Text style={styles.dateTimeLabel}>Start Time</Text>
                <TouchableOpacity
                  style={styles.dateTimePicker}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={selectedCategory.color}
                  />
                  <Text style={styles.dateTimeValue}>{formatTime(startDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeItem}>
                <Text style={styles.dateTimeLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.dateTimePicker}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={selectedCategory.color}
                  />
                  <Text style={styles.dateTimeValue}>{formatDate(endDate)}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateTimeItem}>
                <Text style={styles.dateTimeLabel}>End Time</Text>
                <TouchableOpacity
                  style={styles.dateTimePicker}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={selectedCategory.color}
                  />
                  <Text style={styles.dateTimeValue}>{formatTime(endDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {errors.endDate && <HelperText type="error">{errors.endDate}</HelperText>}
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Online Event</Text>
              <Switch
                value={isOnline}
                onValueChange={setIsOnline}
                color={selectedCategory.color}
              />
            </View>

            {isOnline ? (
              <>
                <TextInput
                  mode="outlined"
                  label="Meeting Link *"
                  value={meetingLink}
                  onChangeText={setMeetingLink}
                  style={styles.input}
                  error={!!errors.meetingLink}
                  placeholder="https://meet.google.com/..."
                  keyboardType="url"
                />
                {errors.meetingLink && (
                  <HelperText type="error">{errors.meetingLink}</HelperText>
                )}
              </>
            ) : (
              <>
                <TextInput
                  mode="outlined"
                  label="Venue Address *"
                  value={location}
                  onChangeText={setLocation}
                  style={styles.input}
                  error={!!errors.location}
                  placeholder="Enter venue address"
                />
                {errors.location && (
                  <HelperText type="error">{errors.location}</HelperText>
                )}
              </>
            )}
          </View>

          {/* Capacity & Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Registration Settings</Text>

            <TextInput
              mode="outlined"
              label="Max Capacity (optional)"
              value={maxCapacity}
              onChangeText={setMaxCapacity}
              style={styles.input}
              keyboardType="numeric"
              error={!!errors.maxCapacity}
              placeholder="Leave empty for unlimited"
            />
            {errors.maxCapacity && (
              <HelperText type="error">{errors.maxCapacity}</HelperText>
            )}
            <HelperText type="info">
              When capacity is reached, new registrations will be added to a waitlist.
            </HelperText>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags (up to 5)</Text>

            <View style={styles.tagInputRow}>
              <TextInput
                mode="outlined"
                value={tagInput}
                onChangeText={setTagInput}
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Add tag"
                onSubmitEditing={addTag}
              />
              <TouchableOpacity
                style={[styles.addTagButton, { backgroundColor: selectedCategory.color }]}
                onPress={addTag}
                disabled={tags.length >= 5}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <Chip
                    key={index}
                    onClose={() => removeTag(tag)}
                    style={styles.tag}
                    textStyle={styles.tagText}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            style={[styles.submitButton, { backgroundColor: selectedCategory.color }]}
            labelStyle={styles.submitButtonLabel}
          >
            Create Event
          </Button>
        </ScrollView>

        {/* Date Time Pickers */}
        <DateTimePickerModal
          isVisible={showStartDatePicker}
          mode="date"
          onConfirm={handleStartDateConfirm}
          onCancel={() => setShowStartDatePicker(false)}
          date={startDate}
          minimumDate={new Date()}
        />

        <DateTimePickerModal
          isVisible={showStartTimePicker}
          mode="time"
          onConfirm={handleStartTimeConfirm}
          onCancel={() => setShowStartTimePicker(false)}
          date={startDate}
        />

        <DateTimePickerModal
          isVisible={showEndDatePicker}
          mode="date"
          onConfirm={handleEndDateConfirm}
          onCancel={() => setShowEndDatePicker(false)}
          date={endDate}
          minimumDate={startDate}
        />

        <DateTimePickerModal
          isVisible={showEndTimePicker}
          mode="time"
          onConfirm={handleEndTimeConfirm}
          onCancel={() => setShowEndTimePicker(false)}
          date={endDate}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDarkMode) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme?.colors?.background || '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingTop: Platform.OS === 'android' ? 40 : 16,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#fff',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme?.colors?.text || '#333',
      marginBottom: 16,
    },
    categoryScroll: {
      paddingRight: 20,
    },
    categoryItem: {
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'transparent',
      marginRight: 12,
      minWidth: 80,
      backgroundColor: theme?.colors?.surface || '#fff',
    },
    categoryIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    categoryLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: theme?.colors?.textSecondary || '#666',
      textAlign: 'center',
    },
    input: {
      marginBottom: 12,
      backgroundColor: theme?.colors?.surface || '#fff',
    },
    dateTimeRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    dateTimeItem: {
      flex: 1,
    },
    dateTimeLabel: {
      fontSize: 12,
      color: theme?.colors?.textSecondary || '#666',
      marginBottom: 8,
    },
    dateTimePicker: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme?.colors?.border || '#e0e0e0',
      backgroundColor: theme?.colors?.surface || '#fff',
    },
    dateTimeValue: {
      marginLeft: 8,
      fontSize: 14,
      color: theme?.colors?.text || '#333',
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme?.colors?.surface || '#fff',
    },
    switchLabel: {
      fontSize: 14,
      color: theme?.colors?.text || '#333',
    },
    tagInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    addTagButton: {
      width: 48,
      height: 48,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 16,
    },
    tag: {
      backgroundColor: theme?.colors?.primary + '15' || '#667eea15',
    },
    tagText: {
      color: theme?.colors?.primary || '#667eea',
    },
    submitButton: {
      borderRadius: 12,
      paddingVertical: 6,
      marginTop: 16,
    },
    submitButtonLabel: {
      fontSize: 16,
      fontWeight: '600',
    },
  });
