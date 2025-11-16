import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

// Prefer react-native-vector-icons when available; fallback to emoji glyphs so component is resilient
let Icon: any = null;
try {
  // eslint-disable-next-line global-require
  Icon = require('react-native-vector-icons/MaterialCommunityIcons').default;
} catch (e) {
  Icon = ({name, size = 18, color = '#000', style}: any) => {
    const map: Record<string, string> = {
      close: '✕',
      'chevron-down': '▾',
      sparkle: '✨',
      person: '👤',
    };
    const glyph = map[name] ?? '◻️';
    return <Text style={[{fontSize: size, color}, style]}>{glyph}</Text>;
  };
}

type Props = {
  visible?: boolean;
  onClose?: () => void;
  inline?: boolean;
};

const WebLink: React.FC<Props> = ({visible: visibleProp, onClose, inline = false}) => {
  const [internalVisible, setInternalVisible] = useState<boolean>(visibleProp ?? true);
  const visible = typeof visibleProp === 'boolean' ? visibleProp : internalVisible;
  const [link, setLink] = useState('');
  const [folder, setFolder] = useState('all_notes');

  const close = () => {
    if (onClose) onClose();
    else setInternalVisible(false);
  };

  const inner = (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add link</Text>
        <TouchableOpacity onPress={close}>
          <Icon name="close" size={20} color="#111" />
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Link</Text>
        <TextInput
          style={styles.input}
          placeholder="youtube.com/anyvideo"
          placeholderTextColor="#8b8b8b"
          value={link}
          onChangeText={setLink}
          autoCapitalize="none"
          keyboardType="url"
        />
        <Text style={styles.helper}>Also works with YouTube, PDFs, TikTok, Websites.</Text>
      </View>

      <View style={[styles.field, {marginTop: 10}]}>
        <Text style={styles.label}>Folder</Text>
        <View style={styles.folderRow}>
          <View style={styles.folderIconWrap}>
            <Icon name="account" size={14} color="#7b61ff" />
          </View>

          <RNPickerSelect
            onValueChange={val => setFolder(val)}
            items={[{label: 'All notes', value: 'all_notes'}]}
            value={folder}
            style={pickerStyles}
            useNativeAndroidPickerStyle={false}
            placeholder={{}}
            Icon={() => <Icon name="chevron-down" size={18} color="#6b6b6b" />}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.generateBtn} activeOpacity={0.85}>
        <Icon name="sparkles" size={16} color="#fff" style={{marginRight: 8}} />
        <Text style={styles.generateText}>Generate Notes</Text>
      </TouchableOpacity>
    </View>
  );

  if (inline) return <View>{inner}</View>;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={close} />
        <SafeAreaView style={{flex: 1}}>
          {inner}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default WebLink;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {color: '#111', fontSize: 18, fontWeight: '600'},
  field: {marginTop: 8},
  label: {color: '#6b6b6b', fontSize: 12, marginBottom: 6},
  input: {
    backgroundColor: '#fbfbfd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6e6ea',
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: '#111',
  },
  helper: {color: '#8b8b8b', fontSize: 12, marginTop: 8},
  folderRow: {flexDirection: 'row', alignItems: 'center'},
  folderIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f2efff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  generateBtn: {
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: 'center',
  },
  generateText: {color: '#fff', fontWeight: '700'},
});

const pickerStyles = {
  inputIOS: {
    color: '#111',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 14,
  },
  inputAndroid: {
    color: '#111',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 14,
  },
  placeholder: {
    color: '#6b6b6b',
  },
};
