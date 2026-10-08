-- ============================================================================
-- TUTORMATE: Session Bookings Table, Permissions & RLS Policies
-- Description: Stores session booking details between students and tutors.
-- ============================================================================

-- 1. Create bookings table (flexible UUID identifiers to prevent foreign key errors)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_ref TEXT NOT NULL DEFAULT ('TM-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 6))),
    student_id UUID,
    tutor_id UUID NOT NULL,
    student_name TEXT,
    tutor_name TEXT,
    subject TEXT NOT NULL,
    focus_notes TEXT,
    session_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    duration TEXT DEFAULT '60m',
    delivery_format TEXT DEFAULT 'whiteboard',
    hourly_rate NUMERIC DEFAULT 45,
    total_price NUMERIC DEFAULT 45,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'accepted', 'declined', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create indexes for fast query lookups by tutor, student, date, and status
CREATE INDEX IF NOT EXISTS idx_bookings_tutor_id 
    ON public.bookings (tutor_id);

CREATE INDEX IF NOT EXISTS idx_bookings_student_id 
    ON public.bookings (student_id);

CREATE INDEX IF NOT EXISTS idx_bookings_tutor_date 
    ON public.bookings (tutor_id, session_date);

CREATE INDEX IF NOT EXISTS idx_bookings_status 
    ON public.bookings (status);

-- 3. Grant only the operations used by authenticated clients.
REVOKE ALL ON TABLE public.bookings FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.bookings TO authenticated;
GRANT UPDATE (status, updated_at) ON TABLE public.bookings TO authenticated;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (limit booking access to its student and tutor)
DROP POLICY IF EXISTS "Enable all access for bookings" ON public.bookings;
DROP POLICY IF EXISTS "Booking participants can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Students can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Tutors can update booking status" ON public.bookings;

CREATE POLICY "Booking participants can view bookings"
    ON public.bookings
    FOR SELECT TO authenticated
    USING (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Students can create bookings"
    ON public.bookings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Tutors can update booking status"
    ON public.bookings
    FOR UPDATE TO authenticated
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

-- 6. Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bookings_updated_at ON public.bookings;
CREATE TRIGGER trigger_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_bookings_updated_at();
