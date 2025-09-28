import React, { useState } from 'react';
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
  User
} from 'lucide-react';
import VitalChart from './VitalChart';
import { useAuth } from '../contexts/AuthContext';

interface VitalReading {
  id: string;
  type: 'blood_pressure' | 'blood_sugar' | 'heart_rate';
  value: string;
  timestamp: Date;
  status: 'normal' | 'warning' | 'critical';
}

const PatientDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [readings, setReadings] = useState<VitalReading[]>([
    {
      id: '1',
      type: 'blood_pressure',
      value: '120/80',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'normal'
    },
    {
      id: '2',
      type: 'blood_sugar',
      value: '95',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'normal'
    },
    {
      id: '3',
      type: 'heart_rate',
      value: '72',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: 'normal'
    }
  ]);

  const [newReading, setNewReading] = useState<{
    type: VitalReading['type'];
    systolic: string;
    diastolic: string;
    bloodSugar: string;
    heartRate: string;
  }>({
    type: 'blood_pressure',
    systolic: '',
    diastolic: '',
    bloodSugar: '',
    heartRate: ''
  });

  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmitReading = (e: React.FormEvent) => {
    e.preventDefault();
    
    let value = '';
    let type: VitalReading['type'] = newReading.type;
    
    if (newReading.type === 'blood_pressure') {
      value = `${newReading.systolic}/${newReading.diastolic}`;
    } else if (newReading.type === 'blood_sugar') {
      value = newReading.bloodSugar;
      type = 'blood_sugar';
    } else if (newReading.type === 'heart_rate') {
      value = newReading.heartRate;
      type = 'heart_rate';
    }

    if (value) {
      const reading: VitalReading = {
        id: Date.now().toString(),
        type,
        value,
        timestamp: new Date(),
        status: 'normal' // In real app, this would be calculated based on normal ranges
      };

      setReadings([reading, ...readings]);
      setNewReading({
        type: 'blood_pressure',
        systolic: '',
        diastolic: '',
        bloodSugar: '',
        heartRate: ''
      });
      setShowAddForm(false);
    }
  };

  const getVitalIcon = (type: VitalReading['type']) => {
    switch (type) {
      case 'blood_pressure':
        return Activity;
      case 'blood_sugar':
        return Droplet;
      case 'heart_rate':
        return Heart;
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

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Save Reading
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
                  user_id: 'demo-user', // or replace with actual user id if available
                  type: r.type,
                  value: r.value,
                  status: r.status,
                  created_at: r.timestamp.toISOString()
                }))}
              />
            </div>
          </div>
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
      </div>
    </div>
  );
};

export default PatientDashboard;