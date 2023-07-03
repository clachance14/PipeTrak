"use client";

import { Sidebar } from "@components/Sidebar";
import { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren<{}>) {
  return (
    <div className="flex bg-zinc-50 dark:bg-zinc-900">
      <Sidebar />
      <main className="min-h-screen flex-1 transition-all duration-300 ease-in-out lg:ml-[280px]">
        {children}
      </main>
    </div>
  );
}
