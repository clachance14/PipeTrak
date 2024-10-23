import { type Locale, config } from "@config";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import {
	createSession,
	createSessionCookie,
	generateSessionToken,
	invalidateSession,
	validateSessionToken,
} from "auth";
import { cookies } from "next/headers";
import { getOrCreateTeamMembershipForUser } from "../modules/team/procedures/lib/team-membership";

export async function createContext(
	params?: FetchCreateContextFnOptions | { isAdmin?: boolean },
) {
	const sessionId = cookies().get(config.auth.sessionCookieName)?.value ?? null;
	let { user, session } = sessionId
		? await validateSessionToken(sessionId)
		: { user: null, session: null };

	if (user && session && !session.teamId) {
		const teamMembership = await getOrCreateTeamMembershipForUser(user.id);

			await invalidateSession(session.id);
			const newSessionToken = generateSessionToken();
			const newSession = await createSession(newSessionToken, user.id, {
				teamId: teamMembership.teamId,
			});
			const newSessionCookie = createSessionCookie(newSessionToken);

			if (params && "resHeaders" in params) {
				params.resHeaders?.append("Set-Cookie", newSessionCookie.serialize());
			} else {
				cookies().set(newSessionCookie);
			}
			session = newSession;
	}

	const locale = (cookies().get(config.i18n.localeCookieName)?.value ??
		config.i18n.defaultLocale) as Locale;

	return {
		user,
		session,
		locale,
		responseHeaders:
			params && "resHeaders" in params ? params.resHeaders : undefined,
		isAdmin: params && "isAdmin" in params ? params.isAdmin : false,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
