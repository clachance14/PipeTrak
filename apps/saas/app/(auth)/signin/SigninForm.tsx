"use client";

import {
  signInWithEmail,
  signInWithOAuth,
  signInWithPassword,
} from "auth/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Hint, Icon, Input } from "ui";
import { config } from "../../../../../_features/auth/config";
import SigninModeSwitch, { SigninMode } from "./SigninModeSwitch";
import { SocialSigninButton } from "./SocialSigninButton";

export function SigninForm({
  labels,
  redirectTo,
  providers,
}: {
  providers: string[];
  redirectTo?: string | null;
  labels: {
    email: string;
    password: string;
    submit: string;
    forgotPassword: string;
    hints: {
      linkSent: {
        title: string;
        message: string;
      };
      emailNotVerified: {
        title: string;
        message: string;
      };
      invalidCredentials: {
        title: string;
        message: string;
      };
      linkNotSent: {
        title: string;
        message: string;
      };
    };
  };
}) {
  const router = useRouter();
  const [signinMode, setSigninMode] = useState(SigninMode.MagicLink);

  const isPasswordSignin = signinMode === SigninMode.Password;

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { isSubmitting, errors, isSubmitted, isSubmitSuccessful },
  } = useForm<{
    email: string;
    password?: string;
    serverError?: void;
  }>({});

  useEffect(() => {
    clearErrors("serverError");
  }, [signinMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (e: FormEvent) => {
    clearErrors("serverError");
    return handleSubmit(async ({ email, password }) => {
      try {
        let response;
        if (isPasswordSignin) {
          response = await signInWithPassword(email, password, {
            callbackUrl: redirectTo ?? config.redirectAfterSignin,
          });
        } else {
          response = await signInWithEmail(email, {
            callbackUrl: redirectTo ?? config.redirectAfterSignin,
          });
        }

        if (response?.error) {
          setError("serverError", { type: response.error ?? "invalid" });
          return;
        }

        if (isPasswordSignin) {
          router.push(config.redirectAfterSignin);
        }
      } catch (e) {
        setError("serverError", { type: "linkNotSent" });
      }
    })(e);
  };

  return (
    <>
      {isSubmitted && isSubmitSuccessful && !isPasswordSignin ? (
        <Hint
          status="success"
          title={labels.hints.linkSent.title}
          message={labels.hints.linkSent.message}
          icon={<Icon.mail className="h-4 w-4" />}
        />
      ) : (
        <form className="flex flex-col items-stretch gap-6" onSubmit={onSubmit}>
          <SigninModeSwitch activeMode={signinMode} onChange={setSigninMode} />

          {isSubmitted && errors.serverError && (
            <Hint
              status="error"
              title={
                isPasswordSignin
                  ? errors.serverError.type === "emailNotVerified"
                    ? labels.hints.emailNotVerified.title
                    : labels.hints.invalidCredentials.title
                  : labels.hints.linkNotSent.title
              }
              message={
                isPasswordSignin
                  ? errors.serverError.type === "emailNotVerified"
                    ? labels.hints.emailNotVerified.message
                    : labels.hints.invalidCredentials.message
                  : labels.hints.linkNotSent.message
              }
              icon={<Icon.error className="h-4 w-4" />}
            />
          )}

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

          {signinMode === "password" && (
            <div>
              <label htmlFor="password" className="mb-1 block font-semibold">
                {labels.password}
              </label>
              <Input
                type="password"
                {...register("password", { required: true })}
                required
                autoComplete="current-password"
              />
              <div className="mt-1 text-right text-sm">
                <Link href="/forgot-password">{labels.forgotPassword}</Link>
              </div>
            </div>
          )}

          <Button type="submit" isLoading={isSubmitting}>
            {labels.submit}
          </Button>
        </form>
      )}

      <hr className="border-zinc-950 my-8 border-opacity-5 dark:border-white dark:border-opacity-5" />

      <div className="flex w-full flex-col gap-2 sm:flex-row">
        {providers.map((providerId) => (
          <SocialSigninButton
            key={providerId}
            provider={providerId}
            onClick={() =>
              signInWithOAuth(providerId, {
                callbackUrl: config.redirectAfterSignin,
              })
            }
          />
        ))}
      </div>
    </>
  );
}
