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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_state: {
        Row: {
          chave: string
          dados: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          chave: string
          dados?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          chave?: string
          dados?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      folha_competencia: {
        Row: {
          aprendizes: number
          atualizado_por: string | null
          carteira: string
          codigo_dominio: string
          competencia: string
          created_at: string
          data_publicacao: string
          empregados: number
          empresa_codigo: string
          empresa_nome: string
          id: string
          observacoes: string
          responsavel: string
          status: string
          tipo_ponto: string
          updated_at: string
        }
        Insert: {
          aprendizes?: number
          atualizado_por?: string | null
          carteira?: string
          codigo_dominio?: string
          competencia: string
          created_at?: string
          data_publicacao?: string
          empregados?: number
          empresa_codigo: string
          empresa_nome?: string
          id?: string
          observacoes?: string
          responsavel?: string
          status?: string
          tipo_ponto?: string
          updated_at?: string
        }
        Update: {
          aprendizes?: number
          atualizado_por?: string | null
          carteira?: string
          codigo_dominio?: string
          competencia?: string
          created_at?: string
          data_publicacao?: string
          empregados?: number
          empresa_codigo?: string
          empresa_nome?: string
          id?: string
          observacoes?: string
          responsavel?: string
          status?: string
          tipo_ponto?: string
          updated_at?: string
        }
        Relationships: []
      }
      folha_etapas: {
        Row: {
          atualizado_por: string | null
          codigo_dominio: string
          competencia: string
          concluida: boolean
          created_at: string
          data_conclusao: string | null
          empresa_codigo: string
          empresa_nome: string
          etapa: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          atualizado_por?: string | null
          codigo_dominio?: string
          competencia: string
          concluida?: boolean
          created_at?: string
          data_conclusao?: string | null
          empresa_codigo: string
          empresa_nome?: string
          etapa: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          atualizado_por?: string | null
          codigo_dominio?: string
          competencia?: string
          concluida?: boolean
          created_at?: string
          data_conclusao?: string | null
          empresa_codigo?: string
          empresa_nome?: string
          etapa?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      folha_etapas_historico: {
        Row: {
          alterado_em: string
          alterado_por: string | null
          codigo_dominio: string
          competencia: string
          empresa_codigo: string
          empresa_nome: string
          etapa: string
          id: string
          status_anterior: string | null
          status_novo: string
        }
        Insert: {
          alterado_em?: string
          alterado_por?: string | null
          codigo_dominio?: string
          competencia: string
          empresa_codigo: string
          empresa_nome?: string
          etapa: string
          id?: string
          status_anterior?: string | null
          status_novo: string
        }
        Update: {
          alterado_em?: string
          alterado_por?: string | null
          codigo_dominio?: string
          competencia?: string
          empresa_codigo?: string
          empresa_nome?: string
          etapa?: string
          id?: string
          status_anterior?: string | null
          status_novo?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          created_at: string
          departamento: string
          email: string
          id: string
          nome: string
          perfil: Database["public"]["Enums"]["app_perfil"]
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          departamento?: string
          email: string
          id: string
          nome?: string
          perfil?: Database["public"]["Enums"]["app_perfil"]
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          departamento?: string
          email?: string
          id?: string
          nome?: string
          perfil?: Database["public"]["Enums"]["app_perfil"]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      existe_usuario: { Args: never; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_gestao: { Args: { _user_id: string }; Returns: boolean }
      is_usuario_ativo: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_perfil:
        | "Administrador"
        | "Coordenador"
        | "Supervisor"
        | "Analista"
        | "Gerente"
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
      app_perfil: [
        "Administrador",
        "Coordenador",
        "Supervisor",
        "Analista",
        "Gerente",
      ],
    },
  },
} as const
