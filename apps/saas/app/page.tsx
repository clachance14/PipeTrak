import { getUserSession } from "auth";
import TestComponent from "./TestComponent";

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
