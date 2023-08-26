"use client";

import { appConfig } from "@config";
import { zodResolver } from "@hookform/resolvers/zod";
import { login, signUp } from "@saas/auth";
import { Button, Hint, Icon, Input } from "@ui/components";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { SocialSigninButton } from "./SocialSigninButton";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

type FormValues = z.infer<typeof formSchema>;

export function SignupForm() {
  const t = useTranslations();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isSubmitted, isSubmitSuccessful, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });
  const [serverError, setServerError] = useState<null | {
    title: string;
    message: string;
  }>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit: SubmitHandler<FormValues> = async ({
    email,
    password,
    name,
  }) => {
    setServerError(null);
    try {
      await signUp({
        email,
        password,
        name,
      });
    } catch (e) {
      setServerError({
        title: t("auth.signup.hints.signupFailed.title"),
        message: t("auth.signup.hints.signupFailed.message"),
      });
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">{t("auth.signup.title")}</h1>

      <p className="text-muted-foreground mb-6 mt-2">
        {t("auth.signup.message")}
      </p>

      <div className="flex flex-col items-stretch gap-3">
        {appConfig.auth.oAuthProviders.map((providerId) => (
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

      <hr className=" my-8" />

      {isSubmitted && isSubmitSuccessful ? (
        <Hint
          status="success"
          title={t("auth.signup.hints.verifyEmail.title")}
          message={t("auth.signup.hints.verifyEmail.message")}
          icon={Icon.mail}
        />
      ) : (
        <form
          className="flex flex-col items-stretch gap-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          {isSubmitted && serverError && (
            <Hint status="error" {...serverError} icon={Icon.error} />
          )}

          <div>
            <label htmlFor="email" className="mb-1 block font-semibold">
              {t("auth.signup.name")} *
            </label>
            <Input
              // status={errors.name ? "error" : "default"}
              type="text"
              {...register("name", { required: true })}
              required
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block font-semibold">
              {t("auth.signup.email")} *
            </label>
            <Input
              // status={errors.email ? "error" : "default"}
              type="email"
              {...register("email", { required: true })}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block font-semibold">
              {t("auth.signup.password")} *
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                className="pr-10"
                // status={errors.password ? "error" : "default"}
                {...register("password", { required: true, minLength: 8 })}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-primary absolute inset-y-0 right-0 flex items-center pr-4 text-xl"
              >
                {showPassword ? (
                  <Icon.hide className="h-4 w-4" />
                ) : (
                  <Icon.show className="h-4 w-4" />
                )}
              </button>
            </div>
            <small className="italic opacity-50">
              {t("auth.signup.passwordHint")}
            </small>
          </div>

          <Button loading={isSubmitting}>
            {t("auth.signup.submit")} &rarr;
          </Button>

          <div>
            <span className="text-muted-foreground">
              {t("auth.signup.alreadyHaveAccount")}{" "}
            </span>
            <Link href="/auth/login">{t("auth.signup.signIn")} &rarr;</Link>
          </div>
        </form>
      )}
    </div>
  );
}
