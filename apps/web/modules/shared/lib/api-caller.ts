import "server-only";
import { createApiCaller } from "api/trpc/caller";

// The api caller is used to make api calls from the server,
// so there is no real http request, but instead it will
// just call the function directly

let apiCaller: Awaited<ReturnType<typeof createApiCaller>> | null = null;

export const getApiCaller = async () => {
	if (!apiCaller) {
		apiCaller = await createApiCaller();
	}

	return apiCaller;
};
