import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
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
      job_searches: {
        Row: {
          id: string
          user_id: string
          resume_id: string | null
          search_type: 'resume_based' | 'manual' | null
          search_keywords: any | null
          job_title: string | null
          location: string | null
          location_type: 'remote' | 'hybrid' | 'onsite' | 'any' | null
          salary_min: number | null
          salary_max: number | null
          experience_level: string | null
          search_date: string
          total_results: number
          status: string
        }
        Insert: {
          user_id: string
          resume_id?: string | null
          search_type?: 'resume_based' | 'manual' | null
          search_keywords?: any | null
          job_title?: string | null
          location?: string | null
          location_type?: 'remote' | 'hybrid' | 'onsite' | 'any' | null
          salary_min?: number | null
          salary_max?: number | null
          experience_level?: string | null
          total_results?: number
          status?: string
        }
        Update: {
          search_keywords?: any | null
          job_title?: string | null
          location?: string | null
          location_type?: 'remote' | 'hybrid' | 'onsite' | 'any' | null
          salary_min?: number | null
          salary_max?: number | null
          experience_level?: string | null
          total_results?: number
          status?: string
        }
      }
      job_search_results: {
        Row: {
          id: string
          search_id: string
          job_board: string
          job_title: string | null
          company_name: string | null
          location: string | null
          job_url: string | null
          job_description: string | null
          salary_range: string | null
          posted_date: string | null
          scraped_at: string
          relevance_score: number | null
        }
        Insert: {
          search_id: string
          job_board: string
          job_title?: string | null
          company_name?: string | null
          location?: string | null
          job_url?: string | null
          job_description?: string | null
          salary_range?: string | null
          posted_date?: string | null
          relevance_score?: number | null
        }
        Update: {
          job_title?: string | null
          company_name?: string | null
          location?: string | null
          job_url?: string | null
          job_description?: string | null
          salary_range?: string | null
          posted_date?: string | null
          relevance_score?: number | null
        }
      }
      job_boards: {
        Row: {
          id: string
          name: string
          base_url: string | null
          is_active: boolean | null
          scraper_config: any | null
          rate_limit_per_minute: number | null
        }
        Insert: {
          name: string
          base_url?: string | null
          is_active?: boolean | null
          scraper_config?: any | null
          rate_limit_per_minute?: number | null
        }
        Update: {
          name?: string
          base_url?: string | null
          is_active?: boolean | null
          scraper_config?: any | null
          rate_limit_per_minute?: number | null
        }
      }
    }
  }
}