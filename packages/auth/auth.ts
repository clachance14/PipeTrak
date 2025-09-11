import { config } from "@repo/config";
// Removed getBaseUrl import - using auth config's built-in version
import { getAuthConfig, getAuthSecret } from "@repo/config/auth-config-simple";
import {
	db,
	getInvitationById,
	getPurchasesByOrganizationId,
	getPurchasesByUserId,
	getUserByEmail,
	hasExistingMembership,
} from "@repo/database";
import type { Locale } from "@repo/i18n";
import { logger } from "@repo/logs";
import { sendEmail } from "@repo/mail";
import { cancelSubscription } from "@repo/payments";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
	admin,
	createAuthMiddleware,
	magicLink,
	openAPI,
	organization,
	twoFactor,
	username,
} from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import { parse as parseCookies } from "cookie";
import { updateSeatsInOrganizationSubscription } from "./lib/organization";
import { invitationOnlyPlugin } from "./plugins/invitation-only";

const getLocaleFromRequest = (request?: Request) => {
	const cookies = parseCookies(request?.headers.get("cookie") ?? "");
	return (
		(cookies[config.i18n.localeCookieName] as Locale) ??
		config.i18n.defaultLocale
	);
};

// Initialize auth configuration at startup
const authConfig = getAuthConfig();

const appUrl = authConfig.baseURL;

// Log startup information
console.log("🚀 Initializing PipeTrak Auth");

