import { getUser } from "auth";

export default async function Home() {
  const user = await getUser();

  return (
    <main>
      Hello {user.name}
      {/* {user ? (
        <Button onClick={() => signOut()}>Sign out</Button>
      ) : (
        <Button as={Link} href="/signin">
          Sign in
        </Button>
      )} */}
    </main>
  );
}
