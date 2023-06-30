import { Newsletter } from "app/[locale]/(home)/Newsletter";
import { Features } from "./Features";
import { Hero } from "./Hero";

export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <Newsletter />
    </main>
  );
}
