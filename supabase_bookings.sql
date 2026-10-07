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

-- 3. Grant required privileges to postgres roles
GRANT ALL ON TABLE public.bookings TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Allow access for authenticated & anon clients)
DROP POLICY IF EXISTS "Enable all access for bookings" ON public.bookings;

CREATE POLICY "Enable all access for bookings"
    ON public.bookings
    FOR ALL
    USING (true)
    WITH CHECK (true);

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
