
import React, { useState } from 'react';
import { Upload, File, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileUploadProps {
  label: string;
  fileType: 'license' | 'id' | 'profile';
  acceptedTypes: string;
  onUpload: (filePath: string) => void;
  uploadedPath?: string;
}

const FileUpload = ({ label, fileType, acceptedTypes, onUpload, uploadedPath }: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to upload files');
      }

      // Generate a unique file name to prevent conflicts
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      // Determine bucket based on file type
      let bucketName = 'doctor-documents';
      if (fileType === 'profile') {
        bucketName = 'profile-photos';
      }
      
      // Create file path with user ID folder
      const filePath = `${user.id}/${fileName}`;

      // Upload the file
      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Call the onUpload callback with the file path
      onUpload(filePath);
      toast.success('File uploaded successfully', {
        description: 'Your document has been uploaded.'
      });
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.message);
      toast.error('Upload failed', {
        description: err.message || 'There was an error uploading your file. Please try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={fileType}>{label}</Label>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          className={`relative ${uploadedPath ? 'bg-green-50' : ''}`}
          disabled={isUploading}
        >
          <input
            type="file"
            id={fileType}
            accept={acceptedTypes}
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          {uploadedPath ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              <span>Uploaded</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              <span>{isUploading ? 'Uploading...' : 'Choose file'}</span>
            </>
          )}
        </Button>
        {uploadedPath && (
          <File className="h-4 w-4 text-green-600" />
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
