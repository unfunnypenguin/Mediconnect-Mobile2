import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { User } from 'lucide-react';

interface AvatarOption {
  id: string;
  name: string;
  color_value: string;
  gradient_value?: string;
  category: string;
}

interface AvatarSelectorProps {
  currentUser: any;
  onAvatarSelect: (avatarOption: AvatarOption) => void;
}

const AvatarSelector = ({ currentUser, onAvatarSelect }: AvatarSelectorProps) => {
  const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvatarOptions();
    if (currentUser?.selected_avatar_id) {
      setSelectedAvatarId(currentUser.selected_avatar_id);
    }
  }, [currentUser]);

  const fetchAvatarOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('avatar_options')
        .select('id, name, color_value, gradient_value, category')
        .order('category', { ascending: true });

      if (error) throw error;
      setAvatarOptions(data || []);
    } catch (error: any) {
      console.error('Error fetching avatar options:', error);
      toast.error('Failed to load avatar options');
    }
  };

  const handleAvatarSelect = async (avatar: AvatarOption) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setSelectedAvatarId(avatar.id);

      // Update the user's selected avatar in the database
      const { error } = await supabase
        .from('profiles')
        .update({ 
          selected_avatar_id: avatar.id,
          photo_url: null // Clear photo_url when selecting color avatar
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Update the local state
      onAvatarSelect(avatar);
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      toast.error('Failed to update avatar');
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

  const groupedAvatars = avatarOptions.reduce((acc, avatar) => {
    if (!acc[avatar.category]) {
      acc[avatar.category] = [];
    }
    acc[avatar.category].push(avatar);
    return acc;
  }, {} as Record<string, AvatarOption[]>);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-3">Choose Your Profile Color</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select a color or gradient for your profile avatar.
        </p>
      </div>

      {Object.entries(groupedAvatars).map(([category, avatars]) => (
        <Card key={category}>
          <CardContent className="p-3">
            <h4 className="text-md font-medium mb-2 capitalize">{category} Colors</h4>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2">
              {avatars.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => handleAvatarSelect(avatar)}
                  disabled={loading}
                  className={`relative group transition-all duration-200 rounded-full ${
                    selectedAvatarId === avatar.id 
                      ? 'ring-2 ring-primary ring-offset-2' 
                      : 'hover:ring-2 hover:ring-muted-foreground hover:ring-offset-2'
                  }`}
                  title={avatar.name}
                >
                  <Avatar className="h-14 w-14 sm:h-12 sm:w-12">
                    <div 
                      className="w-full h-full rounded-full flex items-center justify-center text-white font-medium text-lg sm:text-sm"
                      style={getAvatarStyle(avatar)}
                    >
                      {currentUser?.name ? getInitials(currentUser.name) : <User className="h-6 w-6 sm:h-5 sm:w-5" />}
                    </div>
                    <AvatarFallback>
                      <User className="h-6 w-6 sm:h-5 sm:w-5" />
                    </AvatarFallback>
                  </Avatar>
                  {selectedAvatarId === avatar.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                      <div className="w-3 h-3 bg-white rounded-full shadow-lg" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AvatarSelector;
