import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { ChevronDown } from 'lucide-react-native';

type FolderOption = {
  label: string;
  value: string;
};

type FolderSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options?: FolderOption[];
  style?: any;
  disabled?: boolean;
  placeholder?: { label?: string; value?: string | null };
};

const FolderSelect: React.FC<FolderSelectProps> = ({
  value,
  onValueChange,
  options = [{ label: 'All notes', value: 'all_notes' }],
  style,
  disabled = false,
  placeholder = {},
}) => {
  return (
    <View style={[styles.pickerWrap, style]}>
      <Text style={styles.label}>Folder</Text>
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
    </View>
  );
};

export default FolderSelect;

const styles = StyleSheet.create({
  pickerWrap: {
    marginVertical: 8,
  },
  label: {
    fontFamily: 'Arimo',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 32,
    color: '#364153',
    marginBottom: 6,
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