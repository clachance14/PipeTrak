"use client";

import { appConfig } from "@config";
import { useAuthActions } from "auth-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Button, Hint, Icon, Input } from "ui";
import SigninModeSwitch, { SigninMode } from "./SigninModeSwitch";
import { SocialSigninButton } from "./SocialSigninButton";

const labels = {
  createAnAccount: "Create an account",
  dontHaveAnAccount: "Don't have an account yet?",
  email: "Email",
  forgotPassword: "Forgot password?",
  hints: {
    emailNotVerified: {
      message:
        "Please verify your email before signing in. Check your inbox for the verification mail.",
      title: "Email not verified",
    },
    invalidCredentials: {
      message:
        "We are sorry, but the credentials you entered are invalid. Please try again.",
      title: "Invalid credentials",
    },
    linkNotSent: {
      message:
        "We are sorry, but we were unable to send you a magic link. Please try again later.",
      title: "Link not sent",
    },
    linkSent: {
      message: "We have sent you a link to continue. Please check your inbox.",
      title: "Link sent",
    },
  },
  password: "Password",
  submit: "Sign in",
  sendMagicLink: "Send magic link",
  subtitle:
    "Choose a provider to log in with or enter your credentials to continue.",
  title: "Welcome back",
};

type SigninFormValues = {
  email: string;
  password?: string;
};

const oAuthProviders = ["google", "github"];

export function LoginForm() {
  const { signIn } = useAuthActions();
  const [signinMode, setSigninMode] = useState(SigninMode.MagicLink);
  const [serverError, setServerError] = useState<null | string>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo =
    searchParams.get("redirectTo") ?? appConfig.auth.redirectAfterLogin;

  const isPasswordSignin = signinMode === SigninMode.Password;

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isSubmitted, isSubmitSuccessful },
  } = useForm<SigninFormValues>({});

  useEffect(() => {
    reset();
    setServerError(null);
  }, [signinMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit: SubmitHandler<SigninFormValues> = async ({
    email,
    password,
  }) => {
    setServerError(null);
    try {
      let response;
      if (isPasswordSignin) {
        if (!password) return;

        response = await signIn({
          method: "password",
          email,
          password,
        });
      } else {
        response = await signIn({
          method: "email",
          email,
          redirectTo,
        });
      }

      if (response && "error" in response) {
        setServerError(response.error.message);
        return;
      }
    } catch (e) {
      setServerError("Could not sign in. Please try again later.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-extrabold">{labels.title}</h1>
      <p className="mb-6 mt-4 text-zinc-500">{labels.subtitle}</p>

      <div className="space-y-3">
        {oAuthProviders.map((providerId) => (
          <SocialSigninButton
            key={providerId}
            provider={providerId}
            onClick={() =>
              signIn({
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
          title={labels.hints.linkSent.title}
          message={labels.hints.linkSent.message}
          icon={<Icon.mail className="h-4 w-4" />}
        />
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <SigninModeSwitch
            activeMode={signinMode}
            onChange={(value) => setSigninMode(value as SigninMode)}
          />
          {isSubmitted && serverError && (
            <Hint
              status="error"
              message={serverError}
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
                <Link href="/auth/forgot-password">
                  {labels.forgotPassword}
                </Link>
              </div>
            </div>
          )}
          <Button className="w-full" type="submit" isLoading={isSubmitting}>
            {signinMode === SigninMode.MagicLink
              ? labels.sendMagicLink
              : labels.submit}
          </Button>

          <div>
            {labels.dontHaveAnAccount}{" "}
            <Link href="/auth/signup">{labels.createAnAccount} &rarr;</Link>
          </div>
        </form>
      )}
    </div>
  );
}
