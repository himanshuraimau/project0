import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

// Lightweight local Icon fallback using emoji so the component works without extra deps
const Icon: React.FC<{
  name: string;
  size?: number;
  color?: string;
  style?: any;
}> = ({name, size = 18, color = '#fff', style}) => {
  const map: Record<string, string> = {
    close: '✕',
    mic: '🎤',
    'keyboard-voice': '🎙️',
    star: '⭐',
    folder: '📁',
    sparkle: '✨',
    caret: '▾',
  };
  const glyph = map[name] ?? '◻️';
  return <Text style={[{fontSize: size, color}, style]}>{glyph}</Text>;
};

type Phase = 'initial' | 'recording' | 'recorded';

type Props = {
  visible?: boolean;
  onClose?: () => void;
  inline?: boolean;
};

const RecordAudio: React.FC<Props> = ({visible: visibleProp, onClose, inline = false}) => {
  const [internalVisible, setInternalVisible] = useState<boolean>(visibleProp ?? true);
  const visible = typeof visibleProp === 'boolean' ? visibleProp : internalVisible;
  const [phase, setPhase] = useState<Phase>('initial');
  const [language, setLanguage] = useState('english');
  const [folder, setFolder] = useState('all_notes');
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase === 'recording') startTimer();
    if (phase !== 'recording') stopTimer();
    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === 'recording') startPulse();
    else stopPulse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000) as unknown as number;
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current as any);
      timerRef.current = null;
    }
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const stopPulse = () => {
    pulse.stopAnimation();
    pulse.setValue(1);
  };

  const reset = () => {
    setSeconds(0);
    setPhase('initial');
  };

  const formatTime = (s: number) => {
    const mm = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const close = () => {
    if (onClose) onClose();
    else setInternalVisible(false);
  };

  const inner = (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Record audio</Text>
        <TouchableOpacity onPress={close}>
          <Icon name="close" size={22} color="#111" />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={styles.pickerWrap}>
          <Text style={styles.label}>Audio language</Text>
          <RNPickerSelect
            onValueChange={val => setLanguage(val)}
            items={[{label: 'English', value: 'english'}]}
            value={language}
            style={pickerStyles}
            useNativeAndroidPickerStyle={false}
            placeholder={{}}
            Icon={() => <Icon name="caret" size={18} color="#6b6b6b" />}
          />
        </View>

        <View style={styles.pickerWrap}>
          <Text style={styles.label}>Folder</Text>
          <View style={styles.folderRow}>
            <View style={styles.folderIconWrap}>
              <Icon name="folder" size={14} color="#7b61ff" />
            </View>
            <RNPickerSelect
              onValueChange={val => setFolder(val)}
              items={[{label: 'All notes', value: 'all_notes'}]}
              value={folder}
              style={pickerStyles}
              useNativeAndroidPickerStyle={false}
              placeholder={{}}
              Icon={() => <Icon name="caret" size={18} color="#6b6b6b" />}
            />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {phase === 'initial' && (
          <TouchableOpacity
            style={styles.recordButtonGradient}
            onPress={() => setPhase('recording')}
            activeOpacity={0.85}
          >
            <Text style={styles.recordButtonText}>Start recording</Text>
            <Icon name="keyboard-voice" size={20} color="#fff" style={{marginLeft: 8}} />
          </TouchableOpacity>
        )}

        {phase !== 'initial' && (
          <Animated.View style={[styles.timerButton, {transform: [{scale: pulse}]}]}>
            <Icon name="mic" size={20} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.timerText}>{formatTime(seconds)}</Text>
          </Animated.View>
        )}

        {phase === 'recording' && (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={() => setPhase('recorded')}
          >
            <Text style={styles.stopText}>Stop</Text>
          </TouchableOpacity>
        )}

        {phase === 'recorded' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.deleteBtn} onPress={reset}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resumeBtn}
              onPress={() => setPhase('recording')}
            >
              <Text style={styles.resumeText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={() => close()}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.generateBtn} activeOpacity={0.85}>
          <Icon name="sparkle" size={16} color="#fff" style={{marginRight: 8}} />
          <Text style={styles.generateText}>Generate Notes</Text>
        </TouchableOpacity>
      </View>
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

export default RecordAudio;

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
    // subtle elevated sheet
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
  row: {flexDirection: 'row', justifyContent: 'space-between', gap: 12},
  pickerWrap: {flex: 1, marginVertical: 8},
  label: {color: '#6b6b6b', fontSize: 12, marginBottom: 6},
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
  content: {marginTop: 18, alignItems: 'center'},
  recordButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff5f7a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    // button shadow
    shadowColor: '#ff5f7a',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  recordButtonText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: '100%',
    justifyContent: 'center',
  },
  timerText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  stopButton: {
    marginTop: 12,
    backgroundColor: '#444',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  stopText: {color: '#fff', fontWeight: '600'},
  actionRow: {flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 12},
  deleteBtn: {flex: 1, alignItems: 'center', paddingVertical: 10},
  deleteText: {color: '#ff6b9a', fontWeight: '600'},
  resumeBtn: {flex: 1, backgroundColor: '#d9534f', marginHorizontal: 6, borderRadius: 10, alignItems: 'center', paddingVertical: 10},
  resumeText: {color: '#fff', fontWeight: '600'},
  saveBtn: {flex: 1, backgroundColor: '#3bb273', borderRadius: 10, alignItems: 'center', paddingVertical: 10},
  saveText: {color: '#fff', fontWeight: '600'},
  generateBtn: {flexDirection: 'row', backgroundColor: '#000', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, marginTop: 18, alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  generateText: {color: '#fff', fontWeight: '700'},
  demoRow: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 18},
  demoControl: {flex: 1, alignItems: 'center', paddingVertical: 8},
  demoText: {color: '#9aa0a6'},
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
