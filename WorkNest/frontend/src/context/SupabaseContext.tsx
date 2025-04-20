import React, { createContext, useContext, ReactNode } from 'react';
import { supabase } from '../services/tasksSupabase';
import { SupabaseClient } from '@supabase/supabase-js';

// Create a context for Supabase
const SupabaseContext = createContext<SupabaseClient | undefined>(undefined);

// Create a provider component
export const SupabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
};

// Custom hook to use Supabase
export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};