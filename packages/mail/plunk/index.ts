import { config } from "../config";
import { SendEmailHandler } from "../types";

const plunkApiKey = process.env.PLUNK_API_KEY;

if (!plunkApiKey) {
  throw new Error("Plunk API key not found");
}

const { from } = config;

export const send: SendEmailHandler = async ({ to, subject, html, text }) => {
  const response = await fetch("https://api.useplunk.com/v1/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${plunkApiKey}`,
    },
    body: JSON.stringify({
      to,
      from,
      subject,
      body: html,
    }),
  });

  if (!response.ok) {
    throw new Error("Could not send email ", await response.json());
  }
};
