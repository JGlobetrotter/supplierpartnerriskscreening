
-- Create storage bucket for screening documents
INSERT INTO storage.buckets (id, name, public) VALUES ('screening-documents', 'screening-documents', false);

-- Users can upload to their own screening folder
CREATE POLICY "Users can upload screening documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'screening-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own screening documents
CREATE POLICY "Users can view own screening documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'screening-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own screening documents
CREATE POLICY "Users can delete own screening documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'screening-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
