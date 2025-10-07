import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertTriangle, 
  Search,
  Bell,
  Activity,
  Heart,
  LogOut,
  User,
  UserPlus,
  Calendar,
  Plus,
  Pill,
  Stethoscope,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { appointmentsService } from '../lib/database';
import NotificationBell from './NotificationBell';
import LiveVitalMonitor from './LiveVitalMonitor';
import AnalyticsDashboard from './AnalyticsDashboard';
import NotificationService from '../services/notificationService';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  lastVitalReading?: string;
  status: 'normal' | 'warning' | 'critical';
  latestVitals?: {
    systolic?: number;
    diastolic?: number;
    heartRate?: number;
    bloodSugar?: number;
  };
  relationshipId?: string;
  relationshipStatus?: string;
}

interface VitalReading {
  id: string;
  type: string;
  value: string;
  systolic?: number;
  diastolic?: number;
  unit: string;
  status: string;
  recorded_at: string;
  user_id: string;
  patient_name?: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  user_id: string;
  patient_name?: string;
}

interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  title: string;
  description: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  patient_name?: string;
  notes?: string;
}

const DoctorDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [vitals, setVitals] = useState<VitalReading[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'vitals' | 'appointments' | 'medications' | 'analytics'>('overview');
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 30
  });

  // Load data when component mounts
  useEffect(() => {
    if (user && profile?.role === 'doctor') {
      loadDashboardData();
      setupRealtimeSubscriptions();
    }
  }, [user, profile]);

  const setupRealtimeSubscriptions = () => {
    // Subscribe to vital reading alerts
    const vitalSubscription = NotificationService.subscribeToVitalAlerts();
    
    // Subscribe to appointment alerts
    const appointmentSubscription = NotificationService.subscribeToAppointmentAlerts();

    // Cleanup function
    return () => {
      vitalSubscription.unsubscribe();
      appointmentSubscription.unsubscribe();
    };
  };

  const testNotificationSystem = async () => {
    if (!user?.id) return;
    
    try {
      // Send a sample critical alert
      await NotificationService.sendCriticalVitalAlert(
        user.id,
        'sample-patient-id',
        'John Doe',
        'blood_pressure',
        '180/120'
      );

      // Send a welcome notification
      await NotificationService.sendWelcomeNotification(
        user.id,
        'doctor',
        profile?.full_name || 'Doctor'
      );

      toast.success('🔔 Sample notifications sent! Check the notification bell.');
    } catch (error) {
      console.error('Error sending test notifications:', error);
      toast.error('Failed to send test notifications');
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data for doctor:', user?.id);

      // Load patients assigned to this doctor
      await loadPatients();
      await loadVitals();
      await loadMedications();
      await loadAppointments();

      // If no data exists, create sample data
      if (patients.length === 0) {
        await createSampleData();
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const createSampleData = async () => {
    try {
      console.log('Creating sample data...');
      
      // Create sample patients
      const samplePatients = [
        { full_name: 'Emily Rodriguez', email: 'emily.rodriguez@email.com', role: 'patient' },
        { full_name: 'Michael Thompson', email: 'michael.thompson@email.com', role: 'patient' },
        { full_name: 'Sarah Johnson', email: 'sarah.johnson@email.com', role: 'patient' }
      ];

      for (const patientData of samplePatients) {
        // Insert patient profile
        const { data: patient, error: patientError } = await supabase
          .from('profiles')
          .insert([patientData])
          .select()
          .single();

        if (patientError) {
          console.error('Error creating patient:', patientError);
          continue;
        }

        // Create doctor-patient relationship
        await supabase
          .from('doctor_patient_relationships')
          .insert([{
            doctor_id: user?.id,
            patient_id: patient.id,
            status: 'active'
          }]);

        // Create sample vitals
        await supabase
          .from('vital_readings')
          .insert([
            {
              user_id: patient.id,
              type: 'blood_pressure',
              value: '120/80',
              systolic: 120,
              diastolic: 80,
              unit: 'mmHg',
              status: 'normal'
            },
            {
              user_id: patient.id,
              type: 'heart_rate',
              value: '72',
              unit: 'bpm',
              status: 'normal'
            }
          ]);

        // Create sample medications
        await supabase
          .from('medications')
          .insert([{
            user_id: patient.id,
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            instructions: 'Take with food',
            start_date: new Date().toISOString().split('T')[0],
            is_active: true
          }]);

        // Create sample appointment
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        
        await supabase
          .from('appointments')
          .insert([{
            patient_id: patient.id,
            doctor_id: user?.id,
            title: 'Regular Checkup',
            description: 'Routine health examination',
            appointment_date: futureDate.toISOString(),
            duration_minutes: 30,
            status: 'scheduled'
          }]);
      }

      toast.success('Sample data created successfully!');
      
      // Reload data after creating samples
      await loadPatients();
      await loadVitals();
      await loadMedications();
      await loadAppointments();
      
    } catch (error) {
      console.error('Error creating sample data:', error);
      toast.error('Failed to create sample data');
    }
  };

  const loadPatients = async () => {
    if (!user?.id) {
      console.log('No user ID available for loading patients');
      return;
    }

    try {
      console.log('Loading patients for doctor:', user.id);
      
      // Get patients assigned to this doctor through doctor_patient_relationships
      const { data, error } = await supabase
        .from('doctor_patient_relationships')
        .select(`
          id,
          status,
          patient_id,
          profiles!doctor_patient_relationships_patient_id_fkey (
            id,
            full_name,
            email,
            created_at
          )
        `)
        .eq('doctor_id', user?.id)
        .eq('status', 'active');

      if (error) {
        console.error('Error loading patients:', error);
        toast.error('Failed to load patients');
        return;
      }

      console.log('Raw patients data from database:', data);

      if (!data || data.length === 0) {
        console.log('No patients found for this doctor. You may need to create doctor-patient relationships.');
        setPatients([]);
        return;
      }

      // Transform the data to match our Patient interface
      const transformedPatients: Patient[] = data?.map(relationship => {
        const profile = Array.isArray(relationship.profiles) ? relationship.profiles[0] : relationship.profiles;
        
        if (!profile) {
          console.warn('Missing profile data for relationship:', relationship);
          return null;
        }
        
        return {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          created_at: profile.created_at,
          status: 'normal' as const,
          relationshipId: relationship.id,
          relationshipStatus: relationship.status
        };
      }).filter(Boolean) as Patient[];

      setPatients(transformedPatients);
      console.log('Patients loaded successfully:', transformedPatients.length, 'patients');
    } catch (error) {
      console.error('Error in loadPatients:', error);
      toast.error('Failed to load patients');
    }
  };

  const loadVitals = async () => {
    try {
      // Get latest vital readings for all patients
      const { data, error } = await supabase
        .from('vital_readings')
        .select(`
          *,
          profiles!vital_readings_user_id_fkey (
            full_name
          )
        `)
        .order('recorded_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading vitals:', error);
        return;
      }

      const transformedVitals: VitalReading[] = data?.map(vital => {
        const profile = Array.isArray(vital.profiles) ? vital.profiles[0] : vital.profiles;
        return {
          ...vital,
          patient_name: profile?.full_name
        };
      }) || [];

      setVitals(transformedVitals);
      console.log('Vitals loaded:', transformedVitals.length);
    } catch (error) {
      console.error('Error in loadVitals:', error);
    }
  };

  const loadMedications = async () => {
    try {
      // Get medications for all patients
      const { data, error } = await supabase
        .from('medications')
        .select(`
          *,
          profiles!medications_user_id_fkey (
            full_name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading medications:', error);
        return;
      }

      const transformedMedications: Medication[] = data?.map(med => {
        const profile = Array.isArray(med.profiles) ? med.profiles[0] : med.profiles;
        return {
          ...med,
          patient_name: profile?.full_name
        };
      }) || [];

      setMedications(transformedMedications);
      console.log('Medications loaded:', transformedMedications.length);
    } catch (error) {
      console.error('Error in loadMedications:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      // Get appointments for this doctor (both scheduled and pending requests)
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          profiles!appointments_patient_id_fkey (
            full_name
          )
        `)
        .or(`doctor_id.eq.${user?.id},doctor_id.is.null`)
        .order('appointment_date', { ascending: true });

      if (error) {
        console.error('Error loading appointments:', error);
        return;
      }

      const transformedAppointments: Appointment[] = data?.map(appt => {
        const profile = Array.isArray(appt.profiles) ? appt.profiles[0] : appt.profiles;
        return {
          ...appt,
          patient_name: profile?.full_name
        };
      }) || [];

      setAppointments(transformedAppointments);
      console.log('Appointments loaded:', transformedAppointments.length);
      console.log('Appointments data:', transformedAppointments);
    } catch (error) {
      console.error('Error in loadAppointments:', error);
    }
  };

  const acceptAppointmentRequest = async (appointmentId: string) => {
    try {
      await appointmentsService.updateStatus(appointmentId, 'scheduled');
      toast.success('Appointment accepted successfully!');
      loadAppointments(); // Reload to show updated data
    } catch (error) {
      console.error('Error accepting appointment:', error);
      toast.error('Failed to accept appointment');
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) {
        console.error('Error updating appointment status:', error);
        toast.error('Failed to update appointment');
        return;
      }

      toast.success(`Appointment ${newStatus} successfully!`);
      loadAppointments(); // Reload to show updated data
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment');
    }
  };

  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    if (!newAppointment.patientId || !newAppointment.title || !newAppointment.date || !newAppointment.time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const selectedDate = new Date(newAppointment.date + 'T' + newAppointment.time);
      
      // Validate the date
      if (isNaN(selectedDate.getTime())) {
        toast.error('Invalid date or time selected');
        return;
      }

      // Check if the date is in the future
      if (selectedDate <= new Date()) {
        toast.error('Please select a future date and time');
        return;
      }

      const appointmentData = {
        doctor_id: user.id,
        patient_id: newAppointment.patientId,
        title: newAppointment.title,
        description: newAppointment.description || '',
        appointment_date: selectedDate.toISOString(),
        duration_minutes: newAppointment.duration,
        status: 'scheduled' as const
      };

      console.log('Creating appointment with data:', appointmentData);

      // Use the service method for better error handling
      const createdAppointment = await appointmentsService.create(appointmentData);
      console.log('Appointment created successfully:', createdAppointment);
      
      toast.success('Appointment scheduled successfully!');

      setShowScheduleModal(false);
      setNewAppointment({
        patientId: '',
        title: '',
        description: '',
        date: '',
        time: '',
        duration: 30
      });
      await loadAppointments(); // Reload appointments
    } catch (error: any) {
      console.error('Error scheduling appointment:', error);
      const errorMessage = error?.message || 'Failed to schedule appointment';
      toast.error(`Failed to schedule appointment: ${errorMessage}`);
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !newPatientEmail.trim()) return;

    try {
      // First, find the patient by email
      const { data: patientData, error: patientError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', newPatientEmail.trim())
        .eq('role', 'patient')
        .single();

      if (patientError || !patientData) {
        toast.error('Patient not found. Please check the email address.');
        return;
      }

      // Check if relationship already exists
      const { data: existingRelation } = await supabase
        .from('doctor_patient_relationships')
        .select('id')
        .eq('doctor_id', user.id)
        .eq('patient_id', patientData.id)
        .single();

      if (existingRelation) {
        toast.error('This patient is already in your patient list.');
        return;
      }

      // Create doctor-patient relationship
      const { error: relationError } = await supabase
        .from('doctor_patient_relationships')
        .insert([{
          doctor_id: user.id,
          patient_id: patientData.id,
          status: 'active'
        }]);

      if (relationError) {
        console.error('Error creating relationship:', relationError);
        toast.error('Failed to add patient. Please try again.');
        return;
      }

      toast.success(`${patientData.full_name} has been added to your patient list!`);
      setShowAddPatientModal(false);
      setNewPatientEmail('');
      loadPatients(); // Reload patients list
    } catch (error) {
      console.error('Error adding patient:', error);
      toast.error('Failed to add patient. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const criticalVitals = vitals.filter(v => v.status === 'critical').length;
  const warningVitals = vitals.filter(v => v.status === 'warning').length;
  const upcomingAppointments = appointments.filter(a => 
    new Date(a.appointment_date) > new Date() && a.status === 'scheduled'
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Stethoscope className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Doctor Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={testNotificationSystem}
                className="bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 text-sm flex items-center space-x-1"
                title="Test notification system"
              >
                <Bell className="h-4 w-4" />
                <span>Test Notifications</span>
              </button>
              <NotificationBell />
              <div className="flex items-center space-x-2">
                <User className="h-6 w-6 text-gray-500" />
                <span className="text-sm text-gray-700">Dr. {profile?.full_name || 'Doctor'}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'patients', label: 'Patients', icon: Users },
              { id: 'vitals', label: 'Vital Signs', icon: Heart },
              { id: 'medications', label: 'Medications', icon: Pill },
              { id: 'appointments', label: 'Appointments', icon: Calendar },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Sample Data Button */}
            {patients.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">No patients found</h3>
                    <p className="text-blue-700">Create sample data to explore the dashboard functionality</p>
                  </div>
                  <button
                    onClick={createSampleData}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create Sample Data</span>
                  </button>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Patients</p>
                    <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                    <p className="text-2xl font-bold text-gray-900">{criticalVitals}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <Heart className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Warnings</p>
                    <p className="text-2xl font-bold text-gray-900">{warningVitals}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Upcoming Appointments</p>
                    <p className="text-2xl font-bold text-gray-900">{upcomingAppointments}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Vital Readings */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Vital Readings</h3>
                <div className="space-y-3">
                  {vitals.slice(0, 5).map(vital => (
                    <div key={vital.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{vital.patient_name}</p>
                        <p className="text-sm text-gray-600">{vital.type}: {vital.value} {vital.unit}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vital.status)}`}>
                          {vital.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(vital.recorded_at)}</p>
                      </div>
                    </div>
                  ))}
                  {vitals.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No vital readings yet</p>
                  )}
                </div>
              </div>

              {/* Upcoming Appointments */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Appointments</h3>
                <div className="space-y-3">
                  {appointments
                    .filter(appt => new Date(appt.appointment_date) > new Date())
                    .slice(0, 5)
                    .map(appointment => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{appointment.patient_name}</p>
                        <p className="text-sm text-gray-600">{appointment.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatDate(appointment.appointment_date)}</p>
                        <p className="text-xs text-gray-500">{appointment.duration_minutes} min</p>
                      </div>
                    </div>
                  ))}
                  {appointments.filter(appt => new Date(appt.appointment_date) > new Date()).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No upcoming appointments</p>
                  )}
                </div>
              </div>
            </div>

            {/* Live Vital Monitor */}
            <div className="mt-6">
              <LiveVitalMonitor />
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">My Patients</h2>
              <button 
                onClick={() => setShowAddPatientModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <UserPlus className="h-5 w-5" />
                <span>Add Patient</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Patients List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Reading
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPatients.map(patient => (
                      <tr key={patient.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{patient.full_name}</div>
                            <div className="text-sm text-gray-500">{patient.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                            {patient.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patient.lastVitalReading || 'No readings yet'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button 
                            onClick={() => setSelectedPatient(patient)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => toast('Messaging feature coming soon!', { icon: 'ℹ️' })}
                            className="text-green-600 hover:text-green-900"
                          >
                            Message
                          </button>
                          <button 
                            onClick={() => {
                              setNewAppointment({...newAppointment, patientId: patient.id});
                              setShowScheduleModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Schedule
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPatients.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first patient'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Vital Signs Monitor</h2>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reading
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vitals.map(vital => (
                      <tr key={vital.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {vital.patient_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {vital.type.replace('_', ' ').toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vital.value} {vital.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vital.status)}`}>
                            {vital.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(vital.recorded_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {vitals.length === 0 && (
                  <div className="text-center py-8">
                    <Heart className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No vital readings</h3>
                    <p className="mt-1 text-sm text-gray-500">Vital signs will appear here when patients record them</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'medications' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Patient Medications</h2>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medication
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dosage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Frequency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {medications.map(med => (
                      <tr key={med.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {med.patient_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {med.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {med.dosage}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {med.frequency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            med.is_active ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                          }`}>
                            {med.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {medications.length === 0 && (
                  <div className="text-center py-8">
                    <Pill className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No medications</h3>
                    <p className="mt-1 text-sm text-gray-500">Patient medications will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Appointments Management</h2>
              <button 
                onClick={() => setShowScheduleModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Schedule Appointment</span>
              </button>
            </div>

            {/* Pending Requests Section */}
            {appointments.filter(apt => !apt.doctor_id || apt.doctor_id === '').length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Bell className="h-5 w-5 text-orange-500 mr-2" />
                    Pending Appointment Requests ({appointments.filter(apt => !apt.doctor_id || apt.doctor_id === '').length})
                  </h3>
                </div>
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-orange-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Patient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Appointment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requested Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {appointments.filter(apt => !apt.doctor_id || apt.doctor_id === '').map(appointment => (
                        <tr key={appointment.id} className="hover:bg-orange-25">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {appointment.patient_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{appointment.title}</div>
                              <div className="text-sm text-gray-500">{appointment.description}</div>
                              {appointment.notes && (
                                <div className="text-sm text-gray-400 mt-1">Note: {appointment.notes}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(appointment.appointment_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {appointment.duration_minutes} min
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => acceptAppointmentRequest(appointment.id)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                            >
                              Decline
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Scheduled Appointments */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">My Scheduled Appointments</h3>
              </div>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Appointment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.filter(apt => apt.doctor_id === user?.id).map(appointment => (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {appointment.patient_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{appointment.title}</div>
                            <div className="text-sm text-gray-500">{appointment.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(appointment.appointment_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {appointment.duration_minutes} min
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            appointment.status === 'scheduled' ? 'text-blue-600 bg-blue-100' :
                            appointment.status === 'completed' ? 'text-green-600 bg-green-100' :
                            appointment.status === 'cancelled' ? 'text-red-600 bg-red-100' :
                            'text-gray-600 bg-gray-100'
                          }`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {appointment.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {appointment.status === 'cancelled' && (
                            <button
                              onClick={() => updateAppointmentStatus(appointment.id, 'scheduled')}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                            >
                              Reschedule
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {appointments.filter(apt => apt.doctor_id && apt.doctor_id !== '').length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No scheduled appointments</h3>
                    <p className="mt-1 text-sm text-gray-500">Accepted appointment requests will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Patient Modal */}
      {showAddPatientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Patient</h3>
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Email
                </label>
                <input
                  type="email"
                  value={newPatientEmail}
                  onChange={(e) => setNewPatientEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="patient@example.com"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter the email of an existing patient to add them to your patient list.
                </p>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPatientModal(false);
                    setNewPatientEmail('');
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Patient Details</h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Patient Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-gray-900">{selectedPatient.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedPatient.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      selectedPatient.status === 'normal' ? 'bg-green-100 text-green-800' :
                      selectedPatient.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedPatient.status.charAt(0).toUpperCase() + selectedPatient.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Reading</label>
                    <p className="text-gray-900">{selectedPatient.lastVitalReading || 'No readings yet'}</p>
                  </div>
                </div>
              </div>

              {/* Latest Vitals */}
              {selectedPatient.latestVitals && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Latest Vital Signs</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedPatient.latestVitals.systolic && selectedPatient.latestVitals.diastolic && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Blood Pressure</label>
                        <p className="text-gray-900">{selectedPatient.latestVitals.systolic}/{selectedPatient.latestVitals.diastolic} mmHg</p>
                      </div>
                    )}
                    {selectedPatient.latestVitals.heartRate && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Heart Rate</label>
                        <p className="text-gray-900">{selectedPatient.latestVitals.heartRate} BPM</p>
                      </div>
                    )}
                    {selectedPatient.latestVitals.bloodSugar && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Blood Sugar</label>
                        <p className="text-gray-900">{selectedPatient.latestVitals.bloodSugar} mg/dL</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setNewAppointment({...newAppointment, patientId: selectedPatient.id});
                    setSelectedPatient(null);
                    setShowScheduleModal(true);
                  }}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Schedule Appointment
                </button>
                <button
                  onClick={() => toast('Messaging feature coming soon!', { icon: 'ℹ️' })}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <AnalyticsDashboard />
      )}

      {/* Schedule Appointment Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule New Appointment</h3>
            <form onSubmit={handleScheduleAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Patient
                </label>
                <select
                  value={newAppointment.patientId}
                  onChange={(e) => setNewAppointment({...newAppointment, patientId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a patient...</option>
                  {patients.length === 0 ? (
                    <option value="" disabled>No patients assigned yet</option>
                  ) : (
                    patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.full_name} ({patient.email})
                      </option>
                    ))
                  )}
                </select>
                {patients.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    You need to have patients assigned to schedule appointments. Check the debugger above.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Type
                </label>
                <select
                  value={newAppointment.title}
                  onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select type...</option>
                  <option value="Regular Checkup">Regular Checkup</option>
                  <option value="Follow-up Visit">Follow-up Visit</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Lab Work Review">Lab Work Review</option>
                  <option value="Emergency Consultation">Emergency Consultation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={newAppointment.date}
                  onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <select
                  value={newAppointment.time}
                  onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select time...</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <select
                  value={newAppointment.duration}
                  onChange={(e) => setNewAppointment({...newAppointment, duration: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newAppointment.description}
                  onChange={(e) => setNewAppointment({...newAppointment, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Any specific notes or concerns..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setNewAppointment({
                      patientId: '',
                      title: '',
                      description: '',
                      date: '',
                      time: '',
                      duration: 30
                    });
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Schedule Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
