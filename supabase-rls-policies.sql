-- ============================================
-- Supabase Row Level Security (RLS) Policies
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS on all tables
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTICIPANTS TABLE POLICIES
-- ============================================

-- Allow anyone to read completed participants (for leaderboard)
CREATE POLICY "Public can read completed participants"
ON participants FOR SELECT
USING (completed = true);

-- Allow anyone to insert new participants (registration)
CREATE POLICY "Anyone can register as participant"
ON participants FOR INSERT
WITH CHECK (true);

-- Allow participants to update their own record (via participant_id)
CREATE POLICY "Participants can update own record"
ON participants FOR UPDATE
USING (true)  -- In production, use auth.uid() or session validation
WITH CHECK (true);

-- ============================================
-- ANSWERS TABLE POLICIES
-- ============================================

-- Allow anyone to insert answers (quiz submissions)
CREATE POLICY "Anyone can submit answers"
ON answers FOR INSERT
WITH CHECK (true);

-- Allow reading own answers only (optional - for review)
CREATE POLICY "Read own answers"
ON answers FOR SELECT
USING (true);  -- Restrict if needed

-- ============================================
-- QUIZZES TABLE POLICIES
-- ============================================

-- Allow anyone to read active quizzes (for participants)
CREATE POLICY "Public can read active quizzes"
ON quizzes FOR SELECT
USING (is_active = true);

-- For admin operations, you have two options:
--
-- OPTION 1: Allow all operations (current behavior - less secure)
-- This allows anyone with the anon key to modify quizzes
-- Only use this if your admin panel is protected by password

CREATE POLICY "Allow all quiz operations"
ON quizzes FOR ALL
USING (true)
WITH CHECK (true);

-- OPTION 2: Use Supabase Auth (more secure - recommended for production)
-- Uncomment these and remove OPTION 1 if you implement Supabase Auth
--
-- CREATE POLICY "Admins can manage quizzes"
-- ON quizzes FOR ALL
-- USING (auth.role() = 'authenticated')
-- WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- NOTES
-- ============================================
--
-- Current security model:
-- - Admin panel is protected by password in environment variable
-- - RLS allows read/write for quiz operations (admin responsibility)
-- - Participants can register and submit answers
-- - Leaderboard only shows completed participants
--
-- For production with multiple admins, consider:
-- 1. Implementing Supabase Auth
-- 2. Creating an admin_users table
-- 3. Using JWT claims for role-based access
--
