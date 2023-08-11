import { ColorModeToggle, Logo } from "@components";
import { useLocale } from "next-intl";
import Link from "next-intl/link";
import { PropsWithChildren } from "react";

export default function AuthLayout({ children }: PropsWithChildren<{}>) {
  const locale = useLocale();

  return (
    <>
      <div className="bg-card text-card-foreground flex min-h-screen place-items-center">
        <div className="container">
          <div className="mx-auto grid w-full max-w-md gap-6">
            <div className="flex items-center justify-between">
              <Link href="/" className="block">
                <Logo />
              </Link>
              <ColorModeToggle />
            </div>

            <div className="border-border rounded-2xl border p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
