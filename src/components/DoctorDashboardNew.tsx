import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Search,
  Bell,
  Activity,
  Heart,
  Droplet,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  User,
  Loader2,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doctorPatientService, vitalReadingsService } from '../lib/database';
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
  const [patients, setPatients] = useState<PatientWithVitals[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.id && profile?.role === 'doctor') {
      loadPatientsData();
    }
  }, [user?.id, profile?.role]);

  const loadPatientsData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('Loading patients for doctor:', user.id);
      
      // Try to get patients from database
      try {
        const patientRelationships = await doctorPatientService.getPatientsByDoctorId(user.id);
        console.log('Found patient relationships:', patientRelationships.length);
        
        if (patientRelationships.length === 0) {
          setPatients([]);
          return;
        }

        // Process patient data if relationships exist
        const patientPromises = patientRelationships.map(async (relationship) => {
          if (!relationship.patient) return null;
          
          try {
            const vitals = await vitalReadingsService.getByUserId(relationship.patient.id, 5);
            
            const latestStatus = vitals.length > 0 ? 
              vitals.find(v => v.status === 'critical')?.status ||
              vitals.find(v => v.status === 'warning')?.status ||
              'normal' : 'normal';
            
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
          } catch (error) {
            console.error('Error loading vitals for patient:', relationship.patient.id, error);
            return {
              id: relationship.patient.id,
              name: relationship.patient.full_name,
              email: relationship.patient.email,
              status: 'normal' as const,
              latestVitals: {}
            };
          }
        });
        
        const patientsData = (await Promise.all(patientPromises)).filter(Boolean) as PatientWithVitals[];
        setPatients(patientsData);
        
      } catch (error) {
        console.log('Doctor-patient relationships table not set up yet. Please run setup-doctor-relationships.sql');
        setPatients([]);
      }
      
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading doctor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
                <p className="text-gray-600">Welcome, Dr. {profile?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Bell className="h-5 w-5" />
              </button>
              <button
                onClick={signOut}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Patients</h3>
                <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Critical</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => p.status === 'critical').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Warning</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => p.status === 'warning').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Normal</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => p.status === 'normal').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Patients List */}
        {patients.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Patients Assigned</h3>
            <p className="text-gray-600 mb-4">
              You don't have any patients assigned yet. Doctor-patient relationships need to be set up.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>Next Steps:</strong><br />
                1. Run the setup-doctor-relationships.sql script in Supabase<br />
                2. Assign patients to your doctor account<br />
                3. Patients will appear here once assigned
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPatients.map((patient) => {
              const StatusIcon = getStatusIcon(patient.status);
              return (
                <div key={patient.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-100 p-3 rounded-full">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                        <p className="text-gray-600">{patient.email}</p>
                        {patient.lastReading && (
                          <p className="text-sm text-gray-500">
                            Last reading: {patient.lastReading.toLocaleDateString()} at {patient.lastReading.toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      {/* Vitals */}
                      {patient.latestVitals && Object.keys(patient.latestVitals).length > 0 && (
                        <div className="flex space-x-4">
                          {patient.latestVitals.bloodPressure && (
                            <div className="text-center">
                              <Activity className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                              <p className="text-xs text-gray-500">BP</p>
                              <p className="font-semibold text-gray-900">{patient.latestVitals.bloodPressure}</p>
                            </div>
                          )}
                          {patient.latestVitals.bloodSugar && (
                            <div className="text-center">
                              <Droplet className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                              <p className="text-xs text-gray-500">Sugar</p>
                              <p className="font-semibold text-gray-900">{patient.latestVitals.bloodSugar}</p>
                            </div>
                          )}
                          {patient.latestVitals.heartRate && (
                            <div className="text-center">
                              <Heart className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                              <p className="text-xs text-gray-500">HR</p>
                              <p className="font-semibold text-gray-900">{patient.latestVitals.heartRate}</p>
                            </div>
                          )}
                        </div>
                      )}

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
        )}

        {filteredPatients.length === 0 && patients.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No patients found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
