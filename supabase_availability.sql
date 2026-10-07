-- ============================================================================
-- TUTORMATE: Tutor Availability Table, Permissions & RLS Policies
-- Description: Enables tutors to save and manage their availability schedules.
-- Fixes PostgreSQL Error 42501 (permission denied for table tutor_availability).
-- ============================================================================

-- 1. Create tutor_availability table
CREATE TABLE IF NOT EXISTS public.tutor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    morning_window BOOLEAN DEFAULT TRUE NOT NULL,
    afternoon_window BOOLEAN DEFAULT TRUE NOT NULL,
    evening_window BOOLEAN DEFAULT TRUE NOT NULL,
    timezone TEXT DEFAULT 'America/Los_Angeles' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_tutor_date UNIQUE (tutor_id, date)
);

-- 2. Create index for fast query lookups by tutor and date
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor_date 
    ON public.tutor_availability (tutor_id, date);

-- 3. Grant required privileges to postgres roles (Fixes Error 42501)
GRANT ALL ON TABLE public.tutor_availability TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Allow read/write access for authenticated & anon clients)
DROP POLICY IF EXISTS "Tutors can manage their own availability" ON public.tutor_availability;
DROP POLICY IF EXISTS "Anyone authenticated can view tutor availability" ON public.tutor_availability;
DROP POLICY IF EXISTS "Enable all access for tutor availability" ON public.tutor_availability;

CREATE POLICY "Enable all access for tutor availability"
    ON public.tutor_availability
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_tutor_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tutor_availability_updated_at ON public.tutor_availability;
CREATE TRIGGER trigger_tutor_availability_updated_at
    BEFORE UPDATE ON public.tutor_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_tutor_availability_updated_at();
