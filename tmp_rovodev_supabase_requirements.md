# 🔧 Supabase Configuration Requirements

## 📊 **Database Schema Updates Needed**

### 1. **Files Table Updates**
```sql
-- Add these columns to your existing 'files' table
ALTER TABLE files ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
ALTER TABLE files ADD COLUMN IF NOT EXISTS last_downloaded TIMESTAMPTZ;
ALTER TABLE files ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS bucket_path TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS file_format VARCHAR(10);
ALTER TABLE files ADD COLUMN IF NOT EXISTS original_format VARCHAR(10);

-- Update existing rows to set default values
UPDATE files SET download_count = 0 WHERE download_count IS NULL;
UPDATE files SET file_format = 'jpeg' WHERE file_format IS NULL;
```

### 2. **Storage Bucket Setup**
Create these storage buckets in your Supabase project:

1. **`user-files`** - For storing actual files
2. **`thumbnails`** - For storing generated thumbnails

### 3. **Storage Policies**
```sql
-- Policy for user-files bucket (authenticated users can upload)
CREATE POLICY "Users can upload their own files" ON storage.objects
FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for user-files bucket (public read access for sharing)
CREATE POLICY "Public can view shared files" ON storage.objects
FOR SELECT USING (bucket_id = 'user-files');

-- Policy for thumbnails bucket (authenticated users can upload)
CREATE POLICY "Users can upload thumbnails" ON storage.objects
FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for thumbnails bucket (public read access)
CREATE POLICY "Public can view thumbnails" ON storage.objects
FOR SELECT USING (bucket_id = 'thumbnails');
```

### 4. **Download Tracking Table**
```sql
-- Create download tracking table
CREATE TABLE IF NOT EXISTS download_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  download_timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_ip INET,
  user_agent TEXT,
  download_format VARCHAR(10)
);

-- Index for better performance
CREATE INDEX idx_download_logs_file_id ON download_logs(file_id);
CREATE INDEX idx_download_logs_timestamp ON download_logs(download_timestamp);
```

## 🔒 **Row Level Security (RLS) Updates**

### 1. **Files Table RLS**
```sql
-- Enable RLS on files table
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own files
CREATE POLICY "Users can view own files" ON files
FOR SELECT USING (auth.uid() = owner_id);

-- Policy for users to insert their own files
CREATE POLICY "Users can insert own files" ON files
FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Policy for users to update their own files
CREATE POLICY "Users can update own files" ON files
FOR UPDATE USING (auth.uid() = owner_id);

-- Policy for users to delete their own files
CREATE POLICY "Users can delete own files" ON files
FOR DELETE USING (auth.uid() = owner_id);
```

### 2. **Download Logs RLS**
```sql
-- Enable RLS on download_logs table
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;

-- Policy for users to view download logs of their files
CREATE POLICY "Users can view download logs of own files" ON download_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM files 
    WHERE files.id = download_logs.file_id 
    AND files.owner_id = auth.uid()
  )
);

-- Policy for anyone to insert download logs (for tracking)
CREATE POLICY "Anyone can insert download logs" ON download_logs
FOR INSERT WITH CHECK (true);
```

## 📁 **Storage Bucket Configuration**

### 1. **Bucket Settings**
- **user-files**: Public = false, File size limit = 50MB
- **thumbnails**: Public = true, File size limit = 5MB

### 2. **MIME Type Restrictions**
```sql
-- Add MIME type validation (optional)
CREATE OR REPLACE FUNCTION validate_file_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type NOT IN (
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mov', 'video/avi',
    'application/pdf', 'text/plain', 'application/zip'
  ) THEN
    RAISE EXCEPTION 'Unsupported file type: %', NEW.type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to files table
CREATE TRIGGER validate_file_type_trigger
  BEFORE INSERT OR UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION validate_file_type();
```

## 🔧 **Environment Variables to Add**

Add these to your `.env` file:
```env
# Supabase Storage Configuration
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://your-project.supabase.co/storage/v1
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## ⚡ **Performance Optimizations**

### 1. **Database Indexes**
```sql
-- Improve query performance
CREATE INDEX IF NOT EXISTS idx_files_owner_created ON files(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
CREATE INDEX IF NOT EXISTS idx_files_bucket_path ON files(bucket_path);
```

### 2. **Storage Optimization**
- Enable automatic image optimization in Supabase
- Set up CDN for faster file delivery
- Configure proper cache headers

## 🚀 **Next Steps After Configuration**

1. Run all SQL scripts in your Supabase SQL editor
2. Create the storage buckets manually in Supabase dashboard
3. Update environment variables
4. Test file upload/download functionality
5. Verify thumbnail generation works
6. Test download format conversion

## ⚠️ **Important Notes**

- Backup your existing data before running schema updates
- Test all policies in development first
- Monitor storage usage and set appropriate limits
- Consider implementing file scanning for security
- Set up proper monitoring and logging

**Status**: Ready for manual implementation in Supabase dashboard