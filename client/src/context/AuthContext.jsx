import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ApiError } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, role, is_banned, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch profile:', error);
      setProfile(null);
      return null;
    }

    setProfile(data || null);
    return data || null;
  };

  useEffect(() => {
    // Get initial session
    async function bootstrapAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        const fetchedProfile = await refreshProfile(session.user.id);
        if (fetchedProfile?.is_banned) {
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    }

    bootstrapAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        refreshProfile(session.user.id)
          .then((fetchedProfile) => {
            if (fetchedProfile?.is_banned) {
              return supabase.auth.signOut();
            }

            return null;
          })
          .finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const fetchedProfile = await refreshProfile(data?.user?.id);
    if (fetchedProfile?.is_banned) {
      await supabase.auth.signOut();
      throw new ApiError('Your account has been suspended. Please contact support.', 403);
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const getAuthHeader = async () => {
    // Always get fresh session to handle token refresh
    const { data: { session: currentSession }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return {};
    }
    
    if (currentSession?.access_token) {
      return { Authorization: `Bearer ${currentSession.access_token}` };
    }
    return {};
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    getAuthHeader,
    refreshProfile,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin' || profile?.role === 'super_admin',
    isSuperAdmin: profile?.role === 'super_admin',
    isBanned: !!profile?.is_banned,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
