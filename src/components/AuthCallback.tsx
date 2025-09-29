import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const { user, profile, loading } = useAuth();

  // Log information for debugging
  useEffect(() => {
    console.log('AuthCallback rendered', {
      user: !!user,
      profile: !!profile,
      loading,
      userEmail: user?.email,
      profileRole: profile?.role
    });
  }, [user, profile, loading]);

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
    
    return <Navigate to={redirectPath} replace />;
  }

  // If we have a user but no profile, the role selection modal should be shown
  // The modal is controlled by the AuthContext, so just go to home page
  if (user && !profile) {
    return <Navigate to="/" replace />;
  }

  // If no user, redirect to landing page
  return <Navigate to="/" replace />;
};

export default AuthCallback;
