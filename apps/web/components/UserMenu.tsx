"use client";

import {
  Menu,
  MenuContent,
  MenuItem,
  MenuPositioner,
  MenuTrigger,
} from "@ark-ui/react";
import { env } from "@env.mjs";
import { useAuthActions } from "auth-client";
import Image from "next/image";
import { Icon } from "ui";

export default function UserMenu({
  email,
  name,
  image,
}: {
  email: string;
  name: string;
  image?: string;
}) {
  const { signOut } = useAuthActions();

  return (
    <Menu positioning={{ placement: "top-end" }}>
      <MenuTrigger className="flex w-full items-center gap-2 border-none bg-transparent p-0">
        <span className="bg-primary-500 text-primary-500 relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-opacity-10 text-2xl">
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
      </MenuTrigger>

      <MenuPositioner className="w-[80%] text-sm">
        <MenuContent className="rounded-lg border border-zinc-200 bg-white p-1 text-zinc-600 shadow-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          <MenuItem asChild id="homepage">
            <a
              href={env.NEXT_PUBLIC_MARKETING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="data-[focus]:bg-zinc-100 data-[checked]:font-bold data-[checked]:text-zinc-900 dark:data-[focus]:bg-zinc-800 dark:data-[checked]:text-white flex cursor-pointer items-center justify-start gap-3 rounded-md px-4 py-1.5 not-italic text-zinc-700 !no-underline hover:no-underline dark:text-zinc-300"
            >
              <Icon.home className="h-4 w-4" /> Homepage
            </a>
          </MenuItem>
          <MenuItem
            id="logout"
            className="data-[focus]:bg-zinc-100 data-[checked]:font-bold data-[checked]:text-zinc-900 dark:data-[focus]:bg-zinc-800 dark:data-[checked]:text-white flex cursor-pointer items-center justify-start gap-3 rounded-md px-4 py-1.5 not-italic text-zinc-700 dark:text-zinc-300"
            onClick={() => signOut()}
          >
            <Icon.logout className="h-4 w-4" /> Logout
          </MenuItem>
        </MenuContent>
      </MenuPositioner>
    </Menu>
  );
}
