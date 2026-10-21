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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      cliente: {
        Row: {
          creado_en: string
          creado_por: string | null
          cuit: string
          id: string
          nombre: string
          razon_social: string
        }
        Insert: {
          creado_en?: string
          creado_por?: string | null
          cuit: string
          id?: string
          nombre: string
          razon_social: string
        }
        Update: {
          creado_en?: string
          creado_por?: string | null
          cuit?: string
          id?: string
          nombre?: string
          razon_social?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      control: {
        Row: {
          equipo_id: string | null
          estado: Database["public"]["Enums"]["estado_control"]
          id: string
          local_id: string
          motivo_estado: string | null
          tipo_control_id: string
          ultima_fecha: string | null
          ultimo_ejecutor: string | null
          vencimiento: string | null
        }
        Insert: {
          equipo_id?: string | null
          estado?: Database["public"]["Enums"]["estado_control"]
          id?: string
          local_id: string
          motivo_estado?: string | null
          tipo_control_id: string
          ultima_fecha?: string | null
          ultimo_ejecutor?: string | null
          vencimiento?: string | null
        }
        Update: {
          equipo_id?: string | null
          estado?: Database["public"]["Enums"]["estado_control"]
          id?: string
          local_id?: string
          motivo_estado?: string | null
          tipo_control_id?: string
          ultima_fecha?: string | null
          ultimo_ejecutor?: string | null
          vencimiento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "control_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "local"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_tipo_control_id_fkey"
            columns: ["tipo_control_id"]
            isOneToOne: false
            referencedRelation: "tipo_control"
            referencedColumns: ["id"]
          },
        ]
      }
      equipo: {
        Row: {
          codigo: string
          creado_en: string
          creado_por: string | null
          detalle: string | null
          estado: Database["public"]["Enums"]["estado_equipo"]
          id: string
          local_id: string
          qr_token: string
          tipo_equipo_id: string
          ubicacion: string
        }
        Insert: {
          codigo: string
          creado_en?: string
          creado_por?: string | null
          detalle?: string | null
          estado?: Database["public"]["Enums"]["estado_equipo"]
          id?: string
          local_id: string
          qr_token?: string
          tipo_equipo_id: string
          ubicacion?: string
        }
        Update: {
          codigo?: string
          creado_en?: string
          creado_por?: string | null
          detalle?: string | null
          estado?: Database["public"]["Enums"]["estado_equipo"]
          id?: string
          local_id?: string
          qr_token?: string
          tipo_equipo_id?: string
          ubicacion?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipo_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipo_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "local"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipo_tipo_equipo_id_fkey"
            columns: ["tipo_equipo_id"]
            isOneToOne: false
            referencedRelation: "tipo_equipo"
            referencedColumns: ["id"]
          },
        ]
      }
      local: {
        Row: {
          barrio: string
          cliente_id: string
          creado_en: string
          creado_por: string | null
          direccion: string
          encargado_nombre: string
          encargado_telefono: string
          horario_acceso: string
          id: string
          nombre: string
          requisitos_acceso: string | null
          rubro: Database["public"]["Enums"]["rubro"]
          supervisor_id: string | null
        }
        Insert: {
          barrio: string
          cliente_id: string
          creado_en?: string
          creado_por?: string | null
          direccion: string
          encargado_nombre?: string
          encargado_telefono?: string
          horario_acceso?: string
          id?: string
          nombre: string
          requisitos_acceso?: string | null
          rubro: Database["public"]["Enums"]["rubro"]
          supervisor_id?: string | null
        }
        Update: {
          barrio?: string
          cliente_id?: string
          creado_en?: string
          creado_por?: string | null
          direccion?: string
          encargado_nombre?: string
          encargado_telefono?: string
          horario_acceso?: string
          id?: string
          nombre?: string
          requisitos_acceso?: string | null
          rubro?: Database["public"]["Enums"]["rubro"]
          supervisor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "local_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido: {
        Row: {
          canal: Database["public"]["Enums"]["canal_pedido"]
          creado_en: string
          creado_por: string | null
          detalle: string
          estado: Database["public"]["Enums"]["estado_pedido"]
          id: string
          local_id: string
          resuelto_en: string | null
          sla_vence_en: string
          titulo: string
          urgencia: Database["public"]["Enums"]["urgencia_pedido"]
        }
        Insert: {
          canal: Database["public"]["Enums"]["canal_pedido"]
          creado_en?: string
          creado_por?: string | null
          detalle?: string
          estado?: Database["public"]["Enums"]["estado_pedido"]
          id?: string
          local_id: string
          resuelto_en?: string | null
          sla_vence_en: string
          titulo: string
          urgencia?: Database["public"]["Enums"]["urgencia_pedido"]
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal_pedido"]
          creado_en?: string
          creado_por?: string | null
          detalle?: string
          estado?: Database["public"]["Enums"]["estado_pedido"]
          id?: string
          local_id?: string
          resuelto_en?: string | null
          sla_vence_en?: string
          titulo?: string
          urgencia?: Database["public"]["Enums"]["urgencia_pedido"]
        }
        Relationships: [
          {
            foreignKeyName: "pedido_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "local"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil: {
        Row: {
          activo: boolean
          creado_en: string
          debe_cambiar_clave: boolean
          email: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          usuario: string | null
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          debe_cambiar_clave?: boolean
          email: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          usuario?: string | null
        }
        Update: {
          activo?: boolean
          creado_en?: string
          debe_cambiar_clave?: boolean
          email?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          usuario?: string | null
        }
        Relationships: []
      }
      registro: {
        Row: {
          control_id: string
          creado_en: string
          creado_por: string | null
          ejecutor: string
          fecha: string
          id: string
          local_id: string
          nota: string | null
          oblea: string | null
          origen: Database["public"]["Enums"]["origen_registro"]
          resultado: Database["public"]["Enums"]["resultado_registro"]
          vencimiento_anterior: string | null
          vencimiento_nuevo: string | null
        }
        Insert: {
          control_id: string
          creado_en?: string
          creado_por?: string | null
          ejecutor: string
          fecha: string
          id?: string
          local_id: string
          nota?: string | null
          oblea?: string | null
          origen?: Database["public"]["Enums"]["origen_registro"]
          resultado: Database["public"]["Enums"]["resultado_registro"]
          vencimiento_anterior?: string | null
          vencimiento_nuevo?: string | null
        }
        Update: {
          control_id?: string
          creado_en?: string
          creado_por?: string | null
          ejecutor?: string
          fecha?: string
          id?: string
          local_id?: string
          nota?: string | null
          oblea?: string | null
          origen?: Database["public"]["Enums"]["origen_registro"]
          resultado?: Database["public"]["Enums"]["resultado_registro"]
          vencimiento_anterior?: string | null
          vencimiento_nuevo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registro_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "control"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registro_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registro_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "local"
            referencedColumns: ["id"]
          },
        ]
      }
      tipo_control: {
        Row: {
          activo: boolean
          anticipacion_dias: number
          aplica_al_local: boolean
          base: Database["public"]["Enums"]["base_recalculo"]
          depende_de_unidad: boolean
          ejecutor: Database["public"]["Enums"]["ejecutor_tipo"]
          evidencia: string[]
          id: string
          nombre: string
          norma: string | null
          periodo_unidad: Database["public"]["Enums"]["periodo_unidad"]
          periodo_valor: number | null
          texto_hecho: string
          verbo: string
        }
        Insert: {
          activo?: boolean
          anticipacion_dias?: number
          aplica_al_local?: boolean
          base?: Database["public"]["Enums"]["base_recalculo"]
          depende_de_unidad?: boolean
          ejecutor?: Database["public"]["Enums"]["ejecutor_tipo"]
          evidencia?: string[]
          id?: string
          nombre: string
          norma?: string | null
          periodo_unidad: Database["public"]["Enums"]["periodo_unidad"]
          periodo_valor?: number | null
          texto_hecho: string
          verbo: string
        }
        Update: {
          activo?: boolean
          anticipacion_dias?: number
          aplica_al_local?: boolean
          base?: Database["public"]["Enums"]["base_recalculo"]
          depende_de_unidad?: boolean
          ejecutor?: Database["public"]["Enums"]["ejecutor_tipo"]
          evidencia?: string[]
          id?: string
          nombre?: string
          norma?: string | null
          periodo_unidad?: Database["public"]["Enums"]["periodo_unidad"]
          periodo_valor?: number | null
          texto_hecho?: string
          verbo?: string
        }
        Relationships: []
      }
      tipo_control_equipo: {
        Row: {
          tipo_control_id: string
          tipo_equipo_id: string
        }
        Insert: {
          tipo_control_id: string
          tipo_equipo_id: string
        }
        Update: {
          tipo_control_id?: string
          tipo_equipo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipo_control_equipo_tipo_control_id_fkey"
            columns: ["tipo_control_id"]
            isOneToOne: false
            referencedRelation: "tipo_control"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tipo_control_equipo_tipo_equipo_id_fkey"
            columns: ["tipo_equipo_id"]
            isOneToOne: false
            referencedRelation: "tipo_equipo"
            referencedColumns: ["id"]
          },
        ]
      }
      tipo_equipo: {
        Row: {
          activo: boolean
          id: string
          nombre: string
          usa_unidad: boolean
        }
        Insert: {
          activo?: boolean
          id?: string
          nombre: string
          usa_unidad?: boolean
        }
        Update: {
          activo?: boolean
          id?: string
          nombre?: string
          usa_unidad?: boolean
        }
        Relationships: []
      }
      unidad: {
        Row: {
          equipo_id: string
          fabricacion: string
          id: string
          instalada_desde: string
          retirada_en: string | null
          serie: string
        }
        Insert: {
          equipo_id: string
          fabricacion: string
          id?: string
          instalada_desde: string
          retirada_en?: string | null
          serie: string
        }
        Update: {
          equipo_id?: string
          fabricacion?: string
          id?: string
          instalada_desde?: string
          retirada_en?: string | null
          serie?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidad_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipo"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cerrar_sesiones: { Args: { p_usuario: string }; Returns: undefined }
      reemplazar_unidad: {
        Args: {
          p_desde: string
          p_equipo: string
          p_fabricacion: string
          p_serie: string
        }
        Returns: string
      }
      registrar_control: {
        Args: {
          p_control: string
          p_ejecutor: string
          p_fecha: string
          p_fecha_tarjeta?: string
          p_nota?: string
          p_oblea?: string
          p_resultado: Database["public"]["Enums"]["resultado_registro"]
        }
        Returns: string
      }
    }
    Enums: {
      base_recalculo: "desde_ejecucion" | "desde_vencimiento"
      canal_pedido: "portal" | "whatsapp" | "telefono"
      ejecutor_tipo: "scp" | "tercero"
      estado_control: "activo" | "no_aplica"
      estado_equipo: "activo" | "en_servicio_externo" | "baja"
      estado_pedido: "nuevo" | "aceptado" | "programado" | "resuelto"
      origen_registro: "calculado" | "certificado" | "relevamiento"
      periodo_unidad: "dia" | "mes" | "anio" | "manual"
      resultado_registro:
        | "ok"
        | "reemplazo"
        | "observado"
        | "no_apto"
        | "no_realizado"
      rol_usuario: "admin" | "supervisor"
      rubro: "gastronomico" | "retail" | "farmacia" | "oficina" | "otro"
      urgencia_pedido: "emergencia" | "urgente" | "normal"
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
      base_recalculo: ["desde_ejecucion", "desde_vencimiento"],
      canal_pedido: ["portal", "whatsapp", "telefono"],
      ejecutor_tipo: ["scp", "tercero"],
      estado_control: ["activo", "no_aplica"],
      estado_equipo: ["activo", "en_servicio_externo", "baja"],
      estado_pedido: ["nuevo", "aceptado", "programado", "resuelto"],
      origen_registro: ["calculado", "certificado", "relevamiento"],
      periodo_unidad: ["dia", "mes", "anio", "manual"],
      resultado_registro: [
        "ok",
        "reemplazo",
        "observado",
        "no_apto",
        "no_realizado",
      ],
      rol_usuario: ["admin", "supervisor"],
      rubro: ["gastronomico", "retail", "farmacia", "oficina", "otro"],
      urgencia_pedido: ["emergencia", "urgente", "normal"],
    },
  },
} as const
