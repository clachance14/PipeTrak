"use client";

import { signOut } from "@saas/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
} from "@ui/components";
import Link from "next-intl/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function UserMenu({
  email,
  name,
  image,
}: {
  email: string;
  name: string;
  image?: string;
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 border-none bg-transparent p-0">
        <span className="bg-card text-foreground relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-2xl">
          {image ? (
            <Image
              src={image}
              alt={name ?? ""}
              fill
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          ) : (
            <Icon.user className="h-4 w-4" />
          )}
        </span>
        <span className="block flex-1 text-left leading-none">
          <strong className="block text-sm">{name}</strong>
          <span className="text-xs text-gray-500">{email}</span>
        </span>
        <Icon.chevronDown className="h-4 w-4 opacity-30" />
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <Link href="/" target="_blank" rel="noopener noreferrer">
            <Icon.home className="mr-2 h-4 w-4" /> Homepage
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            router.replace("/");
            await signOut();
          }}
        >
          <Icon.logout className="mr-2 h-4 w-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