export const auth = betterAuth({
	secret: getAuthSecret(),
	baseURL: appUrl,
	trustedOrigins: authConfig.trustAllOrigins
		? ["*"]
		: authConfig.trustedOrigins,
	appName: authConfig.appName,
	database: prismaAdapter(db, {
		provider: "postgresql",
		// Optimize for serverless environments
		...(process.env.VERCEL && {
			skipPreparedStatements: true,
		}),
	}),
	advanced: {
		database: {
			generateId: false,
		},
	},
	session: {
		expiresIn: authConfig.session.expiresIn,
		freshAge: authConfig.session.freshAge,
	},
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ["google", "github"],
		},
	},
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			// Development mode logging
			if (authConfig.debugMode) {
				console.log(`🔐 Auth hook (after): ${ctx.path}`);
			}

			if (ctx.path.startsWith("/organization/accept-invitation")) {
				const { invitationId } = ctx.body;

				if (!invitationId) {
					return;
				}

				const invitation = await getInvitationById(invitationId);

				if (!invitation) {
					return;
				}

				await updateSeatsInOrganizationSubscription(
					invitation.organizationId,
				);
			} else if (ctx.path.startsWith("/organization/remove-member")) {
				const { organizationId } = ctx.body;

				if (!organizationId) {
					return;
				}

				await updateSeatsInOrganizationSubscription(organizationId);
			}
		}),
		before: createAuthMiddleware(async (ctx) => {
			// Development mode logging
			if (authConfig.debugMode) {
				console.log(`🔐 Auth hook (before): ${ctx.path}`);
			}

			// Development mock user bypass
			if (authConfig.mockUser) {
				console.log(
					"🧪 Using mock user for development:",
					authConfig.mockUser.email,
				);
				// Set mock session
				ctx.context.session = {
					session: {
						userId: authConfig.mockUser.id,
						...authConfig.mockUser,
					},
					user: authConfig.mockUser,
				};
				return; // Skip normal auth processing
			}
			if (
				ctx.path.startsWith("/delete-user") ||
				ctx.path.startsWith("/organization/delete")
			) {
				const userId = ctx.context.session?.session.userId;
				const { organizationId } = ctx.body;

				if (userId || organizationId) {
					const purchases = organizationId
						? await getPurchasesByOrganizationId(organizationId)
						: // biome-ignore lint/style/noNonNullAssertion: This is a valid case
							await getPurchasesByUserId(userId!);
					const subscriptions = purchases.filter(
						(purchase) =>
							purchase.type === "SUBSCRIPTION" &&
							purchase.subscriptionId !== null,
					);

					if (subscriptions.length > 0) {
						for (const subscription of subscriptions) {
							await cancelSubscription(
								// biome-ignore lint/style/noNonNullAssertion: This is a valid case
								subscription.subscriptionId!,
							);
						}
					}
				}
			}
		}),
	},
	user: {
		additionalFields: {
			onboardingComplete: {
				type: "boolean",
				required: false,
			},
			locale: {
				type: "string",
				required: false,
			},
		},
		deleteUser: {
			enabled: true,
		},
		changeEmail: {
			enabled: true,
			sendChangeEmailVerification: async (
				{
					user: { email, name },
					url,
				}: { user: { email: string; name: string }; url: string },
				request?: Request,
			) => {
				const locale = getLocaleFromRequest(request);
				await sendEmail({
					to: email,
					templateId: "emailVerification",
					context: {
						url,
						name,
					},
					locale,
				});
			},
		},
	},
	emailAndPassword: {
		enabled: true,
		// Environment-aware email verification
		// Development: Skip email verification for faster iteration
		// Production: Require email verification for security
		autoSignIn:
			authConfig.skipEmailVerification || !config.auth.enableSignup,
		requireEmailVerification:
			authConfig.validation.requireEmailVerification &&
			config.auth.enableSignup,
		sendResetPassword: async (
			{
				user,
				url,
			}: { user: { email: string; name: string }; url: string },
			request?: Request,
		) => {
			const locale = getLocaleFromRequest(request);
			await sendEmail({
				to: user.email,
				templateId: "forgotPassword",
				context: {
					url,
					name: user.name,
				},
				locale,
			});
		},
	},
	emailVerification: {
		sendOnSignUp:
			authConfig.validation.requireEmailVerification &&
			config.auth.enableSignup,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async (
			{
				user: { email, name },
				url,
			}: { user: { email: string; name: string }; url: string },
			request?: Request,
		) => {
			const locale = getLocaleFromRequest(request);
			await sendEmail({
				to: email,
				templateId: "emailVerification",
				context: {
					url,
					name,
				},
				locale,
			});
		},
	},
	// Social providers - conditionally enabled based on environment
	...(authConfig.features.socialLogin && {
		socialProviders: {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID as string,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
				scope: ["email", "profile"],
			},
			github: {
				clientId: process.env.GITHUB_CLIENT_ID as string,
				clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
				scope: ["user:email"],
			},
		},
	}),
	plugins: [
		username(),
		admin(),
		// Conditionally enable features based on environment
		...(authConfig.features.passkeys ? [passkey()] : []),
		...(authConfig.features.magicLink
			? [
					magicLink({
						disableSignUp: true,
						sendMagicLink: async ({ email, url }, request) => {
							const locale = getLocaleFromRequest(request);

							// In development, log magic link for debugging
							if (authConfig.debugMode) {
								console.log(
									`🔗 Magic link for ${email}: ${url}`,
								);
							}

							await sendEmail({
								to: email,
								templateId: "magicLink",
								context: {
									url,
								},
								locale,
							});
						},
					}),
				]
			: []),
		organization({
			allowUserToCreateOrganization: async (user) => {
				// Only allow organization creation if user doesn't already belong to one
				const hasExisting = await hasExistingMembership(user.id);
				return !hasExisting;
			},
			organizationLimit: 1,
			sendInvitationEmail: async (
				{ email, id, organization },
				request,
			) => {
				const locale = getLocaleFromRequest(request);
				const existingUser = await getUserByEmail(email);

				const url = new URL(
					existingUser ? "/auth/login" : "/auth/signup",
					authConfig.baseURL,
				);

				url.searchParams.set("invitationId", id);
				url.searchParams.set("email", email);

				// In development, log invitation for debugging
				if (authConfig.debugMode) {
					console.log(
						`📧 Organization invitation for ${email}: ${url.toString()}`,
					);
				}

				await sendEmail({
					to: email,
					templateId: "organizationInvitation",
					locale,
					context: {
						organizationName: organization.name,
						url: url.toString(),
					},
				});
			},
		}),
		openAPI(),
		invitationOnlyPlugin(),
		// Conditionally enable 2FA in production
		...(authConfig.features.twoFactor ? [twoFactor()] : []),
	],
	onAPIError: {
		onError(error: any, ctx: any) {
			logger.error(error, { ctx });
		},
	},
});

export * from "./lib/organization";

export type Session = typeof auth.$Infer.Session;

// Temporary type definitions to fix build errors
// TODO: Replace with proper types once auth system is fully configured
export type ActiveOrganization = {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
	metadata?: OrganizationMetadata;
	members: Array<{
		id: string;
		role: OrganizationMemberRole;
		userId: string;
		organizationId?: string;
		createdAt?: Date;
		user: {
			id?: string;
			name: string;
			email: string;
			image?: string;
		};
	}>;
	invitations?: Array<{
		id: string;
		email: string;
		role: OrganizationMemberRole;
		status: OrganizationInvitationStatus;
		expiresAt: string | Date;
	}>;
};

export type Organization = {
	id: string;
	name: string;
	slug: string;
	metadata: OrganizationMetadata;
};

export type OrganizationMemberRole = "owner" | "admin" | "member";

export type OrganizationInvitationStatus =
	| "pending"
	| "accepted"
	| "rejected"
	| "canceled";

export type OrganizationMetadata = Record<string, unknown> | undefined;
