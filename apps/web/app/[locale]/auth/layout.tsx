import { ColorModeToggle, Logo } from "@components";
import { useLocale } from "next-intl";
import Link from "next-intl/link";
import { PropsWithChildren } from "react";

export default function AuthLayout({ children }: PropsWithChildren<{}>) {
  const locale = useLocale();

  return (
    <>
      <div className="flex min-h-screen place-items-center bg-white dark:bg-zinc-900">
        <div className="container">
          <div className="mx-auto grid w-full max-w-xl gap-6">
            <div className="flex items-center justify-between">
              <Link href="/" className="block">
                <Logo />
              </Link>
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
