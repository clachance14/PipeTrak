"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "api/client";
import { Button, Hint, Icon, Input } from "modules/ui/components";
import { useTranslations } from "next-intl";
import { SubmitHandler, useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  email: z.string().email(),
});
type FormValues = z.infer<typeof formSchema>;

export function Newsletter() {
  const t = useTranslations("home");
  const newsletterSignupMutation = apiClient.newsletter.signup.useMutation();

  const {
    handleSubmit,
    register,
    formState: { isSubmitting, isSubmitSuccessful },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormValues> = async ({ email }) => {
    try {
      await newsletterSignupMutation.mutateAsync({ email });
    } catch {}
  };

  return (
    <section className="border-border border-t py-24">
      <div className="container">
        <div className="mb-12 text-center">
          <Icon.key className="text-primary mx-auto mb-3 h-12 w-12" />
          <h1 className="text-3xl font-bold lg:text-4xl">
            {t("newsletter.title")}
          </h1>
          <p className="mt-3 text-lg opacity-70">{t("newsletter.subtitle")}</p>
        </div>

        <div className="mx-auto max-w-lg">
          {isSubmitSuccessful ? (
            <Hint
              status="success"
              title={t("newsletter.hints.success.title")}
              message={t("newsletter.hints.success.message")}
              icon={Icon.success}
            />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex items-start">
                <Input
                  type="email"
                  required
                  placeholder={t("newsletter.email")}
                  {...register("email")}
                />
                <Button type="submit" className="ml-4">
                  {t("newsletter.submit")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
