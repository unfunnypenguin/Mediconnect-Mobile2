import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://tpwidyfwjqgkajzfcwhe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwd2lkeWZ3anFna2FqemZjd2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4NTUyNDEsImV4cCI6MjA1ODQzMTI0MX0.lENoiFQ1kpzU8Sp8T3SidJGCtU_hCiLdoCgOAI7lK5A";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage
  }
});
console.log("Supabase client initialized:", supabase);

export const updateDoctorVerificationStatus = async (
  doctorId: string,
  status: 'approved' | 'rejected',
  adminId: string,
  notes: string | null = null,
  province: string | null = null,
  institutionName: string | null = null
) => {
  try {
    const updateData: {
      verification_status: string;
      review_date: string;
      verification_notes: string | null;
      province?: string | null;
      institution_name?: string | null;
    } = {
      verification_status: status,
      review_date: new Date().toISOString(),
      verification_notes: notes,
    };

    if (province !== null) {
      updateData.province = province;
    }
    if (institutionName !== null) {
      updateData.institution_name = institutionName;
    }

    const { error: doctorProfileError } = await supabase
      .from('doctor_profiles')
      .update(updateData)
      .eq('doctor_id', doctorId);

    if (doctorProfileError) {
      throw doctorProfileError;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        is_verified: status === 'approved',
      })
      .eq('id', doctorId);

    if (profileError) {
      throw profileError;
    }

    // Insert a record into doctor_verifications table for audit trail
    const { error: verificationError } = await supabase
      .from('doctor_verifications')
      .insert({
        doctor_id: doctorId,
        admin_id: adminId,
        status: status,
        notes: notes,
      });

    if (verificationError) {
      console.error("Error inserting into doctor_verifications:", verificationError);
      // Don't throw, as the main status update is more critical
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating doctor verification status:", error);
    return { success: false, error };
  }
};
