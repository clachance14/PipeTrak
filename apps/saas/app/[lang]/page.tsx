import { getUserSession } from "auth";
import { getTranslator } from "next-intl/server";
import TestComponent from "./TestComponent";

export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslator(locale);

  return {
    title: t("helloWorld"),
  };
}

export default async function Home() {
  const session = await getUserSession();

  if (!session) {
    return <div>Not logged in</div>;
  }

  const { user } = session;

  return (
    <main>
      Hello {user.name}
      <TestComponent userName={user.name} />
    </main>
  );
}
