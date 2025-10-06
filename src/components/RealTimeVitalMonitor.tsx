import React, { useEffect, useState } from 'react';
import { AlertTriangle, Activity, Heart, Droplet, Thermometer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface RealTimeVitalMonitor {
  onVitalAlert?: (vital: any) => void;
}

const RealTimeVitalMonitor: React.FC<RealTimeVitalMonitor> = ({ onVitalAlert }) => {
  const { user, profile } = useAuth();
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id || profile?.role !== 'doctor') return;

    // Subscribe to real-time vital readings for alert detection
    const subscription = supabase
      .channel('vital_monitoring')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vital_readings',
          filter: `status=in.(critical,warning)`
        },
        async (payload) => {
          const vitalReading = payload.new;
          console.log('🚨 Real-time vital alert detected:', vitalReading);

          try {
            // Get patient information
            const { data: patientData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', vitalReading.user_id)
              .single();

            // Check if this doctor is assigned to this patient
            const { data: relationship } = await supabase
              .from('doctor_patient_relationships')
              .select('id')
              .eq('doctor_id', user.id)
              .eq('patient_id', vitalReading.user_id)
              .eq('status', 'active')
              .single();

            if (relationship && patientData) {
              const alert = {
                ...vitalReading,
                patient_name: patientData.full_name,
                timestamp: new Date()
              };

              setRecentAlerts(prev => [alert, ...prev.slice(0, 4)]); // Keep last 5 alerts

              // Show immediate toast notification
              const alertMessage = `${patientData.full_name}: ${vitalReading.type.replace('_', ' ')} ${vitalReading.value}`;
              
              if (vitalReading.status === 'critical') {
                toast.error(`🚨 CRITICAL: ${alertMessage}`, {
                  duration: 8000,
                  position: 'top-right',
                });
              } else {
                toast(`⚠️ WARNING: ${alertMessage}`, {
                  duration: 6000,
                  position: 'top-right',
                  icon: '⚠️',
                });
              }

              // Call callback if provided
              if (onVitalAlert) {
                onVitalAlert(alert);
              }
            }
          } catch (error) {
            console.error('Error processing real-time vital alert:', error);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, profile?.role, onVitalAlert]);

  const getVitalIcon = (type: string) => {
    switch (type) {
      case 'blood_pressure':
        return <Heart className="h-4 w-4" />;
      case 'blood_sugar':
        return <Droplet className="h-4 w-4" />;
      case 'heart_rate':
        return <Activity className="h-4 w-4" />;
      case 'temperature':
        return <Thermometer className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'critical' ? 'text-red-600' : 'text-yellow-600';
  };

  if (profile?.role !== 'doctor' || recentAlerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 z-40">
      <div className="p-3 border-b border-gray-200 bg-red-50">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="text-sm font-semibold text-red-900">Live Vital Alerts</h3>
        </div>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {recentAlerts.map((alert, index) => (
          <div
            key={`${alert.id}-${index}`}
            className={`p-3 border-b border-gray-100 last:border-b-0 ${
              alert.status === 'critical' ? 'bg-red-50' : 'bg-yellow-50'
            }`}
          >
            <div className="flex items-start space-x-2">
              <div className={`mt-0.5 ${getStatusColor(alert.status)}`}>
                {getVitalIcon(alert.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {alert.patient_name}
                  </p>
                  <span className={`text-xs font-medium ${getStatusColor(alert.status)}`}>
                    {alert.status.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700">
                  {alert.type.replace('_', ' ')}: <strong>{alert.value}</strong>
                </p>
                
                <p className="text-xs text-gray-500 mt-1">
                  {alert.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 bg-gray-50 text-center">
        <button
          onClick={() => setRecentAlerts([])}
          className="text-xs text-gray-600 hover:text-gray-800"
        >
          Clear alerts
        </button>
      </div>
    </div>
  );
};

export default RealTimeVitalMonitor;
