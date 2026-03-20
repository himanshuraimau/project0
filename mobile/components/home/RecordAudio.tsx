import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  Platform,
  Dimensions,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { Audio } from "expo-av";
import { useNoteCreation } from "@/lib/hooks/useNoteCreation";
import { Mic } from "lucide-react-native";
import FullWidthButton from "@/components/ui/FullWidthButton";
import FolderSelect from "@/components/ui/FolderSelect";
import { useAlert } from "@/lib/contexts/AlertContext";
import { useTheme } from "@/lib/hooks/useTheme";

// Lightweight local Icon fallback using emoji so the component works without extra deps
const Icon: React.FC<{
  name: string;
  size?: number;
  color?: string;
  style?: any;
}> = ({ name, size = 18, color = "#fff", style }) => {
  const map: Record<string, string> = {
    close: "✕",
    mic: "🎤",
    "keyboard-voice": "🎙️",
    star: "⭐",
    folder: "📁",
    sparkle: "✨",
    caret: "▾",
    play: "▶️",
    pause: "⏸️",
  };
  const glyph = map[name] ?? "◻️";
  return <Text style={[{ fontSize: size, color }, style]}>{glyph}</Text>;
};

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
  const [folder, setFolder] = useState("");  // Empty string = no folder (uncategorized)
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

  // Setup audio mode on mount
  useEffect(() => {
    setupAudioMode();
    return () => {
      // Cleanup on unmount
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
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setSeconds(0);
            setPhase("initial");
            setIsPlaying(false);
            recordingUriRef.current = null;

            // Clean up recording and sound
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
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        showAlert(
          "Permission Required",
          "Please grant microphone permission to record audio."
        );
        return;
      }

      // Prepare recording
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

      // Reset audio mode
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

      // If already playing, pause it
      if (isPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        return;
      }

      // If sound exists but paused, resume
      if (soundRef.current && !isPlaying) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        return;
      }

      // Create new sound instance
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
      // Stop playback if playing
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        setIsPlaying(false);
      }

      // Step 1: Transcribe audio
      setProcessingStep("transcribing");

      // Create FormData for audio file
      const formData = new FormData();

      // Get file info
      const filename = `recording-${Date.now()}.m4a`;
      const fileType = Platform.OS === "ios" ? "audio/x-m4a" : "audio/mp4";

      // Create FormData for audio file
      formData.append("audio", {
        uri: recordingUriRef.current,
        type: fileType,
        name: filename,
      } as any);

      // Add folderId if selected
      if (folder) {
        formData.append('folderId', folder);
      }

      // Use hook for transcription
      const transcriptionResult = await transcribeAudio(formData);

      if (!transcriptionResult) {
        // Error handled by hook
        return;
      }

      console.log('📦 Transcription result:', {
        hasNote: !!transcriptionResult.note,
        noteId: transcriptionResult.note?.id,
        transcriptId: transcriptionResult.transcript?.id,
      });

      // Check if note was already generated by the backend
      let note;
      if (transcriptionResult.note && transcriptionResult.note.id) {
        console.log('✅ Using note from backend:', transcriptionResult.note.id);
        note = transcriptionResult.note;
      } else {
        console.warn('⚠️ No note in response, generating new note (this may cause duplicate indexing)');
        // Fallback: Generate AI note from transcript
        setProcessingStep("generating");

        // Use hook for note generation
        note = await generateAINote({
          transcriptId: transcriptionResult.transcript.id,
          folderId: folder || undefined,
        });

        if (!note) {
          // Error handled by hook
          return;
        }
        console.log('📝 Generated new note:', note.id);
      }

      // Trigger refresh callback immediately on success
      if (onNoteGenerated) {
        onNoteGenerated(note.id);
      }

      // Success!
      showAlert("Success!", "Your notes have been generated successfully.", [
        {
          text: "View Notes",
          onPress: () => {
            close();
          },
        },
        {
          text: "Close",
          onPress: close,
          style: "cancel",
        },
      ]);
    } catch (error: any) {
      // Hook handles errors
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
    }
  };

  const formatTime = (s: number) => {
    const mm = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const close = () => {
    if (onClose) onClose();
    else setInternalVisible(false);
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    container: {
      backgroundColor: c.card,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: 10,
      paddingBottom: 16,
    },
    containerContent: {
      paddingTop: 0,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 7,
      marginHorizontal: 8,
    },
    title: { color: c.foreground, fontSize: 20, fontWeight: "600" },
    separator: {
      height: 1,
      backgroundColor: c.border,
      marginHorizontal: -40,
      width: Dimensions.get("window").width + 20,
    },
    row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
    field: { marginTop: 8 },
    label: {
      fontFamily: "Inter",
      fontWeight: "500",
      fontSize: 18,
      lineHeight: 32,
      color: c.foreground,
      marginBottom: 6,
    },
    folderRow: { flexDirection: "row", alignItems: "center" },
    folderIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    content: { marginTop: 20, alignItems: "center", width: "100%" },
    buttonContainer: {
      width: "100%",
    },
    timerButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.destructive,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 14,
      width: "100%",
      justifyContent: "center",
    },
    timerText: { color: c.background, fontSize: 16, fontWeight: "500" },
    actionRowContainer: {
      flexDirection: "row",
      width: "100%",
      gap: 8,
    },
    actionButton: {
      flex: 1,
    },
    demoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 18,
    },
    demoControl: { flex: 1, alignItems: "center", paddingVertical: 8 },
    demoText: { color: c.mutedForeground },
  });

  const pickerStyles = {
    inputIOS: {
      color: c.foreground,
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : c.muted,
      borderRadius: 10,
      fontSize: 14,
      borderWidth: 1.26,
      borderColor: c.border,
      height: 53,
    },
    inputAndroid: {
      color: c.foreground,
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : c.muted,
      borderRadius: 10,
      fontSize: 14,
      borderWidth: 1.26,
      borderColor: c.border,
      height: 53,
    },
    placeholder: {
      color: c.mutedForeground,
    },
    iconContainer: {
      top: 16,
      right: 16,
    },
  };

  const inner = (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Record audio</Text>
          <TouchableOpacity onPress={close}>
            <Icon name="close" size={22} color={c.foreground} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.separator} />
      <View style={[styles.container, styles.containerContent]}>
        <View style={styles.field}>
          <Text style={styles.label}>Audio language</Text>
          <RNPickerSelect
            onValueChange={(val) => setLanguage(val)}
            items={[{ label: "English", value: "english" }]}
            value={language}
            style={pickerStyles}
            useNativeAndroidPickerStyle={false}
            placeholder={{}}
            Icon={() => <Icon name="caret" size={18} color={c.mutedForeground} />}
          />
        </View>

        <FolderSelect
          value={folder}
          onValueChange={(val: string) => setFolder(val)}
          style={{ marginTop: 10 }}
        />

        <View style={styles.content}>
          {phase === "initial" && (
            <View style={styles.buttonContainer}>
              <FullWidthButton
                onPress={startRecording}
                buttonText="Start recording"
                icon={<Mic size={20} color="#FFFFFF" style={{ marginRight: 8 }} />}
                backgroundColor={c.destructive}
                textColor="#FFFFFF"
                style={{ marginTop: 0 }}
              />
            </View>
          )}

          {phase !== "initial" && (
            <Animated.View style={[styles.timerButton]}>
              <Mic size={24} color="#FFFFFF" style={{ borderRadius: 0 }} />
              <Text style={styles.timerText}>{formatTime(seconds)}</Text>
            </Animated.View>
          )}

          {phase === "recording" && (
            <View style={styles.buttonContainer}>
              <FullWidthButton
                onPress={stopRecording}
                buttonText="Stop"
                backgroundColor={c.mutedForeground}
                textColor="#FFFFFF"
                style={{ marginTop: 12, height: 48 }}
              />
            </View>
          )}

          {phase === "recorded" && (
            <>
              <View style={styles.actionRowContainer}>
                <View style={styles.actionButton}>
                  <FullWidthButton
                    onPress={reset}
                    buttonText="Delete"
                    backgroundColor={isDark ? 'rgba(239,68,68,0.12)' : '#FFE2E2'}
                    textColor={c.destructive}
                    style={{ marginTop: 12, height: 48 }}
                    textStyle={{ fontSize: 14 }}
                  />
                </View>
                <View style={styles.actionButton}>
                  <FullWidthButton
                    onPress={startRecording}
                    buttonText="Resume"
                    backgroundColor={c.destructive}
                    textColor="#FFFFFF"
                    style={{ marginTop: 12, height: 48 }}
                    textStyle={{ fontSize: 14 }}
                  />
                </View>
                <View style={styles.actionButton}>
                  <FullWidthButton
                    onPress={togglePlayback}
                    buttonText={isPlaying ? "Pause" : "Play"}
                    backgroundColor={c.mutedForeground}
                    textColor="#FFFFFF"
                    style={{ marginTop: 12, height: 48 }}
                    textStyle={{ fontSize: 14 }}
                  />
                </View>
              </View>
            </>
          )}

          <View style={styles.buttonContainer}>
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
      </View>
    </>
  );

  if (inline) return <View>{inner}</View>;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={close} />
        <SafeAreaView style={{ flex: 1 }}>{inner}</SafeAreaView>
      </View>
    </Modal>
  );
};

export default RecordAudio;
