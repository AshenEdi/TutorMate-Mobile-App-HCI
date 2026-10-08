import { Audio } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform } from "react-native";

export const MAX_VOICE_RECORDING_SECONDS = 300; // 5 minutes max limit

export interface VoiceRecorderHook {
  isRecording: boolean;
  recordingDuration: number;
  recordedUri: string | null;
  recordedDuration: number;
  isPlayingPreview: boolean;
  previewPosition: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => Promise<void>;
  playPreview: () => Promise<void>;
  pausePreview: () => Promise<void>;
  discardRecording: () => void;
  reset: () => void;
}

export function formatTimeSeconds(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60);
  const s = Math.floor(totalSecs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function useVoiceRecorder(): VoiceRecorderHook {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(0);

  const durationRef = useRef(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<any>(null);

  // Web fallback refs
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const cleanupSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    setIsPlayingPreview(false);
    setPreviewPosition(0);
  };

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      if (Platform.OS === "web" && mediaRecorderRef.current) {
        return new Promise<string | null>((resolve) => {
          const mediaRecorder = mediaRecorderRef.current;
          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            const url = URL.createObjectURL(audioBlob);
            setRecordedUri(url);
            setRecordedDuration(durationRef.current || 1);
            setIsRecording(false);
            mediaRecorder.stream?.getTracks()?.forEach((t: any) => t.stop());
            resolve(url);
          };
          mediaRecorder.stop();
        });
      }

      if (recordingRef.current) {
        setIsRecording(false);
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        const duration = durationRef.current || 1;
        setRecordedUri(uri);
        setRecordedDuration(duration);
        recordingRef.current = null;

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });

        return uri;
      }
    } catch (err) {
      console.warn("Error stopping recording:", err);
    }

    setIsRecording(false);
    return null;
  }, []);

  const cancelRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      if (Platform.OS === "web" && mediaRecorderRef.current) {
        mediaRecorderRef.current.stream?.getTracks()?.forEach((t: any) => t.stop());
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
      } else if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      }
    } catch {}

    await cleanupSound();
    setIsRecording(false);
    setRecordedUri(null);
    setRecordingDuration(0);
    setRecordedDuration(0);
    durationRef.current = 0;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      await cleanupSound();
      setRecordedUri(null);
      setRecordedDuration(0);
      setRecordingDuration(0);
      durationRef.current = 0;

      if (Platform.OS === "web") {
        if (!navigator?.mediaDevices?.getUserMedia) {
          Alert.alert("Unsupported", "Voice recording is not supported on this browser.");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const mediaRecorder = new (window as any).MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event: any) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);

        timerRef.current = setInterval(() => {
          durationRef.current += 1;
          const current = durationRef.current;
          setRecordingDuration(current);
          if (current >= MAX_VOICE_RECORDING_SECONDS) {
            void stopRecording();
          }
        }, 1000);
        return;
      }

      // Native iOS / Android with expo-av
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Microphone Permission",
          "TutorMate requires microphone access to record voice messages."
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
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        const current = durationRef.current;
        setRecordingDuration(current);
        if (current >= MAX_VOICE_RECORDING_SECONDS) {
          void stopRecording();
        }
      }, 1000);
    } catch (err) {
      console.warn("Error starting voice recording:", err);
      Alert.alert("Recording Error", "Could not start voice recording.");
    }
  }, [stopRecording]);

  const playPreview = useCallback(async () => {
    if (!recordedUri) return;

    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlayingPreview(true);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: recordedUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            if (status.positionMillis !== undefined) {
              setPreviewPosition(Math.floor(status.positionMillis / 1000));
            }
            if (status.didJustFinish) {
              setIsPlayingPreview(false);
              setPreviewPosition(0);
            }
          }
        }
      );
      soundRef.current = sound;
      setIsPlayingPreview(true);
    } catch (err) {
      console.warn("Preview playback error:", err);
    }
  }, [recordedUri]);

  const pausePreview = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.pauseAsync();
        setIsPlayingPreview(false);
      } catch {}
    }
  }, []);

  const reset = useCallback(() => {
    void cancelRecording();
  }, [cancelRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      void cleanupSound();
      if (recordingRef.current) {
        void recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

  return {
    isRecording,
    recordingDuration,
    recordedUri,
    recordedDuration,
    isPlayingPreview,
    previewPosition,
    startRecording,
    stopRecording,
    cancelRecording,
    playPreview,
    pausePreview,
    discardRecording: reset,
    reset,
  };
}
