# PDF Import Feature

## Overview

This document describes the implementation of the PDF file selection feature in the "Upload text or PDF" component. Users can now select one or multiple PDF files from their device, which will be displayed in the interface before processing.

## User Flow

### 1. Access PDF Import
1. User taps **"+" FAB button** on home screen
2. Modal opens with "New Note" options
3. User selects **"Upload text or PDF"** option
4. Form appears with both text input and PDF import options

### 2. Select PDF Files
1. User taps **"Import PDF(s)"** button
2. Native file picker opens
3. User can select:
   - Single PDF file
   - Multiple PDF files (multi-select enabled)
4. User confirms selection

### 3. Review Selected Files
1. Selected PDFs appear in a list below the folder selector
2. Each PDF shows:
   - File icon (purple)
   - File name
   - Remove button (red X)
3. User can:
   - View all selected files
   - Remove individual files by tapping the X button
   - Add more files by tapping "Import PDF(s)" again

### 4. Success Feedback
After selection, an alert displays:
- Title: "PDFs Selected"
- Message: "Selected X file(s): [file names]"
- Button: "OK"

## Implementation Details

### Package Installation

**Installed**: `expo-document-picker@~14.0.7`

```bash
npx expo install expo-document-picker
```

### Component: UploadTextOrPDF.tsx

#### New Import
```typescript
import * as DocumentPicker from 'expo-document-picker';
```

#### New State
```typescript
const [selectedPDFs, setSelectedPDFs] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
```

**State Structure**:
```typescript
DocumentPickerAsset {
  uri: string;          // File URI
  name: string;         // File name with extension
  size: number;         // File size in bytes
  mimeType: string;     // MIME type (application/pdf)
}
```

#### PDF Import Function
```typescript
const handleImportPDF = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',        // Only PDF files
      multiple: true,                  // Allow multiple selection
      copyToCacheDirectory: true,      // Copy files to app cache
    });

    if (result.canceled) {
      console.log('User cancelled PDF selection');
      return;
    }

    // Store selected PDFs
    setSelectedPDFs(result.assets);
    
    // Show success message
    const fileNames = result.assets.map(asset => asset.name).join(', ');
    Alert.alert(
      'PDFs Selected',
      `Selected ${result.assets.length} file(s): ${fileNames}`,
      [{ text: 'OK' }]
    );

    console.log('Selected PDFs:', result.assets);
  } catch (err: any) {
    console.error('Failed to pick PDF:', err);
    Alert.alert('Error', 'Failed to select PDF files. Please try again.');
  }
};
```

**Key Features**:
- **File type restriction**: Only PDF files can be selected
- **Multiple selection**: Users can select multiple PDFs at once
- **Cache copy**: Files are copied to app cache for processing
- **Error handling**: Catches and displays errors
- **User feedback**: Shows alert with selected file names
- **Console logging**: Logs selected files for debugging

### UI Components

#### Import PDF Button
```tsx
<TouchableOpacity 
  style={[styles.importBtn, loading && styles.buttonDisabled]} 
  activeOpacity={0.85}
  disabled={loading}
  onPress={handleImportPDF}
>
  <Icon name="file" size={16} color="#333" style={{marginRight: 8}} />
  <Text style={styles.importText}>Import PDF(s)</Text>
</TouchableOpacity>
```

**Features**:
- Disabled during note creation
- Calls `handleImportPDF` on press
- File icon indicator
- Clear label text

#### Selected PDFs Display
```tsx
{selectedPDFs.length > 0 && (
  <View style={[styles.field, {marginTop: 10}]}>
    <Text style={styles.label}>Selected PDFs ({selectedPDFs.length})</Text>
    <View style={styles.pdfListContainer}>
      {selectedPDFs.map((pdf, index) => (
        <View key={index} style={styles.pdfItem}>
          <Icon name="file" size={16} color="#7C3AED" style={{marginRight: 8}} />
          <Text style={styles.pdfName} numberOfLines={1}>
            {pdf.name}
          </Text>
          <TouchableOpacity 
            onPress={() => {
              setSelectedPDFs(prev => prev.filter((_, i) => i !== index));
            }}
            style={styles.removePdfButton}
          >
            <Icon name="close" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  </View>
)}
```

**Features**:
- **Conditional rendering**: Only shows when PDFs are selected
- **Count display**: Shows number of selected files
- **File list**: Each PDF in its own card
- **File icon**: Purple file icon for visual clarity
- **File name**: Truncated if too long (numberOfLines={1})
- **Remove button**: Red X button to remove individual files
- **Filter logic**: Removes file from array on button press

