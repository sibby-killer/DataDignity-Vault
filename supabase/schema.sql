-- SecureVault Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  wallet_address TEXT,
  backup_key_encrypted TEXT,
  backup_key_iv TEXT,
  backup_key_salt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table
CREATE TABLE IF NOT EXISTS public.files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  salt TEXT NOT NULL,
  shared_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  recipient_id TEXT NOT NULL, -- Email for now, can be UUID later
  granted_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoke_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_owner ON public.files(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_created ON public.files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permissions_file ON public.permissions(file_id);
CREATE INDEX IF NOT EXISTS idx_permissions_recipient ON public.permissions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_permissions_status ON public.permissions(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Files policies
CREATE POLICY "Users can view own files"
  ON public.files FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own files"
  ON public.files FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own files"
  ON public.files FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own files"
  ON public.files FOR DELETE
  USING (auth.uid() = owner_id);

-- Permissions policies
CREATE POLICY "Users can view permissions for own files"
  ON public.permissions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.files WHERE id = file_id
    )
  );

CREATE POLICY "Users can grant permissions for own files"
  ON public.permissions FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM public.files WHERE id = file_id
    )
  );

CREATE POLICY "Users can revoke permissions for own files"
  ON public.permissions FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.files WHERE id = file_id
    )
  );

-- Activity logs policies
CREATE POLICY "Users can view own activity logs"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update file shared_count
CREATE OR REPLACE FUNCTION public.update_file_shared_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.files
  SET shared_count = (
    SELECT COUNT(*)
    FROM public.permissions
    WHERE file_id = NEW.file_id AND status = 'active'
  )
  WHERE id = NEW.file_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update shared_count
DROP TRIGGER IF EXISTS on_permission_change ON public.permissions;
CREATE TRIGGER on_permission_change
  AFTER INSERT OR UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_file_shared_count();
