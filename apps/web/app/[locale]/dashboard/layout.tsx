"use client";

import { Sidebar } from "@components";
import { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren<{}>) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="mt-2 min-h-screen flex-1 rounded-tl-xl bg-white px-8 py-12 ring-1 ring-black/5 transition-all duration-300 ease-in-out dark:bg-zinc-900 dark:ring-white/10 lg:ml-[300px]">
        {children}
      </main>
    </div>
  );
}
