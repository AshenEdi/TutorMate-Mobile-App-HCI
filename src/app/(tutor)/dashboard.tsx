import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function TutorDashboard() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/welcome');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Tutor Success Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="school" size={72} color="#1D61F2" />
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Tutor Login Successful!</Text>
        <Text style={styles.subtitle}>
          Welcome back,{'\n'}
          <Text style={styles.name}>{profile?.full_name ?? 'Tutor'}</Text>
        </Text>

        <View style={styles.infoBadge}>
          <Ionicons name="mail-outline" size={15} color="#0052CC" />
          <Text style={styles.infoText}>{profile?.email ?? '—'}</Text>
        </View>

        <View style={styles.roleBadge}>
          <Ionicons name="people-outline" size={15} color="#1D61F2" />
          <Text style={styles.roleText}>Role: Tutor</Text>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
  },
  name: {
    fontWeight: '700',
    color: '#0052CC',
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#0052CC',
    fontWeight: '600',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    color: '#1D61F2',
    fontWeight: '600',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
