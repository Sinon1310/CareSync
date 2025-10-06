import React, { useState } from 'react';
import { 
  Bell, 
  BellRing, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Trash2,
  Plus,
  Send
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationService from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const NotificationTestDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  
  const [testNotification, setTestNotification] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    priority: 'medium' as const
  });

  const sendTestNotification = async () => {
    if (!user?.id || !testNotification.title || !testNotification.message) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await NotificationService.createNotification({
        user_id: user.id,
        title: testNotification.title,
        message: testNotification.message,
        type: testNotification.type,
        priority: testNotification.priority
      });

      toast.success('Test notification sent!');
      setTestNotification({
        title: '',
        message: '',
        type: 'info',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const sendPredefinedNotifications = async () => {
    if (!user?.id) return;

    try {
      // Send welcome notification
      await NotificationService.sendWelcomeNotification(
        user.id, 
        profile?.role || 'patient', 
        profile?.full_name || 'User'
      );

      // Send a critical alert simulation
      if (profile?.role === 'doctor') {
        await NotificationService.sendCriticalVitalAlert(
          user.id,
          'sample-patient-id',
          'John Doe',
          'blood_pressure',
          '180/120'
        );

        await NotificationService.sendNewPatientAlert(
          user.id,
          'sample-patient-id-2',
          'Jane Smith'
        );
      } else {
        await NotificationService.sendMedicationReminder(
          user.id,
          'sample-med-id',
          'Lisinopril',
          '10mg'
        );

        await NotificationService.sendAppointmentReminder(
          user.id,
          'sample-appointment-id',
          'Dr. Johnson',
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        );
      }

      toast.success('Sample notifications sent!');
    } catch (error) {
      console.error('Error sending sample notifications:', error);
      toast.error('Failed to send sample notifications');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical':
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'appointment':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BellRing className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notification System</h1>
              <p className="text-gray-600">Real-time notifications dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {unreadCount} unread
            </span>
          </div>
        </div>

        {/* Test Notification Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Send Test Notification</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={testNotification.title}
                onChange={(e) => setTestNotification(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Notification title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={testNotification.message}
                onChange={(e) => setTestNotification(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Notification message..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={testNotification.type}
                  onChange={(e) => setTestNotification(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                  <option value="appointment">Appointment</option>
                  <option value="medication">Medication</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={testNotification.priority}
                  onChange={(e) => setTestNotification(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={sendTestNotification}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>Send Test</span>
              </button>

              <button
                onClick={sendPredefinedNotifications}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Send Samples</span>
              </button>
            </div>
          </div>

          {/* Notification Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Mark All as Read ({unreadCount})</span>
              </button>

              <button
                onClick={clearAll}
                disabled={notifications.length === 0}
                className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear All ({notifications.length})</span>
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Notification Statistics</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center p-2 bg-white rounded border">
                  <div className="text-lg font-bold text-blue-600">{notifications.length}</div>
                  <div className="text-gray-600">Total</div>
                </div>
                <div className="text-center p-2 bg-white rounded border">
                  <div className="text-lg font-bold text-red-600">{unreadCount}</div>
                  <div className="text-gray-600">Unread</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {notifications.slice(0, 10).map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.read ? 'bg-opacity-100' : 'bg-opacity-40'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 pt-1">
                      {getTypeIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className={`text-sm font-medium ${
                          !notification.read ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {notification.title}
                        </h4>
                        
                        <div className="flex items-center space-x-2 ml-2">
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`mt-1 text-sm ${
                        !notification.read ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {notification.message}
                      </p>

                      <div className="mt-2 flex items-center space-x-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          notification.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {notification.priority}
                        </span>
                        
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                          {notification.type}
                        </span>

                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h4>
              <p className="text-gray-500">Send a test notification to see how it works!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationTestDashboard;
