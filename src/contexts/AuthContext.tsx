import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  showAuthModal: boolean
  setShowAuthModal: (show: boolean) => void
  authMode: 'login' | 'register'
  setAuthMode: (mode: 'login' | 'register') => void
  showRoleSelection: boolean
  setShowRoleSelection: (show: boolean) => void
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string, role: 'patient' | 'doctor') => Promise<{ error: any }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  createProfileForGoogleUser: (role: 'patient' | 'doctor') => Promise<{ success: boolean; role: 'patient' | 'doctor' }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [showRoleSelection, setShowRoleSelection] = useState(false)

  // Fallback to ensure loading doesn't get stuck
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('Fallback: Setting loading to false after 3 seconds')
      setLoading(false)
    }, 3000)

    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    console.log('AuthContext initializing...')
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email || 'No user')
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch((error) => {
      console.error('Auth session error:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'No user')
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Check if we're in Google auth flow
          const isGoogleAuthFlow = localStorage.getItem('googleAuthInProgress') === 'true';
          const profileExists = await fetchProfile(session.user.id);
          
          if (isGoogleAuthFlow && event === 'SIGNED_IN') {
            // If Google auth flow and just signed in
            localStorage.removeItem('googleAuthInProgress');
            
            if (!profileExists) {
              // If no profile exists, show role selection modal
              setShowRoleSelection(true);
            }
            // Profile exists, the redirect in App.tsx will handle navigation
          } 
          else if (!profileExists && event === 'SIGNED_IN') {
            // Non-Google auth but no profile
            setShowRoleSelection(true);
          }
        } else {
          setProfile(null);
          setShowRoleSelection(false);
          setLoading(false);
          localStorage.removeItem('googleAuthInProgress');
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No profile found for user')
          setProfile(null)
          setLoading(false)
          return false // Profile doesn't exist
        } else {
          console.error('Profile fetch error:', error)
        }
      } else if (data) {
        console.log('Profile loaded:', data.role)
        setProfile(data)
        setLoading(false)
        return true // Profile exists
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
    } finally {
      setLoading(false)
    }
    return false
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error: { message: 'Network error. Please check your connection.' } }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: 'patient' | 'doctor') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (!error && data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            role,
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
          return { error: profileError }
        }
      }

      return { error }
    } catch (error) {
      return { error: { message: 'Network error. Please check your connection.' } }
    }
  }

  const signInWithGoogle = async () => {
    try {
      // Store a flag in localStorage to indicate we're in Google auth flow
      localStorage.setItem('googleAuthInProgress', 'true');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Use a specific route for redirect to handle Google auth completion
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) throw error
    } catch (error) {
      localStorage.removeItem('googleAuthInProgress');
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const createProfileForGoogleUser = async (role: 'patient' | 'doctor') => {
    if (!user) throw new Error('No user found')
    
    console.log('Creating profile for Google user:', {
      userId: user.id,
      email: user.email,
      role: role
    })
    
    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        
      if (existingProfile) {
        console.log('Profile already exists, updating role:', role)
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({ role: role })
          .eq('id', user.id)
          
        if (error) throw error
      } else {
        // Insert new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role,
          })
  
        if (error) throw error
      }
      
      // Refresh profile
      await fetchProfile(user.id)
      setShowRoleSelection(false)
      
      // Return success
      return { success: true, role }
    } catch (error) {
      console.error('Error creating/updating profile:', error)
      throw error
    }
  }

  const value = {
    user,
    profile,
    loading,
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
    showRoleSelection,
    setShowRoleSelection,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    createProfileForGoogleUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}