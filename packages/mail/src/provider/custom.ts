import { config } from "@repo/config";
import type { SendEmailHandler } from "../../types";

// biome-ignore lint/correctness/noUnusedVariables: This is to understand the available parameters
const { from: _from } = config.mails;

// biome-ignore lint/correctness/noUnusedFunctionParameters: This is to understand the available parameters
export const send: SendEmailHandler = async ({ to: _to, subject: _subject, text: _text, html: _html }) => {
	// handle your custom email sending logic here
};
