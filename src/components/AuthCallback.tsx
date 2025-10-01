import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const { user, profile, loading, showRoleSelection } = useAuth();

  // Log information for debugging
  useEffect(() => {
    console.log('AuthCallback rendered', {
      user: !!user,
      profile: !!profile,
      loading,
      showRoleSelection,
      userEmail: user?.email,
      profileRole: profile?.role
    });
  }, [user, profile, loading, showRoleSelection]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing sign-in process...</p>
        </div>
      </div>
    );
  }

  // If we have a user and profile, redirect to the appropriate dashboard
  if (user && profile) {
    const redirectPath = profile.role === 'patient' 
      ? '/patient-dashboard' 
      : '/doctor-dashboard';
    
    console.log('✅ Redirecting to dashboard:', {
      redirectPath,
      userEmail: user.email,
      userRole: profile.role
    });
    return <Navigate to={redirectPath} replace />;
  }

  // If we have a user but no profile, and role selection is showing, go to home
  // so the role selection modal can appear
  if (user && !profile) {
    console.log('⚠️ User exists but no profile, triggering role selection:', {
      userEmail: user.email,
      showRoleSelection
    });
    return <Navigate to="/" replace />;
  }

  // If no user, redirect to landing page
  console.log('❌ No user found, redirecting to landing page');
  return <Navigate to="/" replace />;
};

export default AuthCallback;
