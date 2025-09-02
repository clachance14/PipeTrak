#!/usr/bin/env tsx

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), "../../.env.local") });

/**
 * Script to help get the correct Supabase keys from your project
 *
 * To get the correct keys:
 * 1. Go to https://supabase.com/dashboard/project/ogmahtkaqziaoxldxnts/settings/api
 * 2. Copy the "anon public" key (under Project API keys)
 * 3. Copy the "service_role" key (keep this secret!)
 * 4. Update .env.local with these values
 */

console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                    SUPABASE API KEY SETUP GUIDE                    ║
╚════════════════════════════════════════════════════════════════════╝

Your Supabase project is configured but the API keys are invalid.

Project Reference: ogmahtkaqziaoxldxnts
Project URL: https://ogmahtkaqziaoxldxnts.supabase.co

To fix this issue:

1. Open your Supabase dashboard:
   https://supabase.com/dashboard/project/ogmahtkaqziaoxldxnts/settings/api

2. Under "Project API keys", copy these keys:
   
   a) anon (public) key - Used for client-side access
      This key should start with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   b) service_role (secret) key - Used for server-side admin access
      Keep this key SECRET! Never expose it in client code.

3. Update your .env.local file:
   
   NEXT_PUBLIC_SUPABASE_ANON_KEY="<paste-anon-key-here>"
   SUPABASE_SERVICE_ROLE_KEY="<paste-service-role-key-here>"

4. If you can't access the dashboard, you may need to:
   - Log in to Supabase: https://supabase.com
   - Make sure you have access to the project
   - Or create a new Supabase project

5. After updating the keys, restart your dev server:
   pnpm dev

Current (Invalid) Key in .env.local:
${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50)}...

Need help?
- Supabase Docs: https://supabase.com/docs/guides/api#api-url-and-keys
- Check project access: https://supabase.com/dashboard/projects
`);

// Test the current key
async function testKey() {
	console.log("\nTesting current API key...");
	const testUrl = "https://ogmahtkaqziaoxldxnts.supabase.co/rest/v1/";
	const currentKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (currentKey) {
		try {
			const response = await fetch(testUrl, {
				headers: {
					apikey: currentKey,
					Authorization: `Bearer ${currentKey}`,
				},
			});

			if (response.ok) {
				console.log("✅ API key is valid!");
			} else {
				const error = await response.text();
				console.log("❌ API key is invalid:", error);
			}
		} catch (error) {
			console.log("❌ Failed to test API key:", error);
		}
	} else {
		console.log("❌ No API key found in environment variables");
	}
}

testKey().then(() => process.exit(0));
