import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileText, Loader2 } from 'lucide-react';

interface Props {
  screeningId: string | null;
  stepKey: string;
  files: string[];
  onFilesChange: (files: string[]) => void;
}

const FileUpload = ({ screeningId, stepKey, files, onFilesChange }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || !user) return;

    setUploading(true);
    const newFiles = [...files];

    for (const file of Array.from(selected)) {
      const path = `${user.id}/${stepKey}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('screening-documents')
        .upload(path, file);

      if (error) {
        toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      } else {
        newFiles.push(path);
      }
    }

    onFilesChange(newFiles);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = async (path: string) => {
    await supabase.storage.from('screening-documents').remove([path]);
    onFilesChange(files.filter(f => f !== path));
  };

  const getFileName = (path: string) => {
    const parts = path.split('/');
    const name = parts[parts.length - 1];
    // Remove timestamp prefix
    return name.replace(/^\d+-/, '');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-1 h-4 w-4" />
          )}
          Upload Supporting Documents
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
          onChange={upload}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(path => (
            <div
              key={path}
              className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{getFileName(path)}</span>
              </div>
              <button
                onClick={() => remove(path)}
                className="ml-2 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
