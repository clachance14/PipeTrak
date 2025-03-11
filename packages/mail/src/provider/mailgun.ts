import { config } from "@repo/config";
import { logger } from "@repo/logs";
import type { SendEmailHandler } from "../../types";

const { from } = config.mails;
const { MAILGUN_DOMAIN, MAILGUN_API_KEY } = process.env;

if (!MAILGUN_DOMAIN || !MAILGUN_API_KEY) {
	throw new Error("MAILGUN_DOMAIN and MAILGUN_API_KEY must be set");
}

export const send: SendEmailHandler = async ({ to, subject, html, text }) => {
	const body = new FormData();
	body.append("from", from);
	body.append("to", to);
	body.append("subject", subject);
	body.append("text", text);
	if (html) {
		body.append("html", html);
	}

	const response = await fetch(
		`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
		{
			method: "POST",
			headers: {
				Authorization: `Basic ${Buffer.from(
					`api:${MAILGUN_API_KEY}`
				).toString("base64")}`,
			},
			body,
		}
	);

	if (!response.ok) {
		logger.error(await response.json());

		throw new Error("Could not send email");
	}
};
