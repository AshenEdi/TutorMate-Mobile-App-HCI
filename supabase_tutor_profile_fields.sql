-- Tutor profile fields used by the tutor profile editor.
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS phone_number TEXT,
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS online_video BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS in_person BOOLEAN NOT NULL DEFAULT FALSE;
