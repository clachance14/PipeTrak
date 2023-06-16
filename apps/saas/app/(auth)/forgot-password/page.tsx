import Link from "next/link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

const translations = {
  backToSignin: "Back to signin",
  email: "Email",
  hints: {
    linkNotSent: {
      message:
        "We are sorry, but we were unable to send you a link to reset your password. Please try again later.",
      title: "Link not sent",
    },
    linkSent: {
      message: "We have sent you a link to continue. Please check your inbox.",
      title: "Link sent",
    },
  },
  message:
    "Please enter your email address and we will send you a link to reset your password.",
  submit: "Send link",
  title: "Forgot your password?",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold">{translations.title}</h1>
      <p className="mb-6 mt-4 text-zinc-500">
        {translations.message}{" "}
        <Link href="/signup">{translations.backToSignin} &rarr;</Link>
      </p>
      <ForgotPasswordForm
        labels={{
          email: translations.email,
          submit: translations.submit,
          hints: {
            linkSent: {
              title: translations.hints.linkSent.title,
              message: translations.hints.linkSent.message,
            },
            linkNotSent: {
              title: translations.hints.linkNotSent.title,
              message: translations.hints.linkNotSent.message,
            },
          },
        }}
      />
    </>
  );
}
