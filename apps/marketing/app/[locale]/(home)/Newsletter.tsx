"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveEmail } from "app/[locale]/(home)/actions";
import { useTranslations } from "next-intl";
import { SubmitHandler, useForm } from "react-hook-form";
import { Button, Hint, Icon, Input } from "ui";
import * as z from "zod";

const formSchema = z.object({
  email: z.string().email(),
});
type FormValues = z.infer<typeof formSchema>;

export function Newsletter() {
  const t = useTranslations("home");
  const {
    handleSubmit,
    register,
    formState: { isSubmitting, isSubmitSuccessful },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormValues> = async ({ email }) => {
    await saveEmail(email);
  };

  return (
    <section className="border-t py-24 dark:text-white">
      <div className="container">
        <div className="mb-12 text-center">
          <Icon.key className="text-primary-500 mx-auto mb-3 h-12 w-12" />
          <h1 className="text-4xl font-bold lg:text-5xl">
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
              icon={<Icon.success className="h-4 w-4" />}
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
                <Button type="submit" className="ml-4" isLoading={isSubmitting}>
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
