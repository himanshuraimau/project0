import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  Platform,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { Audio } from "expo-av";
import { Feather } from "@expo/vector-icons";
import { useNoteCreation } from "@/lib/hooks/useNoteCreation";
import { Mic } from "lucide-react-native";
import FullWidthButton from "@/components/ui/FullWidthButton";
import FolderSelect from "@/components/ui/FolderSelect";
import { useAlert } from "@/lib/contexts/AlertContext";
import { useTheme } from "@/lib/hooks/useTheme";
import { neutral } from "@/lib/design-system";

type Phase = "initial" | "recording" | "recorded";

type Props = {
  visible?: boolean;
  onClose?: () => void;
  inline?: boolean;
  onNoteGenerated?: (noteId: string) => void;
};

const RecordAudio: React.FC<Props> = ({
  visible: visibleProp,
  onClose,
  inline = false,
  onNoteGenerated,
}) => {
  const { transcribeAudio, generateAINote } = useNoteCreation();
  const [internalVisible, setInternalVisible] = useState<boolean>(
    visibleProp ?? true
  );
  const { showAlert } = useAlert();
  const { theme, mode } = useTheme();
  const c = theme.colors;
  const isDark = mode === "dark";
  const visible =
    typeof visibleProp === "boolean" ? visibleProp : internalVisible;
  const [phase, setPhase] = useState<Phase>("initial");
  const [language, setLanguage] = useState("english");
  const [folder, setFolder] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<
    "transcribing" | "generating" | null
  >(null);

  const timerRef = useRef<number | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingUriRef = useRef<string | null>(null);

  // Shared colors
  const inputBg = isDark ? neutral[800] : neutral[100];
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    if (phase === "recording") startTimer();
    if (phase !== "recording") stopTimer();
    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === "recording") startPulse();
    else stopPulse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    setupAudioMode();
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(console.error);
      }
    };
  }, []);

  const setupAudioMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error("Failed to setup audio mode:", error);
    }
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
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
      ])
    ).start();
  };

  const stopPulse = () => {
    pulse.stopAnimation();
    pulse.setValue(1);
  };

  const reset = () => {
    showAlert(
      "Delete Recording",
      "Are you sure you want to delete this recording?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setSeconds(0);
            setPhase("initial");
            setIsPlaying(false);
            recordingUriRef.current = null;
            if (recordingRef.current) {
              recordingRef.current.stopAndUnloadAsync().catch(console.error);
              recordingRef.current = null;
            }
            if (soundRef.current) {
              soundRef.current.unloadAsync().catch(console.error);
              soundRef.current = null;
            }
          },
        },
      ]
    );
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        showAlert(
          "Permission Required",
          "Please grant microphone permission to record audio."
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setPhase("recording");
    } catch (error) {
      showAlert("Error", "Failed to start recording. Please try again.");
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingUriRef.current = uri;
      recordingRef.current = null;
      setPhase("recorded");

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      showAlert("Error", "Failed to stop recording.");
    }
  };

  const togglePlayback = async () => {
    try {
      if (!recordingUriRef.current) {
        showAlert("No Recording", "Please record audio first.");
        return;
      }

      if (isPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (soundRef.current && !isPlaying) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUriRef.current },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (error) {
      showAlert("Error", "Failed to play recording.");
    }
  };

  const handleGenerateNotes = async () => {
    if (!recordingUriRef.current) {
      showAlert("No Recording", "Please record audio first.");
      return;
    }

    setIsProcessing(true);

    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        setIsPlaying(false);
      }

      setProcessingStep("transcribing");

      const formData = new FormData();
      const filename = `recording-${Date.now()}.m4a`;
      const fileType = Platform.OS === "ios" ? "audio/x-m4a" : "audio/mp4";

      formData.append("audio", {
        uri: recordingUriRef.current,
        type: fileType,
        name: filename,
      } as any);

      if (folder) {
        formData.append('folderId', folder);
      }

      const transcriptionResult = await transcribeAudio(formData);

      if (!transcriptionResult) return;

      console.log('Transcription result:', {
        hasNote: !!transcriptionResult.note,
        noteId: transcriptionResult.note?.id,
        transcriptId: transcriptionResult.transcript?.id,
        noteError: transcriptionResult.noteError,
      });

      let note;
      if (transcriptionResult.note && transcriptionResult.note.id) {
        console.log('Using note from backend:', transcriptionResult.note.id);
        note = transcriptionResult.note;
      } else {
        if (transcriptionResult.noteError) {
          console.warn('Transcription saved; inline note failed:', transcriptionResult.noteError);
        }
        console.warn('No note in response, generating new note (this may cause duplicate indexing)');
        setProcessingStep("generating");

        note = await generateAINote({
          transcriptId: transcriptionResult.transcript.id,
          folderId: folder || undefined,
        });

        if (!note) return;
        console.log('Generated new note:', note.id);
      }

      if (onNoteGenerated) {
        onNoteGenerated(note.id);
      }

      showAlert("Success!", "Your notes have been generated successfully.", [
        { text: "View Notes", onPress: () => close() },
        { text: "Close", onPress: close, style: "cancel" },
      ]);
    } catch (error: any) {
      // Hook handles errors
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
    }
  };

  const formatTime = (s: number) => {
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const close = () => {
    if (onClose) onClose();
    else setInternalVisible(false);
  };

  const pickerStyles = {
    inputIOS: {
      color: c.foreground,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: inputBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: inputBorder,
      fontSize: 15,
      height: 48,
    },
    inputAndroid: {
      color: c.foreground,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: inputBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: inputBorder,
      fontSize: 15,
      height: 48,
    },
    placeholder: { color: c.mutedForeground },
    iconContainer: { top: 14, right: 16 },
  };

  const inner = (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.foreground }]}>Record audio</Text>
        <Pressable
          onPress={close}
          style={({ pressed }) => [
            styles.closeButton,
            { backgroundColor: isDark ? neutral[800] : neutral[200], opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="x" size={16} color={c.mutedForeground} />
        </Pressable>
      </View>

      {/* Language picker */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: c.mutedForeground }]}>AUDIO LANGUAGE</Text>
        <RNPickerSelect
          onValueChange={(val) => setLanguage(val)}
          items={[{ label: "English", value: "english" }]}
          value={language}
          style={pickerStyles}
          useNativeAndroidPickerStyle={false}
          placeholder={{}}
          Icon={() => <Feather name="chevron-down" size={16} color={c.mutedForeground} />}
        />
      </View>

      <FolderSelect
        value={folder}
        onValueChange={(val: string) => setFolder(val)}
        style={{ marginTop: 12 }}
      />

      {/* Recording controls */}
      <View style={styles.content}>
        {phase === "initial" && (
          <Pressable
            style={({ pressed }) => [
              styles.recordBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={startRecording}
          >
            <Mic size={20} color="#fff" />
            <Text style={styles.recordBtnText}>Start recording</Text>
          </Pressable>
        )}

        {phase !== "initial" && (
          <View style={[styles.timerCard, { backgroundColor: inputBg, borderColor: inputBorder }]}>
            <View style={[styles.timerDot, { backgroundColor: phase === "recording" ? c.destructive : c.mutedForeground }]} />
            <Text style={[styles.timerText, { color: c.foreground }]}>{formatTime(seconds)}</Text>
          </View>
        )}

        {phase === "recording" && (
          <Pressable
            style={({ pressed }) => [
              styles.stopBtn,
              {
                backgroundColor: isDark ? neutral[800] : neutral[200],
                borderColor: inputBorder,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={stopRecording}
          >
            <Feather name="square" size={16} color={c.foreground} />
            <Text style={[styles.stopBtnText, { color: c.foreground }]}>Stop</Text>
          </Pressable>
        )}

        {phase === "recorded" && (
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEE2E2',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={reset}
            >
              <Feather name="trash-2" size={16} color={c.destructive} />
              <Text style={[styles.actionBtnText, { color: c.destructive }]}>Delete</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: c.destructive,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={startRecording}
            >
              <Feather name="mic" size={16} color="#fff" />
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>Resume</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: isDark ? neutral[800] : neutral[200],
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={togglePlayback}
            >
              <Feather name={isPlaying ? "pause" : "play"} size={16} color={c.foreground} />
              <Text style={[styles.actionBtnText, { color: c.foreground }]}>{isPlaying ? "Pause" : "Play"}</Text>
            </Pressable>
          </View>
        )}

        <FullWidthButton
          onPress={handleGenerateNotes}
          disabled={phase !== "recorded"}
          loading={isProcessing}
          loadingText={
            processingStep === "transcribing"
              ? "Transcribing..."
              : "Generating Notes..."
          }
          buttonText="Generate Notes"
        />
      </View>
    </View>
  );

  if (inline) return <View>{inner}</View>;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.35)' }]}>
        <Pressable style={styles.backdrop} onPress={close} />
        <SafeAreaView style={{ flex: 1 }}>{inner}</SafeAreaView>
      </View>
    </Modal>
  );
};

export default RecordAudio;

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject },
  container: { paddingBottom: 4 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "700", letterSpacing: -0.4 },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  field: { marginBottom: 4 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 2,
    textTransform: "uppercase",
  },

  content: { marginTop: 8 },

  /* Record button */
  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF3B30",
    height: 52,
    borderRadius: 14,
    gap: 10,
  },
  recordBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  /* Timer display */
  timerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 8,
  },
  timerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timerText: {
    fontSize: 22,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },

  /* Stop button */
  stopBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  stopBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },

  /* Recorded action row */
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
