import { createClient } from '@supabase/supabase-js';

// Try loading from Vite env variables or local storage
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url') || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key') || '';

export const isSupabaseConfigured = () => {
  if (localStorage.getItem('supabase_offline_demo') === 'true') {
    return false;
  }
  return supabaseUrl.trim() !== '' && supabaseAnonKey.trim() !== '';
};

export const getSupabaseConfig = () => {
  return {
    url: supabaseUrl || localStorage.getItem('supabase_url') || '',
    key: supabaseAnonKey || localStorage.getItem('supabase_anon_key') || ''
  };
};

export const setSupabaseConfig = (url, key) => {
  if (url) localStorage.setItem('supabase_url', url);
  else localStorage.removeItem('supabase_url');

  if (key) localStorage.setItem('supabase_anon_key', key);
  else localStorage.removeItem('supabase_anon_key');

  window.location.reload();
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to test if connection works by querying the auth endpoint or reports schema
export const testSupabaseConnection = async (clientInstance = supabase) => {
  if (!clientInstance) return false;
  try {
    const { data, error } = await clientInstance.from('reports').select('id').limit(1);
    if (error && error.code === 'PGRST116') {
      // Means table exists but empty (normal)
      return true;
    }
    if (error && error.code === '42P01') {
      // Table doesn't exist yet, but connection works!
      console.warn("Supabase connected but 'reports' table was not found. Please create the table in your SQL editor.");
      return 'table_missing';
    }
    if (error) {
      console.error("Supabase connection error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase test failed:", err);
    return false;
  }
};
