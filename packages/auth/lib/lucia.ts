import { prisma } from "@lucia-auth/adapter-prisma";
import { github, google } from "@lucia-auth/oauth/providers";
import { db } from "database";
import { User, lucia } from "lucia";
import { nextjs } from "lucia/middleware";
import { getBaseUrl } from "utils";
import { env } from "../env";

export const auth = lucia({
  adapter: prisma(db, {
    user: "user",
    session: "userSession",
    key: "userKey",
  }),
  env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
  middleware: nextjs(),
  sessionCookie: {
    expires: false,
  },
  getUserAttributes: (data) => {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      avatar_url: data.avatar_url,
    };
  },
});

export const githubAuth = github(auth, {
  clientId: env.GITHUB_CLIENT_ID,
  clientSecret: env.GITHUB_CLIENT_SECRET,
});

export const googleAuth = google(auth, {
  redirectUri: new URL("/api/oauth/google/callback", getBaseUrl()).toString(),
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  scope: ["email"],
});

export type Auth = typeof auth;
export type SessionUser = User;
export { OAuthRequestError } from "@lucia-auth/oauth";
export { LuciaError } from "lucia";
