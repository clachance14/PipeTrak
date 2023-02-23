import { sendEmail } from '@email/lib/send';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { verify } from 'argon2';
import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider, { SendVerificationRequestParams } from 'next-auth/providers/email';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import prisma from '../../common/server/prisma/prisma';

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

export const authOptions: AuthOptions = {
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
        if (!user || !user.password || !user.emailVerified) throw new Error('invalidCredentials');

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
  // callbacks: {
  //   async signIn({ user }) {
  //     if (isCredentialsSignin && user) {
  //       const sessionToken = generateSessionToken();
  //       const expires = new Date(Date.now() + SESSION_EXPIRATION);

  //       await adapter.createSession({
  //         sessionToken,
  //         userId: user.id,
  //         expires,
  //       });

  //       const cookies = new Cookies(req, res);

  //       cookies.set('next-auth.session-token', sessionToken, {
  //         expires,
  //       });
  //     }

  //     return true;
  //   },
  // },
  // jwt: {
  //   encode: async (params) => {
  //     return isCredentialsSignin ? new Cookies(req, res).get('next-auth.session-token') ?? '' : encode(params);
  //   },
  //   decode: async (params) => {
  //     return isCredentialsSignin ? null : decode(params);
  //   },
  // },
};
