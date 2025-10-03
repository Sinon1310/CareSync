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
    console.log('🚀 AuthContext initializing...')
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📊 Initial session check:', {
        hasSession: !!session,
        userEmail: session?.user?.email || 'No user',
        userId: session?.user?.id || 'No ID',
        timestamp: new Date().toISOString()
      })
      
      setUser(session?.user ?? null)
      if (session?.user) {
        console.log('👤 Initial session found, fetching profile for:', session.user.email)
        fetchProfile(session.user.id)
      } else {
        console.log('👤 No initial session found')
        setLoading(false)
      }
    }).catch((error) => {
      console.error('❌ Auth session error:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user')
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🎉 User successfully signed in via Google OAuth!')
          setUser(session.user)
          
          // Small delay to ensure everything is settled
          setTimeout(async () => {
            console.log('👤 Checking profile for user:', session.user.email)
            
            const profileExists = await fetchProfile(session.user.id);
            
            if (!profileExists) {
              console.log('❌ No profile exists, showing role selection')
              setShowRoleSelection(true);
              setLoading(false);
            } else {
              console.log('✅ Profile exists, user ready for dashboard')
              setShowRoleSelection(false);
              setLoading(false);
            }
          }, 1000) // 1 second delay for stability
          
        } else if (event === 'SIGNED_OUT' || !session?.user) {
          console.log('� User signed out or no session')
          setUser(null)
          setProfile(null);
          setShowRoleSelection(false);
          setLoading(false);
        } else {
          console.log('🔄 Other auth event:', event)
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchProfile(session.user.id)
          }
          setLoading(false)
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
      console.log('🚀 Starting Google OAuth...')
      
      // Clear any existing state
      setShowRoleSelection(false)
      setProfile(null)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      
      if (error) {
        console.error('❌ Google OAuth error:', error)
        throw error
      }
      
      console.log('✅ Google OAuth initiated successfully')
    } catch (error) {
      console.error('❌ Error signing in with Google:', error)
      alert('Google sign-in failed. Please try again.')
      throw error
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const createProfileForGoogleUser = async (role: 'patient' | 'doctor') => {
    if (!user) {
      console.error('❌ No user found for profile creation')
      throw new Error('No user found')
    }
    
    console.log('🔄 Creating profile for Google user:', {
      userId: user.id,
      email: user.email,
      role: role
    })

    try {
      // Simple upsert approach - either insert or update
      const profileData = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role,
        updated_at: new Date().toISOString()
      }
      
      console.log('📝 Profile data to upsert:', profileData)
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error upserting profile:', error)
        console.error('Full error details:', JSON.stringify(error, null, 2))
        throw new Error(`Database error: ${error.message}`)
      }
      
      console.log('✅ Profile upserted successfully:', data)
      
      // Update local state immediately
      setProfile(data)
      
      // Close the role selection modal
      setShowRoleSelection(false)
      
      console.log('🚀 Profile ready, navigating to dashboard:', role)
      
      // Force immediate navigation
      if (role === 'patient') {
        window.location.href = '/patient-dashboard'
      } else {
        window.location.href = '/doctor-dashboard'
      }
      
      // Return success
      return { success: true, role }
    } catch (error) {
      console.error('❌ FATAL ERROR in createProfileForGoogleUser:', error)
      
      // Show user-friendly error
      const errorMessage = error instanceof Error ? error.message : 'Failed to create profile'
      throw new Error(errorMessage)
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