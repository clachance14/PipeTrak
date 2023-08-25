"use client";

import { signOut } from "@saas/auth";
import { UserAvatar } from "@shared/components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icon,
} from "@ui/components";
import { ApiOutput } from "api";
import Link from "next-intl/link";
import { useRouter } from "next/navigation";

export function UserMenu({ user }: { user: ApiOutput["user"]["me"] }) {
  const router = useRouter();

  if (!user) return null;

  const { name, email, avatarUrl } = user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus-visible:ring-primary rounded-full outline-none focus-visible:ring-2">
          <UserAvatar name={name} avatarUrl={avatarUrl} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {name}
          <span className="block text-xs font-normal opacity-70">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/">
            <Icon.settings className="mr-2 h-4 w-4" /> Account settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a href="#" target="_blank" rel="noopener noreferrer">
            <Icon.docs className="mr-2 h-4 w-4" /> Documentation
          </a>
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
