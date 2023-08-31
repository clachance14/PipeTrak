"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { verifyOTP } from "@saas/auth";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Icon,
  Input,
} from "@ui/components";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { useUser } from "../hooks";
import { VerifyOTPType } from "../types";
import { TeamInvitationInfo } from "./TeamInvitationInfo";

const formSchema = z.object({
  otp: z.string().min(6).max(6),
});

type FormValues = z.infer<typeof formSchema>;

export function VerifyOtpForm() {
  const t = useTranslations();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });
  const { user, loaded } = useUser();
  const [serverError, setServerError] = useState<null | {
    title: string;
    message: string;
  }>(null);
  const searchParams = useSearchParams();

  const invitationCode = searchParams.get("invitationCode");
  const email = searchParams.get("email") || "";
  const type: VerifyOTPType =
    (searchParams.get("type") as VerifyOTPType) || "magiclink";
  const redirectTo = invitationCode
    ? `/team/invitation?code=${invitationCode}`
    : searchParams.get("redirectTo") ?? "/team/redirect";

  // redirect when user has been loaded
  useEffect(() => {
    if (user && loaded) {
      if (typeof window !== undefined)
        window.location.href = new URL(
          redirectTo,
          window.location.origin,
        ).toString();
    }
  }, [user, loaded]);

  const onSubmit: SubmitHandler<FormValues> = async ({ otp }) => {
    setServerError(null);
    try {
      await verifyOTP({
        otp,
        type,
        email,
      });
    } catch (e) {
      setServerError({
        title: t("auth.verifyOtp.hints.verificationFailed.title"),
        message: t("auth.verifyOtp.hints.verificationFailed.message"),
      });
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">{t("auth.verifyOtp.title")}</h1>
      <p className="text-muted-foreground mb-6 mt-2">
        {t("auth.verifyOtp.message")}
      </p>

      {invitationCode && <TeamInvitationInfo className="mb-6" />}

      <Form {...form}>
        <form
          className="flex flex-col items-stretch gap-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {form.formState.isSubmitted && serverError && (
            <Alert variant="error">
              <Icon.warning className="h-4 w-4" />
              <AlertTitle>{serverError.title}</AlertTitle>
              <AlertDescription>{serverError.message}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormControl>
                <FormItem>
                  <FormLabel>{t("auth.verifyOtp.otp")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              </FormControl>
            )}
          />

          <Button loading={form.formState.isSubmitting}>
            {t("auth.verifyOtp.submit")} &rarr;
          </Button>
        </form>
      </Form>
    </div>
  );
}
