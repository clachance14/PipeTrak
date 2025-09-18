import { createClient } from '@supabase/supabase-js';
import { logger } from "@repo/logs";
import type {
	GetSignedUploadUrlHandler,
	GetSignedUrlHander,
} from "../../types";

let supabaseClient: ReturnType<typeof createClient> | null = null;

const getSupabaseClient = () => {
	if (supabaseClient) {
		return supabaseClient;
	}

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl) {
		throw new Error("Missing env variable NEXT_PUBLIC_SUPABASE_URL");
	}

	if (!supabaseServiceKey) {
		throw new Error("Missing env variable SUPABASE_SERVICE_ROLE_KEY");
	}

	supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

	return supabaseClient;
};

export const getSignedUploadUrl: GetSignedUploadUrlHandler = async (
	path,
	{ bucket },
) => {
	const supabase = getSupabaseClient();

	try {
		const { data, error } = await supabase.storage
			.from(bucket)
			.createSignedUploadUrl(path, {
				upsert: true,
			});

		if (error) {
			throw new Error(`Supabase storage error: ${error.message}`);
		}

		return data.signedUrl;
	} catch (e) {
		logger.error(e);
		throw new Error("Could not get signed upload url from Supabase");
	}
};

export const getSignedUrl: GetSignedUrlHander = async (
	path,
	{ bucket, expiresIn = 3600 },
) => {
	const supabase = getSupabaseClient();

	try {
		const { data, error } = await supabase.storage
			.from(bucket)
			.createSignedUrl(path, expiresIn);

		if (error) {
			throw new Error(`Supabase storage error: ${error.message}`);
		}

		return data.signedUrl;
	} catch (e) {
		logger.error(e);
		throw new Error("Could not get signed url from Supabase");
	}
};