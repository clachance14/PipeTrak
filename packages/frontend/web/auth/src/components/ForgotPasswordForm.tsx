"use client";

import { Button, Hint, Icon, Input } from "@supastarter/frontend/web/ui";

import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPassword } from "@supastarter/frontend/web/auth";
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
  const t = useTranslations("auth.forgotPassword");
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
        title: t("hints.linkNotSent.title"),
        message: t("hints.linkNotSent.message"),
      });
    }
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold">{t("title")}</h1>
      <p className="mb-6 mt-4 text-zinc-500">
        {t("message")}{" "}
        <Link href="/auth/login">{t("backToSignin")} &rarr;</Link>
      </p>
      {isSubmitted && isSubmitSuccessful ? (
        <Hint
          status="success"
          title={t("hints.linkSent.title")}
          message={t("hints.linkSent.message")}
          icon={<Icon.mail className="h-4 w-4" />}
        />
      ) : (
        <form
          className="flex flex-col items-stretch gap-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <label htmlFor="email" className="mb-1 block font-semibold">
              {t("email")}
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
              {...serverError}
              icon={<Icon.warning className="h-4 w-4" />}
            />
          )}

          <Button isLoading={isSubmitting}>
            <Icon.submit className="h-4 w-4" /> {t("submit")}
          </Button>
        </form>
      )}
    </>
  );
}
