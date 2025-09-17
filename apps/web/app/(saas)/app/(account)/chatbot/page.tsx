import { AiChat } from "@saas/ai/components/AiChat";
import { aiChatListQueryKey, aiChatQueryKey } from "@saas/ai/lib/api";
import { getSession } from "@saas/auth/lib/server";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { getServerApiClient, getServerQueryClient } from "@shared/lib/server";
import { redirect } from "next/navigation";

export default async function AiDemoPage() {
	const session = await getSession();

	if (session?.user.email?.toLowerCase() !== "clachance14@hotmail.com") {
		redirect("/app");
	}

	const queryClient = getServerQueryClient();
	const apiClient = await getServerApiClient();

	const chats = await (async () => {
		const response = await apiClient.ai.chats.$get({});

		if (!response.ok) {
			throw new Error("Failed to fetch chats");
		}

		return response.json().then((data) => data.chats);
	})();

	await queryClient.prefetchQuery({
		queryKey: aiChatListQueryKey(),
		queryFn: async () => chats,
	});

	if (chats.length > 0) {
		await queryClient.prefetchQuery({
			queryKey: aiChatQueryKey(chats[0].id),
			queryFn: async () => {
				const response = await apiClient.ai.chats[":id"].$get({
					param: {
						id: chats[0].id,
					},
				});

				if (!response.ok) {
					throw new Error("Failed to fetch chat");
				}

				return response.json();
			},
		});
	}

	return (
		<>
			<PageHeader
				title="AI Chatbot"
				subtitle="This is an example chatbot built with the OpenAI API"
			/>

			<AiChat />
		</>
	);
}
