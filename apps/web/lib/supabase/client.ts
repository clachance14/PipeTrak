"use client";

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

/**
 * Get or create a singleton Supabase client for client-side operations
 * This prevents multiple GoTrueClient instances from being created
 */
export function createClient() {
  if (!supabaseClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'x-client-info': 'pipetrak-web',
        },
      },
    });
  }
  
  return supabaseClient;
}

/**
 * Create a new Supabase client with custom configuration
 * Use this only when you need specific auth headers or options
 */
export function createClientWithAuth(accessToken?: string) {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'x-client-info': 'pipetrak-web',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    },
  });
}