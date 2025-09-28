import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ndgstkcqxpmbvuauhlgx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZ3N0a2NxeHBtYnZ1YXVobGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTg2NDQsImV4cCI6MjA3NDUzNDY0NH0.Yx89gUTcW14z11_pOQkckzcCJmWnfhOOKkq0gOQvr0M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'patient' | 'doctor'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'patient' | 'doctor'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'patient' | 'doctor'
          created_at?: string
          updated_at?: string
        }
      }
      vital_readings: {
        Row: {
          id: string
          user_id: string
          type: 'blood_pressure' | 'blood_sugar' | 'heart_rate' | 'temperature'
          value: string
          status: 'normal' | 'warning' | 'critical'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'blood_pressure' | 'blood_sugar' | 'heart_rate' | 'temperature'
          value: string
          status?: 'normal' | 'warning' | 'critical'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'blood_pressure' | 'blood_sugar' | 'heart_rate' | 'temperature'
          value?: string
          status?: 'normal' | 'warning' | 'critical'
          created_at?: string
        }
      }
      doctor_patients: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          created_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          patient_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          sender_role: 'patient' | 'doctor'
          sender_name: string
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          sender_role: 'patient' | 'doctor'
          sender_name: string
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          sender_role?: 'patient' | 'doctor'
          sender_name?: string
          created_at?: string
        }
      }
    }
  }
}

export type VitalReading = Database['public']['Tables']['vital_readings']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type DoctorPatient = Database['public']['Tables']['doctor_patients']['Row']
export type Message = Database['public']['Tables']['messages']['Row']