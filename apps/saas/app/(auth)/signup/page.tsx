import Link from "next/link";
import SignupForm from "./SignupForm";

const translations = {
  alreadyHaveAccount: "Already have an account?",
  email: "Email",
  passwordHint: "Please enter at least 8 characters.",
  hints: {
    signupFailed: {
      message:
        "We are sorry, but we were unable to create your account. Please try again later.",
      title: "Could not create account",
    },
    verifyEmail: {
      message:
        "We have sent you a link to verify your email. Please check your inbox.",
      title: "Verify your email",
    },
  },
  message:
    "We are happy that you want to join us. Please fill in the form below to create your account.",
  name: "Name",
  password: "Password",
  signIn: "Sign in",
  submit: "Create account",
  title: "Create an account",
};

export async function generateMetadata() {
  return {
    title: translations.title,
  };
}

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">{translations.title}</h1>

      <p className="mb-6 mt-2 text-zinc-500">
        {translations.message} {translations.alreadyHaveAccount}{" "}
        <Link href="/signin">{translations.signIn} &rarr;</Link>
      </p>

      <SignupForm
        labels={{
          name: translations.name,
          email: translations.email,
          password: translations.password,
          passwordHint: translations.passwordHint,
          submit: translations.submit,
          hints: {
            signupFailed: {
              title: translations.hints.signupFailed.title,
              message: translations.hints.signupFailed.message,
            },
            verifyEmail: {
              title: translations.hints.verifyEmail.title,
              message: translations.hints.verifyEmail.message,
            },
          },
        }}
      />
    </div>
  );
}
