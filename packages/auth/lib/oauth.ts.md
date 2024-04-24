## OAuth2 Handler 📚

### Table of Contents

- [Overview](#overview)
- [Creating an OAuth2 Redirect Handler](#creating-an-oauth2-redirect-handler)
- [Creating an OAuth2 Callback Handler](#creating-an-oauth2-callback-handler)

### Overview

This module provides two functions for handling OAuth2 login and authorization in your Next.js application:

- `createOauthRedirectHandler`: Generates a URL and state for redirecting the user to the OAuth2 provider's login page.
- `createOauthCallbackHandler`: Handles the OAuth2 callback from the provider and creates or updates a user in the database based on the OAuth2 credentials.

### Creating an OAuth2 Redirect Handler

```typescript
import { createOauthRedirectHandler } from "./oauth";

export const googleOauthRedirect = createOauthRedirectHandler("google", async () => {
  // Generate a random state and code verifier (if needed)
  const { state, codeVerifier, url } = await generateAuthorizationTokens();

  // Store the state and code verifier in cookies for later validation
  cookies().set("google_oauth_state", state, /* cookie options */);
  if (codeVerifier) {
    cookies().set("code_verifier", codeVerifier, /* cookie options */);
  }

  return Response.redirect(url);
});
```

### Creating an OAuth2 Callback Handler

```typescript
import { createOauthCallbackHandler } from "./oauth";

export const googleOauthCallback = createOauthCallbackHandler("google", async (code, codeVerifier) => {
  // Validate the authorization code and retrieve user information from the provider
  const oauthUser = await validateAuthorizationCode(code, codeVerifier);

  // Check if the user already exists in the database
  const existingUser = await db.user.findFirst({
    where: {
      // Check both linked OAuth accounts and email
      OR: [
        {
          oauthAccounts: {
            some: {
              providerId: "google",
              providerUserId: oauthUser.id,
            },
          },
        },
        {
          email: oauthUser.email.toLowerCase(),
        },
      ],
    },
    select: {
      id: true,
      oauthAccounts: {
        select: {
          providerId: true,
        },
      },
    },
  });

  if (existingUser) {
    // If the user already exists, link the new OAuth account if necessary
    if (!existingUser.oauthAccounts.some((account) => account.providerId === "google")) {
      await db.userOauthAccount.create({
        data: {
          providerId: "google",
          providerUserId: oauthUser.id,
          userId: existingUser.id,
        },
      });
    }

    // Create a new session for the user and set the session cookie
    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/app",
      },
    });
  } else {
    // If the user does not exist, create a new user and link the OAuth account
    const newUser = await db.user.create({
      data: {
        email: oauthUser.email.toLowerCase(),
        emailVerified: true,
        name: oauthUser.name,
        avatarUrl: oauthUser.avatar,
      },
    });

    await db.userOauthAccount.create({
      data: {
        providerId: "google",
        providerUserId: oauthUser.id,
        userId: newUser.id,
      },
    });

    // Create a new session for the user and set the session cookie
    const session = await lucia.createSession(newUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/app",
      },
    });
  }
});
```