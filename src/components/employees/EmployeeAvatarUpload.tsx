import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, X, User } from 'lucide-react';

interface EmployeeAvatarUploadProps {
  avatarUrl: string | null;
  gender: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  onAvatarChange: (url: string | null) => void;
  disabled?: boolean;
}

// Default avatar URLs based on gender
const getDefaultAvatar = (gender: string) => {
  if (gender === 'female') {
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=female&backgroundColor=b6e3f4&accessories=blank&clothingGraphic=bear&eyebrows=default&eyes=default&facialHair=blank&hairColor=4a312c&mouth=smile&skinColor=f8d25c&top=longHairStraight';
  }
  return 'https://api.dicebear.com/7.x/avataaars/svg?seed=male&backgroundColor=c0aede&accessories=blank&clothingGraphic=bear&eyebrows=default&eyes=default&facialHair=blank&hairColor=2c1b18&mouth=smile&skinColor=edb98a&top=shortHairShortFlat';
};

export function EmployeeAvatarUpload({
  avatarUrl,
  gender,
  employeeId,
  firstName,
  lastName,
  onAvatarChange,
  disabled = false,
}: EmployeeAvatarUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = () => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase() || 'E';
  };

  const displayUrl = avatarUrl || getDefaultAvatar(gender);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, or WebP image.',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB.',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${employeeId || crypto.randomUUID()}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('employee-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('employee-avatars')
        .getPublicUrl(filePath);

      onAvatarChange(publicUrl);
      toast({ title: 'Photo uploaded successfully' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload image.',
      });
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onAvatarChange(null);
    toast({ title: 'Photo removed' });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Label className="text-center">Employee Photo</Label>
      
      <div className="relative group">
        <Avatar className="h-32 w-32 border-2 border-border">
          <AvatarImage src={displayUrl} alt={`${firstName} ${lastName}`} />
          <AvatarFallback className="text-2xl bg-muted">
            {getInitials() || <User className="h-12 w-12" />}
          </AvatarFallback>
        </Avatar>
        
        {!disabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-white hover:text-white hover:bg-white/20"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : avatarUrl ? 'Change Photo' : 'Upload Photo'}
        </Button>
        
        {avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled || uploading}
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Optional. JPG, PNG or WebP (max 2MB)
      </p>
    </div>
  );
}
