import React, { useState } from 'react';
import { 
  MessageSquare, 
  Calendar, 
  Bell,
  UserPlus,
  FileText,
  Phone,
  Video,
  Clock,
  Stethoscope,
  Pill,
  Activity
} from 'lucide-react';

interface QuickActionsProps {
  patients: Array<{
    id: string;
    name: string;
    email: string;
    status: 'normal' | 'warning' | 'critical';
  }>;
}

const QuickActions: React.FC<QuickActionsProps> = ({ patients }) => {
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('');

  const criticalPatients = patients.filter(p => p.status === 'critical').length;
  const warningPatients = patients.filter(p => p.status === 'warning').length;

  const quickActions = [
    {
      id: 'message-all',
      title: 'Message All Patients',
      description: 'Send bulk message to patients',
      icon: MessageSquare,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => handleAction('message-all')
    },
    {
      id: 'schedule-appointment',
      title: 'Schedule Appointment',
      description: 'Book new patient appointment',
      icon: Calendar,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => handleAction('schedule-appointment')
    },
    {
      id: 'emergency-alert',
      title: 'Emergency Alert',
      description: 'Send urgent notification',
      icon: Bell,
      color: 'bg-red-500 hover:bg-red-600',
      action: () => handleAction('emergency-alert')
    },
    {
      id: 'add-patient',
      title: 'Add New Patient',
      description: 'Register new patient',
      icon: UserPlus,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => handleAction('add-patient')
    },
    {
      id: 'clinical-notes',
      title: 'Clinical Notes',
      description: 'View/add patient notes',
      icon: FileText,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: () => handleAction('clinical-notes')
    },
    {
      id: 'video-call',
      title: 'Start Video Call',
      description: 'Begin telehealth session',
      icon: Video,
      color: 'bg-teal-500 hover:bg-teal-600',
      action: () => handleAction('video-call')
    }
  ];

  const handleAction = (actionId: string) => {
    setSelectedAction(actionId);
    setShowActionModal(true);
  };

  const executeAction = () => {
    // In a real app, this would trigger the actual action
    switch (selectedAction) {
      case 'message-all':
        alert(`Sending message to all ${patients.length} patients...`);
        break;
      case 'schedule-appointment':
        alert('Opening appointment scheduler...');
        break;
      case 'emergency-alert':
        alert('Sending emergency alert to critical patients...');
        break;
      case 'add-patient':
        alert('Opening patient registration form...');
        break;
      case 'clinical-notes':
        alert('Opening clinical notes system...');
        break;
      case 'video-call':
        alert('Starting video call platform...');
        break;
      default:
        alert('Action not implemented yet');
    }
    setShowActionModal(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Stethoscope className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              <p className="text-sm text-gray-600">Common doctor tasks and shortcuts</p>
            </div>
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center space-x-3">
            {criticalPatients > 0 && (
              <div className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                {criticalPatients} Critical
              </div>
            )}
            {warningPatients > 0 && (
              <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                {warningPatients} Warning
              </div>
            )}
            <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {patients.length} Total
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.action}
                  className={`${action.color} text-white p-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-6 w-6" />
                    <div className="text-left">
                      <h3 className="font-semibold text-sm">{action.title}</h3>
                      <p className="text-xs opacity-90">{action.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Today's Tasks</h3>
            <Clock className="h-4 w-4 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Review critical patients</span>
              </div>
              <span className="text-xs text-gray-500">High Priority</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Pill className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Medication review for 3 patients</span>
              </div>
              <span className="text-xs text-gray-500">Medium Priority</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Follow-up calls pending</span>
              </div>
              <span className="text-xs text-gray-500">Low Priority</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Action
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to execute this action?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={executeAction}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickActions;
