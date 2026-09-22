export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      evidence_files: {
        Row: {
          arrangement_id: string | null
          created_at: string
          file_name: string
          file_size: number
          id: string
          is_encrypted: boolean | null
          mime_type: string
          notes: string | null
          parent_id: string | null
          parent_type: string
          payment_type: string | null
          sha256_hash: string
          storage_path: string | null
          user_id: string
        }
        Insert: {
          arrangement_id?: string | null
          created_at?: string
          file_name: string
          file_size: number
          id: string
          is_encrypted?: boolean | null
          mime_type: string
          notes?: string | null
          parent_id?: string | null
          parent_type: string
          payment_type?: string | null
          sha256_hash: string
          storage_path?: string | null
          user_id: string
        }
        Update: {
          arrangement_id?: string | null
          created_at?: string
          file_name?: string
          file_size?: number
          id?: string
          is_encrypted?: boolean | null
          mime_type?: string
          notes?: string | null
          parent_id?: string | null
          parent_type?: string
          payment_type?: string | null
          sha256_hash?: string
          storage_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          arrangement_id: string | null
          category: string
          ciphertext_payload: Json | null
          client_id: string | null
          created_at: string
          description: string | null
          employer: string | null
          id: number
          incident_date: string
          is_encrypted: boolean | null
          location: string | null
          user_id: string
          witnesses: string | null
        }
        Insert: {
          arrangement_id?: string | null
          category: string
          ciphertext_payload?: Json | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          employer?: string | null
          id?: number
          incident_date: string
          is_encrypted?: boolean | null
          location?: string | null
          user_id: string
          witnesses?: string | null
        }
        Update: {
          arrangement_id?: string | null
          category?: string
          ciphertext_payload?: Json | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          employer?: string | null
          id?: number
          incident_date?: string
          is_encrypted?: boolean | null
          location?: string | null
          user_id?: string
          witnesses?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          language_preference: string | null
          phone: string | null
          preferred_sector: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          language_preference?: string | null
          phone?: string | null
          preferred_sector?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          language_preference?: string | null
          phone?: string | null
          preferred_sector?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      work_arrangements: {
        Row: {
          user_id: string
          id: string
          label: string
          sector: string
          payment_basis: string
          employer_or_client: string | null
          custom_fields: Json
          confirmed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          id: string
          label: string
          sector?: string
          payment_basis?: string
          employer_or_client?: string | null
          custom_fields?: Json
          confirmed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          id?: string
          label?: string
          sector?: string
          payment_basis?: string
          employer_or_client?: string | null
          custom_fields?: Json
          confirmed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          arrangement_id: string | null
          agreed_pay: number | null
          amount_paid: number | null
          ciphertext_payload: Json | null
          client_id: string | null
          created_at: string
          employer: string | null
          end_time: string | null
          id: number
          is_encrypted: boolean | null
          is_sunday_or_holiday: boolean | null
          location: string | null
          sector: string
          shift_date: string
          start_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          arrangement_id?: string | null
          agreed_pay?: number | null
          amount_paid?: number | null
          ciphertext_payload?: Json | null
          client_id?: string | null
          created_at?: string
          employer?: string | null
          end_time?: string | null
          id?: number
          is_encrypted?: boolean | null
          is_sunday_or_holiday?: boolean | null
          location?: string | null
          sector?: string
          shift_date: string
          start_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          arrangement_id?: string | null
          agreed_pay?: number | null
          amount_paid?: number | null
          ciphertext_payload?: Json | null
          client_id?: string | null
          created_at?: string
          employer?: string | null
          end_time?: string | null
          id?: number
          is_encrypted?: boolean | null
          is_sunday_or_holiday?: boolean | null
          location?: string | null
          sector?: string
          shift_date?: string
          start_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
