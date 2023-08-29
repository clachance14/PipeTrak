"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Icon,
  Input,
} from "@ui/components";

import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPassword } from "@saas/auth";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof formSchema>;

export function ForgotPasswordForm() {
  const t = useTranslations();
  const [serverError, setServerError] = useState<null | {
    title: string;
    message: string;
  }>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful, isSubmitted },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormValues> = async ({ email }) => {
    try {
      await forgotPassword(email);
    } catch (e) {
      setServerError({
        title: t("auth.forgotPassword.hints.linkNotSent.title"),
        message: t("auth.forgotPassword.hints.linkNotSent.message"),
      });
    }
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold">
        {t("auth.forgotPassword.title")}
      </h1>
      <p className="text-muted-foreground mb-6 mt-4">
        {t("auth.forgotPassword.message")}{" "}
        <Link href="/auth/login">
          {t("auth.forgotPassword.backToSignin")} &rarr;
        </Link>
      </p>
      {isSubmitted && isSubmitSuccessful ? (
        <Alert variant="success">
          <Icon.mail className="h-4 w-4" />
          <AlertTitle>
            {t("auth.forgotPassword.hints.linkSent.title")}
          </AlertTitle>
          <AlertDescription>
            {t("auth.forgotPassword.hints.linkSent.message")}
          </AlertDescription>
        </Alert>
      ) : (
        <form
          className="flex flex-col items-stretch gap-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <label htmlFor="email" className="mb-1 block font-semibold">
              {t("auth.forgotPassword.email")}
            </label>
            <Input
              type="email"
              {...register("email", { required: true })}
              required
              autoComplete="email"
            />
          </div>

          {isSubmitted && serverError && (
            <Alert variant="error">
              <Icon.warning className="h-4 w-4" />
              <AlertTitle>{serverError.title}</AlertTitle>
              <AlertDescription>{serverError.message}</AlertDescription>
            </Alert>
          )}

          <Button>
            <Icon.submit className="h-4 w-4" />{" "}
            {t("auth.forgotPassword.submit")}
          </Button>
        </form>
      )}
    </>
  );
}