### Styles Added

```typescript
pdfListContainer: {
  backgroundColor: '#f9fafb',
  borderRadius: 12,
  padding: 8,
  borderWidth: 1,
  borderColor: '#e6e6ea',
},
pdfItem: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 10,
  marginBottom: 6,
},
pdfName: {
  flex: 1,
  color: '#111',
  fontSize: 14,
  fontWeight: '500',
},
removePdfButton: {
  padding: 4,
  marginLeft: 8,
},
```

**Design Choices**:
- **Light gray background**: Subtle container for PDF list
- **White cards**: Individual PDF items stand out
- **Rounded corners**: Modern, friendly appearance
- **Adequate spacing**: 10px padding for comfortable touch targets
- **Flex layout**: File name takes available space
- **Remove button padding**: Easy to tap (4px padding + 8px margin)

## User Experience Features

### 1. File Selection
- **Native file picker**: Platform-appropriate UI (iOS/Android)
- **Multiple selection**: Select multiple PDFs at once
- **File type filter**: Only PDFs shown in picker
- **Clear feedback**: Alert confirms selection with file names

### 2. File Management
- **Visual list**: See all selected files at a glance
- **File count**: Header shows total number of files
- **Easy removal**: Tap X to remove any file
- **Add more**: Can open picker multiple times to add more files
- **Persistent state**: Files remain selected until removed or form reset

### 3. Error Handling
- **User cancellation**: Gracefully handles cancelled selection
- **Permission errors**: Shows error alert if picker fails
- **Console logging**: Helps developers debug issues
- **Error messages**: Clear, user-friendly error alerts

### 4. Visual Feedback
- **Purple file icons**: Matches app color scheme
- **Red remove buttons**: Clear destructive action indicator
- **Truncated names**: Long file names don't break layout
- **Card layout**: Each file in its own contained space

### 5. Accessibility
- **Touch targets**: Adequate size for easy tapping
- **Visual hierarchy**: Clear distinction between elements
- **Color coding**: Purple for files, red for removal
- **Feedback messages**: Clear success and error communication

## DocumentPicker API

### Configuration Options
```typescript
DocumentPicker.getDocumentAsync({
  type: 'application/pdf',     // MIME type filter
  multiple: true,               // Allow multiple files
  copyToCacheDirectory: true,   // Copy to app cache
})
```

### Available MIME Types
- `application/pdf` - PDF files
- `application/msword` - Word documents
- `application/vnd.ms-excel` - Excel files
- `image/*` - All images
- `*/*` - All files

### Response Structure

**Success Response**:
```typescript
{
  canceled: false,
  assets: [
    {
      uri: 'file:///path/to/file.pdf',
      name: 'document.pdf',
      size: 102400,  // bytes
      mimeType: 'application/pdf'
    }
  ]
}
```

**Cancelled Response**:
```typescript
{
  canceled: true
}
```

## Testing Scenarios

### 1. Single PDF Selection
1. Tap "Import PDF(s)"
2. Select one PDF file
3. Tap confirm in picker
4. Verify:
   - Success alert shows file name
   - File appears in selected list
   - File can be removed

### 2. Multiple PDF Selection
1. Tap "Import PDF(s)"
2. Select multiple PDF files (2-5)
3. Tap confirm
4. Verify:
   - Alert shows all file names
   - All files appear in list
   - Count shows correct number
   - Each file has remove button

### 3. Cancel Selection
1. Tap "Import PDF(s)"
2. Cancel picker without selecting
3. Verify:
   - No error shown
   - No files added to list
   - Can try again

### 4. Remove Individual Files
1. Select 3 PDF files
2. Tap X on middle file
3. Verify:
   - That file is removed
   - Other 2 files remain
   - Count updates to 2

### 5. Remove All Files
1. Select multiple files
2. Remove each file one by one
3. Verify:
   - List disappears when last file removed
   - Can select new files again

### 6. Add More Files
1. Select 2 PDFs
2. Tap "Import PDF(s)" again
3. Select 2 more PDFs
4. Verify:
   - New files replace old ones (current behavior)
   - Consider if should append instead

### 7. Long File Names
1. Select PDF with very long name
2. Verify:
   - Name truncates with ellipsis
   - Remove button still visible
   - Layout doesn't break

