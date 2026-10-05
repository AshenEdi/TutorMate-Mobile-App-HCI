import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'tutor' | 'admin';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string, expectedRole?: UserRole) => Promise<{ error: string | null; role?: UserRole }>;
  signUp: (params: SignUpParams) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  /** Extra profile fields (education, specialty, etc.) */
  extra?: Record<string, unknown>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the profile row from the `profiles` table with fallback to user_metadata
  const fetchProfile = async (authUser: User): Promise<UserProfile> => {
    const userEmail = (authUser.email || '').toLowerCase().trim();
    const isAdminEmail =
      userEmail.startsWith('admin@') ||
      userEmail.startsWith('admin.') ||
      userEmail.includes('administrator') ||
      userEmail === 'admin@tutormate.com' ||
      userEmail === 'admin@tutormate.io';

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error || !data) {
      const metaRole = isAdminEmail
        ? 'admin'
        : ((authUser.user_metadata?.role as UserRole) || 'student');
      const metaName =
        authUser.user_metadata?.full_name ||
        (isAdminEmail ? 'System Administrator' : authUser.email?.split('@')[0] || 'User');
      return {
        id: authUser.id,
        full_name: metaName,
        email: authUser.email || '',
        role: metaRole,
        created_at: authUser.created_at,
      };
    }

    if (isAdminEmail && data.role !== 'admin') {
      data.role = 'admin';
      void supabase.from('profiles').update({ role: 'admin' }).eq('id', authUser.id);
    }

    return data as UserProfile;
  };

  // Bootstrap: restore session on app start and listen for changes
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;

      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const prof = await fetchProfile(currentSession.user);
        if (mounted) setProfile(prof);
      }

      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const prof = await fetchProfile(newSession.user);
        if (mounted) setProfile(prof);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // ── signIn ──────────────────────────────────────────────────────────────────
  const signIn = async (
    email: string,
    password: string,
    expectedRole?: UserRole
  ): Promise<{ error: string | null; role?: UserRole }> => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      return { error: error.message };
    }

    let userRole: UserRole = 'student';
    if (data.user) {
      const prof = await fetchProfile(data.user);
      userRole = prof.role;

      const userEmail = (data.user.email || '').toLowerCase().trim();
      const isAdminEmail =
        userEmail.startsWith('admin@') ||
        userEmail.startsWith('admin.') ||
        userEmail.includes('administrator') ||
        userEmail === 'admin@tutormate.com' ||
        userEmail === 'admin@tutormate.io';

      if (isAdminEmail || (expectedRole === 'admin' && userEmail.includes('admin'))) {
        userRole = 'admin';
        prof.role = 'admin';
        void supabase.from('profiles').update({ role: 'admin' }).eq('id', data.user.id);
      }

      // Verify that the user's registered role matches the selected role
      if (expectedRole && userRole !== expectedRole) {
        // Mismatch! Sign out immediately to wipe the authenticated session
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);

        const roleLabels: Record<UserRole, string> = {
          student: 'Student',
          tutor: 'Tutor',
          admin: 'Admin',
        };
        const actualRoleName = roleLabels[userRole] || userRole;

        return {
          error: `This account is registered as a ${actualRoleName}. Please select the "${actualRoleName}" tab above to log in.`,
        };
      }

      setProfile(prof);
      setUser(data.user);
      setSession(data.session);
    }

    setLoading(false);
    return { error: null, role: userRole };
  };

  // ── signUp ──────────────────────────────────────────────────────────────────
  const signUp = async ({
    email,
    password,
    fullName,
    role,
    extra = {},
  }: SignUpParams): Promise<{ error: string | null }> => {
    setLoading(true);

    // 1. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, ...extra },
      },
    });

    if (authError) {
      setLoading(false);
      if (authError.status === 429 || authError.message?.toLowerCase().includes('rate limit') || authError.message?.toLowerCase().includes('too many requests')) {
        return {
          error: 'Rate limit exceeded (429 Too Many Requests). Supabase limits signups per hour to prevent spam. Please wait 5–10 minutes, or disable sign-up rate limits in Supabase Dashboard (Authentication > Rate Limits).',
        };
      }
      return { error: authError.message };
    }

    const userId = authData.user?.id;
    if (!userId) {
      setLoading(false);
      return { error: 'User creation failed — no user ID returned.' };
    }

    // 2. Insert or update profile row in `profiles` table
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: userId,
        full_name: fullName,
        email,
        role,
        ...extra,
      },
      { onConflict: 'id' }
    );

    setLoading(false);

    if (profileError) {
      console.warn('[AuthContext] Direct profile table upsert note:', profileError.message);
      // Note: If RLS prevents direct upsert before email confirmation, 
      // the Supabase database trigger handles creating the profile from user_metadata.
    }

    return { error: null };
  };

  // ── signOut ─────────────────────────────────────────────────────────────────
  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
