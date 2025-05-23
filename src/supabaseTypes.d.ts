export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          screenshot_key: string | null;
          story: Json | null;
          title: string | null;
          updated_at: string;
          url: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          screenshot_key?: string | null;
          story?: Json | null;
          title?: string | null;
          updated_at?: string;
          url: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          screenshot_key?: string | null;
          story?: Json | null;
          title?: string | null;
          updated_at?: string;
          url?: string;
          user_id?: string;
        };
      };
      briefings: {
        Row: {
          contents: Json;
          created_at: string | null;
          id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          contents: Json;
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          contents?: Json;
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
      };
    };
    Views: {
      queued_bookmarks: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          id: string | null;
          screenshot_key: string | null;
          story: Json | null;
          title: string | null;
          updated_at: string | null;
          url: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string | null;
          screenshot_key?: string | null;
          story?: Json | null;
          title?: string | null;
          updated_at?: string | null;
          url?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string | null;
          screenshot_key?: string | null;
          story?: Json | null;
          title?: string | null;
          updated_at?: string | null;
          url?: string | null;
          user_id?: string | null;
        };
      };
      users: {
        Row: {
          email: string | null;
          id: string | null;
        };
        Insert: {
          email?: string | null;
          id?: string | null;
        };
        Update: {
          email?: string | null;
          id?: string | null;
        };
      };
    };
    Functions: {
      bookmark_by_id: {
        Args: {
          id: string;
        };
        Returns: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          screenshot_key: string | null;
          story: Json | null;
          title: string | null;
          updated_at: string;
          url: string;
          user_id: string;
        };
      };
      briefing_bookmarks: {
        Args: {
          briefing_id: string;
        };
        Returns: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          screenshot_key: string | null;
          story: Json | null;
          title: string | null;
          updated_at: string;
          url: string;
          user_id: string;
        }[];
      };
      briefing_by_id: {
        Args: {
          id: string;
        };
        Returns: {
          contents: Json;
          created_at: string | null;
          id: string;
          updated_at: string | null;
          user_id: string;
        };
      };
      delete_bookmark_by_url: {
        Args: {
          url_to_remove: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          owner: string | null;
          public: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          name: string;
          owner?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          owner?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      extension: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      filename: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      foldername: {
        Args: {
          name: string;
        };
        Returns: string[];
      };
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>;
        Returns: {
          size: number;
          bucket_id: string;
        }[];
      };
      search: {
        Args: {
          prefix: string;
          bucketname: string;
          limits?: number;
          levels?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
