-- Create applicant-documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('applicant-documents', 'applicant-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated downloads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletions" ON storage.objects;

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'applicant-documents');

-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated downloads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'applicant-documents');

-- Allow public access to view files (for document viewing)
CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'applicant-documents');

-- Allow authenticated users to update files
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
WITH CHECK (bucket_id = 'applicant-documents');

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletions"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'applicant-documents');
