-- Supabase SQL Schema for HUDT Audition Platform
-- Run this in Supabase Dashboard > SQL Editor

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    ref_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    level TEXT NOT NULL,
    talents TEXT[] NOT NULL DEFAULT '{}',
    instruments TEXT,
    other_talent TEXT,
    previous_experience TEXT NOT NULL DEFAULT 'No',
    experience_details TEXT,
    motivation TEXT NOT NULL,
    hopes_to_gain TEXT,
    availability TEXT[] NOT NULL DEFAULT '{}',
    audition_slot TEXT,
    status TEXT NOT NULL DEFAULT 'Submitted',
    admin_notes TEXT,
    rating INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status_history JSONB DEFAULT '[]'
);

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT REFERENCES applications(id) ON DELETE CASCADE,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT DEFAULT 'sent'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_ref_number ON applications(ref_number);
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_phone ON applications(phone);
CREATE INDEX IF NOT EXISTS idx_applications_department ON applications(department);
CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON applications(submitted_at);

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for server-side access)
CREATE POLICY "Allow all for applications" ON applications FOR ALL USING (true);
CREATE POLICY "Allow all for admins" ON admins FOR ALL USING (true);
CREATE POLICY "Allow all for email_logs" ON email_logs FOR ALL USING (true);
