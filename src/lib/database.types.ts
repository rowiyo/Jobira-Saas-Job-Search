export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
        }
        Update: {
          first_name?: string | null
          last_name?: string | null
          updated_at?: string
        }
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          filename: string
          file_path: string
          file_size: number | null
          parsed_content: string | null
          extracted_keywords: any | null
          upload_date: string
          is_active: boolean
          is_ats_optimized?: boolean
        }
        Insert: {
          user_id: string
          filename: string
          file_path: string
          file_size?: number | null
          parsed_content?: string | null
          extracted_keywords?: any | null
          is_active?: boolean
        }
        Update: {
          filename?: string
          file_path?: string
          parsed_content?: string | null
          extracted_keywords?: any | null
          is_active?: boolean
        }
      }
      // ... rest of your types
    }
  }
}