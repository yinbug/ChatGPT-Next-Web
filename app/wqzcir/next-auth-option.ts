import type { NextAuthOptions } from "next-auth";

export const defaultAuthOption: NextAuthOptions = {
  providers: [],
  debug: process.env.NODE_ENV !== "production",
  secret: "OacqdzU7yEZn2zAHR7xnRkwLbk2K/wqzcir.com/eYg=",
  session: {
    // Choose how you want to save the user session.
    // The default is `"jwt"`, an encrypted JWT (JWE) stored in the session cookie.
    // If you use an `adapter` however, we default it to `"database"` instead.
    // You can still force a JWT session by explicitly defining `"jwt"`.
    // When using `"database"`, the session cookie will only contain a `sessionToken` value,
    // which is used to look up the session in the database.
    strategy: "jwt",

    // Seconds - How long until an idle session expires and is no longer valid.
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  cookies: {
    sessionToken: {
      name: `chatgpt.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // secure: process.env.NODE_ENV === "production"
      },
    },
    callbackUrl: {
      name: `chatgpt.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        // secure: process.env.NODE_ENV === "production"
      },
    },
    csrfToken: {
      name: `chatgpt.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // secure: process.env.NODE_ENV === "production"
      },
    },
  },
};
