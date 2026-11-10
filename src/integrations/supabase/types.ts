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
      applicants: {
        Row: {
          contact: string | null
          created_at: string
          eligibility: string | null
          email: string | null
          id: string
          name: string
          office: string | null
          position_applied: string
          previous_position: string | null
          salary_grade: string | null
          vacant_positions: string | null
        }
        Insert: {
          contact?: string | null
          created_at?: string
          eligibility?: string | null
          email?: string | null
          id?: string
          name: string
          office?: string | null
          position_applied: string
          previous_position?: string | null
          salary_grade?: string | null
          vacant_positions?: string | null
        }
        Update: {
          contact?: string | null
          created_at?: string
          eligibility?: string | null
          email?: string | null
          id?: string
          name?: string
          office?: string | null
          position_applied?: string
          previous_position?: string | null
          salary_grade?: string | null
          vacant_positions?: string | null
        }
        Relationships: []
      }
      assessments: {
        Row: {
          applicant_id: string
          attested_by: string | null
          created_at: string
          division_province: string | null
          education_course: string | null
          education_degree: string | null
          education_pts: number | null
          eligibility_pts: number | null
          evaluated_by: string | null
          experience_duration: string | null
          experience_name: string | null
          experience_pts: number | null
          experience_years: number | null
          id: string
          office_service_unit_region: string | null
          reviewed_by: string | null
          salary_grade_input: string | null
          training_hours: number | null
          training_name: string | null
          training_pts: number | null
          user_id: string
        }
        Insert: {
          applicant_id: string
          attested_by?: string | null
          created_at?: string
          division_province?: string | null
          education_course?: string | null
          education_degree?: string | null
          education_pts?: number | null
          eligibility_pts?: number | null
          evaluated_by?: string | null
          experience_duration?: string | null
          experience_name?: string | null
          experience_pts?: number | null
          experience_years?: number | null
          id?: string
          office_service_unit_region?: string | null
          reviewed_by?: string | null
          salary_grade_input?: string | null
          training_hours?: number | null
          training_name?: string | null
          training_pts?: number | null
          user_id: string
        }
        Update: {
          applicant_id?: string
          attested_by?: string | null
          created_at?: string
          division_province?: string | null
          education_course?: string | null
          education_degree?: string | null
          education_pts?: number | null
          eligibility_pts?: number | null
          evaluated_by?: string | null
          experience_duration?: string | null
          experience_name?: string | null
          experience_pts?: number | null
          experience_years?: number | null
          id?: string
          office_service_unit_region?: string | null
          reviewed_by?: string | null
          salary_grade_input?: string | null
          training_hours?: number | null
          training_name?: string | null
          training_pts?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: true
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          applicant_id: string
          c1: number | null
          c10: number | null
          c2: number | null
          c3: number | null
          c4: number | null
          c5: number | null
          c6: number | null
          c7: number | null
          c8: number | null
          c9: number | null
          created_at: string
          id: string
          interview_date: string | null
          rated_by: string | null
          user_id: string
        }
        Insert: {
          applicant_id: string
          c1?: number | null
          c10?: number | null
          c2?: number | null
          c3?: number | null
          c4?: number | null
          c5?: number | null
          c6?: number | null
          c7?: number | null
          c8?: number | null
          c9?: number | null
          created_at?: string
          id?: string
          interview_date?: string | null
          rated_by?: string | null
          user_id: string
        }
        Update: {
          applicant_id?: string
          c1?: number | null
          c10?: number | null
          c2?: number | null
          c3?: number | null
          c4?: number | null
          c5?: number | null
          c6?: number | null
          c7?: number | null
          c8?: number | null
          c9?: number | null
          created_at?: string
          id?: string
          interview_date?: string | null
          rated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: true
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
        ]
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
