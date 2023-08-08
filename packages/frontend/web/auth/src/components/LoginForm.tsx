"use client";

import { appConfig } from "@config";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "@supastarter/frontend/web/auth";
import { Button, Hint, Icon, Input } from "@supastarter/frontend/web/ui";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import SigninModeSwitch from "./SigninModeSwitch";
import { SocialSigninButton } from "./SocialSigninButton";

const formSchema = z.object({
  email: z.string().email(),
  password: z.optional(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

const oAuthProviders = ["google", "github"];

export function LoginForm() {
  const t = useTranslations("auth.login");
  const [signinMode, setSigninMode] = useState<"password" | "magic-link">(
    "magic-link",
  );
  const [serverError, setServerError] = useState<null | {
    title: string;
    message: string;
  }>(null);
  const searchParams = useSearchParams();

  const redirectTo =
    searchParams.get("redirectTo") ?? appConfig.auth.redirectAfterLogin;

  const isPasswordSignin = signinMode === "password";

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isSubmitted, isSubmitSuccessful },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  useEffect(() => {
    reset();
    setServerError(null);
  }, [signinMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit: SubmitHandler<FormValues> = async ({ email, password }) => {
    setServerError(null);
    try {
      if (isPasswordSignin) {
        if (!password) return;

        await login({
          method: "password",
          email,
          password,
        });
      } else {
        await login({
          method: "email",
          email,
          redirectTo,
        });
      }
    } catch (e) {
      setServerError({
        title: t("hints.invalidCredentials.title"),
        message: t("hints.invalidCredentials.message"),
      });
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-extrabold">{t("title")}</h1>
      <p className="mb-6 mt-4 text-zinc-500">{t("subtitle")}</p>

      <div className="space-y-3">
        {oAuthProviders.map((providerId) => (
          <SocialSigninButton
            key={providerId}
            provider={providerId}
            onClick={() =>
              login({
                method: "oauth",
                provider: providerId,
              })
            }
          />
        ))}
      </div>

      <hr className="my-8 border-zinc-950 border-opacity-5 dark:border-white dark:border-opacity-5" />

      {isSubmitted && isSubmitSuccessful && !isPasswordSignin ? (
        <Hint
          status="success"
          title={t("hints.linkSent.title")}
          message={t("hints.linkSent.message")}
          icon={<Icon.mail className="h-4 w-4" />}
        />
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <SigninModeSwitch
            activeMode={signinMode}
            onChange={(value) => setSigninMode(value as typeof signinMode)}
          />
          {isSubmitted && serverError && (
            <Hint
              status="error"
              {...serverError}
              icon={<Icon.error className="h-4 w-4" />}
            />
          )}
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
          {signinMode === "password" && (
            <div>
              <label htmlFor="password" className="mb-1 block font-semibold">
                {t("password")}
              </label>
              <Input
                type="password"
                {...register("password", { required: true })}
                required
                autoComplete="current-password"
              />
              <div className="mt-1 text-right text-sm">
                <Link href="/auth/forgot-password">{t("forgotPassword")}</Link>
              </div>
            </div>
          )}
          <Button className="w-full" type="submit" isLoading={isSubmitting}>
            {isPasswordSignin ? t("submit") : t("sendMagicLink")}
          </Button>

          <div>
            {t("dontHaveAnAccount")}{" "}
            <Link href="/auth/signup">{t("createAnAccount")} &rarr;</Link>
          </div>
        </form>
      )}
    </div>
  );
}
