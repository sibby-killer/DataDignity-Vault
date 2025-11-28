-- Fix Users Table 406 Error
-- Run this in Supabase SQL Editor

CREATE POLICY IF NOT EXISTS "Anyone can read user emails"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());
