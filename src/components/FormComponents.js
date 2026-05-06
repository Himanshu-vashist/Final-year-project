import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { TextInput, Button, Surface, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import RNPickerSelect from 'react-native-picker-select';
import moment from 'moment';

export const FormSection = ({ title, children, icon, dark = true }) => (
  <Surface style={[styles.formSection, dark && styles.formSectionDark]}>
    <View style={styles.sectionHeader}>
      {icon && <Ionicons name={icon} size={20} color={dark ? "#b366ff" : "#667eea"} />}
      <Text style={[styles.sectionTitle, dark && styles.sectionTitleDark]}>{title}</Text>
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
  dark = true,
  ...props 
}) => (
  <View style={styles.inputContainer}>
    <TextInput
      label={`${label}${required ? ' *' : ''}`}
      value={value}
      onChangeText={onChangeText}
      mode="outlined"
      style={[styles.input, dark && styles.inputDark]}
      multiline={multiline}
      numberOfLines={numberOfLines}
      keyboardType={keyboardType}
      placeholder={placeholder}
      placeholderTextColor={dark ? "#666" : "#999"}
      left={leftIcon && <TextInput.Icon icon={leftIcon} color={dark ? "#b366ff" : "#667eea"} />}
      right={rightIcon && <TextInput.Icon icon={rightIcon} color={dark ? "#b366ff" : "#667eea"} />}
      outlineColor={dark ? "rgba(255,255,255,0.1)" : "#ccc"}
      activeOutlineColor={dark ? "#b366ff" : "#667eea"}
      textColor={dark ? "#fff" : "#333"}
      theme={{ 
        colors: { 
          primary: dark ? '#b366ff' : '#667eea',
          onSurfaceVariant: dark ? '#aaa' : '#666',
        } 
      }}
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
  error,
  dark = true 
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
          style={[styles.input, dark && styles.inputDark]}
          editable={false}
          textColor={dark ? "#fff" : "#333"}
          right={<TextInput.Icon icon="calendar" color={dark ? "#b366ff" : "#667eea"} />}
          outlineColor={dark ? "rgba(255,255,255,0.1)" : "#ccc"}
          activeOutlineColor={dark ? "#b366ff" : "#667eea"}
          theme={{ 
            colors: { 
              primary: dark ? '#b366ff' : '#667eea',
              onSurfaceVariant: dark ? '#aaa' : '#666',
            } 
          }}
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
        isDarkModeEnabled={dark}
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
  error,
  dark = true 
}) => (
  <View style={styles.inputContainer}>
    <Text style={[styles.dropdownLabel, dark && styles.dropdownLabelDark]}>
      {label}{required ? ' *' : ''}
    </Text>
    <View style={[
      styles.dropdownContainer, 
      dark && styles.dropdownContainerDark,
      error && styles.dropdownError
    ]}>
      <RNPickerSelect
        onValueChange={onValueChange}
        items={items}
        value={value}
        placeholder={{ label: placeholder, value: null, color: dark ? '#666' : '#999' }}
        style={{
          inputIOS: [styles.dropdownInput, dark && styles.dropdownInputDark],
          inputAndroid: [styles.dropdownInput, dark && styles.dropdownInputDark],
          placeholder: { color: dark ? '#666' : '#999' },
        }}
        Icon={() => <Ionicons name="chevron-down" size={20} color={dark ? "#b366ff" : "#666"} />}
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
  error,
  dark = true 
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
        dark={dark}
      />
      {tags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <Chip
              key={index}
              mode="outlined"
              onClose={() => removeTag(tag)}
              style={[styles.tag, dark && styles.tagDark]}
              textStyle={[styles.tagText, dark && styles.tagTextDark]}
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
  files = [],
  dark = true 
}) => {
  const handleFileSelect = async () => {
    console.log('File selection would open here');
    if (onFileSelect) {
      onFileSelect([]);
    }
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.dropdownLabel, dark && styles.dropdownLabelDark]}>
        {label}{required ? ' *' : ''}
      </Text>
      
      <TouchableOpacity 
        style={[styles.fileUploadButton, dark && styles.fileUploadButtonDark]} 
        onPress={handleFileSelect}
      >
        <Ionicons name="cloud-upload-outline" size={24} color={dark ? "#b366ff" : "#667eea"} />
        <Text style={[styles.fileUploadText, dark && styles.fileUploadTextDark]}>
          {files.length > 0 ? `${files.length} file(s) selected` : 'Select files'}
        </Text>
      </TouchableOpacity>
      
      {files.length > 0 && (
        <View style={styles.fileList}>
          {files.map((file, index) => (
            <View key={index} style={[styles.fileItem, dark && styles.fileItemDark]}>
              <Ionicons name="document-outline" size={16} color={dark ? "#aaa" : "#666"} />
              <Text style={[styles.fileName, dark && styles.fileNameDark]}>{file.name}</Text>
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

export const FormActions = ({ onSave, onCancel, saveText = 'Save', cancelText = 'Cancel', loading = false, dark = true }) => (
  <View style={styles.formActions}>
    <Button
      mode="contained"
      onPress={onSave}
      loading={loading}
      disabled={loading}
      style={[styles.saveButton, dark && styles.saveButtonDark]}
      contentStyle={styles.buttonContent}
      textColor="#fff"
    >
      {saveText}
    </Button>
    
    <Button
      mode="outlined"
      onPress={onCancel}
      disabled={loading}
      style={[styles.cancelButton, dark && styles.cancelButtonDark]}
      contentStyle={styles.buttonContent}
      textColor={dark ? "#fff" : "#667eea"}
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
  formSectionDark: {
    backgroundColor: 'transparent',
    elevation: 0,
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
  sectionTitleDark: {
    color: '#fff',
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
  inputDark: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4,
    marginLeft: 12,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginLeft: 4,
  },
  dropdownLabelDark: {
    color: '#aaa',
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dropdownContainerDark: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.1)',
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
  dropdownInputDark: {
    color: '#fff',
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
  tagDark: {
    backgroundColor: 'rgba(179,102,255,0.1)',
    borderColor: 'rgba(179,102,255,0.3)',
  },
  tagText: {
    fontSize: 12,
  },
  tagTextDark: {
    color: '#fff',
  },
  fileUploadButton: {
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9ff',
  },
  fileUploadButtonDark: {
    borderColor: 'rgba(179,102,255,0.3)',
    backgroundColor: 'rgba(179,102,255,0.05)',
  },
  fileUploadText: {
    marginTop: 8,
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  fileUploadTextDark: {
    color: '#b366ff',
  },
  fileList: {
    marginTop: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 6,
  },
  fileItemDark: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  fileName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  fileNameDark: {
    color: '#eee',
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
    borderRadius: 12,
  },
  saveButtonDark: {
    backgroundColor: '#b366ff',
  },
  cancelButton: {
    flex: 1,
    borderColor: '#667eea',
    borderRadius: 12,
  },
  cancelButtonDark: {
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonContent: {
    paddingVertical: 10,
  },
});