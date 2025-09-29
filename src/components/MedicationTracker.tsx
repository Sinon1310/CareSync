import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Plus, 
  Check,
  Trash2,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { medicationsService, medicationLogsService, Medication } from '../lib/database';
import toast from 'react-hot-toast';

interface MedicationWithLogs extends Medication {
  todayTaken?: boolean;
  lastTaken?: string;
}

const MedicationTracker: React.FC = () => {
  const { user } = useAuth();
  const [medications, setMedications] = useState<MedicationWithLogs[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    instructions: '',
    start_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user?.id) {
      loadMedications();
    }
  }, [user?.id]);

  const loadMedications = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [medicationsData, todayLogs] = await Promise.all([
        medicationsService.getByPatientId(user.id),
        medicationLogsService.getTodayLogs(user.id)
      ]);

      // Combine medications with today's logs
      const medicationsWithLogs = medicationsData.map(med => {
        const todayLog = todayLogs.find((log: any) => log.medication_id === med.id);
        return {
          ...med,
          todayTaken: !!todayLog,
          lastTaken: todayLog?.taken_at
        };
      });

      setMedications(medicationsWithLogs);
    } catch (error) {
      console.error('Error loading medications:', error);
      toast.error('Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || submitting) return;

    try {
      setSubmitting(true);
      await medicationsService.create({
        patient_id: user.id,
        name: newMedication.name,
        dosage: newMedication.dosage,
        frequency: newMedication.frequency,
        instructions: newMedication.instructions,
        start_date: newMedication.start_date,
        is_active: true
      });

      toast.success('Medication added successfully!');
      setNewMedication({
        name: '',
        dosage: '',
        frequency: '',
        instructions: '',
        start_date: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
      loadMedications();
    } catch (error) {
      console.error('Error adding medication:', error);
      toast.error('Failed to add medication');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkTaken = async (medicationId: string) => {
    if (!user?.id) return;

    try {
      await medicationLogsService.logTaken({
        medication_id: medicationId,
        patient_id: user.id,
        taken_at: new Date().toISOString()
      });

      toast.success('Medication marked as taken!');
      loadMedications();
    } catch (error) {
      console.error('Error logging medication:', error);
      toast.error('Failed to log medication');
    }
  };

  const handleDeactivate = async (medicationId: string) => {
    try {
      await medicationsService.deactivate(medicationId);
      toast.success('Medication deactivated');
      loadMedications();
    } catch (error) {
      console.error('Error deactivating medication:', error);
      toast.error('Failed to deactivate medication');
    }
  };

  const getFrequencyDisplay = (frequency: string) => {
    const frequencyMap: { [key: string]: string } = {
      'once_daily': 'Once daily',
      'twice_daily': 'Twice daily',
      'three_times_daily': 'Three times daily',
      'four_times_daily': 'Four times daily',
      'as_needed': 'As needed',
      'weekly': 'Weekly',
      'monthly': 'Monthly'
    };
    return frequencyMap[frequency] || frequency;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Loading medications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Medications</h2>
            <p className="text-gray-600">Track your daily medications</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Medication
          </button>
        </div>
      </div>

      <div className="p-6">
        {showAddForm && (
          <form onSubmit={handleAddMedication} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Medication</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medication Name *
                </label>
                <input
                  type="text"
                  value={newMedication.name}
                  onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                  placeholder="e.g., Lisinopril"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dosage *
                </label>
                <input
                  type="text"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                  placeholder="e.g., 10mg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency *
                </label>
                <select
                  value={newMedication.frequency}
                  onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select frequency</option>
                  <option value="once_daily">Once daily</option>
                  <option value="twice_daily">Twice daily</option>
                  <option value="three_times_daily">Three times daily</option>
                  <option value="four_times_daily">Four times daily</option>
                  <option value="as_needed">As needed</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newMedication.start_date}
                  onChange={(e) => setNewMedication({...newMedication, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions
              </label>
              <textarea
                value={newMedication.instructions}
                onChange={(e) => setNewMedication({...newMedication, instructions: e.target.value})}
                placeholder="e.g., Take with food, avoid alcohol"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {submitting ? 'Adding...' : 'Add Medication'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {medications.length === 0 ? (
          <div className="text-center py-8">
            <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No medications added yet.</p>
            <p className="text-sm text-gray-500">Add your first medication to start tracking.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {medications.map((medication) => (
              <div 
                key={medication.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    medication.todayTaken ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <Pill className={`h-5 w-5 ${
                      medication.todayTaken ? 'text-green-600' : 'text-blue-600'
                    }`} />
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">{medication.name}</h3>
                    <p className="text-sm text-gray-600">
                      {medication.dosage} • {getFrequencyDisplay(medication.frequency)}
                    </p>
                    {medication.instructions && (
                      <p className="text-xs text-gray-500">{medication.instructions}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {medication.todayTaken ? (
                    <span className="flex items-center text-sm text-green-600">
                      <Check className="h-4 w-4 mr-1" />
                      Taken today
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkTaken(medication.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
                    >
                      <Check className="h-4 w-4" />
                      Mark Taken
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeactivate(medication.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Deactivate medication"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicationTracker;
