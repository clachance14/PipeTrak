"use client";

import { Sidebar } from "@components/Sidebar";
import { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren<{}>) {
  return (
    <div className="dark:bg-zinc-950 flex bg-zinc-50">
      <Sidebar />
      <main className="mt-4 min-h-screen flex-1 rounded-xl bg-white shadow-sm transition-all duration-300 ease-in-out dark:bg-zinc-900 lg:ml-[280px]">
        {children}
      </main>
    </div>
  );
}
