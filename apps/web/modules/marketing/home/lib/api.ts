import { apiClient } from "@shared/lib/api-client";
import { useMutation } from "@tanstack/react-query";
import type { InferRequestType } from "hono";

export const newsletterSignupMutationKey = ["newsletter-signup"] as const;
export const useNewsletterSignupMutation = () => {
	return useMutation({
		mutationKey: newsletterSignupMutationKey,
		mutationFn: async (
			form: InferRequestType<
				typeof apiClient.api.newsletter.signup.$post
			>["form"],
		) => {
			const response = await apiClient.api.newsletter.signup.$post({
				form,
			});

			if (!response.ok) {
				throw new Error("Failed to sign up to newsletter");
			}
		},
	});
};
