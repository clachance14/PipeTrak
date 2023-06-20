"use client";

import { Button, Hint, Icon, Input } from "ui";

import Link from "next/link";
import { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { AuthPaths } from "../../types";

const labels = {
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

export function ForgotPasswordForm({ paths }: { paths: AuthPaths }) {
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { isSubmitting, isSubmitSuccessful, isSubmitted, errors },
  } = useForm<{
    email: string;
    serverError: void;
  }>();

  const onSubmit = (e: FormEvent) => {
    clearErrors("serverError");
    handleSubmit(async () => {
      // try {
      //   const response = await signIn("forgot-password", {
      //     email,
      //     callbackUrl: "/reset-password",
      //     redirect: false,
      //   });
      //   if (response?.error) setError("serverError", { type: "linkNotSent" });
      // } catch (e) {
      //   setError("serverError", { type: "linkNotSent" });
      // }
    })(e);
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold">{labels.title}</h1>
      <p className="mb-6 mt-4 text-zinc-500">
        {labels.message}{" "}
        <Link href={paths.signin}>{labels.backToSignin} &rarr;</Link>
      </p>
      {isSubmitted && isSubmitSuccessful ? (
        <Hint
          status="success"
          title={labels.hints.linkSent.title}
          message={labels.hints.linkSent.message}
          icon={<Icon.mail className="h-4 w-4" />}
        />
      ) : (
        <form className="flex flex-col items-stretch gap-6" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className="mb-1 block font-semibold">
              {labels.email}
            </label>
            <Input
              type="email"
              {...register("email", { required: true })}
              required
              autoComplete="email"
            />
          </div>

          {isSubmitted && errors.serverError && (
            <Hint
              status="error"
              title={labels.hints.linkNotSent.title}
              message={labels.hints.linkNotSent.message}
              icon={<Icon.warning className="h-4 w-4" />}
            />
          )}

          <Button isLoading={isSubmitting}>
            <Icon.submit className="h-4 w-4" /> {labels.submit}
          </Button>
        </form>
      )}
    </>
  );
}
