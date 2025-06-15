
import { supabase } from '@/integrations/supabase/client';

// Simple admin authentication utility
export const ADMIN_CREDENTIALS = {
  email: 'admin@mediconnect.com',
  password: '@$Medi.Connect.2025x'
};

export const verifyAdminCredentials = (email: string, password: string): boolean => {
  return email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
};

export const setAdminSession = async () => {
  try {
    // Actually sign in the admin user with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password
    });

    if (error) {
      console.error('Error signing in admin:', error);
      // Fallback to session storage for backward compatibility
      sessionStorage.setItem('adminAuthenticated', 'true');
      sessionStorage.setItem('adminEmail', ADMIN_CREDENTIALS.email);
      return false;
    }

    // Set session storage as well for compatibility
    sessionStorage.setItem('adminAuthenticated', 'true');
    sessionStorage.setItem('adminEmail', ADMIN_CREDENTIALS.email);
    return true;
  } catch (error) {
    console.error('Error in setAdminSession:', error);
    // Fallback to session storage
    sessionStorage.setItem('adminAuthenticated', 'true');
    sessionStorage.setItem('adminEmail', ADMIN_CREDENTIALS.email);
    return false;
  }
};

export const clearAdminSession = async () => {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error signing out admin:', error);
  }
  
  sessionStorage.removeItem('adminAuthenticated');
  sessionStorage.removeItem('adminEmail');
};

export const isAdminAuthenticated = (): boolean => {
  return sessionStorage.getItem('adminAuthenticated') === 'true';
};

// Synchronous version for immediate use (returns mock admin)
export const getAdminUser = () => {
  if (!isAdminAuthenticated()) return null;
  
  // Return the actual database admin ID for immediate use
  return {
    id: 'd55a36b6-1779-430b-bb82-41af35c7f375', // Use the actual database admin ID
    email: ADMIN_CREDENTIALS.email,
    name: 'MediConnect Admin',
    role: 'admin' as const,
    dateCreated: new Date(),
    firstName: 'MediConnect',
    lastName: 'Admin',
    first_name: 'MediConnect',
    last_name: 'Admin',
    photoURL: null,
    photo_url: null,
    bio: null
  };
};

// Async version for database operations - now returns the actual database admin
export const getAdminUserFromDatabase = async () => {
  if (!isAdminAuthenticated()) return null;
  
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Get the actual admin profile from the database using the fixed admin ID
    const { data: adminProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', 'd55a36b6-1779-430b-bb82-41af35c7f375')
      .eq('role', 'admin')
      .single();
    
    if (adminProfile && !error) {
      return {
        id: adminProfile.id,
        email: adminProfile.email,
        name: adminProfile.name || 'MediConnect Admin',
        role: 'admin' as const,
        dateCreated: new Date(adminProfile.date_created),
        firstName: adminProfile.first_name || 'MediConnect',
        lastName: adminProfile.last_name || 'Admin',
        first_name: adminProfile.first_name || 'MediConnect',
        last_name: adminProfile.last_name || 'Admin',
        photoURL: adminProfile.photo_url,
        photo_url: adminProfile.photo_url,
        bio: adminProfile.bio
      };
    }
  } catch (error) {
    console.warn('Could not fetch admin profile from database:', error);
  }
  
  // Fallback to the session admin with the correct database ID
  return getAdminUser();
};
