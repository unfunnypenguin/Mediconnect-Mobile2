export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          is_super_admin: boolean | null
        }
        Insert: {
          created_at?: string
          id: string
          is_super_admin?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          is_super_admin?: boolean | null
        }
        Relationships: []
      }
      ambulance_requests: {
        Row: {
          ambulance_service_id: string
          id: string
          location_details: string | null
          location_district: string | null
          location_province: string
          notes: string | null
          patient_id: string
          requested_at: string
          status: string
          updated_at: string
        }
        Insert: {
          ambulance_service_id: string
          id?: string
          location_details?: string | null
          location_district?: string | null
          location_province: string
          notes?: string | null
          patient_id: string
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          ambulance_service_id?: string
          id?: string
          location_details?: string | null
          location_district?: string | null
          location_province?: string
          notes?: string | null
          patient_id?: string
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambulance_requests_ambulance_service_id_fkey"
            columns: ["ambulance_service_id"]
            isOneToOne: false
            referencedRelation: "ambulance_services"
            referencedColumns: ["id"]
          },
        ]
      }
      ambulance_services: {
        Row: {
          created_at: string
          district: string | null
          estimated_response_time: string | null
          id: string
          is_active: boolean | null
          name: string
          phone_number: string
          province: string
          service_type: string
        }
        Insert: {
          created_at?: string
          district?: string | null
          estimated_response_time?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone_number: string
          province: string
          service_type: string
        }
        Update: {
          created_at?: string
          district?: string | null
          estimated_response_time?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone_number?: string
          province?: string
          service_type?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          created_at: string
          doctor_id: string | null
          end_time: string
          id: string
          notes: string | null
          patient_id: string | null
          reason: string | null
          rejection_reason: string | null
          start_time: string
          status: string
        }
        Insert: {
          appointment_date: string
          created_at?: string
          doctor_id?: string | null
          end_time: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          reason?: string | null
          rejection_reason?: string | null
          start_time: string
          status?: string
        }
        Update: {
          appointment_date?: string
          created_at?: string
          doctor_id?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          reason?: string | null
          rejection_reason?: string | null
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar_options: {
        Row: {
          category: string | null
          color_value: string
          created_at: string
          gradient_value: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          color_value?: string
          created_at?: string
          gradient_value?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          color_value?: string
          created_at?: string
          gradient_value?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean | null
          sender_id: string | null
          session_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean | null
          sender_id?: string | null
          session_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean | null
          sender_id?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          doctor_id: string | null
          id: string
          patient_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          id?: string
          patient_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          id?: string
          patient_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_actions: {
        Row: {
          action_details: string | null
          action_type: string
          admin_id: string
          complaint_id: string
          created_at: string
          id: string
        }
        Insert: {
          action_details?: string | null
          action_type: string
          admin_id: string
          complaint_id: string
          created_at?: string
          id?: string
        }
        Update: {
          action_details?: string | null
          action_type?: string
          admin_id?: string
          complaint_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaint_actions_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          admin_id: string | null
          admin_notes: string | null
          attachment_url: string | null
          created_at: string
          description: string | null
          doctor_id: string
          id: string
          patient_id: string
          reason: string
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          admin_notes?: string | null
          attachment_url?: string | null
          created_at?: string
          description?: string | null
          doctor_id: string
          id?: string
          patient_id: string
          reason: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          admin_notes?: string | null
          attachment_url?: string | null
          created_at?: string
          description?: string | null
          doctor_id?: string
          id?: string
          patient_id?: string
          reason?: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_availability: {
        Row: {
          day_of_week: number
          doctor_id: string | null
          end_time: string
          id: string
          start_time: string
        }
        Insert: {
          day_of_week: number
          doctor_id?: string | null
          end_time: string
          id?: string
          start_time: string
        }
        Update: {
          day_of_week?: number
          doctor_id?: string | null
          end_time?: string
          id?: string
          start_time?: string
        }
        Relationships: []
      }
      doctor_documents: {
        Row: {
          doctor_id: string
          document_type: string
          document_url: string
          id: string
          uploaded_at: string
          verified: boolean | null
        }
        Insert: {
          doctor_id: string
          document_type: string
          document_url: string
          id?: string
          uploaded_at?: string
          verified?: boolean | null
        }
        Update: {
          doctor_id?: string
          document_type?: string
          document_url?: string
          id?: string
          uploaded_at?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      doctor_profiles: {
        Row: {
          date_created: string | null
          date_updated: string | null
          doctor_id: string
          email: string
          first_name: string
          institution_id: string | null
          institution_name: string
          last_name: string
          license_number: string | null
          nrc_number: string | null
          profile_id: string | null
          province: string
          qualifications: string[] | null
          review_date: string | null
          specialty: string
          verification_notes: string | null
          verification_status: string | null
        }
        Insert: {
          date_created?: string | null
          date_updated?: string | null
          doctor_id?: string
          email: string
          first_name: string
          institution_id?: string | null
          institution_name: string
          last_name: string
          license_number?: string | null
          nrc_number?: string | null
          profile_id?: string | null
          province: string
          qualifications?: string[] | null
          review_date?: string | null
          specialty: string
          verification_notes?: string | null
          verification_status?: string | null
        }
        Update: {
          date_created?: string | null
          date_updated?: string | null
          doctor_id?: string
          email?: string
          first_name?: string
          institution_id?: string | null
          institution_name?: string
          last_name?: string
          license_number?: string | null
          nrc_number?: string | null
          profile_id?: string | null
          province?: string
          qualifications?: string[] | null
          review_date?: string | null
          specialty?: string
          verification_notes?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "healthcare_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_doctor_profiles_doctor_id"
            columns: ["doctor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_doctor_profiles_institution_id"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "healthcare_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_doctor_profiles_profile_id"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_reports: {
        Row: {
          created_at: string
          details: string | null
          doctor_id: string | null
          id: string
          reason: string
          reported_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          doctor_id?: string | null
          id?: string
          reason: string
          reported_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          doctor_id?: string | null
          id?: string
          reason?: string
          reported_by?: string | null
          status?: string
        }
        Relationships: []
      }
      doctor_verifications: {
        Row: {
          admin_id: string | null
          created_at: string
          doctor_id: string | null
          id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_verifications_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      healthcare_alerts: {
        Row: {
          id: string
          message_content: string
          sent_at: string
          sent_by_admin_id: string | null
        }
        Insert: {
          id?: string
          message_content: string
          sent_at?: string
          sent_by_admin_id?: string | null
        }
        Update: {
          id?: string
          message_content?: string
          sent_at?: string
          sent_by_admin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "healthcare_alerts_sent_by_admin_id_fkey"
            columns: ["sent_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      healthcare_institutions: {
        Row: {
          address: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          province: string | null
          type: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          province?: string | null
          type: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          province?: string | null
          type?: string
        }
        Relationships: []
      }
      medication_refills: {
        Row: {
          created_at: string | null
          id: string
          last_refill_date: string
          medication_type: string
          next_refill_date: string
          notifications_enabled: boolean | null
          patient_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_refill_date: string
          medication_type: string
          next_refill_date: string
          notifications_enabled?: boolean | null
          patient_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_refill_date?: string
          medication_type?: string
          next_refill_date?: string
          notifications_enabled?: boolean | null
          patient_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_refills_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_profiles: {
        Row: {
          allergies: string[] | null
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          gender: string | null
          hiv_status: boolean | null
          id: string
          medical_history: string | null
        }
        Insert: {
          allergies?: string[] | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          gender?: string | null
          hiv_status?: boolean | null
          id: string
          medical_history?: string | null
        }
        Update: {
          allergies?: string[] | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          gender?: string | null
          hiv_status?: boolean | null
          id?: string
          medical_history?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          date_created: string
          email: string
          first_name: string | null
          id: string
          is_verified: boolean | null
          last_name: string | null
          name: string | null
          photo_url: string | null
          role: string
          selected_avatar_id: string | null
        }
        Insert: {
          bio?: string | null
          date_created?: string
          email: string
          first_name?: string | null
          id: string
          is_verified?: boolean | null
          last_name?: string | null
          name?: string | null
          photo_url?: string | null
          role: string
          selected_avatar_id?: string | null
        }
        Update: {
          bio?: string | null
          date_created?: string
          email?: string
          first_name?: string | null
          id?: string
          is_verified?: boolean | null
          last_name?: string | null
          name?: string | null
          photo_url?: string | null
          role?: string
          selected_avatar_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_selected_avatar_id_fkey"
            columns: ["selected_avatar_id"]
            isOneToOne: false
            referencedRelation: "avatar_options"
            referencedColumns: ["id"]
          },
        ]
      }
      user_alert_deliveries: {
        Row: {
          alert_id: string
          delivered_at: string | null
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          alert_id: string
          delivered_at?: string | null
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          alert_id?: string
          delivered_at?: string | null
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_alert_deliveries_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "healthcare_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_alert_deliveries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_alerts: {
        Row: {
          alert_id: string | null
          created_at: string | null
          id: string
          read_at: string | null
          user_id: string | null
        }
        Insert: {
          alert_id?: string | null
          created_at?: string | null
          id?: string
          read_at?: string | null
          user_id?: string | null
        }
        Update: {
          alert_id?: string | null
          created_at?: string | null
          id?: string
          read_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_alerts_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "healthcare_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_admin_profile: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_doctor_id_by_name: {
        Args: { doctor_name: string }
        Returns: string
      }
      get_institution_by_name: {
        Args: { institution_name: string }
        Returns: string
      }
      get_pending_doctor_applications: {
        Args: Record<PropertyKey, never>
        Returns: {
          doctor_id: string
          specialty: string
          verification_status: string
          license_number: string
          nrc_number: string
          institution_id: string
          first_name: string
          last_name: string
          email: string
          province: string
          institution_name: string
          date_created: string
          profiles: Json
          healthcare_institutions: Json
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
