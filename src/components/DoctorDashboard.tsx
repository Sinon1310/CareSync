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
  Stethoscope
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
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
  title: string;
  description: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  patient_id: string;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'vitals' | 'appointments' | 'medications'>('overview');
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
    }
  }, [user, profile]);

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
    try {
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
        return;
      }

      console.log('Loaded patients data:', data);

      // Transform the data to match our Patient interface
      const transformedPatients: Patient[] = data?.map(relationship => {
        const profile = Array.isArray(relationship.profiles) ? relationship.profiles[0] : relationship.profiles;
        return {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          created_at: profile.created_at,
          status: 'normal' as const,
          relationshipId: relationship.id,
          relationshipStatus: relationship.status
        };
      }) || [];

      setPatients(transformedPatients);
      console.log('Patients loaded:', transformedPatients);
    } catch (error) {
      console.error('Error in loadPatients:', error);
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
      // Get appointments for this doctor
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          profiles!appointments_patient_id_fkey (
            full_name
          )
        `)
        .eq('doctor_id', user?.id)
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
    } catch (error) {
      console.error('Error in loadAppointments:', error);
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
              <Bell className="h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer" />
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
              { id: 'appointments', label: 'Appointments', icon: Calendar }
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
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">My Patients</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
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
                          <button className="text-blue-600 hover:text-blue-900">View</button>
                          <button className="text-green-600 hover:text-green-900">Message</button>
                          <button className="text-purple-600 hover:text-purple-900">Schedule</button>
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
              <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Schedule Appointment</span>
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.map(appointment => (
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
                            'text-gray-600 bg-gray-100'
                          }`}>
                            {appointment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {appointments.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
                    <p className="mt-1 text-sm text-gray-500">Schedule your first appointment to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorDashboard;
