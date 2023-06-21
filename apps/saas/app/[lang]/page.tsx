import { getUserSession } from "auth";
import useTranslation from "next-translate/useTranslation";
import TestComponent from "./TestComponent";

export async function generateMetadata() {
  const { t } = useTranslation();

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
