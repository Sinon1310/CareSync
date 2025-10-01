import React, { useState, useEffect } from 'react';
import { 
  X,
  Activity,
  Heart,
  Droplet,
  Thermometer,
  Calendar,
  Pill,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { vitalReadingsService, medicationsService } from '../lib/database';

interface PatientDetailModalProps {
  patient: {
    id: string;
    name: string;
    email: string;
    status: 'normal' | 'warning' | 'critical';
  };
  isOpen: boolean;
  onClose: () => void;
}

interface VitalReading {
  id: string;
  type: 'blood_pressure' | 'blood_sugar' | 'heart_rate' | 'weight' | 'temperature' | 'oxygen_saturation';
  value: string;
  systolic?: number;
  diastolic?: number;
  status: 'normal' | 'warning' | 'critical';
  recorded_at: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string | null;
  is_active: boolean;
  start_date: string;
}

const PatientDetailModal: React.FC<PatientDetailModalProps> = ({ patient, isOpen, onClose }) => {
  const [vitals, setVitals] = useState<VitalReading[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vitals' | 'medications' | 'trends'>('vitals');

  useEffect(() => {
    if (isOpen && patient.id) {
      loadPatientData();
    }
  }, [isOpen, patient.id]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      
      // Load vital readings
      const vitalReadings = await vitalReadingsService.getByUserId(patient.id, 30);
      setVitals(vitalReadings);
      
      // Load medications
      const patientMedications = await medicationsService.getByPatientId(patient.id);
      setMedications(patientMedications);
      
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getVitalIcon = (type: string) => {
    switch (type) {
      case 'blood_pressure':
        return Activity;
      case 'heart_rate':
        return Heart;
      case 'blood_sugar':
        return Droplet;
      case 'temperature':
        return Thermometer;
      default:
        return Activity;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
              <p className="text-gray-600">{patient.email}</p>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(patient.status)}`}>
                {patient.status === 'normal' && <CheckCircle className="h-4 w-4 mr-1" />}
                {patient.status === 'warning' && <AlertTriangle className="h-4 w-4 mr-1" />}
                {patient.status === 'critical' && <AlertTriangle className="h-4 w-4 mr-1" />}
                {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('vitals')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'vitals'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Activity className="h-4 w-4 inline-block mr-2" />
            Vital Readings ({vitals.length})
          </button>
          <button
            onClick={() => setActiveTab('medications')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'medications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Pill className="h-4 w-4 inline-block mr-2" />
            Medications ({medications.length})
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'trends'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp className="h-4 w-4 inline-block mr-2" />
            Trends
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading patient data...</span>
            </div>
          ) : (
            <>
              {/* Vitals Tab */}
              {activeTab === 'vitals' && (
                <div className="space-y-4">
                  {vitals.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No vital readings recorded yet</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {vitals.map((vital) => {
                        const Icon = getVitalIcon(vital.type);
                        return (
                          <div key={vital.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Icon className="h-5 w-5 text-gray-600" />
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {vital.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </h4>
                                  <p className="text-sm text-gray-600">{formatDate(vital.recorded_at)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-gray-900">{vital.value}</p>
                                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(vital.status)}`}>
                                  {vital.status}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Medications Tab */}
              {activeTab === 'medications' && (
                <div className="space-y-4">
                  {medications.length === 0 ? (
                    <div className="text-center py-12">
                      <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No medications recorded yet</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {medications.map((medication) => (
                        <div key={medication.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{medication.name}</h4>
                              <p className="text-sm text-gray-600">
                                {medication.dosage} - {medication.frequency}
                              </p>
                              {medication.instructions && (
                                <p className="text-sm text-gray-500 mt-1">{medication.instructions}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                Started: {new Date(medication.start_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              medication.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {medication.is_active ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Trends Tab */}
              {activeTab === 'trends' && (
                <div className="space-y-6">
                  {vitals.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No data available for trends analysis</p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Vital Signs Trends</h3>
                      <div className="bg-gray-100 rounded-lg p-8 text-center">
                        <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Chart visualization coming soon</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button 
              onClick={() => alert('Messaging feature coming soon!')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </button>
            <button 
              onClick={() => alert('Appointment scheduling coming soon!')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Appointment
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailModal;
