import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Search,
  Bell,
  Filter,
  Activity,
  Heart,
  Droplet,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  User,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doctorPatientService, vitalReadingsService, profilesService } from '../lib/database';
import toast from 'react-hot-toast';

interface PatientWithVitals {
  id: string;
  name: string;
  email: string;
  lastReading?: Date;
  status: 'normal' | 'warning' | 'critical';
  latestVitals?: {
    bloodPressure?: string;
    bloodSugar?: string;
    heartRate?: string;
    temperature?: string;
  };
}

const DoctorDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<PatientWithVitals[]>([]);
  const [loading, setLoading] = useState(true);

  // Load patients and their latest vitals
  useEffect(() => {
    if (user?.id && profile?.role === 'doctor') {
      loadPatientsData();
    }
  }, [user?.id, profile?.role]);

  const loadPatientsData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Get all patients assigned to this doctor
      const patientRelationships = await doctorPatientService.getPatientsByDoctorId(user.id);
      
      // Get patient details and latest vitals for each patient
      const patientPromises = patientRelationships.map(async (relationship) => {
        if (!relationship.patient) return null;
        
        // Get latest vital readings for this patient
        const vitals = await vitalReadingsService.getByUserId(relationship.patient.id, 5);
        
        // Calculate overall status based on latest readings
        const latestStatus = vitals.length > 0 ? 
          vitals.find(v => v.status === 'critical')?.status ||
          vitals.find(v => v.status === 'warning')?.status ||
          'normal' : 'normal';
        
        // Extract latest vital values
        const latestVitals: PatientWithVitals['latestVitals'] = {};
        vitals.forEach(vital => {
          if (vital.type === 'blood_pressure' && !latestVitals.bloodPressure) {
            latestVitals.bloodPressure = vital.value;
          } else if (vital.type === 'blood_sugar' && !latestVitals.bloodSugar) {
            latestVitals.bloodSugar = vital.value;
          } else if (vital.type === 'heart_rate' && !latestVitals.heartRate) {
            latestVitals.heartRate = vital.value;
          } else if (vital.type === 'temperature' && !latestVitals.temperature) {
            latestVitals.temperature = vital.value;
          }
        });
        
        return {
          id: relationship.patient.id,
          name: relationship.patient.full_name,
          email: relationship.patient.email,
          lastReading: vitals.length > 0 ? new Date(vitals[0].recorded_at || vitals[0].created_at) : undefined,
          status: latestStatus as 'normal' | 'warning' | 'critical',
          latestVitals
        };
      });
      
      const patientsData = (await Promise.all(patientPromises)).filter(Boolean) as PatientWithVitals[];
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading patients data:', error);
      toast.error('Failed to load patients data');
    } finally {
      setLoading(false);
    }
  };

  // Static data for demo (fallback)
  const staticPatients: PatientWithVitals[] = [
    {
      id: '1',
      name: 'John Smith',
      age: 65,
      condition: 'Hypertension',
      lastReading: new Date(Date.now() - 30 * 60 * 1000),
      status: 'warning',
      vitals: {
        bloodPressure: '145/92',
        bloodSugar: '110',
        heartRate: '78'
      }
    },
    {
      id: '2',
      name: 'Maria Garcia',
      age: 58,
      condition: 'Type 2 Diabetes',
      lastReading: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'normal',
      vitals: {
        bloodPressure: '118/75',
        bloodSugar: '95',
        heartRate: '68'
      }
    },
    {
      id: '3',
      name: 'Robert Johnson',
      age: 72,
      condition: 'Heart Disease',
      lastReading: new Date(Date.now() - 45 * 60 * 1000),
      status: 'critical',
      vitals: {
        bloodPressure: '160/100',
        bloodSugar: '180',
        heartRate: '95'
      }
    },
    {
      id: '4',
      name: 'Sarah Wilson',
      age: 45,
      condition: 'Pre-diabetes',
      lastReading: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'normal',
      vitals: {
        bloodPressure: '125/80',
        bloodSugar: '105',
        heartRate: '72'
      }
    },
    {
      id: '5',
      name: 'Michael Brown',
      age: 68,
      condition: 'Hypertension, Diabetes',
      lastReading: new Date(Date.now() - 8 * 60 * 60 * 1000),
      status: 'warning',
      vitals: {
        bloodPressure: '140/88',
        bloodSugar: '130',
        heartRate: '82'
      }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'critical':
        return XCircle;
      default:
        return Clock;
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.condition.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && patient.status === selectedFilter;
  });

  const criticalPatients = patients.filter(p => p.status === 'critical').length;
  const warningPatients = patients.filter(p => p.status === 'warning').length;
  const normalPatients = patients.filter(p => p.status === 'normal').length;

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome, Dr. {profile?.full_name?.split(' ').pop() || user?.email?.split('@')[0]}! 👩‍⚕️
              </h1>
              <p className="text-gray-600">Monitor your patients' health status and vital signs</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <button className="relative p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {criticalPatients}
                </span>
              </button>
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

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900">{patients.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Critical Alerts</p>
                <p className="text-3xl font-bold text-red-600">{criticalPatients}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Warnings</p>
                <p className="text-3xl font-bold text-yellow-600">{warningPatients}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Normal Status</p>
                <p className="text-3xl font-bold text-green-600">{normalPatients}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Critical Alerts Section */}
        {criticalPatients > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <h2 className="text-xl font-semibold text-red-900">Critical Alerts</h2>
            </div>
            <div className="space-y-3">
              {patients.filter(p => p.status === 'critical').map((patient) => (
                <div key={patient.id} className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                      <p className="text-sm text-gray-600">{patient.condition}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">Blood Pressure: {patient.vitals.bloodPressure}</p>
                      <p className="text-xs text-gray-500">Last reading: {getTimeAgo(patient.lastReading)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Patients</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Patient List */}
          <div className="divide-y divide-gray-100">
            {filteredPatients.map((patient) => {
              const StatusIcon = getStatusIcon(patient.status);
              return (
                <div key={patient.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {patient.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                        <p className="text-gray-600">Age {patient.age} • {patient.condition}</p>
                        <p className="text-sm text-gray-500">Last reading: {getTimeAgo(patient.lastReading)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                      {/* Vital Signs */}
                      <div className="grid grid-cols-3 gap-4 sm:gap-6">
                        <div className="text-center">
                          <Activity className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">BP</p>
                          <p className="font-semibold text-gray-900">{patient.vitals.bloodPressure}</p>
                        </div>
                        <div className="text-center">
                          <Droplet className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">Sugar</p>
                          <p className="font-semibold text-gray-900">{patient.vitals.bloodSugar}</p>
                        </div>
                        <div className="text-center">
                          <Heart className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">HR</p>
                          <p className="font-semibold text-gray-900">{patient.vitals.heartRate}</p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(patient.status)}`}>
                        <StatusIcon className="h-4 w-4 mr-2" />
                        {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                      </div>

                      {/* Action Button */}
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {filteredPatients.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No patients found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;