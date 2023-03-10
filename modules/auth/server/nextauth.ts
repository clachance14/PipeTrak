import { SessionAction } from '@auth/types';
import { sendEmail } from '@email/lib/send';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { verify } from 'argon2';
import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider, { SendVerificationRequestParams } from 'next-auth/providers/email';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import prisma from '../../../prisma/prisma';

// we use the prisma adapter to store the session in the database
// https://next-auth.js.org/adapters/prisma
const adapter = PrismaAdapter(prisma);

// we define the session expiration time
const SESSION_EXPIRATION = 30 * 24 * 60 * 60;

// a custom handler to send the verification emails
const sendVerificationRequest = async ({ identifier: email, url, provider }: SendVerificationRequestParams) => {
  let subject = '',
    text = '',
    html = '',
    templateId;
  const context: Record<string, unknown> = {};

  switch (provider.id) {
    case 'forgot-password':
      templateId = 'reset-password';
      context.resetUrl = url;
      subject = `Reset your password`;
      break;
    case 'change-email':
      templateId = 'change-email';
      context.confirmationUrl = url;
      subject = `Confirm your new email`;
      break;
    case 'create-account':
      subject = `Create an account for ${process.env.NEXTAUTH_URL}`;
      text = `Create an account for ${process.env.NEXTAUTH_URL} here: ${url}`;
      html = `<p>Create an account for <a href="${process.env.NEXTAUTH_URL}">${process.env.NEXTAUTH_URL}</a> here: <a href="${url}">${url}</a></p>`;
      break;
    default:
      templateId = 'magic-link';
      context.magicLink = url;
      subject = `Magic link`;
      break;
  }

  const sent = await sendEmail({
    to: email,
    subject,
    text,
    html,
    templateId,
    context,
  });

  if (!sent) {
    throw new Error('Verification email not sent');
  }
};

export const getAuthOptions = (params?: { action?: SessionAction; workspaceId?: string }): AuthOptions => ({
  pages: {
    signIn: '/auth/signin',
    signOut: '/',
    newUser: '/auth/signup',
  },
  adapter,
  session: {
    strategy: 'jwt',
    maxAge: SESSION_EXPIRATION,
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
    EmailProvider({
      sendVerificationRequest,
    }),
    EmailProvider({
      id: 'forgot-password',
      sendVerificationRequest,
    }),
    EmailProvider({
      id: 'create-account',
      sendVerificationRequest,
    }),
    EmailProvider({
      id: 'change-email',
      sendVerificationRequest,
    }),
    CredentialsProvider({
      type: 'credentials',
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        // if the credentials are missing, throw an error
        if (!credentials?.email || !credentials.password) throw new Error('missingCredentials');

        // find the user in the database
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        // if the user does not exist or the password is not set or the email is not verified
        // don't return an error to prevent user enumeration
        if (!user || !user.password) throw new Error('invalidCredentials');

        if (!user.emailVerified) throw new Error('emailNotVerified');

        // verify the password
        const isValid = await verify(user.password, credentials.password);
        if (!isValid) throw new Error('invalidCredentials');

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
      session.user = {
        ...session.user,
        id: token.uid as string,
        name: (token.name as string) ?? session.user.name,
        workspaceId: (token.workspaceId as string) ?? session.user.workspaceId ?? (token.uid as string),
      };

      return session;
    },
    jwt: async ({ user, token }) => {
      const { action, workspaceId } = params ?? {};
      // if we are updating the session, we load the user data from the database and pass it to the token
      if (action === 'updateSession') {
        const currentUserData = await prisma.user.findFirst({
          where: {
            id: token.uid as string,
          },
        });

        token.name = currentUserData?.name;
      }

      // change the workspace
      if (action === 'switchWorkspace' && workspaceId) {
        const userId = token.uid as string;

        if (workspaceId === userId) {
          token.workspaceId = workspaceId;
        } else {
          const workspace = await prisma.workspace.findFirst({
            where: {
              id: workspaceId,
              members: {
                some: {
                  id: user?.id,
                },
              },
            },
          });

          if (!workspace) throw new Error('Workspace not found');

          token.workspaceId = workspace.id;
        }
      }

      // on initial token creation we add the user id to the token
      if (user) {
        token.uid = user.id;
      }

      return token;
    },
  },
});
