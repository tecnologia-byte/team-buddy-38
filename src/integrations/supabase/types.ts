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
      ajustes: {
        Row: {
          clave: string
          created_at: string
          updated_at: string
          valor: string
        }
        Insert: {
          clave: string
          created_at?: string
          updated_at?: string
          valor?: string
        }
        Update: {
          clave?: string
          created_at?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
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
          acceso_nomina: boolean
          area: string
          canal_avisos: string
          cargo: string
          clave_provisional: boolean
          clave_provisional_texto: string | null
          correo_alterno: string | null
          created_at: string
          cumple: string
          email: string
          estado: string
          estado_foto: string
          firma: string | null
          firma_actualizada: string | null
          firma_consentimiento_at: string | null
          firma_limite_pagos: number
          firma_pagos_restantes: number
          firma_permanente: boolean
          foto: string | null
          foto_pendiente: string | null
          id: string
          ingreso: string
          iniciales: string
          motivo_rechazo: string | null
          nombre: string
          salario: number
          telefono: string
          verificado: boolean
          verificado_at: string | null
          whatsapp: string
        }
        Insert: {
          acceso_nomina?: boolean
          area?: string
          canal_avisos?: string
          cargo?: string
          clave_provisional?: boolean
          clave_provisional_texto?: string | null
          correo_alterno?: string | null
          created_at?: string
          cumple?: string
          email?: string
          estado?: string
          estado_foto?: string
          firma?: string | null
          firma_actualizada?: string | null
          firma_consentimiento_at?: string | null
          firma_limite_pagos?: number
          firma_pagos_restantes?: number
          firma_permanente?: boolean
          foto?: string | null
          foto_pendiente?: string | null
          id: string
          ingreso?: string
          iniciales?: string
          motivo_rechazo?: string | null
          nombre?: string
          salario?: number
          telefono?: string
          verificado?: boolean
          verificado_at?: string | null
          whatsapp?: string
        }
        Update: {
          acceso_nomina?: boolean
          area?: string
          canal_avisos?: string
          cargo?: string
          clave_provisional?: boolean
          clave_provisional_texto?: string | null
          correo_alterno?: string | null
          created_at?: string
          cumple?: string
          email?: string
          estado?: string
          estado_foto?: string
          firma?: string | null
          firma_actualizada?: string | null
          firma_consentimiento_at?: string | null
          firma_limite_pagos?: number
          firma_pagos_restantes?: number
          firma_permanente?: boolean
          foto?: string | null
          foto_pendiente?: string | null
          id?: string
          ingreso?: string
          iniciales?: string
          motivo_rechazo?: string | null
          nombre?: string
          salario?: number
          telefono?: string
          verificado?: boolean
          verificado_at?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      solicitudes: {
        Row: {
          base_legal: string
          colaborador_id: string
          con_salario: boolean
          created_at: string
          dias: number
          estado: string
          fecha_fin: string
          fecha_inicio: string
          id: string
          motivo: string
          respondido_at: string | null
          respondido_por: string | null
          respuesta: string | null
          soporte: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          base_legal?: string
          colaborador_id: string
          con_salario?: boolean
          created_at?: string
          dias?: number
          estado?: string
          fecha_fin: string
          fecha_inicio: string
          id?: string
          motivo?: string
          respondido_at?: string | null
          respondido_por?: string | null
          respuesta?: string | null
          soporte?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          base_legal?: string
          colaborador_id?: string
          con_salario?: boolean
          created_at?: string
          dias?: number
          estado?: string
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          motivo?: string
          respondido_at?: string | null
          respondido_por?: string | null
          respuesta?: string | null
          soporte?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_respondido_por_fkey"
            columns: ["respondido_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
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
      tareas: {
        Row: {
          asignada_por: string | null
          colaborador_id: string
          completada: boolean
          completada_at: string | null
          created_at: string
          detalle: string
          id: string
          prioridad: string
          titulo: string
          updated_at: string
          vence: string | null
        }
        Insert: {
          asignada_por?: string | null
          colaborador_id: string
          completada?: boolean
          completada_at?: string | null
          created_at?: string
          detalle?: string
          id?: string
          prioridad?: string
          titulo: string
          updated_at?: string
          vence?: string | null
        }
        Update: {
          asignada_por?: string | null
          colaborador_id?: string
          completada?: boolean
          completada_at?: string | null
          created_at?: string
          detalle?: string
          id?: string
          prioridad?: string
          titulo?: string
          updated_at?: string
          vence?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tareas_asignada_por_fkey"
            columns: ["asignada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_colaborador_id_fkey"
            columns: ["colaborador_id"]
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
          verificado: boolean
        }[]
      }
      es_contable: { Args: { _user_id: string }; Returns: boolean }
      es_gestor: { Args: { _user_id: string }; Returns: boolean }
      es_nomina: { Args: { _user_id: string }; Returns: boolean }
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
