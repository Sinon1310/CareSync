import { supabase } from './supabase'

// Types
export interface VitalReading {
  id: string
  user_id: string
  type: 'blood_pressure' | 'blood_sugar' | 'heart_rate' | 'weight' | 'temperature' | 'oxygen_saturation'
  value: string
  systolic?: number
  diastolic?: number
  unit?: string
  notes?: string
  status: 'normal' | 'warning' | 'critical'
  recorded_at: string
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  message_type: 'text' | 'alert' | 'appointment'
  read_at?: string
  created_at: string
  sender?: {
    full_name: string
    role: string
  }
  receiver?: {
    full_name: string
    role: string
  }
}

export interface Appointment {
  id: string
  doctor_id: string
  patient_id: string
  title: string
  description?: string
  appointment_date: string
  duration_minutes: number
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  meeting_link?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface DoctorPatient {
  id: string
  doctor_id: string
  patient_id: string
  assigned_at: string
  status: 'active' | 'inactive'
  patient?: {
    id: string
    full_name: string
    email: string
  }
}

export interface Medication {
  id: string
  user_id: string
  prescribed_by?: string | null
  name: string
  dosage: string
  frequency: string
  instructions?: string | null
  start_date: string
  end_date?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MedicationLog {
  id: string
  medication_id: string
  user_id: string
  taken_at: string
  notes?: string | null
  created_at: string
}

// Vital Readings Service
export const vitalReadingsService = {
  // Get vital readings for a user
  async getByUserId(userId: string, limit = 50) {
    console.log('Fetching vital readings for user:', userId);
    const { data, error } = await supabase
      .from('vital_readings')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Supabase error fetching vital readings:', error);
      throw new Error(`Failed to fetch vital readings: ${error.message}`);
    }
    
    console.log('Successfully fetched vital readings:', data?.length || 0, 'records');
    return data as VitalReading[]
  },

  // Add a new vital reading
  async create(reading: Omit<VitalReading, 'id' | 'created_at'>) {
    console.log('Creating reading in DB:', reading);
    const { data, error } = await supabase
      .from('vital_readings')
      .insert(reading)
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating vital reading:', error);
      throw new Error(`Failed to save vital reading: ${error.message}`);
    }
    
    console.log('Successfully created vital reading:', data);
    return data as VitalReading
  },

