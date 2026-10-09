import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NotificationPopover } from './NotificationPopover';

interface StudentHeaderProps {
  title?: string;
}

export function StudentHeader({ title }: StudentHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.topHeader}>
      <View style={styles.brandContainer}>
        <View style={styles.brandIcon}>
          <Ionicons name="book" size={18} color="#FFFFFF" />
        </View>
        {!title && <Text style={styles.brandTitle}>TutorMate</Text>}
      </View>

      {title && (
        <View style={styles.centerTitleContainer}>
          <Text style={styles.centerTitleText}>{title}</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 20 }}>
        <NotificationPopover />
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.headerProfileBtn}
          onPress={() => router.push('/(student)/StudentProfile')}
        >
          <Ionicons name="person" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    paddingBottom: 10,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 20,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginLeft: 10,
  },
  centerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    top: Platform.OS === 'android' ? 14 : 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    pointerEvents: 'none',
  },
  centerTitleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

