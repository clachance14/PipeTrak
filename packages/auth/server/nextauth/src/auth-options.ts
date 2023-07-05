import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { config } from "../../../config";
import { env } from "../env.mjs";
import { adapter, getUserByEmail } from "./database";
import { verify } from "./hash";
import { sendVerificationMail } from "./mail";

export const getAuthOptions = (): AuthOptions => ({
  pages: {
    signIn: "/signin",
    signOut: "/",
    newUser: config.redirectAfterSignin,
  },
  adapter,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    GithubProvider({
      clientId: env.GITHUB_ID,
      clientSecret: env.GITHUB_SECRET,
    }),
    GoogleProvider({
      clientId: env.GOOGLE_ID,
      clientSecret: env.GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    EmailProvider({
      sendVerificationRequest: sendVerificationMail,
    }),
    EmailProvider({
      id: "forgot-password",
      sendVerificationRequest: sendVerificationMail,
    }),
    EmailProvider({
      id: "create-account",
      sendVerificationRequest: sendVerificationMail,
    }),
    EmailProvider({
      id: "change-email",
      sendVerificationRequest: sendVerificationMail,
    }),
    CredentialsProvider({
      type: "credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        // if the credentials are missing, throw an error
        if (!credentials?.email || !credentials.password)
          throw new Error("missingCredentials");

        // find the user in the database
        const user = await getUserByEmail(credentials.email);

        // if the user does not exist or the password is not set or the email is not verified
        // don't return an error to prevent user enumeration
        if (!user || !user.password) throw new Error("invalidCredentials");

        if (!user.emailVerified) throw new Error("emailNotVerified");

        // verify the password
        if (!verify(credentials.password, user.password))
          throw new Error("invalidCredentials");

        // return user information to be stored in the session
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session.user !== undefined) {
        session.user = {
          ...session.user,
          // @ts-ignore
          id: token.uid as string,
          name: (token.name as string) ?? session.user.name,
        };
      }

      return session;
    },
    jwt: async ({ user, token, trigger, session }) => {
      if (trigger === "update") {
        if (session.name) token.name = session.name;
        if (session.email) token.email = session.email;
      }

      // on initial token creation we add the user id to the token
      if (user) {
        token.uid = user.id;
      }

      return token;
    },
  },
});
