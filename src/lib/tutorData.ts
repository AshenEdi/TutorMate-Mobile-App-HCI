import { supabase } from '../../lib/supabase';

export interface BookingRow {
  id: string;
  booking_ref: string;
  student_id: string | null;
  tutor_id: string;
  student_name: string | null;
  tutor_name: string | null;
  subject: string;
  focus_notes: string | null;
  session_date: string;
  time_slot: string;
  duration: string | null;
  delivery_format: string | null;
  hourly_rate: number | null;
  total_price: number | null;
  status: 'pending' | 'confirmed' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ProfileSummary {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  education: string | null;
  specialty: string | null;
  hourly_rate: number | null;
}

export async function getCurrentTutorId(): Promise<string> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('You must be signed in as a tutor.');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.warn('Profile fetch warning in getCurrentTutorId:', error.message);
  }

  if (profile) {
    if (profile.role && profile.role !== 'tutor') {
      await supabase
        .from('profiles')
        .update({ role: 'tutor' })
        .eq('id', user.id);
    }
    return user.id;
  }

  // Profile record doesn't exist yet in public.profiles table -> auto-create it
  const meta = user.user_metadata || {};
  const fullName = meta.full_name || meta.name || user.email?.split('@')[0] || 'Tutor';

  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email || '',
    full_name: fullName,
    role: 'tutor',
    updated_at: new Date().toISOString(),
  });

  return user.id;
}

export async function getTutorBookings(): Promise<BookingRow[]> {
  const tutorId = await getCurrentTutorId();
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('tutor_id', tutorId)
    .order('session_date', { ascending: true })
    .order('time_slot', { ascending: true });

  if (error) throw error;
  return (data ?? []) as BookingRow[];
}

export async function getProfilesById(ids: (string | null | undefined)[]) {
  const uniqueIds = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!uniqueIds.length) return new Map<string, ProfileSummary>();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, education, specialty, hourly_rate')
    .in('id', uniqueIds);

  if (error) throw error;
  return new Map(
    ((data ?? []) as ProfileSummary[]).map((profile) => [profile.id, profile])
  );
}

export async function getOrCreateTutorConversation(studentId: string) {
  const tutorId = await getCurrentTutorId();
  const { data: existing, error: lookupError } = await supabase
    .from('conversations')
    .select('id')
    .eq('tutor_id', tutorId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ tutor_id: tutorId, student_id: studentId })
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return (data?.id || '') as string;
}

export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatBookingDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
}

export function displayBookingStatus(status: BookingRow['status']) {
  if (status === 'confirmed' || status === 'accepted') return 'Accepted';
  if (status === 'pending') return 'Pending';
  if (status === 'declined') return 'Declined';
  if (status === 'completed') return 'Completed';
  return 'Cancelled';
}
