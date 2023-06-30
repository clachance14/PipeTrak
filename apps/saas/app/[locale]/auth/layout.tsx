import { ColorModeToggle } from "common/components";
import { useLocale } from "next-intl";
import { PropsWithChildren } from "react";
import { Logo } from "ui";

const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL;

export default function AuthLayout({ children }: PropsWithChildren<{}>) {
  const locale = useLocale();

  return (
    <>
      <div className="flex min-h-screen place-items-center bg-white dark:bg-zinc-900">
        <div className="container">
          <div className="mx-auto grid w-full max-w-xl gap-6">
            <div className="flex items-center justify-between">
              <a href={`${marketingUrl}/${locale}`} className="block">
                <Logo />
              </a>
              <ColorModeToggle />
            </div>

            <div className="rounded-2xl border p-8 dark:border-zinc-700">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
