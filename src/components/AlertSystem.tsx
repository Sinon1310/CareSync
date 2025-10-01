import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Bell, 
  Activity,
  Heart,
  Droplet,
  User,
  X
} from 'lucide-react';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  patientId: string;
  patientName: string;
  timestamp: Date;
  isRead: boolean;
  actionRequired?: boolean;
  vitalType?: string;
  vitalValue?: string;
}

interface AlertSystemProps {
  patients: Array<{
    id: string;
    name: string;
    email: string;
    status: 'normal' | 'warning' | 'critical';
    latestVitals?: any;
    lastReading?: Date;
  }>;
}

const AlertSystem: React.FC<AlertSystemProps> = ({ patients }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  useEffect(() => {
    generateAlerts();
  }, [patients]);

  const generateAlerts = () => {
    const newAlerts: Alert[] = [];

    // Generate alerts based on patient data
    patients.forEach(patient => {
      // Critical patients alert
      if (patient.status === 'critical') {
        newAlerts.push({
          id: `critical-${patient.id}-${Date.now()}`,
          type: 'critical',
          title: 'Critical Patient Alert',
          message: `${patient.name} has critical vital signs requiring immediate attention`,
          patientId: patient.id,
          patientName: patient.name,
          timestamp: new Date(),
          isRead: false,
          actionRequired: true
        });
      }

      // Warning patients alert
      if (patient.status === 'warning') {
        newAlerts.push({
          id: `warning-${patient.id}-${Date.now()}`,
          type: 'warning',
          title: 'Patient Monitoring Required',
          message: `${patient.name} has vital signs outside normal range`,
          patientId: patient.id,
          patientName: patient.name,
          timestamp: new Date(),
          isRead: false,
          actionRequired: true
        });
      }

      // No recent readings alert
      if (patient.lastReading) {
        const hoursSinceReading = (Date.now() - patient.lastReading.getTime()) / (1000 * 60 * 60);
        if (hoursSinceReading > 24) {
          newAlerts.push({
            id: `no-reading-${patient.id}-${Date.now()}`,
            type: 'info',
            title: 'No Recent Vitals',
            message: `${patient.name} hasn't recorded vitals in over 24 hours`,
            patientId: patient.id,
            patientName: patient.name,
            timestamp: new Date(),
            isRead: false,
            actionRequired: false
          });
        }
      }

      // Specific vital alerts
      if (patient.latestVitals) {
        if (patient.latestVitals.bloodPressure) {
          const [systolic, diastolic] = patient.latestVitals.bloodPressure.split('/').map(Number);
          if (systolic > 140 || diastolic > 90) {
            newAlerts.push({
              id: `bp-${patient.id}-${Date.now()}`,
              type: 'warning',
              title: 'High Blood Pressure Alert',
              message: `${patient.name} - BP: ${patient.latestVitals.bloodPressure} (High)`,
              patientId: patient.id,
              patientName: patient.name,
              timestamp: new Date(),
              isRead: false,
              actionRequired: true,
              vitalType: 'blood_pressure',
              vitalValue: patient.latestVitals.bloodPressure
            });
          }
        }

        if (patient.latestVitals.heartRate) {
          const hr = parseInt(patient.latestVitals.heartRate);
          if (hr > 100 || hr < 60) {
            newAlerts.push({
              id: `hr-${patient.id}-${Date.now()}`,
              type: hr > 100 ? 'warning' : 'info',
              title: hr > 100 ? 'High Heart Rate Alert' : 'Low Heart Rate Alert',
              message: `${patient.name} - Heart Rate: ${hr} bpm`,
              patientId: patient.id,
              patientName: patient.name,
              timestamp: new Date(),
              isRead: false,
              actionRequired: hr > 100,
              vitalType: 'heart_rate',
              vitalValue: patient.latestVitals.heartRate
            });
          }
        }
      }
    });

    // Sort by priority and timestamp
    newAlerts.sort((a, b) => {
      const priorityOrder = { 'critical': 3, 'warning': 2, 'info': 1 };
      if (priorityOrder[a.type] !== priorityOrder[b.type]) {
        return priorityOrder[b.type] - priorityOrder[a.type];
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    setAlerts(newAlerts);
    setUnreadCount(newAlerts.filter(alert => !alert.isRead).length);
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
    setUnreadCount(0);
  };

  const getAlertIcon = (alert: Alert) => {
    if (alert.vitalType === 'blood_pressure') return Activity;
    if (alert.vitalType === 'heart_rate') return Heart;
    if (alert.vitalType === 'blood_sugar') return Droplet;
    return AlertTriangle;
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertIconColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const displayedAlerts = showAllAlerts ? alerts : alerts.slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-red-100 p-2 rounded-lg">
            <Bell className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Alert Center</h2>
            <p className="text-sm text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up!'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Mark all read
            </button>
          )}
          <div className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
            {alerts.length} alerts
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No alerts at this time</p>
            <p className="text-sm text-gray-500">All patients are stable</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayedAlerts.map((alert) => {
              const AlertIcon = getAlertIcon(alert);
              return (
                <div
                  key={alert.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !alert.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getAlertColor(alert.type)}`}>
                      <AlertIcon className={`h-4 w-4 ${getAlertIconColor(alert.type)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${
                          !alert.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {alert.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                          {!alert.isRead && (
                            <button
                              onClick={() => markAsRead(alert.id)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <X className="h-3 w-3 text-gray-400" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{alert.patientName}</span>
                        </div>
                        {alert.actionRequired && (
                          <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                            Take Action
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {alerts.length > 5 && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button
            onClick={() => setShowAllAlerts(!showAllAlerts)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showAllAlerts ? 'Show Less' : `View All ${alerts.length} Alerts`}
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertSystem;
