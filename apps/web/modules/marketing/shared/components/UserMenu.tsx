"use client";

import { signOut } from "@saas/auth";
import { UserAvatar } from "@shared/components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
} from "@ui/components";
import Link from "next-intl/link";
import { useRouter } from "next/navigation";

export function UserMenu({
  email,
  name,
  avatarUrl,
}: {
  email?: string;
  name: string;
  avatarUrl?: string;
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 border-none bg-transparent p-0">
        <UserAvatar name={name} avatarUrl={avatarUrl} />
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
