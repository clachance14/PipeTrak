import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Extract project reference from DATABASE_URL
// Format: postgres://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com
const DATABASE_URL = process.env.DATABASE_URL || '';
const projectRef = DATABASE_URL.match(/postgres\.([^:]+):/)?.[1] || '';

// Construct Supabase URL and anon key
const supabaseUrl = projectRef ? `https://${projectRef}.supabase.co` : '';
// For development, we'll use the service role key from the connection string password
// In production, this should be the anon key from Supabase dashboard
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  // Temporary: extract password from DATABASE_URL as service key for RPC access
  DATABASE_URL.match(/:([^@]+)@/)?.[1] || '';

/**
 * Create a Supabase client for server-side operations
 * This is used for calling RPC functions and accessing Supabase features
 */
export async function createClient() {
  console.log('[createClient] Creating Supabase client...');
  console.log('[createClient] Project ref:', projectRef);
  console.log('[createClient] Supabase URL:', supabaseUrl);
  console.log('[createClient] Has anon key:', !!supabaseAnonKey);
  console.log('[createClient] Anon key length:', supabaseAnonKey?.length);
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[createClient] Supabase configuration missing!');
    console.error('[createClient] URL:', supabaseUrl);
    console.error('[createClient] Key exists:', !!supabaseAnonKey);
    // Return a mock client that returns empty data to prevent crashes
    return {
      from: (table: string) => {
        console.log(`[MockClient] Attempting to query table: ${table}`);
        return {
          select: () => ({ 
            eq: () => ({ 
              single: async () => {
                console.log(`[MockClient] Returning null for ${table} query`);
                return { data: null, error: new Error('Supabase not configured') };
              }
            }),
            data: null,
            error: new Error('Supabase not configured')
          })
        };
      },
      rpc: async (name: string) => {
        console.log(`[MockClient] Attempting to call RPC: ${name}`);
        return { data: null, error: new Error('Supabase RPC not configured') };
      }
    } as any;
  }

  console.log('[createClient] Creating real Supabase client');
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  });
}