import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ApiError } from '../lib/api';

const AuthContext = createContext(null);

const clearSupabaseStorage = () => {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
      localStorage.removeItem(key);
    }
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    try {
      localStorage.removeItem('gmarkt_no_persist');
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  useEffect(() => {
    const handler = () => {
      signOut().then(() => {
        window.location.href = '/login';
      });
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  const refreshProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, role, is_banned, created_at, avatar_url, phone_number')
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
      // Check if the last session was marked as "do not persist"
      if (localStorage.getItem('gmarkt_no_persist')) {
        localStorage.removeItem('gmarkt_no_persist');
        clearSupabaseStorage();
        setUser(null);
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      // If session exists but access token is expired, refresh it first
      let activeSession = session;
      if (session?.expires_at && Date.now() / 1000 > session.expires_at) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshData?.session) {
          activeSession = refreshData.session;
        } else {
          activeSession = null;
        }
      }

      setSession(activeSession);
      setUser(activeSession?.user ?? null);

      if (activeSession?.user?.id) {
        const fetchedProfile = await refreshProfile(activeSession.user.id);
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

  const signUp = async (email, password, displayName, phoneNumber) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          phone_number: phoneNumber,
        },
      },
    });

    if (error) throw error;
    return data;
  };

  const signIn = async (email, password, rememberMe = true) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (!rememberMe) {
      localStorage.setItem('gmarkt_no_persist', 'true');
    } else {
      localStorage.removeItem('gmarkt_no_persist');
    }

    const fetchedProfile = await refreshProfile(data?.user?.id);
    if (fetchedProfile?.is_banned) {
      await supabase.auth.signOut();
      throw new ApiError('Your account has been suspended. Please contact support.', 403);
    }

    return data;
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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
