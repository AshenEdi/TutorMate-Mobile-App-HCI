import {
    Feather,
    Ionicons,
    MaterialCommunityIcons,
} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { TutorBottomNav } from '../../components/TutorBottomNav';
import { useAuth } from '../../context/AuthContext';
type BottomTab = 'sessions' | 'calendar' | 'requests' | 'messages' | 'profile';

interface TutorProfile {
  fullName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  degree: string;
  locationTimezone: string;
  avatarUrl: string;
}

const STORAGE_KEY = '@tutormate_tutor_profile';

export default function TutorProfileDetailsScreen() {
  const router = useRouter();
  const { profile: authProfile, user, signOut } = useAuth();
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('profile');

  const [profile, setProfile] = useState<TutorProfile>({
    fullName: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@stanford.alumni.edu',
    countryCode: '+1',
    phoneNumber: '(415) 890–2411',
    degree: 'Ph.D. in Applied Mathematics, Stanford University',
    locationTimezone: 'San Francisco, CA (PST · GMT-8)',
    avatarUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  });

  // Load profile from Supabase & AsyncStorage on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedData && isMounted) {
          setProfile(JSON.parse(savedData));
        }

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const activeUser = currentUser || user;
        if (!activeUser) return;

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', activeUser.id)
          .single();

        if (isMounted && data) {
          setProfile((prev) => ({
            ...prev,
            fullName: data.full_name || prev.fullName,
            email: data.email || activeUser.email || prev.email,
            avatarUrl: data.avatar_url || prev.avatarUrl,
            degree: data.degree || data.bio || prev.degree,
          }));
        } else if (isMounted && activeUser) {
          setProfile((prev) => ({
            ...prev,
            fullName: authProfile?.full_name || activeUser.user_metadata?.full_name || prev.fullName,
            email: authProfile?.email || activeUser.email || prev.email,
            avatarUrl: authProfile?.avatar_url || activeUser.user_metadata?.avatar_url || prev.avatarUrl,
          }));
        }
      } catch (error) {
        console.warn('Failed to load profile from database/local storage', error);
      }
    })();
    return () => { isMounted = false; };
  }, [user, authProfile]);

  const handleLogout = () => {
    router.replace('/welcome');
    void signOut().catch((error) => {
      console.error('Error signing out:', error);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* --- Top App Header --- */}
      <View style={styles.header}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.headerBackBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tutor)/dashboard");
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerBrandBadge}>
            <Ionicons name="book" size={19} color="#FFFFFF" />
          </View>

          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <TouchableOpacity activeOpacity={0.7} style={styles.headerProfileBtn}>
          <Ionicons name="person" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Page Heading --- */}
        <Text style={styles.pageTitle}>Let's craft your profile</Text>
        <Text style={styles.pageSubtitle}>
          Introduce yourself to prospective students and build immediate academic trust.
        </Text>

        {/* --- Photo Upload Hero Section --- */}
        <View style={styles.heroCard}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.cameraFloatingBtn}
              onPress={() => Alert.alert('Upload Photo', 'Choose photo from library or camera')}
            >
              <Ionicons name="camera" size={17} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.uploadTitle}>Upload Professional Photo</Text>
          <Text style={styles.uploadSubtitle}>
            A clear, friendly headshot helps students and parents feel safe and connected.
          </Text>

          {/* Social Proof Pill */}
          <View style={styles.socialProofBadge}>
            <Ionicons name="checkmark-circle" size={15} color="#0D9488" />
            <Text style={styles.socialProofText}>
              Tutors with photos get <Text style={styles.boldProof}>3.8× more session bookings</Text>
            </Text>
          </View>
        </View>

        {/* --- Form Fields --- */}

        {/* 1. Full Legal or Display Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Full Legal or Display Name <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <Feather name="user" size={19} color="#64748B" style={styles.inputLeadingIcon} />
            <TextInput
              style={styles.textInput}
              value={profile.fullName}
              editable={false}
              onChangeText={(text) => setProfile({ ...profile, fullName: text })}
              placeholder="e.g. Dr. Sarah Jenkins"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* 2. Professional Email Address */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Professional Email Address <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <Feather name="mail" size={19} color="#64748B" style={styles.inputLeadingIcon} />
            <TextInput
              style={styles.textInput}
              value={profile.email}
              editable={false}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(text) => setProfile({ ...profile, email: text })}
              placeholder="name@university.edu"
              placeholderTextColor="#94A3B8"
            />
          </View>
          <Text style={styles.fieldHelpText}>
            We use this for session invites, payout receipts, and parent messaging alerts.
          </Text>
        </View>

        {/* 3. Phone Number */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Phone Number <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <View style={styles.phoneRow}>
            {/* Country Selector */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.countryPicker}
              onPress={() => Alert.alert('Country Code', 'Select country code')}
            >
              <Text style={styles.flagIcon}>🇺🇸</Text>
              <Text style={styles.countryCodeText}>{profile.countryCode}</Text>
              <Ionicons name="chevron-down" size={15} color="#475569" />
            </TouchableOpacity>

            {/* Phone Input */}
            <View style={[styles.inputContainer, styles.phoneInputContainer]}>
              <Feather name="phone" size={18} color="#64748B" style={styles.inputLeadingIcon} />
              <TextInput
                style={styles.textInput}
                value={profile.phoneNumber}
                editable={false}
                keyboardType="phone-pad"
                onChangeText={(text) => setProfile({ ...profile, phoneNumber: text })}
                placeholder="(555) 000-0000"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        </View>

        {/* 4. Academic Degree / Highest Education */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Academic Degree / Highest Education <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <View style={[styles.inputContainer, styles.degreeInputContainer]}>
            <Ionicons
              name="school-outline"
              size={21}
              color="#475569"
              style={styles.degreeIcon}
            />
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={profile.degree}
              editable={false}
              multiline
              onChangeText={(text) => setProfile({ ...profile, degree: text })}
              placeholder="Degree, Major, Institution"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* 5. Location & Primary Timezone */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Location & Primary Timezone <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="location-outline"
              size={20}
              color="#475569"
              style={styles.inputLeadingIcon}
            />
            <TextInput
              style={styles.textInput}
              value={profile.locationTimezone}
              editable={false}
              onChangeText={(text) => setProfile({ ...profile, locationTimezone: text })}
              placeholder="City, State / Timezone"
              placeholderTextColor="#94A3B8"
            />
          </View>
          <Text style={styles.fieldHelpText}>
            Ensures your session booking calendar auto-converts accurately for remote students.
          </Text>
        </View>

        {/* --- Academic Guarantee Trust Banner --- */}
        <View style={styles.guaranteeCard}>
          <View style={styles.guaranteeShieldWrap}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#2563EB" />
          </View>
          <View style={styles.guaranteeContent}>
            <Text style={styles.guaranteeTitle}>TutorMate Academic Guarantee</Text>
            <Text style={styles.guaranteeText}>
              Your credentials will earn a Verified Educator badge once reviewed, boosting discovery
              placement in parent searches.
            </Text>
          </View>
        </View>

        {/* --- Action Buttons --- */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.editProfileButton}
          onPress={() => router.push('/(tutor)/EditTutorProfile')}
        >
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- Bottom Navigation Bar --- */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveBottomTab('sessions')}
        >
          <MaterialCommunityIcons
            name="ticket-confirmation-outline"
            size={22}
            color={activeBottomTab === 'sessions' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.navLabel,
              activeBottomTab === 'sessions' && styles.navLabelActive,
            ]}
          >
            Sessions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveBottomTab('calendar')}
        >
          <Ionicons
            name="calendar-outline"
            size={21}
            color={activeBottomTab === 'calendar' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.navLabel,
              activeBottomTab === 'calendar' && styles.navLabelActive,
            ]}
          >
            Calendar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveBottomTab('requests')}
        >
          <View style={styles.badgeWrap}>
            <MaterialCommunityIcons
              name="card-account-details-outline"
              size={23}
              color={activeBottomTab === 'requests' ? '#2563EB' : '#64748B'}
            />
            <View style={styles.redBadge}>
              <Text style={styles.redBadgeText}>2</Text>
            </View>
          </View>
          <Text
            style={[
              styles.navLabel,
              activeBottomTab === 'requests' && styles.navLabelActive,
            ]}
          >
            Requests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveBottomTab('messages')}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={21}
            color={activeBottomTab === 'messages' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.navLabel,
              activeBottomTab === 'messages' && styles.navLabelActive,
            ]}
          >
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveBottomTab('profile')}
        >
          <Ionicons
            name="person-circle-outline"
            size={23}
            color={activeBottomTab === 'profile' ? '#2563EB' : '#64748B'}
          />
          <Text
            style={[
              styles.navLabel,
              activeBottomTab === 'profile' && styles.navLabelActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
      <TutorBottomNav activeTab="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBackBtn: {
    padding: 4,
    marginRight: -4,
  },
  headerBrandBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 2,
  },
  headerProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0B1527',
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: '#EEF6FF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#CBD5E1',
  },
  cameraFloatingBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#EEF6FF',
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  socialProofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  socialProofText: {
    fontSize: 12,
    color: '#0F766E',
    fontWeight: '500',
  },
  boldProof: {
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 52,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  inputLeadingIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#0F172A',
    fontWeight: '500',
  },
  fieldHelpText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginTop: 6,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    gap: 6,
  },
  flagIcon: {
    fontSize: 16,
  },
  countryCodeText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  phoneInputContainer: {
    flex: 1,
  },
  degreeInputContainer: {
    height: 'auto',
    minHeight: 64,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  degreeIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  multilineInput: {
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  guaranteeCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 6,
    marginBottom: 24,
    gap: 12,
  },
  guaranteeShieldWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guaranteeContent: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  guaranteeText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  logoutButton: {
    backgroundColor: '#EA7A24',
    borderRadius: 26,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  editProfileButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 26,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  editProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomNav: {
    display: 'none',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 18 : 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  badgeWrap: {
    position: 'relative',
  },
  redBadge: {
    position: 'absolute',
    top: -4,
    right: -7,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  redBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  navLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 3,
  },
  navLabelActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
});