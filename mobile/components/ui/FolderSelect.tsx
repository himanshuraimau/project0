import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { ChevronDown } from 'lucide-react-native';
import { useFolders } from '@/lib/hooks/useFolders';

type FolderOption = {
  label: string;
  value: string;
};

type FolderSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  style?: any;
  disabled?: boolean;
  placeholder?: { label?: string; value?: string | null };
};

const FolderSelect: React.FC<FolderSelectProps> = ({
  value,
  onValueChange,
  style,
  disabled = false,
  placeholder = { label: 'Select folder...', value: null },
}) => {
  const { folders, loading, fetchFolders } = useFolders();
  const [options, setOptions] = useState<FolderOption[]>([]);

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    // Build options from fetched folders
    const folderOptions: FolderOption[] = [
      { label: 'No folder (Uncategorized)', value: '' },
      ...folders.map(folder => ({
        label: folder.name,
        value: folder.id,
      })),
    ];
    setOptions(folderOptions);
  }, [folders]);

  return (
    <View style={[styles.pickerWrap, style]}>
      <Text style={styles.label}>Folder</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4f3be7" />
          <Text style={styles.loadingText}>Loading folders...</Text>
        </View>
      ) : (
        <RNPickerSelect
          onValueChange={onValueChange}
          items={options}
          value={value}
          style={pickerStyles}
          useNativeAndroidPickerStyle={false}
          placeholder={placeholder}
          disabled={disabled}
          Icon={() => <ChevronDown size={18} color="#6b6b6b" />}
        />
      )}
    </View>
  );
};

export default FolderSelect;

const styles = StyleSheet.create({
  pickerWrap: {
    marginVertical: 8,
  },
  label: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 32,
    color: '#364153',
    marginBottom: 6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1.26,
    borderColor: '#D4D4D4',
    height: 53,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
});

const pickerStyles = {
  inputIOS: {
    color: '#111',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    fontSize: 14,
    borderWidth: 1.26,
    borderColor: '#D4D4D4',
    height: 53,
  },
  inputAndroid: {
    color: '#111',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    fontSize: 14,
    borderWidth: 1.26,
    borderColor: '#D4D4D4',
    height: 53,
  },
  placeholder: {
    color: '#6b6b6b',
  },
  iconContainer: {
    top: 16,
    right: 16,
  },
};