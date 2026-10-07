import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { TutorBottomNav } from '../../components/TutorBottomNav';
import { supabase } from '../../../lib/supabase';

interface EditProfileFormData {
  fullName: string;
  email: string;
  isEmailVerified: boolean;
  phoneNumber: string;
  degreeCredentials: string;
  location: string;
  onlineVideo: boolean;
  inPerson: boolean;
  bio: string;
  hourlyRate: string;
  avatarUrl: string;
}

const STORAGE_KEY = '@tutormate_tutor_edit_profile';

export default function EditProfileScreen() {
  const router = useRouter();
  // Form State initialized matching the screenshot
  const [formData, setFormData] = useState<EditProfileFormData>({
    fullName: 'Dr. Evelyn Vance, Ph.D.',
    email: 'evelyn.vance@stanford.edu',
    isEmailVerified: true,
    phoneNumber: '+1 (555) 438–9210',
    degreeCredentials: 'Ph.D. in Applied Mathematics, Stanford',
    location: 'Palo Alto, California (PST)',
    onlineVideo: true,
    inPerson: true,
    bio: 'Passionate calculus & physics tutor with 6+ years of experience helping college and high school students excel in STEM. I emphasize intuitive visual problem-solving and gentle patience.',
    hourlyRate: '75',
    avatarUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  });

  const [saving, setSaving] = useState(false);

  // Load saved draft/profile from AsyncStorage on initial render
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setFormData(JSON.parse(stored));
        }
      } catch (err) {
        console.warn('Failed to load profile draft from AsyncStorage:', err);
      }
    })();
  }, []);

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      // Persist to local storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      await AsyncStorage.setItem('@tutormate_tutor_profile', JSON.stringify({
        fullName: formData.fullName,
        email: formData.email,
        degree: formData.degreeCredentials,
        locationTimezone: formData.location,
        avatarUrl: formData.avatarUrl,
        phoneNumber: formData.phoneNumber,
        countryCode: '+1',
      }));

      // Supabase integration
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: formData.fullName,
          email: formData.email,
          phone_number: formData.phoneNumber,
          education: formData.degreeCredentials,
          degree: formData.degreeCredentials,
          location: formData.location,
          bio: formData.bio,
          hourly_rate: Number(formData.hourlyRate) || 75,
          avatar_url: formData.avatarUrl,
          role: 'tutor',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      }

      router.replace('/(tutor)/TutorProfile');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Unable to save profile changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewProfile = () => {
    Alert.alert('Preview', 'Navigating to public tutor profile preview...');
  };

  const handleChangePhoto = () => {
    Alert.alert('Change Photo', 'Select image from Gallery or take a Camera snapshot.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* --- Top App Header --- */}
      <View style={styles.header}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity activeOpacity={0.7} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerBrandBadge}>
            <Ionicons name="book" size={19} color="#FFFFFF" />
          </View>

          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <TouchableOpacity activeOpacity={0.7} style={styles.headerProfileBtn}>
          <Ionicons name="person" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Top Context Banner --- */}
        <View style={styles.contextRow}>
          <View style={styles.contextLeft}>
            <View style={styles.contextIconWrap}>
              <Ionicons name="school" size={16} color="#0D9488" />
            </View>
            <Text style={styles.contextText}>Tutor Account Settings</Text>
          </View>

          <TouchableOpacity activeOpacity={0.7} style={styles.moreOptionsBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* --- Photo Section --- */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: formData.avatarUrl }} style={styles.avatarImage} />
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.cameraIconBtn}
              onPress={handleChangePhoto}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.changePhotoBtn}
            onPress={handleChangePhoto}
          >
            <Text style={styles.changePhotoText}>Change Photo</Text>
            <Feather name="arrow-right-circle" size={15} color="#2563EB" />
          </TouchableOpacity>
          <Text style={styles.photoFormatHint}>JPG, PNG or WEBP • Max 5MB</Text>
        </View>

        {/* --- Profile Strength Card --- */}
        <View style={styles.strengthCard}>
          <View style={styles.strengthTopRow}>
            <View style={styles.strengthTitleGroup}>
              <Ionicons name="shield-checkmark" size={18} color="#2563EB" />
              <Text style={styles.strengthTitle}>Profile Strength: 92%</Text>
            </View>
            <View style={styles.readyBadge}>
              <Text style={styles.readyBadgeText}>Almost Ready</Text>
            </View>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '92%' }]} />
          </View>

          <Text style={styles.strengthSubtitle}>
            Complete your bio details to rank higher in student search results.
          </Text>
        </View>

        {/* --- Full Name --- */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <Text style={styles.labelMetaText}>Required</Text>
          </View>
          <View style={styles.inputContainer}>
            <Feather name="user" size={18} color="#475569" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              placeholder="Full Name"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* --- Email Address --- */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Feather name="mail" size={18} color="#475569" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Email Address"
              placeholderTextColor="#94A3B8"
            />
            {formData.isEmailVerified && (
              <View style={styles.verifiedTag}>
                <Ionicons name="checkmark-circle" size={14} color="#2563EB" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* --- Phone Number --- */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <Text style={styles.labelMetaText}>SMS Reminders</Text>
          </View>
          <View style={styles.inputContainer}>
            <Feather name="phone" size={18} color="#475569" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
              keyboardType="phone-pad"
              placeholder="+1 (555) 000-0000"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* --- Degree & Credentials --- */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Degree & Credentials</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="school-outline" size={19} color="#475569" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={formData.degreeCredentials}
              onChangeText={(text) => setFormData({ ...formData, degreeCredentials: text })}
              placeholder="Degree and institution"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* --- Location & Delivery Mode --- */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Location & Delivery Mode</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={19} color="#475569" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="City, State / Timezone"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Delivery Mode Toggle Buttons */}
          <View style={styles.deliveryRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.deliveryPill}
              onPress={() => setFormData({ ...formData, onlineVideo: !formData.onlineVideo })}
            >
              <View
                style={[
                  styles.checkboxBox,
                  formData.onlineVideo && styles.checkboxBoxSelected,
                ]}
              >
                {formData.onlineVideo && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
              <Ionicons name="videocam-outline" size={17} color="#2563EB" style={styles.modeIcon} />
              <Text style={styles.deliveryPillText}>Online Video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.deliveryPill}
              onPress={() => setFormData({ ...formData, inPerson: !formData.inPerson })}
            >
              <View
                style={[
                  styles.checkboxBox,
                  formData.inPerson && styles.checkboxBoxSelected,
                ]}
              >
                {formData.inPerson && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
              <Ionicons name="people-outline" size={17} color="#2563EB" style={styles.modeIcon} />
              <Text style={styles.deliveryPillText}>In-Person</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Bio & Teaching Philosophy --- */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <View style={styles.bioLabelWithIcon}>
              <Ionicons name="document-text-outline" size={16} color="#0F172A" />
              <Text style={styles.fieldLabel}>Bio & Teaching Philosophy</Text>
            </View>
            <Text style={styles.charCountText}>{formData.bio.length} / 500</Text>
          </View>

          <View style={styles.bioContainer}>
            <TextInput
              style={styles.bioTextInput}
              value={formData.bio}
              onChangeText={(text) => {
                if (text.length <= 500) {
                  setFormData({ ...formData, bio: text });
                }
              }}
              multiline
              textAlignVertical="top"
              placeholder="Introduce your background, philosophy, and expertise..."
              placeholderTextColor="#94A3B8"
            />
          </View>
          <Text style={styles.bioTipText}>
            Tip: Mention specific exams you specialize in (AP Calculus, SAT Math, GRE Physics).
          </Text>
        </View>

        {/* --- Hourly Rate Card --- */}
        <View style={styles.rateCard}>
          <View style={styles.rateLeft}>
            <View style={styles.rateIconWrap}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.rateTitle}>Hourly Rate</Text>
              <Text style={styles.rateSubtitle}>Shown on student search cards</Text>
            </View>
          </View>

          <View style={styles.rateValueBadge}>
            <Text style={styles.rateDollarSign}>$</Text>
            <TextInput
              style={styles.rateAmountInput}
              value={formData.hourlyRate}
              onChangeText={(text) => setFormData({ ...formData, hourlyRate: text })}
              keyboardType="numeric"
              maxLength={4}
            />
            <Text style={styles.ratePerHr}>/ hr</Text>
          </View>
        </View>

        {/* --- Primary Buttons --- */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.saveButton}
          onPress={handleSaveChanges}
          disabled={saving}
        >
          <Feather name="save" size={18} color="#FFFFFF" style={styles.saveBtnIcon} />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.previewButton}
          onPress={handlePreviewProfile}
        >
          <Ionicons name="eye-outline" size={19} color="#1D4ED8" style={styles.previewBtnIcon} />
          <Text style={styles.previewButtonText}>Preview Public Profile</Text>
        </TouchableOpacity>
      </ScrollView>
      <TutorBottomNav activeTab="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFCFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    paddingBottom: 12,
    backgroundColor: '#FAFCFF',
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
    paddingBottom: 40,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  contextLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contextIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  moreOptionsBtn: {
    padding: 4,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarImage: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#E2E8F0',
  },
  cameraIconBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  changePhotoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  photoFormatHint: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  strengthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  strengthTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  strengthTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strengthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  readyBadge: {
    backgroundColor: '#CCFBF1',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  readyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1D4ED8',
    borderRadius: 4,
  },
  strengthSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bioLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  labelMetaText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  charCountText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
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
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  deliveryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  deliveryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 8,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxSelected: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  modeIcon: {
    marginLeft: 2,
  },
  deliveryPillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  bioContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    minHeight: 140,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  bioTextInput: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    fontWeight: '400',
  },
  bioTipText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 8,
  },
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 28,
  },
  rateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rateIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  rateSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  rateValueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rateDollarSign: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  rateAmountInput: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1D4ED8',
    paddingHorizontal: 2,
    minWidth: 26,
  },
  ratePerHr: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginLeft: 2,
  },
  saveButton: {
    backgroundColor: '#0252D4',
    borderRadius: 26,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#0252D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  previewButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 10,
  },
  previewBtnIcon: {
    marginRight: 6,
  },
  previewButtonText: {
    color: '#1D4ED8',
    fontSize: 15,
    fontWeight: '700',
  },
});