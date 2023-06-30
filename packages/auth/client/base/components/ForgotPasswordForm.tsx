"use client";

import { Button, Hint, Icon, Input } from "ui";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthActions } from "auth-client-nextauth";
import Link from "next/link";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import * as z from "zod";
import { AuthPaths } from "../../../types";

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

const formSchema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof formSchema>;

export function ForgotPasswordForm({ paths }: { paths: AuthPaths }) {
  const { forgotPassword } = useAuthActions();
  const [serverError, setServerError] = useState<null | string>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful, isSubmitted },
  } = useForm<{
    email: string;
    serverError: void;
  }>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormValues> = async ({ email }) => {
    try {
      const response = await forgotPassword({
        email,
      });
      if (response?.error) {
        setServerError(response.error.message);
        return;
      }
    } catch (e) {
      setServerError("Could not send reset email");
    }
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
        <form
          className="flex flex-col items-stretch gap-6"
          onSubmit={handleSubmit(onSubmit)}
        >
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

          {isSubmitted && serverError && (
            <Hint
              status="error"
              message={serverError}
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
