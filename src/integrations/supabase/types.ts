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
      clinics: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          clinic_name: string | null
          contact_name: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          postcode: string | null
          stripe_account_id: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          clinic_name?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          postcode?: string | null
          stripe_account_id?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          clinic_name?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          postcode?: string | null
          stripe_account_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          channel: string | null
          clinic_id: string | null
          created_at: string | null
          enabled: boolean | null
          id: string
          type: string | null
        }
        Insert: {
          channel?: string | null
          clinic_id?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          type?: string | null
        }
        Update: {
          channel?: string | null
          clinic_id?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_links: {
        Row: {
          amount: number | null
          clinic_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          title: string | null
          type: string | null
        }
        Insert: {
          amount?: number | null
          clinic_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title?: string | null
          type?: string | null
        }
        Update: {
          amount?: number | null
          clinic_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_links_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          clinic_id: string | null
          custom_amount: number | null
          id: string
          message: string | null
          paid_at: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          payment_id: string | null
          payment_link_id: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          clinic_id?: string | null
          custom_amount?: number | null
          id?: string
          message?: string | null
          paid_at?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          payment_id?: string | null
          payment_link_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          clinic_id?: string | null
          custom_amount?: number | null
          id?: string
          message?: string | null
          paid_at?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          payment_id?: string | null
          payment_link_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_payment_link_id_fkey"
            columns: ["payment_link_id"]
            isOneToOne: false
            referencedRelation: "payment_links"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paid: number | null
          clinic_id: string | null
          id: string
          paid_at: string | null
          patient_email: string | null
          patient_name: string | null
          payment_link_id: string | null
          status: string | null
          stripe_payment_id: string | null
        }
        Insert: {
          amount_paid?: number | null
          clinic_id?: string | null
          id?: string
          paid_at?: string | null
          patient_email?: string | null
          patient_name?: string | null
          payment_link_id?: string | null
          status?: string | null
          stripe_payment_id?: string | null
        }
        Update: {
          amount_paid?: number | null
          clinic_id?: string | null
          id?: string
          paid_at?: string | null
          patient_email?: string | null
          patient_name?: string | null
          payment_link_id?: string | null
          status?: string | null
          stripe_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_link_id_fkey"
            columns: ["payment_link_id"]
            isOneToOne: false
            referencedRelation: "payment_links"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          email: string | null
          id: string
          role: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
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
