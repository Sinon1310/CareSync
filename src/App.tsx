
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LandingPage from './components/LandingPage'
import PatientDashboard from './components/PatientDashboard'
import DoctorDashboard from './components/DoctorDashboard'
import AuthModal from './components/AuthModal'
import RoleSelectionModal from './components/RoleSelectionModal'
import AuthCallback from './components/AuthCallback'
import { Toaster } from 'react-hot-toast'

const AppRoutes = () => {
  const { 
    user, 
    loading, 
    profile, 
    showAuthModal, 
    setShowAuthModal, 
    authMode, 
    showRoleSelection, 
    setShowRoleSelection, 
    createProfileForGoogleUser 
  } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Auto-redirect authenticated users to their dashboard
  const getRedirectElement = () => {
    // Don't auto-redirect if we're waiting for role selection
    if (user && !profile && showRoleSelection) {
      return <LandingPage />
    }
    
    if (user && profile) {
      if (profile.role === 'patient') {
        return <Navigate to="/patient-dashboard" replace />
      } else if (profile.role === 'doctor') {
        return <Navigate to="/doctor-dashboard" replace />
      }
    }
    return <LandingPage />
  }

  return (
    <>
      <Routes>
        <Route path="/" element={getRedirectElement()} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route 
          path="/patient-dashboard" 
          element={
            user && profile?.role === 'patient' ? 
            <PatientDashboard /> : 
            <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/doctor-dashboard" 
          element={
            user && profile?.role === 'doctor' ? 
            <DoctorDashboard /> : 
            <Navigate to="/" replace />
          } 
        />
      </Routes>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      )}

      {showRoleSelection && user && (
        <RoleSelectionModal
          isOpen={showRoleSelection}
          onClose={() => setShowRoleSelection(false)}
          onRoleSelect={createProfileForGoogleUser}
          userEmail={user.email}
        />
      )}
    </>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  )
}

export default App