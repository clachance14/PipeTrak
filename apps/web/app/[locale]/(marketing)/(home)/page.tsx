import { Newsletter } from "@app/[locale]/(marketing)/(home)/Newsletter";
import { Features } from "./Features";
import { Hero } from "./Hero";

export default function Home() {
  return (
    <main className="bg-white dark:bg-zinc-900">
      <Hero />
      <Features />
      <Newsletter />
    </main>
  );
}
