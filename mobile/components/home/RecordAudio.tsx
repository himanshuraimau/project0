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
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { Audio } from "expo-av";
import { transcribeAudio } from "@/lib/api/audio";
import { generateAINote } from "@/lib/api/notes";
import { Mic } from "lucide-react-native";
import GenerateNote from "@/components/ui/GenerateNote";
import FolderSelect from "@/components/ui/FolderSelect";

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
  const [internalVisible, setInternalVisible] = useState<boolean>(
    visibleProp ?? true
  );
  const visible =
    typeof visibleProp === "boolean" ? visibleProp : internalVisible;
  const [phase, setPhase] = useState<Phase>("initial");
  const [language, setLanguage] = useState("english");
  const [folder, setFolder] = useState("all_notes");
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
  };

  const startRecording = async () => {
    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
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
      console.log("Recording started");
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording. Please try again.");
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      console.log("Stopping recording...");
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingUriRef.current = uri;
      console.log("Recording stopped. URI:", uri);

      recordingRef.current = null;
      setPhase("recorded");

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error("Failed to stop recording:", error);
      Alert.alert("Error", "Failed to stop recording.");
    }
  };

  const togglePlayback = async () => {
    try {
      if (!recordingUriRef.current) {
        Alert.alert("No Recording", "Please record audio first.");
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
      console.log("Loading sound from:", recordingUriRef.current);
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
      console.error("Failed to play recording:", error);
      Alert.alert("Error", "Failed to play recording.");
    }
  };

  const handleGenerateNotes = async () => {
    if (!recordingUriRef.current) {
      Alert.alert("No Recording", "Please record audio first.");
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
      console.log("Starting audio transcription...");

      // Create FormData for audio file
      const formData = new FormData();

      // Get file info
      const filename = `recording-${Date.now()}.m4a`;
      const fileType = Platform.OS === "ios" ? "audio/x-m4a" : "audio/mp4";

      formData.append("audio", {
        uri: recordingUriRef.current,
        type: fileType,
        name: filename,
      } as any);

      const transcriptionResult = await transcribeAudio(formData);
      console.log("Transcription completed:", transcriptionResult);

      // Check if note was already generated by the backend
      let note;
      if (transcriptionResult.note && transcriptionResult.note.id) {
        console.log("Note was generated by backend:", transcriptionResult.note);
        note = transcriptionResult.note;
      } else {
        // Fallback: Generate AI note from transcript
        setProcessingStep("generating");
        console.log("Generating AI note from transcript...");

        note = await generateAINote({
          transcriptId: transcriptionResult.transcript.id,
        });

        console.log("Note generated successfully:", note);
      }

      // Success!
      Alert.alert("Success!", "Your notes have been generated successfully.", [
        {
          text: "View Notes",
          onPress: () => {
            if (onNoteGenerated) {
              onNoteGenerated(note.id);
            }
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
      console.error("Error processing audio:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to process audio. Please try again.";

      if (error?.message) {
        if (
          error.message.includes("timeout") ||
          error.message.includes("Network Error")
        ) {
          errorMessage =
            "The request took too long. Your audio may still be processing. Please check your notes in a moment.";
        } else if (
          error.message.includes("401") ||
          error.message.includes("Authentication")
        ) {
          errorMessage = "Authentication required. Please sign in again.";
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert("Processing Error", errorMessage);
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

  const inner = (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Record audio</Text>
          <TouchableOpacity onPress={close}>
            <Icon name="close" size={22} color="#111" />
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
            Icon={() => <Icon name="caret" size={18} color="#6b6b6b" />}
          />
        </View>

        <FolderSelect
          value={folder}
          onValueChange={(val: string) => setFolder(val)}
          options={[{ label: "All notes", value: "all_notes" }]}
          style={{ marginTop: 10 }}
        />

        <View style={styles.content}>
          {phase === "initial" && (
            <TouchableOpacity
              style={styles.recordButtonGradient}
              onPress={startRecording}
              activeOpacity={0.85}
            >
              <Mic size={24} color="#FFFFFF" style={{ borderRadius: 0 }} />
              <Text style={styles.recordButtonText}>Start recording</Text>
            </TouchableOpacity>
          )}

          {phase !== "initial" && (
            <Animated.View style={[styles.timerButton]}>
              <Mic size={24} color="#FFFFFF" style={{ borderRadius: 0 }} />
              <Text style={styles.timerText}>{formatTime(seconds)}</Text>
            </Animated.View>
          )}

          {phase === "recording" && (
            <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
              <Text style={styles.stopText}>Stop</Text>
            </TouchableOpacity>
          )}

          {phase === "recorded" && (
            <>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.deleteBtn} onPress={reset}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.resumeBtn}
                  onPress={startRecording}
                >
                  <Text style={styles.resumeText}>Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={togglePlayback}
                >
                  <Text style={styles.playText}>
                    {isPlaying ? "Pause" : "Play"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <GenerateNote
            onPress={handleGenerateNotes}
            disabled={phase !== "recorded"}
            loading={isProcessing}
            loadingText={
              processingStep === "transcribing"
                ? "Transcribing..."
                : "Generating Notes..."
            }
            buttonText="Generate Notes"
            style={styles.customGenerateBtn}
            textStyle={styles.customGenerateText}
          />
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: "#fff",
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
  title: { color: "#111", fontSize: 20, fontWeight: "600" },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: -40,
    width: Dimensions.get("window").width + 20,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  field: { marginTop: 8 },
  label: {
    fontFamily: "Arimo",
    fontWeight: "700",
    fontSize: 18,
    lineHeight: 32,
    color: "#364153",
    marginBottom: 6,
  },
  folderRow: { flexDirection: "row", alignItems: "center" },
  folderIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f2efff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  content: { marginTop: 20, alignItems: "center" },
  recordButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    gap: 12,
    width: 300,
    height: 56,
    backgroundColor: "#FF6467", // Fallback for gradient
    borderRadius: 16,
    // button shadow
    shadowColor: "#ff5f7a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  recordButtonText: {
    color: "#FFFFFF",
    fontFamily: "Arimo",
    fontWeight: "700",
    fontSize: 19,
    lineHeight: 28,
    width: 137,
    height: 29,
    borderRadius: 0,
  },
  timerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff6b6b",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: "100%",
    justifyContent: "center",
  },
  timerText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  stopButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    width: 300,
    height: 47.99,
    backgroundColor: "#8F8F8F",
    borderRadius: 16,
    marginTop: 12,
  },
  stopText: {
    width: 43,
    height: 29,
    fontFamily: "Arimo",
    fontWeight: "700",
    fontSize: 19,
    lineHeight: 28,
    color: "#FFFFFF",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 12,
  },
  deleteBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    width: 99.13,
    height: 47.99,
    backgroundColor: "#FFE2E2",
    borderRadius: 16,
    flex: 1,
  },
  deleteText: {
    width: 47,
    height: 24,
    fontFamily: "Arimo",
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 24,
    color: "#FB2C36",
  },
  resumeBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    width: 99.13,
    height: 47.99,
    backgroundColor: "#FB2C36",
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 6,
  },
  resumeText: {
    width: 60,
    height: 24,
    fontFamily: "Arimo",
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
    borderRadius: 16,
  },
  playBtn: {
    flex: 1,
    backgroundColor: "#8F8F8F",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  playText: { color: "#fff", fontWeight: "600" },
  saveBtn: {
    flex: 1,
    backgroundColor: "#3bb273",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 10,
  },
  saveText: { color: "#fff", fontWeight: "600" },
  customGenerateBtn: {
    width: 300,
    height: 56,
    borderRadius: 15,
    marginTop: 18,
    alignSelf: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  customGenerateText: {
    fontFamily: "Arimo",
    fontSize: 19,
    lineHeight: 28,
  },
  demoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  demoControl: { flex: 1, alignItems: "center", paddingVertical: 8 },
  demoText: { color: "#9aa0a6" },
});

const pickerStyles = {
  inputIOS: {
    color: "#111",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    fontSize: 14,
    borderWidth: 1.26,
    borderColor: "#D4D4D4",
    height: 53,
  },
  inputAndroid: {
    color: "#111",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    fontSize: 14,
    borderWidth: 1.26,
    borderColor: "#D4D4D4",
    height: 53,
  },
  placeholder: {
    color: "#6b6b6b",
  },
  iconContainer: {
    top: 16,
    right: 16,
  },
};
