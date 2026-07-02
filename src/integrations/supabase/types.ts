export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      global_trends: {
        Row: {
          category: string;
          content_ready: boolean;
          created_at: string;
          dedup_key: string;
          freshness: number;
          id: string;
          platform_signals: string[];
          popularity: number;
          published_at: string | null;
          source_name: string | null;
          source_url: string | null;
          sub_tags: string[];
          summary: string | null;
          synced_at: string;
          title: string;
        };
        Insert: {
          category: string;
          content_ready?: boolean;
          created_at?: string;
          dedup_key: string;
          freshness?: number;
          id?: string;
          platform_signals?: string[];
          popularity?: number;
          published_at?: string | null;
          source_name?: string | null;
          source_url?: string | null;
          sub_tags?: string[];
          summary?: string | null;
          synced_at?: string;
          title: string;
        };
        Update: {
          category?: string;
          content_ready?: boolean;
          created_at?: string;
          dedup_key?: string;
          freshness?: number;
          id?: string;
          platform_signals?: string[];
          popularity?: number;
          published_at?: string | null;
          source_name?: string | null;
          source_url?: string | null;
          sub_tags?: string[];
          summary?: string | null;
          synced_at?: string;
          title?: string;
        };
        Relationships: [];
      };
      camera_presets: {
        Row: {
          best_for: string[];
          camera_type: string;
          created_at: string;
          focus: string;
          framing: string;
          id: string;
          is_default: boolean;
          lens: string;
          movement: string;
          preset_key: string;
          preset_name: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          best_for?: string[];
          camera_type: string;
          created_at?: string;
          focus: string;
          framing: string;
          id?: string;
          is_default?: boolean;
          lens: string;
          movement: string;
          preset_key: string;
          preset_name: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          best_for?: string[];
          camera_type?: string;
          created_at?: string;
          focus?: string;
          framing?: string;
          id?: string;
          is_default?: boolean;
          lens?: string;
          movement?: string;
          preset_key?: string;
          preset_name?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      generated_variations: {
        Row: {
          camera: Json;
          compiled_prompt: string;
          created_at: string;
          cta: string;
          hook: Json;
          id: string;
          model_route: Json;
          motion: Json;
          persona: Json;
          prompt_schema: Json;
          render_history_id: string | null;
          score: number;
          script: Json;
          title: string;
          user_id: string;
          variation_index: number;
        };
        Insert: {
          camera?: Json;
          compiled_prompt: string;
          created_at?: string;
          cta: string;
          hook?: Json;
          id?: string;
          model_route?: Json;
          motion?: Json;
          persona?: Json;
          prompt_schema?: Json;
          render_history_id?: string | null;
          score: number;
          script?: Json;
          title: string;
          user_id: string;
          variation_index: number;
        };
        Update: {
          camera?: Json;
          compiled_prompt?: string;
          created_at?: string;
          cta?: string;
          hook?: Json;
          id?: string;
          model_route?: Json;
          motion?: Json;
          persona?: Json;
          prompt_schema?: Json;
          render_history_id?: string | null;
          score?: number;
          script?: Json;
          title?: string;
          user_id?: string;
          variation_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: "generated_variations_render_history_id_fkey";
            columns: ["render_history_id"];
            isOneToOne: false;
            referencedRelation: "render_history";
            referencedColumns: ["id"];
          },
        ];
      };
      higgsfield_scripts: {
        Row: {
          created_at: string;
          cta: string;
          duration_seconds: number;
          framework: string;
          full_script: string;
          hook: string;
          id: string;
          metadata: Json;
          problem: string;
          proof: string;
          render_history_id: string | null;
          solution: string;
          style: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          cta: string;
          duration_seconds: number;
          framework: string;
          full_script: string;
          hook: string;
          id?: string;
          metadata?: Json;
          problem: string;
          proof: string;
          render_history_id?: string | null;
          solution: string;
          style: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          cta?: string;
          duration_seconds?: number;
          framework?: string;
          full_script?: string;
          hook?: string;
          id?: string;
          metadata?: Json;
          problem?: string;
          proof?: string;
          render_history_id?: string | null;
          solution?: string;
          style?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "higgsfield_scripts_render_history_id_fkey";
            columns: ["render_history_id"];
            isOneToOne: false;
            referencedRelation: "render_history";
            referencedColumns: ["id"];
          },
        ];
      };
      hooks: {
        Row: {
          category: string;
          created_at: string;
          hook: string;
          id: string;
          intelligence: Json;
          platform: string;
          predicted_engagement_score: number;
          reason: string | null;
          render_history_id: string | null;
          user_id: string | null;
        };
        Insert: {
          category: string;
          created_at?: string;
          hook: string;
          id?: string;
          intelligence?: Json;
          platform: string;
          predicted_engagement_score: number;
          reason?: string | null;
          render_history_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string;
          hook?: string;
          id?: string;
          intelligence?: Json;
          platform?: string;
          predicted_engagement_score?: number;
          reason?: string | null;
          render_history_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "hooks_render_history_id_fkey";
            columns: ["render_history_id"];
            isOneToOne: false;
            referencedRelation: "render_history";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          created_at: string;
          id: string;
          parts: Json;
          role: string;
          thread_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          parts: Json;
          role: string;
          thread_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          parts?: Json;
          role?: string;
          thread_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "threads";
            referencedColumns: ["id"];
          },
        ];
      };
      motion_presets: {
        Row: {
          created_at: string;
          id: string;
          instructions: string;
          intensity: string;
          is_default: boolean;
          preset_key: string;
          primary_motion: string;
          secondary_motion: string;
          timing: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          instructions: string;
          intensity: string;
          is_default?: boolean;
          preset_key: string;
          primary_motion: string;
          secondary_motion: string;
          timing: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          instructions?: string;
          intensity?: string;
          is_default?: boolean;
          preset_key?: string;
          primary_motion?: string;
          secondary_motion?: string;
          timing?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      negative_prompts: {
        Row: {
          created_at: string;
          id: string;
          is_default: boolean;
          items: string[];
          model: string;
          prompt: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_default?: boolean;
          items?: string[];
          model: string;
          prompt: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_default?: boolean;
          items?: string[];
          model?: string;
          prompt?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      personas: {
        Row: {
          accent: string;
          age: number;
          appearance: string;
          created_at: string;
          creator_style: string;
          energy: string;
          gender: string;
          id: string;
          is_default: boolean;
          metadata: Json;
          persona_key: string;
          persona_name: string;
          speaking_speed: string;
          tone: string;
          trust_level: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          accent: string;
          age: number;
          appearance: string;
          created_at?: string;
          creator_style: string;
          energy: string;
          gender: string;
          id?: string;
          is_default?: boolean;
          metadata?: Json;
          persona_key: string;
          persona_name: string;
          speaking_speed: string;
          tone: string;
          trust_level: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          accent?: string;
          age?: number;
          appearance?: string;
          created_at?: string;
          creator_style?: string;
          energy?: string;
          gender?: string;
          id?: string;
          is_default?: boolean;
          metadata?: Json;
          persona_key?: string;
          persona_name?: string;
          speaking_speed?: string;
          tone?: string;
          trust_level?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      presets: {
        Row: {
          audience: string | null;
          created_at: string;
          default_voice_id: string | null;
          default_voice_name: string | null;
          id: string;
          is_active: boolean;
          language: string | null;
          name: string;
          niche: string | null;
          tone: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          audience?: string | null;
          created_at?: string;
          default_voice_id?: string | null;
          default_voice_name?: string | null;
          id?: string;
          is_active?: boolean;
          language?: string | null;
          name: string;
          niche?: string | null;
          tone?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          audience?: string | null;
          created_at?: string;
          default_voice_id?: string | null;
          default_voice_name?: string | null;
          id?: string;
          is_active?: boolean;
          language?: string | null;
          name?: string;
          niche?: string | null;
          tone?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      render_history: {
        Row: {
          brief: string;
          camera: Json;
          compiled_prompt: string;
          created_at: string;
          duration_seconds: number;
          engine: string;
          error_message: string | null;
          generation: Json;
          id: string;
          intelligence: Json;
          intent: Json;
          model_route: Json;
          motion: Json;
          negative_prompt: Json;
          output_format: string;
          persona: Json;
          platform: string;
          product_name: string;
          prompt_schema: Json;
          request: Json;
          script: Json;
          status: string;
          user_id: string;
        };
        Insert: {
          brief: string;
          camera?: Json;
          compiled_prompt: string;
          created_at?: string;
          duration_seconds: number;
          engine?: string;
          error_message?: string | null;
          generation?: Json;
          id?: string;
          intelligence?: Json;
          intent?: Json;
          model_route?: Json;
          motion?: Json;
          negative_prompt?: Json;
          output_format?: string;
          persona?: Json;
          platform: string;
          product_name: string;
          prompt_schema?: Json;
          request?: Json;
          script?: Json;
          status?: string;
          user_id: string;
        };
        Update: {
          brief?: string;
          camera?: Json;
          compiled_prompt?: string;
          created_at?: string;
          duration_seconds?: number;
          engine?: string;
          error_message?: string | null;
          generation?: Json;
          id?: string;
          intelligence?: Json;
          intent?: Json;
          model_route?: Json;
          motion?: Json;
          negative_prompt?: Json;
          output_format?: string;
          persona?: Json;
          platform?: string;
          product_name?: string;
          prompt_schema?: Json;
          request?: Json;
          script?: Json;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      scripts: {
        Row: {
          created_at: string;
          data: Json;
          engine: string;
          folder: string | null;
          id: string;
          model_route: Json | null;
          prompt_schema: Json | null;
          source_render_id: string | null;
          thread_id: string | null;
          topic: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          data: Json;
          engine?: string;
          folder?: string | null;
          id?: string;
          model_route?: Json | null;
          prompt_schema?: Json | null;
          source_render_id?: string | null;
          thread_id?: string | null;
          topic: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          data?: Json;
          engine?: string;
          folder?: string | null;
          id?: string;
          model_route?: Json | null;
          prompt_schema?: Json | null;
          source_render_id?: string | null;
          thread_id?: string | null;
          topic?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scripts_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "threads";
            referencedColumns: ["id"];
          },
        ];
      };
      threads: {
        Row: {
          context_brief: string | null;
          created_at: string;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          context_brief?: string | null;
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          context_brief?: string | null;
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      trend_sync_runs: {
        Row: {
          error_msg: string | null;
          finished_at: string | null;
          id: string;
          started_at: string;
          status: string;
          trends_added: number;
        };
        Insert: {
          error_msg?: string | null;
          finished_at?: string | null;
          id?: string;
          started_at?: string;
          status?: string;
          trends_added?: number;
        };
        Update: {
          error_msg?: string | null;
          finished_at?: string | null;
          id?: string;
          started_at?: string;
          status?: string;
          trends_added?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
