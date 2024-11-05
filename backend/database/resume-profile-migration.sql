-- Resume & Profile Enhancement Migration
-- Date: 2025-10-30
-- Purpose: Add resume parsing, work experience, education, and certifications

-- ============================================
-- 1. Add new columns to users table
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- 2. Create experiences table (Work History)
-- ============================================

CREATE TABLE IF NOT EXISTS experiences (
  experience_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  company VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for user lookups
CREATE INDEX IF NOT EXISTS idx_experiences_user_id ON experiences(user_id);

-- ============================================
-- 3. Create education table (Academic History)
-- ============================================

CREATE TABLE IF NOT EXISTS education (
  education_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  institution VARCHAR(255) NOT NULL,
  degree VARCHAR(255),
  field_of_study VARCHAR(255),
  start_date DATE,
  end_date DATE,
  gpa VARCHAR(10),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for user lookups
CREATE INDEX IF NOT EXISTS idx_education_user_id ON education(user_id);

-- ============================================
-- 4. Create certifications table
-- ============================================

CREATE TABLE IF NOT EXISTS certifications (
  certification_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  issuing_organization VARCHAR(255),
  issue_date DATE,
  expiry_date DATE,
  credential_id VARCHAR(255),
  credential_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for user lookups
CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON certifications(user_id);

-- ============================================
-- 5. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own experiences" ON experiences;
DROP POLICY IF EXISTS "Public can view experiences of any user" ON experiences;
DROP POLICY IF EXISTS "Users can insert their own experiences" ON experiences;
DROP POLICY IF EXISTS "Users can update their own experiences" ON experiences;
DROP POLICY IF EXISTS "Users can delete their own experiences" ON experiences;

DROP POLICY IF EXISTS "Users can view their own education" ON education;
DROP POLICY IF EXISTS "Public can view education of any user" ON education;
DROP POLICY IF EXISTS "Users can insert their own education" ON education;
DROP POLICY IF EXISTS "Users can update their own education" ON education;
DROP POLICY IF EXISTS "Users can delete their own education" ON education;

DROP POLICY IF EXISTS "Users can view their own certifications" ON certifications;
DROP POLICY IF EXISTS "Public can view certifications of any user" ON certifications;
DROP POLICY IF EXISTS "Users can insert their own certifications" ON certifications;
DROP POLICY IF EXISTS "Users can update their own certifications" ON certifications;
DROP POLICY IF EXISTS "Users can delete their own certifications" ON certifications;

-- Experiences policies
CREATE POLICY "Users can view their own experiences"
  ON experiences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view experiences of any user"
  ON experiences FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own experiences"
  ON experiences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experiences"
  ON experiences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experiences"
  ON experiences FOR DELETE
  USING (auth.uid() = user_id);

-- Education policies
CREATE POLICY "Users can view their own education"
  ON education FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view education of any user"
  ON education FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own education"
  ON education FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own education"
  ON education FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own education"
  ON education FOR DELETE
  USING (auth.uid() = user_id);

-- Certifications policies
CREATE POLICY "Users can view their own certifications"
  ON certifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view certifications of any user"
  ON certifications FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own certifications"
  ON certifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certifications"
  ON certifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own certifications"
  ON certifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. Triggers for updated_at timestamps
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_experiences_updated_at ON experiences;
CREATE TRIGGER update_experiences_updated_at
    BEFORE UPDATE ON experiences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_education_updated_at ON education;
CREATE TRIGGER update_education_updated_at
    BEFORE UPDATE ON education
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_certifications_updated_at ON certifications;
CREATE TRIGGER update_certifications_updated_at
    BEFORE UPDATE ON certifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Create Supabase Storage Buckets (Run in Supabase Dashboard)
-- ============================================

-- Note: These SQL commands won't work directly, you need to create buckets via Supabase Dashboard
-- or using Supabase client library

-- Bucket: resumes (private)
-- Purpose: Store user resume PDFs
-- Access: Private with signed URLs only

-- Instructions to create bucket in Supabase Dashboard:
-- 1. Go to Storage > Create bucket
-- 2. Name: "resumes"
-- 3. Public: NO (keep private)
-- 4. File size limit: 10MB
-- 5. Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- ============================================
-- 8. Sample Data (Optional - for testing)
-- ============================================

-- Insert sample experience
-- INSERT INTO experiences (user_id, company, position, location, start_date, end_date, is_current, description)
-- VALUES (1, 'Tech Corp', 'Software Engineer', 'San Francisco, CA', '2020-01-01', '2023-12-31', false, 'Developed web applications using React and Node.js');

-- Insert sample education
-- INSERT INTO education (user_id, institution, degree, field_of_study, start_date, end_date, gpa)
-- VALUES (1, 'Stanford University', 'Bachelor of Science', 'Computer Science', '2016-09-01', '2020-06-01', '3.8');

-- Insert sample certification
-- INSERT INTO certifications (user_id, name, issuing_organization, issue_date, credential_url)
-- VALUES (1, 'AWS Certified Solutions Architect', 'Amazon Web Services', '2022-06-15', 'https://aws.amazon.com/verification');

COMMIT;
