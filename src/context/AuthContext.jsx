// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initializeSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        console.error('Unable to restore the current session:', error);
        setProfileError(error);
      }

      setUser(session?.user ?? null);
      if (session?.user) await loadProfile(session.user.id);
      if (mounted) setLoading(false);
    }

    initializeSession();

    // Listen for auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'INITIAL_SESSION') return;
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setProfileError(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(uid) {
    setProfileError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (error) {
      console.error('Unable to load the user profile:', error);
      setProfile(null);
      setProfileError(error);
      return null;
    }

    setProfile(data ?? null);
    return data;
  }

  async function signUp({ email, password, full_name }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, role: 'customer' } },
    });
    if (data.user) await loadProfile(data.user.id);
    return { data, error };
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data.user) await loadProfile(data.user.id);
    return { data, error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  }

  async function updatePassword(password) {
    const { data, error } = await supabase.auth.updateUser({ password });
    return { data, error };
  }

  async function createStaff({ email, full_name, password }) {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        return { data: null, error: new Error('Your session has expired. Please sign in again.') };
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, full_name, password }),
      });

      const responseText = await response.text();
      let responseBody = {};
      try {
        responseBody = responseText ? JSON.parse(responseText) : {};
      } catch {
        responseBody = {};
      }

      if (!response.ok) {
        const message = responseBody.error || responseBody.message || `Staff creation failed (${response.status})`;
        if (response.status === 404) {
          return {
            data: null,
            error: new Error('The create-staff Edge Function is not deployed to this Supabase project.'),
          };
        }
        return { data: null, error: new Error(message) };
      }

      return { data: responseBody, error: null };
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return {
          data: null,
          error: new Error('Cannot reach Supabase create-staff. Deploy the Edge Function and verify the Supabase URL, CORS, and network connection.'),
        };
      }

      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unable to create staff account'),
      };
    }
  }

  const isAdmin = profile ? profile.role === 'admin' : false;
  const isStaff = profile ? ['admin', 'staff'].includes(profile.role) : false;

  const value = {
    user,
    profile,
    profileError,
    loading,
    isAdmin,
    isStaff,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    createStaff,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
