import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { TextInput, Button, Surface, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import RNPickerSelect from 'react-native-picker-select';
import moment from 'moment';

export const FormSection = ({ title, children, icon }) => (
  <Surface style={styles.formSection}>
    <View style={styles.sectionHeader}>
      {icon && <Ionicons name={icon} size={20} color="#667eea" />}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </Surface>
);

export const FormInput = ({ 
  label, 
  value, 
  onChangeText, 
  multiline = false, 
  numberOfLines = 1,
  keyboardType = 'default',
  leftIcon,
  rightIcon,
  placeholder,
  required = false,
  error,
  ...props 
}) => (
  <View style={styles.inputContainer}>
    <TextInput
      label={`${label}${required ? ' *' : ''}`}
      value={value}
      onChangeText={onChangeText}
      mode="outlined"
      style={styles.input}
      multiline={multiline}
      numberOfLines={numberOfLines}
      keyboardType={keyboardType}
      placeholder={placeholder}
      left={leftIcon && <TextInput.Icon icon={leftIcon} />}
      right={rightIcon && <TextInput.Icon icon={rightIcon} />}
      theme={{ colors: { primary: '#667eea' } }}
      error={!!error}
      {...props}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export const DatePicker = ({ 
  label, 
  value, 
  onDateChange, 
  mode = 'date',
  required = false,
  error 
}) => {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirm = (date) => {
    onDateChange(date);
    hideDatePicker();
  };

  const formatDate = (date) => {
    if (!date) return '';
    return mode === 'date' 
      ? moment(date).format('DD/MM/YYYY')
      : moment(date).format('DD/MM/YYYY HH:mm');
  };

  return (
    <View style={styles.inputContainer}>
      <TouchableOpacity onPress={showDatePicker}>
        <TextInput
          label={`${label}${required ? ' *' : ''}`}
          value={formatDate(value)}
          mode="outlined"
          style={styles.input}
          editable={false}
          right={<TextInput.Icon icon="calendar" />}
          theme={{ colors: { primary: '#667eea' } }}
          error={!!error}
        />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode={mode}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        date={value || new Date()}
      />
    </View>
  );
};

export const DropdownPicker = ({ 
  label, 
  value, 
  onValueChange, 
  items, 
  placeholder = 'Select an option...',
  required = false,
  error 
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.dropdownLabel}>
      {label}{required ? ' *' : ''}
    </Text>
    <View style={[styles.dropdownContainer, error && styles.dropdownError]}>
      <RNPickerSelect
        onValueChange={onValueChange}
        items={items}
        value={value}
        placeholder={{ label: placeholder, value: null }}
        style={{
          inputIOS: styles.dropdownInput,
          inputAndroid: styles.dropdownInput,
          placeholder: styles.dropdownPlaceholder,
        }}
        Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export const TagInput = ({ 
  label, 
  tags, 
  onTagsChange, 
  placeholder = 'Add tags...',
  required = false,
  error 
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      onTagsChange([...tags, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <View style={styles.inputContainer}>
      <FormInput
        label={label}
        value={inputValue}
        onChangeText={setInputValue}
        placeholder={placeholder}
        required={required}
        error={error}
        rightIcon="add"
        onSubmitEditing={addTag}
      />
      {tags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <Chip
              key={index}
              mode="outlined"
              onClose={() => removeTag(tag)}
              style={styles.tag}
              textStyle={styles.tagText}
            >
              {tag}
            </Chip>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export const FileUpload = ({ 
  label, 
  onFileSelect, 
  acceptedTypes = ['image/*', 'application/pdf'],
  multiple = false,
  required = false,
  error,
  files = []
}) => {
  const handleFileSelect = async () => {
    // This would integrate with expo-document-picker
    // For now, just a placeholder
    console.log('File selection would open here');
    if (onFileSelect) {
      onFileSelect([]);
    }
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.dropdownLabel}>
        {label}{required ? ' *' : ''}
      </Text>
      
      <TouchableOpacity style={styles.fileUploadButton} onPress={handleFileSelect}>
        <Ionicons name="cloud-upload-outline" size={24} color="#667eea" />
        <Text style={styles.fileUploadText}>
          {files.length > 0 ? `${files.length} file(s) selected` : 'Select files'}
        </Text>
      </TouchableOpacity>
      
      {files.length > 0 && (
        <View style={styles.fileList}>
          {files.map((file, index) => (
            <View key={index} style={styles.fileItem}>
              <Ionicons name="document-outline" size={16} color="#666" />
              <Text style={styles.fileName}>{file.name}</Text>
              <TouchableOpacity onPress={() => {
                const newFiles = files.filter((_, i) => i !== index);
                onFileSelect(newFiles);
              }}>
                <Ionicons name="close-circle" size={16} color="#f44336" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export const FormActions = ({ onSave, onCancel, saveText = 'Save', cancelText = 'Cancel', loading = false }) => (
  <View style={styles.formActions}>
    <Button
      mode="contained"
      onPress={onSave}
      loading={loading}
      disabled={loading}
      style={styles.saveButton}
      contentStyle={styles.buttonContent}
    >
      {saveText}
    </Button>
    
    <Button
      mode="outlined"
      onPress={onCancel}
      disabled={loading}
      style={styles.cancelButton}
      contentStyle={styles.buttonContent}
    >
      {cancelText}
    </Button>
  </View>
);

const styles = StyleSheet.create({
  formSection: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  sectionContent: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4,
    marginLeft: 12,
  },
  dropdownLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  dropdownError: {
    borderColor: '#f44336',
  },
  dropdownInput: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#333',
  },
  dropdownPlaceholder: {
    color: '#999',
  },
  tagsContainer: {
    marginTop: 8,
  },
  tag: {
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
  },
  fileUploadButton: {
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9ff',
  },
  fileUploadText: {
    marginTop: 8,
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  fileList: {
    marginTop: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginBottom: 4,
  },
  fileName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  cancelButton: {
    flex: 1,
    borderColor: '#667eea',
  },
  buttonContent: {
    paddingVertical: 8,
  },
});