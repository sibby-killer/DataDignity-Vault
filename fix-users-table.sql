-- Fix Users Table 406 Error
-- Run this in Supabase SQL Editor

-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can read user emails" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create new policies
CREATE POLICY "Anyone can read user emails"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());
