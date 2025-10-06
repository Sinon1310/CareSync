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
          systolic?: number
          diastolic?: number
          status: 'normal' | 'warning' | 'critical'
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'blood_pressure' | 'blood_sugar' | 'heart_rate' | 'temperature'
          value: string
          systolic?: number
          diastolic?: number
          status?: 'normal' | 'warning' | 'critical'
          recorded_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'blood_pressure' | 'blood_sugar' | 'heart_rate' | 'temperature'
          value?: string
          systolic?: number
          diastolic?: number
          status?: 'normal' | 'warning' | 'critical'
          recorded_at?: string
          created_at?: string
        }
      }
      doctor_patient_relationships: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          patient_id?: string
          status?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'critical' | 'warning' | 'info' | 'appointment' | 'medication' | 'system'
          priority: 'low' | 'medium' | 'high' | 'critical'
          read: boolean
          action_url?: string | null
          metadata?: any
          created_at: string
          expires_at?: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'critical' | 'warning' | 'info' | 'appointment' | 'medication' | 'system'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          read?: boolean
          action_url?: string | null
          metadata?: any
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'critical' | 'warning' | 'info' | 'appointment' | 'medication' | 'system'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          read?: boolean
          action_url?: string | null
          metadata?: any
          created_at?: string
          expires_at?: string | null
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
      medications: {
        Row: {
          id: string
          patient_id: string
          prescribed_by: string | null
          name: string
          dosage: string
          frequency: string
          instructions: string | null
          start_date: string
          end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          prescribed_by?: string | null
          name: string
          dosage: string
          frequency: string
          instructions?: string | null
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          prescribed_by?: string | null
          name?: string
          dosage?: string
          frequency?: string
          instructions?: string | null
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      medication_logs: {
        Row: {
          id: string
          medication_id: string
          patient_id: string
          taken_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          medication_id: string
          patient_id: string
          taken_at: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          medication_id?: string
          patient_id?: string
          taken_at?: string
          notes?: string | null
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          title: string
          description: string | null
          appointment_date: string
          duration_minutes: number
          status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          meeting_link: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          title: string
          description?: string | null
          appointment_date: string
          duration_minutes?: number
          status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          meeting_link?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          patient_id?: string
          title?: string
          description?: string | null
          appointment_date?: string
          duration_minutes?: number
          status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          meeting_link?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type VitalReading = Database['public']['Tables']['vital_readings']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type DoctorPatient = Database['public']['Tables']['doctor_patient_relationships']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']