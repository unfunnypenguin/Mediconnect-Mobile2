import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, AuthError, Session } from '@supabase/supabase-js';
import { User, Doctor, Patient, UserRole, HealthcareInstitution } from '@/lib/types';
import { toast } from 'sonner';
import { verifyAdminCredentials, setAdminSession, clearAdminSession, isAdminAuthenticated, getAdminUser } from '@/utils/adminAuth';

interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string, role: UserRole) => Promise<{ user: User }>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  register: (userData: Partial<User> & { role: UserRole }, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Setup auth state change listener first!
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        // Defer full profile fetch so we update user after session is known
        setTimeout(() => {
          fetchUserProfile(nextSession.user);
        }, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // On mount, check for an existing session immediately
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user) {
        fetchUserProfile(initialSession.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User> => {
    const fetchTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
    );

    try {
      console.log('🔄 Starting fetchUserProfile for:', authUser.id);
      setLoading(true);
      
      // Race between actual fetch and timeout
      const result = await Promise.race([
        performProfileFetch(authUser),
        fetchTimeout
      ]);

      return result as User;
    } catch (error) {
      console.error('💥 Critical error in fetchUserProfile:', error);
      setLoading(false);
      
      // Set a basic user profile if detailed fetch fails
      const basicUser: User = {
        id: authUser.id,
        email: authUser.email!,
        role: 'patient' as UserRole,
        name: authUser.email!,
        dateCreated: new Date(authUser.created_at || Date.now()),
      };
      
      console.log('🔄 Setting basic user profile as fallback:', basicUser);
      setUser(basicUser);
      return basicUser;
    }
  };

  const performProfileFetch = async (authUser: SupabaseUser): Promise<User> => {
    console.log('📋 Fetching basic profile...');
    
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          avatar_options!selected_avatar_id(
            id,
            name,
            color_value,
            gradient_value,
            category
          )
        `)
        .eq('id', authUser.id)
        .single();

      console.log('📋 Profile query completed:', { profileData, profileError });

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      if (!profileData) {
        console.error('❌ No profile data found');
        throw new Error('User profile not found');
      }

      console.log('✅ Profile data fetched:', profileData);

      let doctorProfile: Doctor | undefined = undefined;
      let patientProfile: Patient | undefined = undefined;

      // If user is a doctor, fetch additional doctor profile information
      if (profileData.role === 'doctor') {
        console.log('👨‍⚕️ Fetching doctor profile...');
        try {
          const { data: doctorData, error: doctorError } = await supabase
            .from('doctor_profiles')
            .select(`
              *,
              healthcare_institutions!fk_doctor_profiles_institution_id(*)
            `)
            .eq('doctor_id', authUser.id)
            .maybeSingle();

          console.log('👨‍⚕️ Doctor query completed:', { doctorData, doctorError });

          if (doctorError) {
            console.error('⚠️ Doctor profile fetch error (non-fatal):', doctorError);
          } else if (doctorData) {
            console.log('✅ Doctor profile fetched:', doctorData);
            const institution: HealthcareInstitution | undefined = doctorData.healthcare_institutions ? {
              id: doctorData.healthcare_institutions.id,
              name: doctorData.healthcare_institutions.name,
              address: doctorData.healthcare_institutions.address,
              type: doctorData.healthcare_institutions.type as 'hospital' | 'clinic' | 'pharmacy',
              province: doctorData.healthcare_institutions.province,
            } : undefined;

            doctorProfile = {
              ...profileData,
              dateCreated: new Date(authUser.created_at || Date.now()),
              role: 'doctor',
              specialty: doctorData.specialty,
              licenseNumber: doctorData.license_number,
              nrc_number: doctorData.nrc_number,
              verificationStatus: doctorData.verification_status as 'pending' | 'approved' | 'rejected',
              qualifications: doctorData.qualifications,
              institution: institution,
              verification_notes: doctorData.verification_notes
            };
          } else {
            console.log('ℹ️ No doctor profile found');
          }
        } catch (docError) {
          console.error('⚠️ Doctor profile fetch failed (continuing with basic profile):', docError);
        }
      }

      // If user is a patient, fetch additional patient profile information
      if (profileData.role === 'patient') {
        console.log('🤒 Fetching patient profile...');
        try {
          const { data: patientData, error: patientError } = await supabase
            .from('patient_profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          console.log('🤒 Patient query completed:', { patientData, patientError });

          if (patientError) {
            console.error('⚠️ Patient profile fetch error (non-fatal):', patientError);
          } else if (patientData) {
            console.log('✅ Patient profile fetched:', patientData);
            patientProfile = {
              ...profileData,
              dateCreated: new Date(authUser.created_at || Date.now()),
              role: 'patient',
              dateOfBirth: patientData.date_of_birth,
              gender: patientData.gender,
              hivStatus: patientData.hiv_status,
              allergies: patientData.allergies || [],
              medicalHistory: patientData.medical_history,
              emergencyContact: patientData.emergency_contact_name ? {
                name: patientData.emergency_contact_name,
                relationship: patientData.emergency_contact_relationship,
                phone: patientData.emergency_contact_phone
              } : undefined,
            };
          } else {
            console.log('ℹ️ No patient profile found');
          }
        } catch (patError) {
          console.error('⚠️ Patient profile fetch failed (continuing with basic profile):', patError);
        }
      }

      const fetchedUser: User = {
        id: authUser.id,
        email: authUser.email!,
        role: profileData.role as UserRole,
        name: profileData.name,
        firstName: profileData.first_name,
        lastName: profileData.last_name,
        photoURL: profileData.photo_url,
        photo_url: profileData.photo_url,
        bio: profileData.bio,
        selected_avatar_id: profileData.selected_avatar_id,
        dateCreated: new Date(authUser.created_at || Date.now()),
        ...(doctorProfile && {
          specialty: doctorProfile.specialty,
          licenseNumber: doctorProfile.licenseNumber,
          nrc_number: doctorProfile.nrc_number,
          institution: doctorProfile.institution,
          verificationStatus: doctorProfile.verificationStatus,
          verification_notes: doctorProfile.verification_notes
        }),
        ...(patientProfile && {
          dateOfBirth: patientProfile.dateOfBirth,
          gender: patientProfile.gender,
          hivStatus: patientProfile.hivStatus,
          medicalHistory: patientProfile.medicalHistory,
          allergies: patientProfile.allergies,
          emergencyContact: patientProfile.emergencyContact,
        })
      };

      console.log('🎉 User profile completely fetched and setting user state...');
      setUser(fetchedUser);
      setLoading(false);
      console.log('✅ User state set, loading disabled. Final user:', fetchedUser);
      return fetchedUser;

    } catch (error) {
      console.error('💥 Error in performProfileFetch:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return;
  };

  const login = async (email: string, password: string, role: UserRole) => {
    console.log('🚀 Login attempt:', { email, role });
    
    try {
      // Special handling for admin login with simplified auth
      if (role === 'admin') {
        console.log('🔐 Admin login detected, processing...');
        
        if (!verifyAdminCredentials(email, password)) {
          console.error('❌ Invalid admin credentials provided');
          throw new Error('Invalid administrator credentials');
        }

        console.log('✅ Admin credentials verified, setting session...');
        const sessionSuccess = await setAdminSession();
        
        // Create admin user object immediately after setting session
        const adminUser: User = {
          id: 'd55a36b6-1779-430b-bb82-41af35c7f375',
          email: email,
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

        setUser(adminUser);
        setLoading(false);
        console.log('✅ Admin login successful:', adminUser);
        return { user: adminUser };
      }

      // Regular user login through Supabase auth
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        setLoading(false);
        throw error;
      }

      console.log('Auth successful, user ID:', data.user.id);

      if (data.user) {
        // First fetch the user profile to get the actual role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile for role check:', profileError);
          await supabase.auth.signOut();
          setLoading(false);
          throw new Error('User profile not found. Please contact support.');
        }
        
        console.log('Profile role:', profile.role, 'Requested role:', role);
        
        // CRITICAL FIX: Check if the user's actual role matches the requested login role
        if (profile.role !== role) {
          await supabase.auth.signOut();
          setLoading(false);
          throw new Error(`Access denied. This account is registered as ${profile.role}, not ${role}.`);
        }
        
        // Now fetch the complete user profile
        const fetchedUser = await fetchUserProfile(data.user);
        
        // Additional verification for doctors
        if (role === 'doctor') {
          const { data: doctorProfileData, error: doctorError } = await supabase
            .from('doctor_profiles')
            .select('verification_status, verification_notes')
            .eq('doctor_id', data.user.id)
            .single();
            
          if (doctorError) {
            console.error('Error fetching doctor verification status:', doctorError);
            setLoading(false);
            throw new Error('Failed to verify doctor account status');
          }
          
          if (!doctorProfileData) {
            setLoading(false);
            throw new Error('Doctor profile not found. Please contact support.');
          }
          
          if (doctorProfileData.verification_status === 'pending') {
            await supabase.auth.signOut();
            setLoading(false);
            throw new Error('Your account is pending approval by the MediConnect admin. Please wait for verification.');
          }
          
          if (doctorProfileData.verification_status === 'rejected') {
            await supabase.auth.signOut();
            setLoading(false);
            const reason = doctorProfileData.verification_notes 
              ? `: ${doctorProfileData.verification_notes}` 
              : '. Please contact support for details.';
            throw new Error(`Your application has been declined${reason}`);
          }
          
          if (doctorProfileData.verification_status !== 'approved') {
            await supabase.auth.signOut();
            setLoading(false);
            throw new Error('Your account verification status is unclear. Please contact support.');
          }
        }
        
        return { user: fetchedUser };
      }

      setLoading(false);
      throw new Error('Failed to load user profile after successful authentication.');
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          name: userData.name,
          role: userData.role,
          // Add doctor-specific metadata
          ...(userData.role === 'doctor' && {
            specialty: (userData as any).specialty,
            licenseNumber: (userData as any).licenseNumber,
            nrcNumber: (userData as any).nrcNumber,
            selectedProvince: (userData as any).province,
            selectedInstitution: (userData as any).institution_name,
            institutionId: (userData as any).institution_id,
          }),
          // Add patient-specific metadata
          ...(userData.role === 'patient' && {
            dateOfBirth: (userData as any).dateOfBirth,
            gender: (userData as any).gender,
            hivStatus: (userData as any).hivStatus,
          }),
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data && data.user) {
      // If signup was successful, ensure the Supabase client's session is updated
      if (data.session) {
        await supabase.auth.setSession(data.session);
        console.log('✅ Supabase session set after signup:', data.session);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } else {
      throw new Error('User data not returned after signup.');
    }
    
    return;
  };

  const register = async (userData: Partial<User> & { role: UserRole }, password: string) => {
    console.log('🚀 Starting registration process with userData:', userData);
    
    try {
      // Prepare metadata for Supabase auth
      const authMetadata: any = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        name: userData.name,
        role: userData.role,
      };

      // Add doctor-specific metadata
      if (userData.role === 'doctor') {
        console.log('👨‍⚕️ Adding doctor-specific metadata...');
        const doctor = userData as any;
        authMetadata.specialty = doctor.specialty;
        authMetadata.licenseNumber = doctor.licenseNumber;
        authMetadata.nrcNumber = doctor.nrcNumber;
        authMetadata.selectedProvince = doctor.institution?.province || doctor.selectedProvince;
        authMetadata.selectedInstitution = doctor.institution?.name || doctor.selectedInstitution;
        
        console.log('📋 Doctor metadata:', {
          specialty: authMetadata.specialty,
          licenseNumber: authMetadata.licenseNumber,
          nrcNumber: authMetadata.nrcNumber,
          selectedProvince: authMetadata.selectedProvince,
          selectedInstitution: authMetadata.selectedInstitution
        });
      }

      // Add patient-specific metadata
      if (userData.role === 'patient') {
        console.log('🤒 Adding patient-specific metadata...');
        const patient = userData as Patient;
        if (patient.gender) {
          authMetadata.gender = patient.gender;
        }
        if (patient.dateOfBirth) {
          authMetadata.dateOfBirth = patient.dateOfBirth;
        }
        if (patient.hivStatus !== null && patient.hivStatus !== undefined) {
          authMetadata.hivStatus = patient.hivStatus;
        }
        
        console.log('📋 Patient metadata:', {
          gender: authMetadata.gender,
          dateOfBirth: authMetadata.dateOfBirth,
          hivStatus: authMetadata.hivStatus
        });
      }

      console.log('📤 Final auth metadata being sent to Supabase:', authMetadata);

      await signUp(userData.email!, password, userData);
      return;
    } catch (error: any) {
      console.error('💥 Registration error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    // Clear admin session if exists
    if (isAdminAuthenticated()) {
      clearAdminSession();
      setUser(null);
      setLoading(false);
      return;
    }

    // Regular Supabase signout
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
    setLoading(false);
  };

  const logout = async () => {
    await signOut();
    // Ensure all local storage and session storage is cleared
    localStorage.clear();
    sessionStorage.clear();
    // Force a full page reload to ensure no cached state interferes
    window.location.reload();
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    // Skip profile update for admin users
    if (user.role === 'admin' && isAdminAuthenticated()) {
      toast.error('Admin profile cannot be updated');
      return;
    }

    try {
      // Update the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          first_name: updates.firstName || updates.first_name,
          last_name: updates.lastName || updates.last_name,
          photo_url: updates.photoURL || updates.photo_url,
          bio: updates.bio,
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Update role-specific tables
      if (user.role === 'doctor') {
        const { error: doctorError } = await supabase
          .from('doctor_profiles')
          .update({
            first_name: updates.firstName || updates.first_name,
            last_name: updates.lastName || updates.last_name,
            specialty: (updates as Doctor).specialty,
          })
          .eq('doctor_id', user.id);

        if (doctorError) {
          console.error('Error updating doctor profile:', doctorError);
        }
      }

      if (user.role === 'patient') {
        const patientUpdates = updates as Patient;
        const { error: patientError } = await supabase
          .from('patient_profiles')
          .update({
            gender: patientUpdates.gender,
            date_of_birth: patientUpdates.dateOfBirth,
            medical_history: patientUpdates.medicalHistory,
            allergies: patientUpdates.allergies,
            emergency_contact_name: patientUpdates.emergencyContact?.name,
            emergency_contact_relationship: patientUpdates.emergencyContact?.relationship,
            emergency_contact_phone: patientUpdates.emergencyContact?.phone,
            hiv_status: patientUpdates.hivStatus,
          })
          .eq('id', user.id);

        if (patientError) {
          console.error('Error updating patient profile:', patientError);
        }
      }

      // Update local user state
      setUser({
        ...user,
        ...updates,
      });

      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const value = {
    user,
    currentUser: user,
    session,
    loading,
    isAuthenticated: !!user,
    signIn,
    login,
    signUp,
    register,
    signOut,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
