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
          country: string | null
          created_at: string | null
          email: string | null
          email_notifications: boolean | null
          id: string
          logo_url: string | null
          phone: string | null
          postcode: string | null
          sms_notifications: boolean | null
          stripe_account_id: string | null
          stripe_status: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          clinic_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          email_notifications?: boolean | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          postcode?: string | null
          sms_notifications?: boolean | null
          stripe_account_id?: string | null
          stripe_status?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          clinic_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          email_notifications?: boolean | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          postcode?: string | null
          sms_notifications?: boolean | null
          stripe_account_id?: string | null
          stripe_status?: string | null
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          payload: Json
          payment_id: string | null
          processed_at: string | null
          recipient_type: string
          retry_count: number | null
          status: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload: Json
          payment_id?: string | null
          processed_at?: string | null
          recipient_type: string
          retry_count?: number | null
          status?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload?: Json
          payment_id?: string | null
          processed_at?: string | null
          recipient_type?: string
          retry_count?: number | null
          status?: string | null
          type?: string
        }
        Relationships: []
      }
      patient_notes: {
        Row: {
          clinic_id: string
          content: string
          created_at: string
          created_by_user_id: string | null
          id: string
          patient_id: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          content: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          patient_id: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          content?: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          clinic_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_activity: {
        Row: {
          action_type: string
          clinic_id: string
          created_at: string
          details: Json | null
          id: string
          patient_id: string
          payment_link_id: string
          performed_at: string
          performed_by_user_id: string | null
          plan_id: string | null
        }
        Insert: {
          action_type: string
          clinic_id: string
          created_at?: string
          details?: Json | null
          id?: string
          patient_id: string
          payment_link_id: string
          performed_at?: string
          performed_by_user_id?: string | null
          plan_id?: string | null
        }
        Update: {
          action_type?: string
          clinic_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          patient_id?: string
          payment_link_id?: string
          performed_at?: string
          performed_by_user_id?: string | null
          plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_activity_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
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
          payment_count: number | null
          payment_cycle: string | null
          payment_plan: boolean | null
          plan_total_amount: number | null
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
          payment_count?: number | null
          payment_cycle?: string | null
          payment_plan?: boolean | null
          plan_total_amount?: number | null
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
          payment_count?: number | null
          payment_cycle?: string | null
          payment_plan?: boolean | null
          plan_total_amount?: number | null
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
          patient_id: string | null
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
          patient_id?: string | null
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
          patient_id?: string | null
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
            foreignKeyName: "payment_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
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
      payment_schedule: {
        Row: {
          amount: number
          clinic_id: string
          created_at: string | null
          due_date: string
          id: string
          patient_id: string | null
          payment_frequency: string
          payment_link_id: string
          payment_number: number
          payment_request_id: string | null
          plan_id: string | null
          status: string
          total_payments: number
          updated_at: string | null
        }
        Insert: {
          amount: number
          clinic_id: string
          created_at?: string | null
          due_date: string
          id?: string
          patient_id?: string | null
          payment_frequency: string
          payment_link_id: string
          payment_number: number
          payment_request_id?: string | null
          plan_id?: string | null
          status?: string
          total_payments: number
          updated_at?: string | null
        }
        Update: {
          amount?: number
          clinic_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          patient_id?: string | null
          payment_frequency?: string
          payment_link_id?: string
          payment_number?: number
          payment_request_id?: string | null
          plan_id?: string | null
          status?: string
          total_payments?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedule_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedule_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedule_payment_link_id_fkey"
            columns: ["payment_link_id"]
            isOneToOne: false
            referencedRelation: "payment_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedule_payment_request_id_fkey"
            columns: ["payment_request_id"]
            isOneToOne: false
            referencedRelation: "payment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedule_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paid: number | null
          clinic_id: string | null
          id: string
          net_amount: number | null
          paid_at: string | null
          patient_email: string | null
          patient_id: string | null
          patient_name: string | null
          patient_phone: string | null
          payment_link_id: string | null
          payment_ref: string | null
          platform_fee: number | null
          refund_amount: number | null
          refunded_at: string | null
          status: string | null
          stripe_fee: number | null
          stripe_payment_id: string | null
          stripe_refund_fee: number | null
          stripe_refund_id: string | null
        }
        Insert: {
          amount_paid?: number | null
          clinic_id?: string | null
          id?: string
          net_amount?: number | null
          paid_at?: string | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          payment_link_id?: string | null
          payment_ref?: string | null
          platform_fee?: number | null
          refund_amount?: number | null
          refunded_at?: string | null
          status?: string | null
          stripe_fee?: number | null
          stripe_payment_id?: string | null
          stripe_refund_fee?: number | null
          stripe_refund_id?: string | null
        }
        Update: {
          amount_paid?: number | null
          clinic_id?: string | null
          id?: string
          net_amount?: number | null
          paid_at?: string | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          payment_link_id?: string | null
          payment_ref?: string | null
          platform_fee?: number | null
          refund_amount?: number | null
          refunded_at?: string | null
          status?: string | null
          stripe_fee?: number | null
          stripe_payment_id?: string | null
          stripe_refund_fee?: number | null
          stripe_refund_id?: string | null
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
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
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
      plans: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          description: string | null
          has_overdue_payments: boolean
          id: string
          installment_amount: number
          next_due_date: string | null
          paid_installments: number
          patient_id: string
          payment_frequency: string
          payment_link_id: string
          progress: number
          start_date: string
          status: string
          title: string
          total_amount: number
          total_installments: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          has_overdue_payments?: boolean
          id?: string
          installment_amount: number
          next_due_date?: string | null
          paid_installments?: number
          patient_id: string
          payment_frequency: string
          payment_link_id: string
          progress?: number
          start_date: string
          status?: string
          title: string
          total_amount: number
          total_installments: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          has_overdue_payments?: boolean
          id?: string
          installment_amount?: number
          next_due_date?: string | null
          paid_installments?: number
          patient_id?: string
          payment_frequency?: string
          payment_link_id?: string
          progress?: number
          start_date?: string
          status?: string
          title?: string
          total_amount?: number
          total_installments?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_payment_link_id_fkey"
            columns: ["payment_link_id"]
            isOneToOne: false
            referencedRelation: "payment_links"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          id: number
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: number
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          email: string | null
          id: string
          role: string | null
          token_expires_at: string | null
          verification_token: string | null
          verified: boolean | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
          token_expires_at?: string | null
          verification_token?: string | null
          verified?: boolean | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
          token_expires_at?: string | null
          verification_token?: string | null
          verified?: boolean | null
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
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      execute_sql: {
        Args: { sql: string }
        Returns: Json
      }
      generate_verification_token: {
        Args: { user_id: string }
        Returns: string
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      insert_payment_record: {
        Args: {
          p_clinic_id: string
          p_amount_paid: number
          p_patient_name: string
          p_patient_email: string
          p_patient_phone: string
          p_payment_link_id: string
          p_payment_ref: string
          p_stripe_payment_id: string
        }
        Returns: string
      }
      resume_payment_plan: {
        Args: { plan_id: string; resume_date: string }
        Returns: Json
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
