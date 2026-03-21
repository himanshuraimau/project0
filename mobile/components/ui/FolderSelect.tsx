import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import RNPickerSelect from 'react-native-picker-select'
import { ChevronDown } from 'lucide-react-native'
import { useFolders } from '@/lib/hooks/useFolders'
import { useTheme } from '@/lib/hooks/useTheme'

type FolderOption = {
  label: string
  value: string
}

type FolderSelectProps = {
  value: string
  onValueChange: (value: string) => void
  style?: any
  disabled?: boolean
  placeholder?: { label?: string; value?: string | null }
}

const FolderSelect: React.FC<FolderSelectProps> = ({
  value,
  onValueChange,
  style,
  disabled = false,
  placeholder = { label: 'Select folder...', value: null },
}) => {
  const { folders, loading, fetchFolders } = useFolders()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const [options, setOptions] = useState<FolderOption[]>([])

  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'

  useEffect(() => { fetchFolders() }, [])

  useEffect(() => {
    setOptions([
      { label: 'No folder (Uncategorized)', value: '' },
      ...folders.map((f) => ({ label: f.name, value: f.id })),
    ])
  }, [folders])

  const pickerStyles = {
    inputIOS: {
      color: c.foreground,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: inputBg,
      borderRadius: 12,
      fontSize: 15,
      height: 48,
    },
    inputAndroid: {
      color: c.foreground,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: inputBg,
      borderRadius: 12,
      fontSize: 15,
      height: 48,
    },
    placeholder: { color: c.mutedForeground },
    iconContainer: { top: 14, right: 14 },
  }

  return (
    <View style={[styles.wrap, style]}>
      <Text style={[styles.label, { color: c.mutedForeground }]}>FOLDER</Text>
      {loading ? (
        <View style={[styles.loadingWrap, { backgroundColor: inputBg }]}>
          <ActivityIndicator size="small" color={c.primary} />
          <Text style={[styles.loadingText, { color: c.mutedForeground }]}>Loading folders...</Text>
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
          Icon={() => <ChevronDown size={16} color={c.mutedForeground} />}
        />
      )}
    </View>
  )
}

export default FolderSelect

const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
    gap: 8,
  },
  loadingText: { fontSize: 14 },
})