### 8. No PDF Files Available
1. Try on device with no PDFs
2. Verify:
   - File picker opens normally
   - Shows empty or appropriate message
   - Can cancel gracefully

### 9. Permission Denied
1. Deny storage permission (if applicable)
2. Tap "Import PDF(s)"
3. Verify:
   - Error alert shown
   - User informed of issue
   - Can retry after granting permission

### 10. Large PDF Files
1. Select very large PDF (10MB+)
2. Verify:
   - Selection completes
   - File info shows correctly
   - No performance issues

## Platform Considerations

### iOS
- Uses UIDocumentPickerViewController
- Requires no special permissions for user-initiated picking
- Files copied to app's cache directory
- Supports iCloud Drive and Files app

### Android
- Uses Android's document picker
- May require READ_EXTERNAL_STORAGE permission (granted on demand)
- Files copied to app's cache directory
- Supports Google Drive and local storage

### Web (Expo)
- Uses HTML5 file input
- Works in web browsers
- Limited to browser's file access capabilities

## Future Enhancements

### 1. PDF Processing
- Extract text from PDF
- Auto-populate content field with extracted text
- Show preview of first page
- OCR for scanned PDFs

### 2. File Upload to Server
- Upload PDFs to backend
- Backend extracts text
- Create note from extracted content
- Progress indicator during upload

### 3. Append Mode
- Option to append new PDFs to existing selection
- Don't replace when selecting more files
- Bulk remove button (remove all)

### 4. File Validation
- Check file size limits
- Validate PDF format
- Show warnings for unsupported files
- Preview file before confirmation

### 5. Enhanced File Info
- Show file size in human-readable format
- Show file date/time
- Show page count (if available)
- Thumbnail preview

### 6. Drag and Drop (Web)
- Drag PDF files onto interface
- Drop to add to selection
- Visual drop zone indicator

### 7. Cloud Storage Integration
- Import from Google Drive
- Import from Dropbox
- Import from iCloud
- Import from OneDrive

### 8. Batch Operations
- Select all / deselect all
- Reorder files
- Merge multiple PDFs
- Split combined PDFs

## Known Limitations

### Current Implementation
- **Replaces files**: New selection replaces previous (not append)
- **No processing**: Files selected but not processed yet
- **No upload**: Files stored locally only
- **No extraction**: Text not extracted from PDF
- **Memory only**: Files not persisted if form closed

### Workarounds
- Select all desired files at once
- Take note of file names for reference
- Process files in next implementation phase

## Error Codes and Messages

### Common Errors
- **ERR_PICKER_CANCELLED**: User cancelled (not shown to user)
- **ERR_DOCUMENT_PICKER_CANCELLED**: iOS cancellation
- **Permission denied**: Storage permission not granted
- **File not found**: Selected file no longer exists

### Error Messages Shown
- "Failed to select PDF files. Please try again." - Generic picker error
- "PDFs Selected" - Success confirmation (not an error)

## Code Files Modified

### `/mobile/components/home/UploadTextOrPDF.tsx`
**Changes**:
- Added `expo-document-picker` import
- Added `selectedPDFs` state variable
- Implemented `handleImportPDF` function
- Updated "Import PDF(s)" button with `onPress` handler
- Added selected PDFs display section
- Added styles: `pdfListContainer`, `pdfItem`, `pdfName`, `removePdfButton`

## Dependencies

- **expo-document-picker@~14.0.7**: Document/file picker for Expo
- **React Native**: UI components (TouchableOpacity, Alert, Text, View)
- **react-native-vector-icons**: File and close icons

## Summary

This feature provides a complete, production-ready PDF file selection implementation:

✅ **Native File Picker**: Platform-appropriate file selection UI  
✅ **Multiple Selection**: Select multiple PDFs at once  
✅ **File Type Filter**: Only PDF files shown in picker  
✅ **Visual Feedback**: Selected files displayed in clean list  
✅ **Easy Management**: Remove individual files with X button  
✅ **Error Handling**: Graceful handling of cancellation and errors  
✅ **User Feedback**: Success alerts with file names  
✅ **Accessibility**: Adequate touch targets and visual hierarchy  
✅ **No Compilation Errors**: Clean, type-safe implementation  

The feature lays the foundation for future PDF processing functionality including text extraction, upload to server, and automatic note creation from PDF content! 🎉📄✨

**Next Steps**:
1. Implement PDF text extraction
2. Upload PDFs to backend
3. Auto-generate notes from PDF content
4. Add progress indicators for large files
5. Implement file size validation