  // Get recent readings by type
  async getRecentByType(userId: string, type: VitalReading['type'], days = 30) {
    const { data, error } = await supabase
      .from('vital_readings')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .gte('recorded_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: true })

    if (error) throw error
    return data as VitalReading[]
  },

  // Subscribe to real-time updates
  subscribeToUserReadings(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('vital_readings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vital_readings',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}

// Messages Service
export const messagesService = {
  // Get conversation between two users
  async getConversation(userId1: string, userId2: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(full_name, role),
        receiver:profiles!messages_receiver_id_fkey(full_name, role)
      `)
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Message[]
  },

  // Send a message
  async send(message: Omit<Message, 'id' | 'created_at' | 'sender' | 'receiver'>) {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single()

    if (error) throw error
    return data as Message
  },

  // Mark message as read
  async markAsRead(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)

    if (error) throw error
  },

  // Subscribe to real-time messages
  subscribeToConversation(userId1: string, userId2: string, callback: (payload: any) => void) {
    return supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1}))`
        },
        callback
      )
      .subscribe()
  }
}

// Doctor-Patient Service
export const doctorPatientService = {
  // Get patients for a doctor
  async getPatientsByDoctorId(doctorId: string) {
    const { data, error } = await supabase
      .from('doctor_patient_relationships')
      .select(`
        *,
        patient:profiles!doctor_patient_relationships_patient_id_fkey(id, full_name, email, role)
      `)
      .eq('doctor_id', doctorId)
      .eq('status', 'active')

    if (error) throw error
    return data as DoctorPatient[]
  },

  // Get doctors for a patient
  async getDoctorsByPatientId(patientId: string) {
    const { data, error } = await supabase
      .from('doctor_patient_relationships')
      .select(`
        *,
        doctor:profiles!doctor_patient_relationships_doctor_id_fkey(id, full_name, email, role)
      `)
      .eq('patient_id', patientId)
      .eq('status', 'active')

    if (error) throw error
    return data
  },

  // Assign patient to doctor
  async assignPatient(doctorId: string, patientId: string) {
    const { data, error } = await supabase
      .from('doctor_patient_relationships')
      .insert({
        doctor_id: doctorId,
        patient_id: patientId,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Search for patients to assign
  async searchPatients(searchTerm: string, doctorId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('role', 'patient')
      .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .not('id', 'in', `(SELECT patient_id FROM doctor_patient_relationships WHERE doctor_id = '${doctorId}' AND status = 'active')`)
      .limit(10)

    if (error) throw error
    return data
  }
}

// Appointments Service
export const appointmentsService = {
  // Get appointments for a user
  async getByUserId(userId: string, role: 'doctor' | 'patient') {
    const column = role === 'doctor' ? 'doctor_id' : 'patient_id'
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor:profiles!appointments_doctor_id_fkey(full_name, email),
        patient:profiles!appointments_patient_id_fkey(full_name, email)
      `)
      .eq(column, userId)
      .order('appointment_date', { ascending: true })

    if (error) throw error
    return data
  },

  // Create appointment
  async create(appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        ...appointment,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update appointment status
  async updateStatus(id: string, status: Appointment['status']) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Profiles Service
export const profilesService = {
  // Get profile by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Update profile
  async update(id: string, updates: Partial<any>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Search profiles by role
  async searchByRole(role: 'doctor' | 'patient', query?: string) {
    let queryBuilder = supabase
      .from('profiles')
      .select('*')
      .eq('role', role)

    if (query) {
      queryBuilder = queryBuilder.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    }

    const { data, error } = await queryBuilder
    if (error) throw error
    return data
  }
}

// Medications Service
export const medicationsService = {
  // Get medications for a user
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Medication[]
  },

  // Legacy method for backward compatibility
  async getByPatientId(patientId: string) {
    return this.getByUserId(patientId)
  },

  // Add a new medication
  async create(medication: Omit<Medication, 'id' | 'created_at' | 'updated_at'>) {
    console.log('Creating medication in DB:', medication);
    const { data, error } = await supabase
      .from('medications')
      .insert({
        ...medication,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating medication:', error);
      throw new Error(`Failed to save medication: ${error.message}`);
    }
    
    console.log('Successfully created medication:', data);
    return data as Medication
  },

  // Update medication
  async update(id: string, updates: Partial<Medication>) {
    const { data, error } = await supabase
      .from('medications')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Medication
  },

  // Deactivate medication
  async deactivate(id: string) {
    return this.update(id, { is_active: false })
  }
}

// Medication Logs Service
export const medicationLogsService = {
  // Get medication logs for a user
  async getByUserId(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('medication_logs')
      .select(`
        *,
        medication:medications(name, dosage)
      `)
      .eq('user_id', userId)
      .order('taken_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as MedicationLog[]
  },

  // Legacy method for backward compatibility
  async getByPatientId(patientId: string, limit = 50) {
    return this.getByUserId(patientId, limit)
  },

  // Log medication taken
  async logTaken(log: Omit<MedicationLog, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('medication_logs')
      .insert(log)
      .select()
      .single()

    if (error) throw error
    return data as MedicationLog
  },

  // Get today's medication logs for a user
  async getTodayLogs(userId: string) {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('medication_logs')
      .select(`
        *,
        medication:medications(name, dosage, frequency)
      `)
      .eq('user_id', userId)
      .gte('taken_at', `${today}T00:00:00.000Z`)
      .lt('taken_at', `${today}T23:59:59.999Z`)
      .order('taken_at', { ascending: false })

    if (error) throw error
    return data as MedicationLog[]
  }
}
