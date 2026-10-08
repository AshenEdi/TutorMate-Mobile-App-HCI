import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatTimeSeconds } from "../../hooks/useVoiceRecorder";

// Global audio coordinator to ensure only ONE voice note plays at any time
let currentlyPlayingSound: { sound: any; stopCallback: () => void } | null = null;

export function stopAllActiveAudio() {
  if (currentlyPlayingSound) {
    try {
      if (Platform.OS === "web") {
        currentlyPlayingSound.sound?.pause();
      } else {
        currentlyPlayingSound.sound?.stopAsync();
      }
      currentlyPlayingSound.stopCallback();
    } catch {}
    currentlyPlayingSound = null;
  }
}

interface VoiceMessageProps {
  audioUrl?: string | null;
  duration?: number | null;
  isMe: boolean;
}

export function VoiceMessage({ audioUrl, duration = 0, isMe }: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionSec, setPositionSec] = useState(0);
  const [totalSec, setTotalSec] = useState(duration || 0);

  const soundRef = useRef<Audio.Sound | null>(null);
  const webAudioRef = useRef<HTMLAudioElement | null>(null);

  const cleanupAudio = async () => {
    if (currentlyPlayingSound?.sound === (Platform.OS === "web" ? webAudioRef.current : soundRef.current)) {
      currentlyPlayingSound = null;
    }

    if (Platform.OS === "web" && webAudioRef.current) {
      try {
        webAudioRef.current.pause();
        webAudioRef.current.src = "";
      } catch {}
      webAudioRef.current = null;
    } else if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }

    setIsPlaying(false);
    setPositionSec(0);
  };

  const handleTogglePlay = async () => {
    if (!audioUrl) return;

    if (isPlaying) {
      // Pause
      if (Platform.OS === "web" && webAudioRef.current) {
        webAudioRef.current.pause();
      } else if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
      setIsPlaying(false);
      return;
    }

    // Stop any other active voice message first
    stopAllActiveAudio();

    try {
      if (Platform.OS === "web" && typeof Audio !== "undefined") {
        let audio = webAudioRef.current;
        if (!audio) {
          const newAudio: HTMLAudioElement = new (window as any).Audio(audioUrl);
          audio = newAudio;
          webAudioRef.current = newAudio;

          newAudio.ontimeupdate = () => {
            setPositionSec(Math.floor(newAudio.currentTime));
            if (newAudio.duration && !isNaN(newAudio.duration) && (!totalSec || totalSec <= 0)) {
              setTotalSec(Math.floor(newAudio.duration));
            }
          };

          newAudio.onended = () => {
            setIsPlaying(false);
            setPositionSec(0);
          };
        }

        if (audio) {
          await audio.play();
          setIsPlaying(true);

          currentlyPlayingSound = {
            sound: audio,
            stopCallback: () => {
              setIsPlaying(false);
              setPositionSec(0);
            },
          };
        }
        return;
      }

      // Native Audio playback via expo-av
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              if (status.positionMillis !== undefined) {
                setPositionSec(Math.floor(status.positionMillis / 1000));
              }
              if (status.durationMillis && (!totalSec || totalSec <= 0)) {
                setTotalSec(Math.floor(status.durationMillis / 1000));
              }
              if (status.didJustFinish) {
                setIsPlaying(false);
                setPositionSec(0);
              }
            }
          }
        );
        soundRef.current = sound;
        setIsPlaying(true);
      }

      currentlyPlayingSound = {
        sound: soundRef.current,
        stopCallback: () => {
          setIsPlaying(false);
          setPositionSec(0);
        },
      };
    } catch (err) {
      console.warn("Error playing audio note:", err);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      void cleanupAudio();
    };
  }, []);

  const progressPercent = totalSec > 0 ? Math.min(100, (positionSec / totalSec) * 100) : 0;
  const displayDuration = isPlaying ? formatTimeSeconds(positionSec) : formatTimeSeconds(totalSec || duration || 0);

  return (
    <View style={[styles.container, isMe ? styles.containerMe : styles.containerOther]}>
      <TouchableOpacity
        style={[styles.playButton, isMe ? styles.playButtonMe : styles.playButtonOther]}
        onPress={handleTogglePlay}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isPlaying ? "pause" : "play"}
          size={18}
          color={isMe ? "#2563EB" : "#FFFFFF"}
          style={{ marginLeft: isPlaying ? 0 : 2 }}
        />
      </TouchableOpacity>

      {/* Waveform & Progress track */}
      <View style={styles.trackCol}>
        <View style={styles.waveformContainer}>
          <View style={[styles.progressBarBg, isMe ? styles.barBgMe : styles.barBgOther]}>
            <View
              style={[
                styles.progressBarFill,
                isMe ? styles.barFillMe : styles.barFillOther,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.micTag}>
            <Ionicons name="mic" size={10} color={isMe ? "#BFDBFE" : "#64748B"} style={{ marginRight: 3 }} />
            <Text style={[styles.voiceTagText, isMe ? styles.tagTextMe : styles.tagTextOther]}>
              Voice Note
            </Text>
          </View>
          <Text style={[styles.durationText, isMe ? styles.durationTextMe : styles.durationTextOther]}>
            {displayDuration}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 210,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  containerMe: {},
  containerOther: {},
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playButtonMe: {
    backgroundColor: "#FFFFFF",
  },
  playButtonOther: {
    backgroundColor: "#2563EB",
  },
  trackCol: {
    flex: 1,
    justifyContent: "center",
  },
  waveformContainer: {
    height: 12,
    justifyContent: "center",
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  barBgMe: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  barBgOther: {
    backgroundColor: "#E2E8F0",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  barFillMe: {
    backgroundColor: "#FFFFFF",
  },
  barFillOther: {
    backgroundColor: "#2563EB",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  micTag: {
    flexDirection: "row",
    alignItems: "center",
  },
  voiceTagText: {
    fontSize: 10,
    fontWeight: "600",
  },
  tagTextMe: {
    color: "#BFDBFE",
  },
  tagTextOther: {
    color: "#64748B",
  },
  durationText: {
    fontSize: 11,
    fontWeight: "700",
  },
  durationTextMe: {
    color: "#FFFFFF",
  },
  durationTextOther: {
    color: "#1E293B",
  },
});
