import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Heart, 
  Droplet, 
  Thermometer,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface RealtimeVitalReading {
  id: string;
  user_id: string;
  type: 'blood_pressure' | 'blood_sugar' | 'heart_rate' | 'temperature';
  value: string;
  systolic?: number;
  diastolic?: number;
  status: 'normal' | 'warning' | 'critical';
  recorded_at: string;
  created_at: string;
  patient_name?: string;
  patient_email?: string;
}

const LiveVitalMonitor: React.FC = () => {
  const { user } = useAuth();
  const [realtimeReadings, setRealtimeReadings] = useState<RealtimeVitalReading[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [patientMap, setPatientMap] = useState<Map<string, { name: string; email: string }>>(new Map());

  // Load patient information for this doctor
  useEffect(() => {
    if (!user?.id) return;

    const loadPatients = async () => {
      try {
        console.log('Loading patients for doctor:', user.id);
        const { data, error } = await supabase
          .from('doctor_patient_relationships')
          .select(`
            patient_id,
            profiles!doctor_patient_relationships_patient_id_fkey (
              full_name,
              email
            )
          `)
          .eq('doctor_id', user.id)
          .eq('status', 'active');

        if (error) {
          console.error('Error loading patients:', error);
          return;
        }

        console.log('Raw patient data:', data);

        const map = new Map();
        data?.forEach(relationship => {
          const profile = Array.isArray(relationship.profiles) 
            ? relationship.profiles[0] 
            : relationship.profiles;
          if (profile) {
            map.set(relationship.patient_id, {
              name: profile.full_name,
              email: profile.email
            });
          }
        });
        setPatientMap(map);
        console.log('Loaded patients for monitoring:', map.size, 'patients');
        console.log('Patient map entries:', Array.from(map.entries()));
      } catch (error) {
        console.error('Error in loadPatients:', error);
      }
    };

    loadPatients();
  }, [user?.id]);

  // Load existing vital readings on mount
  useEffect(() => {
    const loadExistingReadings = async () => {
      if (!user?.id || patientMap.size === 0) return;
      
      try {
        console.log('📋 Loading existing vital readings...');
        const patientIds = Array.from(patientMap.keys());
        console.log('🔍 Loading readings for patients:', patientIds);
        
        const { data: readings, error } = await supabase
          .from('vital_readings')
          .select('*')
          .in('user_id', patientIds)
          .order('recorded_at', { ascending: false })
          .limit(20);
        
        if (error) {
          console.error('❌ Error loading readings:', error);
          return;
        }
        
        console.log('✅ Loaded readings:', readings);
        const enrichedReadings = readings?.map(reading => ({
          ...reading,
          patient_name: patientMap.get(reading.user_id)?.name || 'Unknown',
          patient_email: patientMap.get(reading.user_id)?.email || ''
        })) || [];
        
        setRealtimeReadings(enrichedReadings);
      } catch (error) {
        console.error('💥 Error in loadExistingReadings:', error);
      }
    };
    
    loadExistingReadings();
  }, [user?.id, patientMap]);

  // Set up real-time subscription for vital readings
  useEffect(() => {
    if (!user?.id) return;

    // Always set up subscription, regardless of patient count
    console.log('Setting up real-time subscription...');
    
    const subscription = supabase
      .channel(`live_vitals_doctor_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vital_readings'
        },
        (payload) => {
          console.log('🔥 Received vital reading:', payload.new);
          const newReading = payload.new as RealtimeVitalReading;
          
          // Check if this reading is from one of our patients
          const patientInfo = patientMap.get(newReading.user_id);
          console.log('🔍 Patient info lookup:', newReading.user_id, '→', patientInfo);
          
          if (patientInfo) {
            const enrichedReading = {
              ...newReading,
              patient_name: patientInfo.name,
              patient_email: patientInfo.email
            };

            console.log('✅ Adding reading to live monitor:', enrichedReading);
            setRealtimeReadings(prev => [enrichedReading, ...prev.slice(0, 19)]);

            // Show toast notification
            if (newReading.status === 'critical') {
              toast.error(`🚨 CRITICAL: ${patientInfo.name} - ${newReading.type.replace('_', ' ')} ${newReading.value}`, {
                duration: 8000,
                icon: '🚨'
              });
            } else if (newReading.status === 'warning') {
              toast(`⚠️ Warning: ${patientInfo.name} - ${newReading.type.replace('_', ' ')} ${newReading.value}`, {
                duration: 5000,
                icon: '⚠️'
              });
            } else {
              toast.success(`📊 ${patientInfo.name} recorded ${newReading.type.replace('_', ' ')}: ${newReading.value}`, {
                duration: 3000,
                icon: '✅'
              });
            }
          } else {
            console.log('❌ Reading from non-patient user:', newReading.user_id);
            console.log('Available patients:', Array.from(patientMap.keys()));
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('🔌 Unsubscribing from vital readings');
      subscription.unsubscribe();
    };
  }, [user?.id, patientMap]);

  const getVitalIcon = (type: string) => {
    switch (type) {
      case 'blood_pressure':
        return <Heart className="h-5 w-5" />;
      case 'blood_sugar':
        return <Droplet className="h-5 w-5" />;
      case 'heart_rate':
        return <Activity className="h-5 w-5" />;
      case 'temperature':
        return <Thermometer className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default:
        return 'text-green-600 bg-green-100 border-green-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <TrendingDown className="h-4 w-4 text-yellow-500" />;
      default:
        return <Minus className="h-4 w-4 text-green-500" />;
    }
  };

  const formatVitalType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              {isConnected && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white">
                  <div className="h-full w-full bg-green-500 rounded-full animate-ping"></div>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Live Vital Monitor</h3>
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <div className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                {isConnected ? 'Real-time monitoring active' : 'Establishing connection...'}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="inline-flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{realtimeReadings.length}</div>
                <div className="text-xs text-gray-500">Live Readings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{patientMap.size}</div>
                <div className="text-xs text-gray-500">Patients</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {realtimeReadings.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {realtimeReadings.map((reading, index) => (
              <div 
                key={reading.id} 
                className={`p-4 transition-all duration-300 ${
                  index === 0 ? 'bg-blue-50 border-l-4 border-blue-400' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(reading.status)}`}>
                      {getVitalIcon(reading.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">
                          {reading.patient_name || 'Unknown Patient'}
                        </h4>
                        {index === 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
                            New
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-600">
                          {formatVitalType(reading.type)}
                        </span>
                        <span className="text-lg font-semibold text-gray-900">
                          {reading.value}
                        </span>
                        {reading.type === 'blood_pressure' && (
                          <span className="text-xs text-gray-500">mmHg</span>
                        )}
                        {reading.type === 'blood_sugar' && (
                          <span className="text-xs text-gray-500">mg/dL</span>
                        )}
                        {reading.type === 'heart_rate' && (
                          <span className="text-xs text-gray-500">bpm</span>
                        )}
                        {reading.type === 'temperature' && (
                          <span className="text-xs text-gray-500">°F</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-2">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reading.status)}`}>
                          {getStatusIcon(reading.status)}
                          <span className="capitalize">{reading.status}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(reading.recorded_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    {getTrendIcon(reading.status)}
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      <span>Live</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="relative mb-6">
              <Activity className="h-16 w-16 text-gray-300 mx-auto" />
              {isConnected && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full animate-pulse">
                  <div className="h-4 w-4 bg-green-500 rounded-full animate-ping"></div>
                </div>
              )}
            </div>
            
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              {isConnected ? '🔴 Live Monitoring Active' : '⚪ Connecting to Live Feed...'}
            </h4>
            
            <p className="text-gray-600 mb-4">
              {isConnected 
                ? 'Ready to receive patient vital readings in real-time'
                : 'Establishing real-time connection...'
              }
            </p>
            
            {patientMap.size > 0 ? (
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="h-2 w-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm font-medium text-blue-700">
                  Monitoring {patientMap.size} patient{patientMap.size !== 1 ? 's' : ''}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-700">
                  No patients assigned
                </span>
              </div>
            )}
            
            <div className="mt-6 text-xs text-gray-500">
              <p>🚨 Critical alerts appear instantly</p>
              <p>⚠️ Warnings are highlighted in real-time</p>
              <p>✅ All readings are monitored continuously</p>
            </div>
          </div>
        )}
      </div>

      {realtimeReadings.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Latest readings from your patients</span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span>Critical</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <span>Warning</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Normal</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveVitalMonitor;
