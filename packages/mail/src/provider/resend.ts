import { config } from "@repo/config";
import { logger } from "@repo/logs";
import type { SendEmailHandler } from "../../types";

const { from } = config.mails;

export const send: SendEmailHandler = async ({ to, subject, html }) => {
	const emailData = {
		from,
		to,
		subject,
		html,
	};

	// Log email details for debugging
	logger.info("Sending email via Resend:", {
		from: emailData.from,
		to: emailData.to,
		subject: emailData.subject,
	});

	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
		},
		body: JSON.stringify(emailData),
	});

	const responseData = await response.json();

	if (!response.ok) {
		logger.error("Resend API error:", responseData);
		throw new Error("Could not send email");
	}

	logger.info("Resend API response:", responseData);
	// Return void as expected by SendEmailHandler type
};
