import React, { useState } from 'react'
import { X, User, UserCheck } from 'lucide-react'

interface RoleSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onRoleSelect: (role: 'patient' | 'doctor') => void
  userEmail?: string
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onRoleSelect, 
  userEmail 
}) => {
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!selectedRole) return
    
    setLoading(true)
    try {
      console.log('Submitting role selection:', selectedRole)
      await onRoleSelect(selectedRole)
      
      // Force navigation to the correct dashboard after role selection
      // This helps with Google OAuth flow where the redirection might not happen automatically
      if (selectedRole === 'patient') {
        window.location.href = '/patient-dashboard'
      } else {
        window.location.href = '/doctor-dashboard'
      }
    } catch (error) {
      console.error('Error selecting role:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome to CareSync!</h2>
            {userEmail && (
              <p className="text-sm text-gray-600 mt-1">Signed in as {userEmail}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Choose your role
            </h3>
            <p className="text-sm text-gray-600">
              Please select how you'll be using CareSync to personalize your experience.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <label 
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedRole === 'patient' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="role"
                value="patient"
                checked={selectedRole === 'patient'}
                onChange={(e) => setSelectedRole(e.target.value as 'patient')}
                className="sr-only"
              />
              <div className="flex items-center space-x-4 w-full">
                <div className={`p-2 rounded-lg ${
                  selectedRole === 'patient' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <User className={`h-6 w-6 ${
                    selectedRole === 'patient' ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Patient</div>
                  <div className="text-sm text-gray-600">
                    Monitor your health, track vitals, and communicate with your healthcare providers
                  </div>
                </div>
              </div>
            </label>

            <label 
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedRole === 'doctor' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="role"
                value="doctor"
                checked={selectedRole === 'doctor'}
                onChange={(e) => setSelectedRole(e.target.value as 'doctor')}
                className="sr-only"
              />
              <div className="flex items-center space-x-4 w-full">
                <div className={`p-2 rounded-lg ${
                  selectedRole === 'doctor' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <UserCheck className={`h-6 w-6 ${
                    selectedRole === 'doctor' ? 'text-green-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Healthcare Provider</div>
                  <div className="text-sm text-gray-600">
                    Manage patients, monitor vital signs, and provide remote care
                  </div>
                </div>
              </div>
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedRole || loading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
          >
            {loading ? 'Setting up your account...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoleSelectionModal
