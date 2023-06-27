import { Newsletter } from "app/[locale]/(home)/Newsletter";
import Link from "next-intl/link";
import { Features } from "./Features";
import { Hero } from "./Hero";

export default function Home() {
  return (
    <main>
      <Hero />
      <div>
        <Link href="/" locale="de">
          Deutsch
        </Link>{" "}
        |{" "}
        <Link href="/" locale="en">
          English
        </Link>
      </div>
      <Features />
      <Newsletter />
    </main>
  );
}
