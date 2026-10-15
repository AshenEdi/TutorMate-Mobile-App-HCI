import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  createAudioPlayer,
  type AudioPlayer,
} from "expo-audio";
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
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const soundRef = useRef<AudioPlayer | null>(null);
  const timerRef = useRef<any>(null);

  // Web fallback refs
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const cleanupSound = async () => {
    if (soundRef.current) {
      soundRef.current.pause();
      soundRef.current.remove();
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

      if (recorder.isRecording) {
        setIsRecording(false);
        await recorder.stop();
        const uri = recorder.uri;
        const duration = durationRef.current || 1;
        setRecordedUri(uri);
        setRecordedDuration(duration);

        await setAudioModeAsync({
          allowsRecording: false,
        });

        return uri;
      }
    } catch (err) {
      console.warn("Error stopping recording:", err);
    }

    setIsRecording(false);
    return null;
  }, [recorder]);

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
      } else if (recorder.isRecording) {
        await recorder.stop();
        await setAudioModeAsync({ allowsRecording: false });
      }
    } catch (err) {
      console.warn("Error canceling voice recording:", err);
    }

    await cleanupSound();
    setIsRecording(false);
    setRecordedUri(null);
    setRecordingDuration(0);
    setRecordedDuration(0);
    durationRef.current = 0;
  }, [recorder]);

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

      // Native iOS / Android recording with expo-audio
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Microphone Permission",
          "TutorMate requires microphone access to record voice messages."
        );
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
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
  }, [recorder, stopRecording]);

  const playPreview = useCallback(async () => {
    if (!recordedUri) return;

    try {
      if (soundRef.current) {
        soundRef.current.play();
        setIsPlayingPreview(true);
        return;
      }

      await setAudioModeAsync({ playsInSilentMode: true });
      const sound = createAudioPlayer(recordedUri, { updateInterval: 250 });
      sound.addListener("playbackStatusUpdate", (status) => {
        setPreviewPosition(Math.floor(status.currentTime));
        if (status.didJustFinish) {
          setIsPlayingPreview(false);
          setPreviewPosition(0);
          void sound.seekTo(0);
        }
      });
      soundRef.current = sound;
      sound.play();
      setIsPlayingPreview(true);
    } catch (err) {
      console.warn("Preview playback error:", err);
    }
  }, [recordedUri]);

  const pausePreview = useCallback(async () => {
    if (soundRef.current) {
      soundRef.current.pause();
      setIsPlayingPreview(false);
    }
  }, []);

  const reset = useCallback(() => {
    void cancelRecording();
  }, [cancelRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      void cleanupSound();
    };
  }, [recorder]);

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
