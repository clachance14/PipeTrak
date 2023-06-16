import Link from "next/link";
import { SigninForm } from "./SigninForm";

export async function generateMetadata() {
  return {
    title: translations.title,
  };
}

const translations = {
  createAnAccount: "Create an account",
  dontHaveAnAccount: "Don't have an account yet?",
  email: "Email",
  forgotPassword: "Forgot password?",
  hints: {
    emailNotVerified: {
      message:
        "Please verify your email before signing in. Check your inbox for the verification mail.",
      title: "Email not verified",
    },
    invalidCredentials: {
      message:
        "We are sorry, but the credentials you entered are invalid. Please try again.",
      title: "Invalid credentials",
    },
    linkNotSent: {
      message:
        "We are sorry, but we were unable to send you a magic link. Please try again later.",
      title: "Link not sent",
    },
    linkSent: {
      message: "We have sent you a link to continue. Please check your inbox.",
      title: "Link sent",
    },
  },
  password: "Password",
  submit: "Sign in",
  subtitle: "Please enter your credentials to sign in.",
  title: "Welcome back",
};

export default function SigninPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string };
}) {
  const oAuthProviders = [
    { type: "oauth", id: "google" },
    { type: "oauth", id: "github" },
  ]
    .filter((provider) => provider.type === "oauth")
    .map((provider) => provider.id);

  const { redirectTo } = searchParams;

  return (
    <>
      <h1 className="text-3xl font-extrabold">{translations.title}</h1>
      <p className="mb-6 mt-4 text-zinc-500">
        {translations.subtitle}
        <br />
        {translations.dontHaveAnAccount}{" "}
        <Link href="/signup">{translations.createAnAccount} &rarr;</Link>
      </p>
      <SigninForm
        providers={oAuthProviders}
        redirectTo={redirectTo}
        labels={{
          email: translations.email,
          password: translations.password,
          submit: translations.submit,
          forgotPassword: translations.forgotPassword,
          hints: {
            linkSent: {
              title: translations.hints.linkSent.title,
              message: translations.hints.linkSent.message,
            },
            linkNotSent: {
              title: translations.hints.linkNotSent.title,
              message: translations.hints.linkNotSent.message,
            },
            invalidCredentials: {
              title: translations.hints.invalidCredentials.title,
              message: translations.hints.invalidCredentials.message,
            },
            emailNotVerified: {
              title: translations.hints.emailNotVerified.title,
              message: translations.hints.emailNotVerified.message,
            },
          },
        }}
      />
    </>
  );
}
