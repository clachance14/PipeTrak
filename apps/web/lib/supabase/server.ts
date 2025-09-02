import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Fallback: Extract project reference from DATABASE_URL if direct config not available
const DATABASE_URL = process.env.DATABASE_URL || "";
const projectRef = DATABASE_URL.match(/postgres\.([^:]+):/)?.[1] || "";
const fallbackUrl = projectRef ? `https://${projectRef}.supabase.co` : "";
const fallbackKey = DATABASE_URL.match(/:([^@]+)@/)?.[1] || "";

// Use direct config first, then fallback
const finalUrl = supabaseUrl || fallbackUrl;
const finalKey = supabaseAnonKey || fallbackKey;

/**
 * Create a Supabase client for server-side operations
 * This is used for calling RPC functions and accessing Supabase features
 */
export async function createClient() {
	console.log("[createClient] Creating Supabase client...");
	console.log("[createClient] Project ref:", projectRef);
	console.log("[createClient] Final URL:", finalUrl);
	console.log("[createClient] Has final key:", !!finalKey);
	console.log("[createClient] Key length:", finalKey?.length);

	if (!finalUrl || !finalKey) {
		console.error("[createClient] Supabase configuration missing!");
		console.error("[createClient] Final URL:", finalUrl);
		console.error("[createClient] Final key exists:", !!finalKey);
		console.error("[createClient] DATABASE_URL available:", !!DATABASE_URL);
		console.error(
			"[createClient] NEXT_PUBLIC_SUPABASE_URL available:",
			!!process.env.NEXT_PUBLIC_SUPABASE_URL,
		);
		console.error(
			"[createClient] NEXT_PUBLIC_SUPABASE_ANON_KEY available:",
			!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		);

		throw new Error(
			"Supabase configuration missing: Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables",
		);
	}

	console.log("[createClient] Creating real Supabase client");
	return createSupabaseClient(finalUrl, finalKey, {
		auth: {
			persistSession: false,
		},
	});
}
