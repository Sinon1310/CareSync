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
  Loader2
} from 'lucide-react';
import VitalChart from './VitalChart';
import MedicationTracker from './MedicationTracker';
import { useAuth } from '../contexts/AuthContext';
import { vitalReadingsService } from '../lib/database';
import toast from 'react-hot-toast';
import { showSuccessToast, showErrorToast, showVitalSavedToast, showValidationErrorToast, showLoadingToast } from '../utils/toast';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

interface VitalReading {
  id: string;
  type: 'blood_pressure' | 'blood_sugar' | 'heart_rate' | 'temperature';
  value: string;
  timestamp: Date;
  status: 'normal' | 'warning' | 'critical';
}

const PatientDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const [showAddForm, setShowAddForm] = useState(false);

  // Load vital readings from database
  useEffect(() => {
    if (user?.id) {
      loadVitalReadings();
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
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your health data...</p>
            </div>
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
                <p className="text-2xl font-bold text-gray-900">7 days</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Last Reading</p>
                <p className="text-2xl font-bold text-gray-900">
                  {readings.length > 0 ? '2h ago' : 'None'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Health Score</p>
                <p className="text-2xl font-bold text-green-600">95%</p>
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
                          <Loader2 className="h-4 w-4 animate-spin" />
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
      </div>
    </div>
  );
};

export default PatientDashboard;