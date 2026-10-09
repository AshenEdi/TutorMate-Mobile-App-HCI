-- ============================================================================
-- TUTORMATE: Admin Moderation, Disputes, Escrow, Credits & Notifications Schema
-- ============================================================================

-- 1. Extend profiles table with admin moderation fields
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS strikes_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS standing TEXT DEFAULT 'good_standing' CHECK (standing IN ('good_standing', 'warning', 'under_review', 'suspended')),
    ADD COLUMN IF NOT EXISTS session_credits INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS background_check_status TEXT DEFAULT 'verified' CHECK (background_check_status IN ('verified', 'pending', 'rejected', 'unverified'));

-- 2. Create disputes table (flexible foreign keys to allow seamless testing and guest data)
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE DEFAULT ('#DIS-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 6))),
    booking_id UUID,
    booking_ref TEXT,
    student_id UUID,
    tutor_id UUID,
    student_name TEXT,
    tutor_name TEXT,
    subject TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('urgent', 'high', 'technical', 'medium')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')) DEFAULT 'pending',
    escrow_amount NUMERIC(10, 2) DEFAULT 0.00,
    reason TEXT NOT NULL,
    category TEXT DEFAULT 'Session Quality',
    student_statement TEXT,
    student_attachment_url TEXT,
    tutor_statement TEXT,
    system_audit_log JSONB DEFAULT '{}'::jsonb,
    decision TEXT CHECK (decision IN ('full_refund', 'reschedule', 'partial_refund', 'dismiss', NULL)),
    refund_amount NUMERIC(10, 2) DEFAULT 0.00,
    resolution_notes TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    auto_escalate_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 hours'),
);

ALTER TABLE public.disputes DROP CONSTRAINT IF EXISTS disputes_resolved_by_fkey;
ALTER TABLE public.disputes DROP CONSTRAINT IF EXISTS fk_disputes_resolved_by;

-- 3. Create moderation flags table (safety filter / chat flags)
CREATE TABLE IF NOT EXISTS public.moderation_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE DEFAULT ('#CHT-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 6))),
    flagged_user_id UUID,
    flagged_user_name TEXT,
    counterpart_id UUID,
    subject TEXT DEFAULT 'Safety Filter',
    flag_type TEXT CHECK (flag_type IN ('payment_bypass', 'harassment', 'safety', 'inactivity', 'technical')) DEFAULT 'payment_bypass',
    message_content TEXT,
    callout_description TEXT,
    priority TEXT CHECK (priority IN ('urgent', 'high', 'medium')) DEFAULT 'high',
    status TEXT CHECK (status IN ('active', 'warning_issued', 'dismissed', 'suspended')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Create moderation actions table (audit trail for strikes/warnings/credits)
CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    admin_id UUID,
    dispute_id UUID,
    action_type TEXT CHECK (action_type IN ('warning', 'strike', 'suspension', 'unsuspension', 'credit', 'dismissal')) NOT NULL,
    reason TEXT NOT NULL,
    amount NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.moderation_actions DROP CONSTRAINT IF EXISTS moderation_actions_admin_id_fkey;
ALTER TABLE public.moderation_actions DROP CONSTRAINT IF EXISTS fk_moderation_actions_admin_id;

-- 5. Create session credits table
CREATE TABLE IF NOT EXISTS public.session_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID,
    dispute_id UUID,
    duration_minutes INT DEFAULT 30,
    status TEXT CHECK (status IN ('available', 'used', 'expired')) DEFAULT 'available',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    used_at TIMESTAMPTZ
);

-- 6. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    role TEXT CHECK (role IN ('student', 'tutor', 'admin')) DEFAULT 'student',
    type TEXT CHECK (type IN ('session', 'message', 'wallet', 'booking', 'material', 'review', 'dispute', 'moderation')) DEFAULT 'dispute',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    highlight_text TEXT,
    is_unread BOOLEAN DEFAULT TRUE,
    category TEXT DEFAULT 'Reminders',
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Create reports and reviews tables (if not already existing)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID,
    tutor_id UUID,
    category TEXT,
    rating INT DEFAULT 5,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID,
    student_id UUID,
    rating INT DEFAULT 5,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Create Indexes
CREATE INDEX IF NOT EXISTS idx_disputes_student_id ON public.disputes (student_id);
CREATE INDEX IF NOT EXISTS idx_disputes_tutor_id ON public.disputes (tutor_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes (status);
CREATE INDEX IF NOT EXISTS idx_disputes_booking_id ON public.disputes (booking_id);
CREATE INDEX IF NOT EXISTS idx_moderation_flags_status ON public.moderation_flags (status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (user_id, is_unread);

-- 9. Enable Row Level Security
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies
-- Disputes:
DROP POLICY IF EXISTS "Disputes access policy" ON public.disputes;
DROP POLICY IF EXISTS "Disputes select policy" ON public.disputes;
DROP POLICY IF EXISTS "Disputes insert policy" ON public.disputes;
DROP POLICY IF EXISTS "Disputes update policy" ON public.disputes;

CREATE POLICY "Disputes select policy" ON public.disputes
    FOR SELECT TO authenticated, anon
    USING (true);

CREATE POLICY "Disputes insert policy" ON public.disputes
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "Disputes update policy" ON public.disputes
    FOR UPDATE TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Moderation Flags:
DROP POLICY IF EXISTS "Moderation flags access policy" ON public.moderation_flags;
CREATE POLICY "Moderation flags access policy" ON public.moderation_flags
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Session Credits:
DROP POLICY IF EXISTS "Session credits access policy" ON public.session_credits;
CREATE POLICY "Session credits access policy" ON public.session_credits
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Notifications:
DROP POLICY IF EXISTS "Notifications access policy" ON public.notifications;
CREATE POLICY "Notifications access policy" ON public.notifications
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Reports & Reviews:
DROP POLICY IF EXISTS "Reports access policy" ON public.reports;
CREATE POLICY "Reports access policy" ON public.reports
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Reviews access policy" ON public.reviews;
CREATE POLICY "Reviews access policy" ON public.reviews
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- 11. Grant Table Permissions to Supabase API Roles (Required for Supabase Client Access)
GRANT ALL ON TABLE public.disputes TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.moderation_flags TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.moderation_actions TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.session_credits TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.notifications TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.reports TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.reviews TO authenticated, anon, service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;

-- 12. Cleanup default starter moderation flags if present
DELETE FROM public.moderation_flags WHERE code IN ('#CHT-8821', '#CHT-4419');





