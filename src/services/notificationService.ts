import { supabase } from '../lib/supabase';
import { Notification } from '../contexts/NotificationContext';

export class NotificationService {
  
  // Create a notification
  static async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'read'>) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data as Notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send critical vital alert to doctor
  static async sendCriticalVitalAlert(
    doctorId: string, 
    patientId: string, 
    patientName: string, 
    vitalType: string, 
    vitalValue: string
  ) {
    return this.createNotification({
      user_id: doctorId,
      title: `🚨 Critical Alert: ${patientName}`,
      message: `${patientName} has recorded a critical ${vitalType.replace('_', ' ')} reading of ${vitalValue}. Immediate attention may be required.`,
      type: 'critical',
      priority: 'critical',
      metadata: {
        patient_id: patientId,
        patient_name: patientName,
        vital_type: vitalType,
        vital_value: vitalValue
      },
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });
  }

  // Send warning vital alert to doctor
  static async sendWarningVitalAlert(
    doctorId: string, 
    patientId: string, 
    patientName: string, 
    vitalType: string, 
    vitalValue: string
  ) {
    return this.createNotification({
      user_id: doctorId,
      title: `⚠️ Warning: ${patientName}`,
      message: `${patientName} has recorded a concerning ${vitalType.replace('_', ' ')} reading of ${vitalValue}. Please review when convenient.`,
      type: 'warning',
      priority: 'high',
      metadata: {
        patient_id: patientId,
        patient_name: patientName,
        vital_type: vitalType,
        vital_value: vitalValue
      },
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours
    });
  }

  // Send appointment reminder to patient
  static async sendAppointmentReminder(
    patientId: string, 
    appointmentId: string, 
    doctorName: string, 
    appointmentDate: string
  ) {
    const appointmentTime = new Date(appointmentDate);
    const formattedDate = appointmentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return this.createNotification({
      user_id: patientId,
      title: `📅 Appointment Reminder`,
      message: `You have an upcoming appointment with Dr. ${doctorName} on ${formattedDate}. Please arrive 15 minutes early.`,
      type: 'appointment',
      priority: 'medium',
      metadata: {
        appointment_id: appointmentId,
        doctor_name: doctorName,
        appointment_date: appointmentDate
      },
      action_url: '/appointments',
      expires_at: appointmentTime.toISOString()
    });
  }

  // Send appointment confirmation to doctor
  static async sendAppointmentConfirmation(
    doctorId: string, 
    appointmentId: string, 
    patientName: string, 
    appointmentDate: string
  ) {
    const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return this.createNotification({
      user_id: doctorId,
      title: `📅 New Appointment Scheduled`,
      message: `${patientName} has scheduled an appointment for ${formattedDate}.`,
      type: 'appointment',
      priority: 'medium',
      metadata: {
        appointment_id: appointmentId,
        patient_name: patientName,
        appointment_date: appointmentDate
      },
      action_url: '/appointments'
    });
  }

  // Send medication reminder to patient
  static async sendMedicationReminder(
    patientId: string, 
    medicationId: string, 
    medicationName: string, 
    dosage: string
  ) {
    return this.createNotification({
      user_id: patientId,
      title: `💊 Medication Reminder`,
      message: `Time to take your ${medicationName} (${dosage}). Don't forget to log it in your dashboard!`,
      type: 'medication',
      priority: 'medium',
      metadata: {
        medication_id: medicationId,
        medication_name: medicationName,
        dosage: dosage
      },
      action_url: '/medications',
      expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
    });
  }

  // Send new patient alert to doctor
  static async sendNewPatientAlert(
    doctorId: string, 
    patientId: string, 
    patientName: string
  ) {
    return this.createNotification({
      user_id: doctorId,
      title: `👤 New Patient Added`,
      message: `${patientName} has been added to your patient list and is now sharing their health data with you.`,
      type: 'info',
      priority: 'low',
      metadata: {
        patient_id: patientId,
        patient_name: patientName
      },
      action_url: '/patients'
    });
  }

  // Send welcome notification to new user
  static async sendWelcomeNotification(userId: string, userRole: 'patient' | 'doctor', userName: string) {
    const isDoctor = userRole === 'doctor';
    
    return this.createNotification({
      user_id: userId,
      title: `🎉 Welcome to CareSync, ${isDoctor ? 'Dr.' : ''} ${userName}!`,
      message: isDoctor 
        ? 'Your doctor dashboard is ready. You can now monitor your patients, review vital signs, and manage appointments all in one place.'
        : 'Your patient portal is ready. Start tracking your vital signs, managing medications, and staying connected with your healthcare team.',
      type: 'system',
      priority: 'low',
      action_url: isDoctor ? '/doctor-dashboard' : '/patient-dashboard'
    });
  }

  // Send system maintenance notification
  static async sendMaintenanceNotification(userId: string, startTime: string, duration: string) {
    return this.createNotification({
      user_id: userId,
      title: `🔧 Scheduled Maintenance`,
      message: `CareSync will undergo scheduled maintenance starting ${startTime} for approximately ${duration}. We apologize for any inconvenience.`,
      type: 'system',
      priority: 'low',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    });
  }

  // Send critical system alert
  static async sendSystemAlert(userId: string, alertMessage: string) {
    return this.createNotification({
      user_id: userId,
      title: `🚨 System Alert`,
      message: alertMessage,
      type: 'system',
      priority: 'high',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });
  }

  // Send multiple appointment reminders (batch processing)
  static async sendBatchAppointmentReminders(appointments: Array<{
    patientId: string;
    appointmentId: string;
    doctorName: string;
    appointmentDate: string;
  }>) {
    const promises = appointments.map(apt => 
      this.sendAppointmentReminder(apt.patientId, apt.appointmentId, apt.doctorName, apt.appointmentDate)
    );

    try {
      await Promise.all(promises);
      console.log(`Sent ${appointments.length} appointment reminders`);
    } catch (error) {
      console.error('Error sending batch appointment reminders:', error);
    }
  }

  // Check and alert for missed vital readings
  static async checkMissedVitalReadings() {
    try {
      // Get patients who haven't recorded vitals in the last 24 hours
      const { data: missedReadings, error } = await supabase
        .rpc('get_patients_with_missed_vitals', {
          hours_threshold: 24
        });

      if (error) {
        console.error('Error checking missed vital readings:', error);
        return;
      }

      // Send notifications to doctors about patients with missed readings
      for (const record of missedReadings || []) {
        await this.createNotification({
          user_id: record.doctor_id,
          title: `📊 Missing Vital Signs`,
          message: `${record.patient_name} hasn't recorded vital signs in over 24 hours. You may want to check in with them.`,
          type: 'warning',
          priority: 'medium',
          metadata: {
            patient_id: record.patient_id,
            patient_name: record.patient_name,
            last_reading: record.last_reading
          },
          action_url: '/patients'
        });
      }
    } catch (error) {
      console.error('Error in checkMissedVitalReadings:', error);
    }
  }

  // Subscribe to vital readings and auto-alert doctors
  static subscribeToVitalAlerts() {
    return supabase
      .channel('vital_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vital_readings'
        },
        async (payload) => {
          const vitalReading = payload.new;
          
          // Only process critical and warning status readings
          if (vitalReading.status !== 'critical' && vitalReading.status !== 'warning') {
            return;
          }

          try {
            // Get patient info and their doctors
            const { data: relationships, error } = await supabase
              .from('doctor_patient_relationships')
              .select(`
                doctor_id,
                profiles!doctor_patient_relationships_patient_id_fkey (
                  full_name
                )
              `)
              .eq('patient_id', vitalReading.user_id)
              .eq('status', 'active');

            if (error || !relationships) {
              console.error('Error fetching doctor-patient relationships:', error);
              return;
            }

            // Send alerts to all assigned doctors
            for (const relationship of relationships) {
              const patientProfile = Array.isArray(relationship.profiles) 
                ? relationship.profiles[0] 
                : relationship.profiles;

              if (vitalReading.status === 'critical') {
                await this.sendCriticalVitalAlert(
                  relationship.doctor_id,
                  vitalReading.user_id,
                  patientProfile?.full_name || 'Unknown Patient',
                  vitalReading.type,
                  vitalReading.value
                );
              } else if (vitalReading.status === 'warning') {
                await this.sendWarningVitalAlert(
                  relationship.doctor_id,
                  vitalReading.user_id,
                  patientProfile?.full_name || 'Unknown Patient',
                  vitalReading.type,
                  vitalReading.value
                );
              }
            }
          } catch (error) {
            console.error('Error processing vital alert:', error);
          }
        }
      )
      .subscribe();
  }

  // Subscribe to appointment changes
  static subscribeToAppointmentAlerts() {
    return supabase
      .channel('appointment_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments'
        },
        async (payload) => {
          const appointment = payload.new;
          
          try {
            // Get patient and doctor names
            const { data: patientData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', appointment.patient_id)
              .single();

            const { data: doctorData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', appointment.doctor_id)
              .single();

            if (patientData && doctorData) {
              // Send confirmation to doctor
              await this.sendAppointmentConfirmation(
                appointment.doctor_id,
                appointment.id,
                patientData.full_name,
                appointment.appointment_date
              );

              // Schedule reminder for patient (24 hours before appointment)
              const appointmentTime = new Date(appointment.appointment_date);
              const reminderTime = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);
              
              if (reminderTime > new Date()) {
                // In a production app, you'd use a job queue for this
                setTimeout(() => {
                  this.sendAppointmentReminder(
                    appointment.patient_id,
                    appointment.id,
                    doctorData.full_name,
                    appointment.appointment_date
                  );
                }, reminderTime.getTime() - Date.now());
              }
            }
          } catch (error) {
            console.error('Error processing appointment alert:', error);
          }
        }
      )
      .subscribe();
  }
}

export default NotificationService;
