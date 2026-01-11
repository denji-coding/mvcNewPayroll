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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          branch_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string | null
          date: string
          employee_id: string
          hours_worked: number | null
          id: string
          late_minutes: number | null
          overtime_hours: number | null
          remarks: string | null
          rfid_time_in: string | null
          rfid_time_out: string | null
          status: string | null
          time_in: string | null
          time_out: string | null
          undertime_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          employee_id: string
          hours_worked?: number | null
          id?: string
          late_minutes?: number | null
          overtime_hours?: number | null
          remarks?: string | null
          rfid_time_in?: string | null
          rfid_time_out?: string | null
          status?: string | null
          time_in?: string | null
          time_out?: string | null
          undertime_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          employee_id?: string
          hours_worked?: number | null
          id?: string
          late_minutes?: number | null
          overtime_hours?: number | null
          remarks?: string | null
          rfid_time_in?: string | null
          rfid_time_out?: string | null
          status?: string | null
          time_in?: string | null
          time_out?: string | null
          undertime_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_managers: {
        Row: {
          assigned_at: string | null
          branch_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          branch_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          branch_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_managers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          code: string
          contact_number: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          code: string
          contact_number?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          contact_number?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_salary_adjustments: {
        Row: {
          amount: number
          component_id: string
          created_at: string | null
          effective_from: string | null
          effective_to: string | null
          employee_id: string
          id: string
          is_recurring: boolean | null
        }
        Insert: {
          amount: number
          component_id: string
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          employee_id: string
          id?: string
          is_recurring?: boolean | null
        }
        Update: {
          amount?: number
          component_id?: string
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          employee_id?: string
          id?: string
          is_recurring?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_salary_adjustments_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "salary_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_salary_adjustments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          bank_account_number: string | null
          bank_name: string | null
          basic_salary: number
          branch_id: string | null
          civil_status: string | null
          created_at: string | null
          date_hired: string
          date_of_birth: string | null
          department: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string
          employment_status:
            | Database["public"]["Enums"]["employment_status"]
            | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          middle_name: string | null
          pagibig_number: string | null
          philhealth_number: string | null
          phone: string | null
          position: string
          rfid_card_number: string | null
          sss_number: string | null
          tin_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          basic_salary?: number
          branch_id?: string | null
          civil_status?: string | null
          created_at?: string | null
          date_hired: string
          date_of_birth?: string | null
          department?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id: string
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          middle_name?: string | null
          pagibig_number?: string | null
          philhealth_number?: string | null
          phone?: string | null
          position: string
          rfid_card_number?: string | null
          sss_number?: string | null
          tin_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          basic_salary?: number
          branch_id?: string | null
          civil_status?: string | null
          created_at?: string | null
          date_hired?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          middle_name?: string | null
          pagibig_number?: string | null
          philhealth_number?: string | null
          phone?: string | null
          position?: string
          rfid_card_number?: string | null
          sss_number?: string | null
          tin_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string | null
          date: string
          id: string
          name: string
          type: string
          year: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          name: string
          type: string
          year: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          name?: string
          type?: string
          year?: number
        }
        Relationships: []
      }
      leave_credits: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          total_credits: number | null
          updated_at: string | null
          used_credits: number | null
          year: number
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          total_credits?: number | null
          updated_at?: string | null
          used_credits?: number | null
          year: number
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          total_credits?: number | null
          updated_at?: string | null
          used_credits?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_credits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string | null
          employee_id: string
          end_date: string
          hr_action_at: string | null
          hr_id: string | null
          hr_remarks: string | null
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          manager_action_at: string | null
          manager_id: string | null
          manager_remarks: string | null
          medical_certificate_url: string | null
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"] | null
          total_days: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          end_date: string
          hr_action_at?: string | null
          hr_id?: string | null
          hr_remarks?: string | null
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          manager_action_at?: string | null
          manager_id?: string | null
          manager_remarks?: string | null
          medical_certificate_url?: string | null
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          total_days: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          end_date?: string
          hr_action_at?: string | null
          hr_id?: string | null
          hr_remarks?: string | null
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          manager_action_at?: string | null
          manager_id?: string | null
          manager_remarks?: string | null
          medical_certificate_url?: string | null
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          total_days?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          loan_type: string
          monthly_amortization: number
          principal_amount: number
          remaining_balance: number
          start_date: string
          status: string | null
          total_paid: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          loan_type: string
          monthly_amortization: number
          principal_amount: number
          remaining_balance: number
          start_date: string
          status?: string | null
          total_paid?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          loan_type?: string
          monthly_amortization?: number
          principal_amount?: number
          remaining_balance?: number
          start_date?: string
          status?: string | null
          total_paid?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          reference_id: string | null
          reference_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      payroll_periods: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          id: string
          pay_date: string
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["payroll_status"] | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          pay_date: string
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["payroll_status"] | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          pay_date?: string
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["payroll_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payroll_records: {
        Row: {
          allowances_breakdown: Json | null
          basic_pay: number
          created_at: string | null
          days_worked: number | null
          deductions_breakdown: Json | null
          employee_id: string
          gross_pay: number | null
          holiday_pay: number | null
          id: string
          net_pay: number | null
          night_differential: number | null
          other_deductions: number | null
          overtime_pay: number | null
          pagibig_contribution: number | null
          payroll_period_id: string
          philhealth_contribution: number | null
          sss_contribution: number | null
          total_allowances: number | null
          total_deductions: number | null
          updated_at: string | null
          withholding_tax: number | null
        }
        Insert: {
          allowances_breakdown?: Json | null
          basic_pay?: number
          created_at?: string | null
          days_worked?: number | null
          deductions_breakdown?: Json | null
          employee_id: string
          gross_pay?: number | null
          holiday_pay?: number | null
          id?: string
          net_pay?: number | null
          night_differential?: number | null
          other_deductions?: number | null
          overtime_pay?: number | null
          pagibig_contribution?: number | null
          payroll_period_id: string
          philhealth_contribution?: number | null
          sss_contribution?: number | null
          total_allowances?: number | null
          total_deductions?: number | null
          updated_at?: string | null
          withholding_tax?: number | null
        }
        Update: {
          allowances_breakdown?: Json | null
          basic_pay?: number
          created_at?: string | null
          days_worked?: number | null
          deductions_breakdown?: Json | null
          employee_id?: string
          gross_pay?: number | null
          holiday_pay?: number | null
          id?: string
          net_pay?: number | null
          night_differential?: number | null
          other_deductions?: number | null
          overtime_pay?: number | null
          pagibig_contribution?: number | null
          payroll_period_id?: string
          philhealth_contribution?: number | null
          sss_contribution?: number | null
          total_allowances?: number | null
          total_deductions?: number | null
          updated_at?: string | null
          withholding_tax?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          middle_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          middle_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          middle_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      salary_components: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_mandatory: boolean | null
          is_taxable: boolean | null
          name: string
          type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          is_taxable?: boolean | null
          name: string
          type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          is_taxable?: boolean | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_employee_by_user: { Args: { _user_id: string }; Returns: string }
      get_user_branch_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "hr_admin" | "branch_manager" | "employee"
      employment_status:
        | "active"
        | "resigned"
        | "terminated"
        | "on_leave"
        | "inactive"
      leave_status:
        | "pending"
        | "manager_approved"
        | "hr_approved"
        | "rejected"
        | "cancelled"
      leave_type:
        | "vacation"
        | "sick"
        | "emergency"
        | "maternity"
        | "paternity"
        | "bereavement"
        | "unpaid"
      notification_type:
        | "leave_request"
        | "leave_approved"
        | "leave_rejected"
        | "payroll_ready"
        | "announcement"
        | "system"
        | "attendance"
      payroll_status: "draft" | "processing" | "approved" | "paid"
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
    Enums: {
      app_role: ["hr_admin", "branch_manager", "employee"],
      employment_status: [
        "active",
        "resigned",
        "terminated",
        "on_leave",
        "inactive",
      ],
      leave_status: [
        "pending",
        "manager_approved",
        "hr_approved",
        "rejected",
        "cancelled",
      ],
      leave_type: [
        "vacation",
        "sick",
        "emergency",
        "maternity",
        "paternity",
        "bereavement",
        "unpaid",
      ],
      notification_type: [
        "leave_request",
        "leave_approved",
        "leave_rejected",
        "payroll_ready",
        "announcement",
        "system",
        "attendance",
      ],
      payroll_status: ["draft", "processing", "approved", "paid"],
    },
  },
} as const
