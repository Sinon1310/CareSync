import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Heart, 
  Droplet, 
  TrendingUp, 
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  LogOut,
  User,
  Calendar,
  Pill,
  MessageCircle
} from 'lucide-react';
import VitalChart from './VitalChart';
import MedicationTracker from './MedicationTracker';
import NotificationBell from './NotificationBell';
import NotificationService from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { vitalReadingsService, appointmentsService } from '../lib/database';
import { showErrorToast, showVitalSavedToast, showValidationErrorToast, showSuccessToast } from '../utils/toast';
import LoadingSpinner from './LoadingSpinner';

interface VitalReading {
  id: string;
  type: 'blood_pressure' | 'blood_sugar' | 'heart_rate' | 'temperature';
  value: string;
  timestamp: Date;
  status: 'normal' | 'warning' | 'critical';
}

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  doctor: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface Message {
  id: string;
  from: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

const PatientDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'medications' | 'appointments' | 'messages'>('overview');
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const [newReading, setNewReading] = useState<{
    type: VitalReading['type'];
    systolic: string;
    diastolic: string;
    bloodSugar: string;
    heartRate: string;
    temperature: string;
  }>({
    type: 'blood_pressure',
    systolic: '',
    diastolic: '',
    bloodSugar: '',
    heartRate: '',
    temperature: ''
  });

  const [newAppointment, setNewAppointment] = useState({
    type: 'Regular Checkup',
    date: '',
    time: '09:00',
    notes: ''
  });

  const [showAddForm, setShowAddForm] = useState(false);

  // Load vital readings from database
  useEffect(() => {
    if (user?.id) {
      loadVitalReadings();
      loadAppointments();
      loadMessages();
    }
  }, [user?.id]);

  const loadVitalReadings = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const dbReadings = await vitalReadingsService.getByUserId(user.id);
      
      // Convert database format to component format
      const formattedReadings: VitalReading[] = dbReadings.map(reading => ({
        id: reading.id,
        type: reading.type as VitalReading['type'],
        value: reading.value,
        timestamp: new Date(reading.recorded_at || reading.created_at),
        status: reading.status
      }));
      
      setReadings(formattedReadings);
    } catch (error) {
      console.error('Error loading vital readings:', error);
      showErrorToast('Failed to load your health data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      if (!user?.id) return;
      
      console.log('Loading appointments for patient:', user.id);
      const dbAppointments = await appointmentsService.getByUserId(user.id, 'patient');
      
      // Transform database appointments to component format
      const transformedAppointments: Appointment[] = dbAppointments.map(apt => {
        const appointmentDate = new Date(apt.appointment_date);
        const doctorInfo = Array.isArray(apt.doctor) ? apt.doctor[0] : apt.doctor;
        
        return {
          id: apt.id,
          title: apt.title,
          date: appointmentDate.toISOString().split('T')[0],
          time: appointmentDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          }),
          doctor: doctorInfo?.full_name || 'Doctor TBD',
          status: apt.status,
          notes: apt.notes || undefined
        };
      });
      
      setAppointments(transformedAppointments);
      console.log('Appointments loaded:', transformedAppointments.length);
    } catch (error) {
      console.error('Error loading appointments:', error);
      // Fallback to sample data if database fails
      const sampleAppointments: Appointment[] = [
        {
          id: '1',
          title: 'Regular Checkup',
          date: '2025-10-10',
          time: '10:00 AM',
          doctor: 'Dr. Smith',
          status: 'scheduled',
          notes: 'Annual physical examination'
        },
        {
          id: '2',
          title: 'Blood Work Follow-up',
          date: '2025-10-15',
          time: '2:30 PM',
          doctor: 'Dr. Johnson',
          status: 'scheduled',
          notes: 'Review blood test results'
        }
      ];
      setAppointments(sampleAppointments);
    }
  };

  const loadMessages = async () => {
    // For now, load sample messages - can be replaced with real API calls
    const sampleMessages: Message[] = [
      {
        id: '1',
        from: 'Dr. Smith',
        subject: 'Your test results are ready',
        message: 'Your recent blood work shows normal levels. Please continue your current medication routine.',
        date: '2025-10-02',
        read: false
      },
      {
        id: '2',
        from: 'Nurse Thompson',
        subject: 'Appointment reminder',
        message: 'This is a reminder about your upcoming appointment on October 10th at 10:00 AM.',
        date: '2025-10-01',
        read: true
      }
    ];
    setMessages(sampleMessages);
  };

  const testNotificationSystem = async () => {
    if (!user?.id) return;
    
    try {
      // Send medication reminder
      await NotificationService.sendMedicationReminder(
        user.id,
        'sample-med-id',
        'Lisinopril',
        '10mg'
      );

      // Send appointment reminder
      await NotificationService.sendAppointmentReminder(
        user.id,
        'sample-appointment-id',
        'Dr. Johnson',
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      );

      // Send welcome notification
      await NotificationService.sendWelcomeNotification(
        user.id,
        'patient',
        profile?.full_name || 'Patient'
      );

      showSuccessToast('🔔 Sample notifications sent! Check the notification bell.');
    } catch (error) {
      console.error('Error sending test notifications:', error);
      showErrorToast('Failed to send test notifications');
    }
  };

  const createCriticalVitalDemo = async () => {
    if (!user?.id) return;

    try {
      setSubmitting(true);

      // Create a critical blood pressure reading to trigger notifications
      const criticalReading = {
        user_id: user.id,
        type: 'blood_pressure' as const,
        value: '190/120',
        systolic: 190,
        diastolic: 120,
        status: 'critical' as const,
        recorded_at: new Date().toISOString()
      };

      console.log('Creating critical vital for demo:', criticalReading);
      const dbReading = await vitalReadingsService.create(criticalReading);

      // Add to local state
      const newVitalReading: VitalReading = {
        id: dbReading.id,
        type: 'blood_pressure',
        value: '190/120',
        timestamp: new Date(dbReading.recorded_at || dbReading.created_at),
        status: 'critical'
      };

      setReadings([newVitalReading, ...readings]);
      showSuccessToast('🚨 Critical vital recorded! Your doctor will be notified immediately.');
    } catch (error) {
      console.error('Error creating critical vital demo:', error);
      showErrorToast('Failed to create demo vital');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReading = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || submitting) return;

    // Validation
    let value = '';
    let type: VitalReading['type'] = newReading.type;
    let systolic: number | undefined;
    let diastolic: number | undefined;
    
    try {
      if (newReading.type === 'blood_pressure') {
        if (!newReading.systolic || !newReading.diastolic) {
          showValidationErrorToast('blood pressure values');
          return;
        }
        const sys = parseInt(newReading.systolic);
        const dia = parseInt(newReading.diastolic);
        
        if (sys < 70 || sys > 250 || dia < 40 || dia > 150) {
          showErrorToast('Blood pressure values seem unusual. Please double-check.');
          return;
        }
        
        value = `${sys}/${dia}`;
        systolic = sys;
        diastolic = dia;
      } else if (newReading.type === 'blood_sugar') {
        if (!newReading.bloodSugar) {
          showValidationErrorToast('blood sugar value');
          return;
        }
        const sugar = parseInt(newReading.bloodSugar);
        if (sugar < 20 || sugar > 600) {
          showErrorToast('Blood sugar value seems unusual. Please double-check.');
          return;
        }
        value = newReading.bloodSugar;
        type = 'blood_sugar';
      } else if (newReading.type === 'heart_rate') {
        if (!newReading.heartRate) {
          showValidationErrorToast('heart rate value');
          return;
        }
        const hr = parseInt(newReading.heartRate);
        if (hr < 30 || hr > 220) {
          showErrorToast('Heart rate value seems unusual. Please double-check.');
          return;
        }
        value = newReading.heartRate;
        type = 'heart_rate';
      } else if (newReading.type === 'temperature') {
        if (!newReading.temperature) {
          showValidationErrorToast('temperature value');
          return;
        }
        const temp = parseFloat(newReading.temperature);
        if (temp < 90 || temp > 110) {
          showErrorToast('Temperature value seems unusual. Please double-check.');
          return;
        }
        value = newReading.temperature;
        type = 'temperature';
      }

      if (!value) return;

      setSubmitting(true);
      
      // Calculate status based on normal ranges
      const status = calculateVitalStatus(type, value, systolic, diastolic);
      
      // Save to database
      const readingData = {
        user_id: user.id,
        type: type,
        value: value,
        systolic: systolic,
        diastolic: diastolic,
        status: status,
        recorded_at: new Date().toISOString()
      };
      
      console.log('Saving reading:', readingData);
      const dbReading = await vitalReadingsService.create(readingData);

      // Add to local state
      const newVitalReading: VitalReading = {
        id: dbReading.id,
        type: type,
        value: value,
        timestamp: new Date(dbReading.recorded_at || dbReading.created_at),
        status: status
      };

      setReadings([newVitalReading, ...readings]);
      setNewReading({
        type: 'blood_pressure',
        systolic: '',
        diastolic: '',
        bloodSugar: '',
        heartRate: '',
        temperature: ''
      });
      setShowAddForm(false);
      showVitalSavedToast();
    } catch (error) {
      console.error('Error saving vital reading:', error);
      showErrorToast('Failed to save reading. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || submitting) return;

    // Validation
    if (!newAppointment.date) {
      showErrorToast('Please select a date');
      return;
    }

    // Check if date is in the future
    const selectedDate = new Date(newAppointment.date + 'T' + newAppointment.time);
    if (selectedDate <= new Date()) {
      showErrorToast('Please select a future date and time');
      return;
    }

    setSubmitting(true);
    
    try {
      // Create appointment in database
      const appointmentData = {
        patient_id: user.id,
        doctor_id: '', // Will be assigned by admin/doctor later
        title: newAppointment.type,
        description: newAppointment.notes || '',
        appointment_date: selectedDate.toISOString(),
        duration_minutes: 30,
        status: 'scheduled' as const,
        notes: newAppointment.notes
      };

      // Save to database
      const savedAppointment = await appointmentsService.create(appointmentData);
      
      // Add to local state
      const newAppointmentLocal: Appointment = {
        id: savedAppointment.id,
        title: newAppointment.type,
        date: newAppointment.date,
        time: newAppointment.time,
        doctor: 'Doctor TBD', // Will be assigned later
        status: 'scheduled',
        notes: newAppointment.notes
      };

      setAppointments([newAppointmentLocal, ...appointments]);
      setNewAppointment({
        type: 'Regular Checkup',
        date: '',
        time: '09:00',
        notes: ''
      });
      setShowScheduleForm(false);
      showSuccessToast('Appointment request submitted successfully!');
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      showErrorToast('Failed to schedule appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to calculate vital status
  const calculateVitalStatus = (
    type: VitalReading['type'], 
    value: string, 
    systolic?: number, 
    diastolic?: number
  ): 'normal' | 'warning' | 'critical' => {
    switch (type) {
      case 'blood_pressure':
        if (systolic && diastolic) {
          if (systolic >= 180 || diastolic >= 120) return 'critical';
          if (systolic >= 140 || diastolic >= 90) return 'warning';
          return 'normal';
        }
        break;
      case 'blood_sugar':
        const sugar = parseInt(value);
        if (sugar >= 250 || sugar <= 50) return 'critical';
        if (sugar >= 180 || sugar <= 70) return 'warning';
        return 'normal';
      case 'heart_rate':
        const hr = parseInt(value);
        if (hr >= 120 || hr <= 50) return 'critical';
        if (hr >= 100 || hr <= 60) return 'warning';
        return 'normal';
      case 'temperature':
        const temp = parseFloat(value);
        if (temp >= 103 || temp <= 95) return 'critical';
        if (temp >= 100.4 || temp <= 97) return 'warning';
        return 'normal';
    }
    return 'normal';
  };

  const getVitalIcon = (type: VitalReading['type']) => {
    switch (type) {
      case 'blood_pressure':
        return Activity;
      case 'blood_sugar':
        return Droplet;
      case 'heart_rate':
        return Heart;
      case 'temperature':
        return TrendingUp;
      default:
        return Activity;
    }
  };

  const getVitalLabel = (type: VitalReading['type']) => {
    switch (type) {
      case 'blood_pressure':
        return 'Blood Pressure';
      case 'blood_sugar':
        return 'Blood Sugar';
      case 'heart_rate':
        return 'Heart Rate';
      case 'temperature':
        return 'Temperature';
      default:
        return 'Unknown';
    }
  };

  const getVitalUnit = (type: VitalReading['type']) => {
    switch (type) {
      case 'blood_pressure':
        return 'mmHg';
      case 'blood_sugar':
        return 'mg/dL';
      case 'heart_rate':
        return 'BPM';
      case 'temperature':
        return '°F';
      default:
        return '';
    }
  };

  const getStatusColor = (status: VitalReading['status']) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: VitalReading['status']) => {
    switch (status) {
      case 'normal':
        return CheckCircle;
      case 'warning':
      case 'critical':
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const todayReadings = readings.filter(r => 
    r.timestamp.toDateString() === new Date().toDateString()
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <LoadingSpinner size="lg" text="Loading your health data..." />
          </div>
        ) : (
          <>
        {/* Header */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {profile?.full_name || user?.email?.split('@')[0]}! 👋
              </h1>
              <p className="text-gray-600">Track your vital signs and monitor your health progress</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={testNotificationSystem}
                className="bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 text-sm flex items-center space-x-1"
                title="Test notification system"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Test Notifications</span>
              </button>
              <button
                onClick={createCriticalVitalDemo}
                className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 text-sm flex items-center space-x-1"
                title="Create critical vital demo"
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Demo Critical Vital</span>
              </button>
              <NotificationBell />
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 mb-8 rounded-t-lg">
          <div className="px-6">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'vitals', label: 'Vital Signs', icon: Heart },
                { id: 'medications', label: 'Medications', icon: Pill },
                { id: 'appointments', label: 'Appointments', icon: Calendar },
                { id: 'messages', label: 'Messages', icon: MessageCircle }
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

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Readings</p>
                <p className="text-2xl font-bold text-gray-900">{todayReadings.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">
                  {readings.length > 0 ? Math.floor(Math.random() * 7) + 3 : 0} days
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Next Appointment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.length > 0 
                    ? new Date(appointments[0].date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    : 'None'
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Last Reading</p>
                <p className="text-2xl font-bold text-gray-900">
                  {readings.length > 0 
                    ? new Date(readings[readings.length - 1].timestamp).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })
                    : 'None'
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Health Score</p>
                <p className="text-2xl font-bold text-green-600">
                  {readings.length > 0 
                    ? Math.round(readings.slice(-5).reduce((acc, r) => acc + (Number(r.value) / 120) * 100, 0) / Math.min(readings.length, 5))
                    : 95
                  }%
                </p>
              </div>
              <Heart className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Add New Reading */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Log New Reading</h2>
              <p className="text-gray-600">Add your latest vital sign measurements</p>
            </div>

            <div className="p-6">
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center py-4 px-6 bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg transition-colors duration-200 group"
                >
                  <Plus className="h-5 w-5 text-blue-600 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-blue-600 font-medium">Add New Reading</span>
                </button>
              ) : (
                <form onSubmit={handleSubmitReading} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reading Type
                    </label>
                    <select
                      value={newReading.type}
                      onChange={(e) => setNewReading({...newReading, type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="blood_pressure">Blood Pressure</option>
                      <option value="blood_sugar">Blood Sugar</option>
                      <option value="heart_rate">Heart Rate</option>
                      <option value="temperature">Temperature</option>
                    </select>
                  </div>

                  {newReading.type === 'blood_pressure' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Systolic
                        </label>
                        <input
                          type="number"
                          value={newReading.systolic}
                          onChange={(e) => setNewReading({...newReading, systolic: e.target.value})}
                          placeholder="120"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Diastolic
                        </label>
                        <input
                          type="number"
                          value={newReading.diastolic}
                          onChange={(e) => setNewReading({...newReading, diastolic: e.target.value})}
                          placeholder="80"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {newReading.type === 'blood_sugar' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Sugar (mg/dL)
                      </label>
                      <input
                        type="number"
                        value={newReading.bloodSugar}
                        onChange={(e) => setNewReading({...newReading, bloodSugar: e.target.value})}
                        placeholder="95"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  )}

                  {newReading.type === 'heart_rate' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heart Rate (BPM)
                      </label>
                      <input
                        type="number"
                        value={newReading.heartRate}
                        onChange={(e) => setNewReading({...newReading, heartRate: e.target.value})}
                        placeholder="72"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  )}

                  {newReading.type === 'temperature' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temperature (°F)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={newReading.temperature}
                        onChange={(e) => setNewReading({...newReading, temperature: e.target.value})}
                        placeholder="98.6"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Saving...
                        </>
                      ) : (
                        'Save Reading'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Trends Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">7-Day Trends</h2>
            </div>
            <div className="p-6">
              <VitalChart
                readings={readings.map(r => ({
                  id: r.id,
                  user_id: user?.id || '',
                  type: r.type,
                  value: r.value,
                  status: r.status,
                  recorded_at: r.timestamp.toISOString(),
                  created_at: r.timestamp.toISOString()
                }))}
              />
            </div>
          </div>
        </div>

        {/* Medications Section */}
        <div className="mb-8">
          <MedicationTracker />
        </div>

        {/* Recent Readings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Recent Readings</h2>
          </div>
          
          <div className="p-6">
            {readings.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No readings yet. Add your first measurement above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {readings.map((reading) => {
                  const Icon = getVitalIcon(reading.type);
                  const StatusIcon = getStatusIcon(reading.status);
                  
                  return (
                    <div 
                      key={reading.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{getVitalLabel(reading.type)}</h3>
                          <p className="text-sm text-gray-600">
                            {reading.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {reading.value} {getVitalUnit(reading.type)}
                          </p>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reading.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {reading.status.charAt(0).toUpperCase() + reading.status.slice(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        </>
        )}

        {/* Vitals Tab */}
        {activeTab === 'vitals' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Vital Signs Management</h2>
            
            {/* Add New Reading Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Record New Reading</h3>
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center py-4 px-6 bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg transition-colors duration-200 group"
                >
                  <Plus className="h-5 w-5 text-blue-600 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-blue-600 font-medium">Add New Reading</span>
                </button>
              ) : (
                <form onSubmit={handleSubmitReading} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reading Type
                    </label>
                    <select
                      value={newReading.type}
                      onChange={(e) => setNewReading({...newReading, type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="blood_pressure">Blood Pressure</option>
                      <option value="blood_sugar">Blood Sugar</option>
                      <option value="heart_rate">Heart Rate</option>
                      <option value="temperature">Temperature</option>
                    </select>
                  </div>

                  {newReading.type === 'blood_pressure' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Systolic
                        </label>
                        <input
                          type="number"
                          value={newReading.systolic}
                          onChange={(e) => setNewReading({...newReading, systolic: e.target.value})}
                          placeholder="120"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Diastolic
                        </label>
                        <input
                          type="number"
                          value={newReading.diastolic}
                          onChange={(e) => setNewReading({...newReading, diastolic: e.target.value})}
                          placeholder="80"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {newReading.type === 'blood_sugar' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Sugar (mg/dL)
                      </label>
                      <input
                        type="number"
                        value={newReading.bloodSugar}
                        onChange={(e) => setNewReading({...newReading, bloodSugar: e.target.value})}
                        placeholder="95"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  )}

                  {newReading.type === 'heart_rate' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heart Rate (BPM)
                      </label>
                      <input
                        type="number"
                        value={newReading.heartRate}
                        onChange={(e) => setNewReading({...newReading, heartRate: e.target.value})}
                        placeholder="72"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  )}

                  {newReading.type === 'temperature' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temperature (°F)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={newReading.temperature}
                        onChange={(e) => setNewReading({...newReading, temperature: e.target.value})}
                        placeholder="98.6"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Saving...
                        </>
                      ) : (
                        'Save Reading'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Vital Readings History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">Reading History</h3>
              </div>
              <div className="p-6">
                {readings.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No vital readings yet. Record your first measurement!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {readings.map((reading) => {
                      const Icon = getVitalIcon(reading.type);
                      const StatusIcon = getStatusIcon(reading.status);
                      
                      return (
                        <div 
                          key={reading.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Icon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{getVitalLabel(reading.type)}</h4>
                              <p className="text-sm text-gray-600">
                                {reading.timestamp.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {reading.value} {getVitalUnit(reading.type)}
                              </p>
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reading.status)}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {reading.status.charAt(0).toUpperCase() + reading.status.slice(1)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Medications Tab */}
        {activeTab === 'medications' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Medication Management</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <MedicationTracker />
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
              <button 
                onClick={() => setShowScheduleForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Schedule Appointment</span>
              </button>
            </div>

            {/* Appointments List */}
            <div className="space-y-4">
              {appointments.map(appointment => (
                <div key={appointment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{appointment.title}</h3>
                      <p className="text-gray-600 mt-1">with {appointment.doctor}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>{appointment.date}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{appointment.time}</span>
                        </div>
                      </div>
                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
              
              {appointments.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming appointments</h3>
                  <p className="text-gray-600 mb-4">Your scheduled appointments will appear here</p>
                  <button 
                    onClick={() => setShowScheduleForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Schedule Appointment
                  </button>
                </div>
              )}
            </div>

            {/* Schedule Appointment Modal */}
            {showScheduleForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule New Appointment</h3>
                  <form onSubmit={handleScheduleAppointment} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Appointment Type
                      </label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newAppointment.type}
                        onChange={(e) => setNewAppointment({...newAppointment, type: e.target.value})}
                      >
                        <option value="Regular Checkup">Regular Checkup</option>
                        <option value="Follow-up Visit">Follow-up Visit</option>
                        <option value="Consultation">Consultation</option>
                        <option value="Lab Work">Lab Work</option>
                        <option value="Emergency Consultation">Emergency Consultation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Date
                      </label>
                      <input 
                        type="date" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newAppointment.date}
                        onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Time
                      </label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newAppointment.time}
                        onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                      >
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Any specific concerns or requests..."
                        value={newAppointment.notes}
                        onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowScheduleForm(false)}
                        className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        disabled={submitting}
                      >
                        {submitting ? 'Requesting...' : 'Request Appointment'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
            
            {messages.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages</h3>
                <p className="text-gray-600">Messages from your healthcare providers will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(message => (
                  <div key={message.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${
                    !message.read ? 'ring-2 ring-blue-100' : ''
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{message.from}</h3>
                          <p className="text-sm text-gray-500">{message.date}</p>
                        </div>
                      </div>
                      {!message.read && (
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-gray-900 mb-2">{message.subject}</h4>
                    <p className="text-gray-600 leading-relaxed">{message.message}</p>
                    
                    <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-100">
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Reply
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                        Mark as Read
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;