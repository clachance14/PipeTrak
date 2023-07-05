"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Button, Hint, Icon, Input } from "ui";
import { config } from "../../../config";
import { AuthPaths } from "../../../types";
import { useAuthActions } from "../provider";
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
  subtitle: "Please enter your credentials to sign in.",
  title: "Welcome back",
};

type SigninFormValues = {
  email: string;
  password?: string;
};

export function SigninForm({ paths }: { paths: AuthPaths }) {
  const { signIn } = useAuthActions();
  const [signinMode, setSigninMode] = useState(SigninMode.MagicLink);
  const [serverError, setServerError] = useState<null | string>(null);
  const router = useRouter();

  const oAuthProviders = [
    { type: "oauth", id: "google" },
    { type: "oauth", id: "github" },
  ]
    .filter((provider) => provider.type === "oauth")
    .map((provider) => provider.id);

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
  }, [signinMode]);

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
        });
      }

      if (response && "error" in response) {
        setServerError(response.error.message);
        return;
      }

      router.replace(config.redirectAfterSignin);
    } catch (e) {
      setServerError("Could not sign in. Please try again later.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-extrabold">{labels.title}</h1>
      <p className="mb-6 mt-4 text-zinc-500">
        {labels.subtitle}
        <br />
        {labels.dontHaveAnAccount}{" "}
        <Link href={paths.signup}>{labels.createAnAccount} &rarr;</Link>
      </p>
      {isSubmitted && isSubmitSuccessful && !isPasswordSignin ? (
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
          <SigninModeSwitch activeMode={signinMode} onChange={setSigninMode} />

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
                <Link href={paths["forgot-password"]}>
                  {labels.forgotPassword}
                </Link>
              </div>
            </div>
          )}

          <Button type="submit" isLoading={isSubmitting}>
            {labels.submit}
          </Button>
        </form>
      )}

      <hr className="my-8 border-zinc-950 border-opacity-5 dark:border-white dark:border-opacity-5" />

      <div className="flex w-full flex-col gap-2 sm:flex-row">
        {oAuthProviders.map((providerId) => (
          <SocialSigninButton
            key={providerId}
            provider={providerId}
            onClick={() =>
              signIn({
                method: "oauth",
                provider: providerId,
                // callbackUrl: config.redirectAfterSignin,
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
