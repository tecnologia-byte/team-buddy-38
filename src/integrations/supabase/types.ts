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
      avisos: {
        Row: {
          created_at: string
          detalle: string
          id: string
          nuevo: boolean
          para_id: string
          titulo: string
        }
        Insert: {
          created_at?: string
          detalle?: string
          id?: string
          nuevo?: boolean
          para_id: string
          titulo: string
        }
        Update: {
          created_at?: string
          detalle?: string
          id?: string
          nuevo?: boolean
          para_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_para_id_fkey"
            columns: ["para_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          colaborador_id: string
          created_at: string
          estado: string
          id: string
          monto: number
          periodo: string
          recibo: string
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          estado?: string
          id?: string
          monto?: number
          periodo: string
          recibo?: string
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          estado?: string
          id?: string
          monto?: number
          periodo?: string
          recibo?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          area: string
          cargo: string
          created_at: string
          cumple: string
          email: string
          estado: string
          estado_foto: string
          firma: string | null
          firma_actualizada: string | null
          foto: string | null
          foto_pendiente: string | null
          id: string
          ingreso: string
          iniciales: string
          motivo_rechazo: string | null
          nombre: string
          salario: number
          telefono: string
        }
        Insert: {
          area?: string
          cargo?: string
          created_at?: string
          cumple?: string
          email?: string
          estado?: string
          estado_foto?: string
          firma?: string | null
          firma_actualizada?: string | null
          foto?: string | null
          foto_pendiente?: string | null
          id: string
          ingreso?: string
          iniciales?: string
          motivo_rechazo?: string | null
          nombre?: string
          salario?: number
          telefono?: string
        }
        Update: {
          area?: string
          cargo?: string
          created_at?: string
          cumple?: string
          email?: string
          estado?: string
          estado_foto?: string
          firma?: string | null
          firma_actualizada?: string | null
          foto?: string | null
          foto_pendiente?: string | null
          id?: string
          ingreso?: string
          iniciales?: string
          motivo_rechazo?: string | null
          nombre?: string
          salario?: number
          telefono?: string
        }
        Relationships: []
      }
      soporte_tickets: {
        Row: {
          asunto: string
          categoria: string
          creador_id: string
          created_at: string
          email: string
          estado: string
          id: string
          mensaje: string
          nombre: string
          respuesta: string | null
          updated_at: string
        }
        Insert: {
          asunto: string
          categoria?: string
          creador_id: string
          created_at?: string
          email?: string
          estado?: string
          id?: string
          mensaje: string
          nombre?: string
          respuesta?: string | null
          updated_at?: string
        }
        Update: {
          asunto?: string
          categoria?: string
          creador_id?: string
          created_at?: string
          email?: string
          estado?: string
          id?: string
          mensaje?: string
          nombre?: string
          respuesta?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "soporte_tickets_creador_id_fkey"
            columns: ["creador_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      directorio: {
        Args: never
        Returns: {
          area: string
          cargo: string
          cumple: string
          estado: string
          foto: string
          id: string
          iniciales: string
          nombre: string
        }[]
      }
      es_contable: { Args: { _user_id: string }; Returns: boolean }
      es_gestor: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "Administrador"
        | "Recursos Humanos"
        | "Supervisor"
        | "Colaborador"
        | "Contabilidad"
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
      app_role: [
        "Administrador",
        "Recursos Humanos",
        "Supervisor",
        "Colaborador",
        "Contabilidad",
      ],
    },
  },
} as const
