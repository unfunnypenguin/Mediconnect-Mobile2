
import { supabase } from '@/integrations/supabase/client';

export const ensureAdminUserExists = async () => {
  try {
    console.log('🔍 Checking if admin user exists...');
    
    // First, let's try to call the database function to create admin
    console.log('📞 Calling create_admin_profile function...');
    const { data: functionResult, error: functionError } = await supabase.rpc('create_admin_profile');
    
    if (functionError) {
      console.error('❌ Error calling create_admin_profile function:', functionError);
    } else {
      console.log('✅ create_admin_profile function called successfully:', functionResult);
    }

    // Wait a moment for the function to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Now check if admin profile exists
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@mediconnect.com')
      .single();

    console.log('🔍 Admin profile check result:', { adminProfile, profileError });

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error checking admin profile:', profileError);
      
      // If there's an error other than "not found", try direct insert as fallback
      console.log('🔄 Attempting direct insert as fallback...');
      
      const adminId = '00000000-0000-0000-0000-000000000001'; // Fixed UUID for admin
      
      const { error: insertError } = await supabase
        .from('profiles')
        .upsert({
          id: adminId,
          email: 'admin@mediconnect.com',
          role: 'admin',
          first_name: 'MediConnect',
          last_name: 'Admin',
          name: 'MediConnect Admin',
          date_created: new Date().toISOString()
        }, {
          onConflict: 'email'
        });

      if (insertError) {
        console.error('❌ Direct insert also failed:', insertError);
      } else {
        console.log('✅ Admin profile created via direct insert');
        
        // Also ensure admin_users record exists
        const { error: adminUserError } = await supabase
          .from('admin_users')
          .upsert({
            id: adminId,
            is_super_admin: true
          }, {
            onConflict: 'id'
          });
          
        if (adminUserError) {
          console.error('⚠️ Error creating admin_users record:', adminUserError);
        }
      }
    } else if (!adminProfile) {
      console.log('❌ Admin profile still not found after function call');
    } else {
      console.log('✅ Admin profile exists:', adminProfile);
    }
  } catch (error) {
    console.error('💥 Error in ensureAdminUserExists:', error);
  }
};
