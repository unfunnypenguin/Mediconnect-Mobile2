import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, User } from 'lucide-react';
import { toast } from 'sonner';
import AvatarSelector from './AvatarSelector';

interface AvatarOption {
  id: string;
  name: string;
  color_value: string;
  gradient_value?: string;
  category: string;
}

const ProfileSettings = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption | null>(null);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    photo_url: '',
    selected_avatar_id: null
  });

  useEffect(() => {
    if (currentUser) {
      setProfile({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        email: currentUser.email || '',
        photo_url: currentUser.photo_url || '',
        selected_avatar_id: currentUser.selected_avatar_id || null
      });
      
      // Fetch the selected avatar details if available
      if (currentUser.selected_avatar_id) {
        fetchSelectedAvatar(currentUser.selected_avatar_id);
      }
    }
  }, [currentUser]);

  const fetchSelectedAvatar = async (avatarId: string) => {
    try {
      const { data, error } = await supabase
        .from('avatar_options')
        .select('id, name, color_value, gradient_value, category')
        .eq('id', avatarId)
        .single();

      if (error) throw error;
      setSelectedAvatar(data);
    } catch (error: any) {
      console.error('Error fetching selected avatar:', error);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      setLoading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          photo_url: publicUrl,
          selected_avatar_id: null // Clear avatar selection when uploading custom photo
        })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ 
        ...prev, 
        photo_url: publicUrl,
        selected_avatar_id: null
      }));
      setSelectedAvatar(null);
      toast.success('Profile photo updated successfully');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (avatarOption: AvatarOption) => {
    setSelectedAvatar(avatarOption);
    setProfile(prev => ({ 
      ...prev, 
      photo_url: '',
      selected_avatar_id: avatarOption.id
    }));
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          name: `${profile.first_name} ${profile.last_name}`.trim()
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvatarStyle = (avatar: AvatarOption) => {
    if (avatar.gradient_value) {
      return { background: avatar.gradient_value };
    }
    return { backgroundColor: avatar.color_value };
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to view your profile settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Update your personal information and profile appearance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="profile" className="text-sm">Profile Info</TabsTrigger>
              <TabsTrigger value="avatar" className="text-sm">Profile Color</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Avatar className="h-24 w-24 sm:h-20 sm:w-20">
                  {profile.photo_url ? (
                    <AvatarImage src={profile.photo_url} alt="Profile" />
                  ) : selectedAvatar ? (
                    <div 
                      className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-2xl sm:text-xl"
                      style={getAvatarStyle(selectedAvatar)}
                    >
                      {currentUser?.name ? getInitials(currentUser.name) : <User className="h-10 w-10 sm:h-8 sm:w-8" />}
                    </div>
                  ) : (
                    <AvatarFallback>
                      <User className="h-10 w-10 sm:h-8 sm:w-8" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col items-center sm:items-start">
                  <Button
                    type="button"
                    variant="outline"
                    className="relative w-full sm:w-auto h-9 px-3.5"
                    disabled={loading}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={loading}
                    />
                    <Upload className="h-4 w-4 mr-2" />
                    {loading ? 'Uploading...' : 'Upload Custom Photo'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center sm:text-left">
                    Upload your own photo or choose a color from the Profile Color tab
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={profile.first_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profile.last_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Email cannot be changed from this interface.
                </p>
              </div>

              <Button onClick={handleSave} disabled={loading} className="w-full">
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </TabsContent>

            <TabsContent value="avatar" className="space-y-6">
              <AvatarSelector 
                currentUser={currentUser} 
                onAvatarSelect={handleAvatarSelect}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;
