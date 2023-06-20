"use client";

import Link from "next/link";
// import { trpc } from "@backend/trpc/client";
import { useRouter } from "next/navigation";
import { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { Button, Hint, Icon, Input } from "ui";
import { AuthPaths } from "../../types";

const labels = {
  backToSignin: "Back to signin",
  hints: {
    passwordNotUpdated: {
      message:
        "We are sorry, but we were unable to update your password. Please try again later.",
      title: "Password not updated",
    },
  },
  message: "Enter your new password to update your account.",
  newPassword: "New password",
  submit: "Update password",
  title: "Reset your password",
};

export function ResetPasswordForm({ paths }: { paths: AuthPaths }) {
  const router = useRouter();
  // const updatePasswordMutation = trpc.changePassword.useMutation();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { isSubmitting, isSubmitted, errors },
  } = useForm<{
    password: string;
    serverError?: void;
  }>();

  const onSubmit = (e: FormEvent) => {
    clearErrors("serverError");
    handleSubmit(async () => {
      try {
        // await updatePasswordMutation.mutateAsync({ password });

        await router.push("/");
      } catch (e) {
        setError("serverError", { type: "passwordNotUpdated" });
      }
    })(e);
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold">{labels.title}</h1>
      <p className="mb-6 mt-4 text-zinc-500">
        {labels.message}{" "}
        <Link href={paths.signin}>{labels.backToSignin} &rarr;</Link>
      </p>
      <form
        className="mt-6 flex flex-col items-stretch gap-6"
        onSubmit={onSubmit}
      >
        <div>
          <label htmlFor="password" className="mb-1 block font-semibold">
            {labels.newPassword}
          </label>
          <Input
            id="password"
            type="password"
            {...register("password", { required: true })}
            required
            autoComplete="new-password"
          />
        </div>

        {isSubmitted && errors.serverError && (
          <Hint
            status="error"
            title={labels.hints.passwordNotUpdated.title}
            message={labels.hints.passwordNotUpdated.message}
            icon={<Icon.error className="h-4 w-4" />}
          />
        )}

        <Button isLoading={isSubmitting}>{labels.submit}</Button>
      </form>
    </>
  );
}
