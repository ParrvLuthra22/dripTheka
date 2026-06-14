// Drip Theka — NextAuth v5 configuration.
//
// Providers:
//   • Google OAuth (primary)
//   • Credentials (email-only, no password — magic link in V1.1)
//
// Adapter: @auth/drizzle-adapter → Neon Postgres (persists users/accounts)
// Session strategy: JWT always — sessions live in a signed token, never the DB.
// The adapter still records the user/account rows on OAuth sign-in.
//
// REQUIRED ENV VARS:
//   AUTH_SECRET            — random string, generate with: npx auth secret
//   GOOGLE_CLIENT_ID       — from Google Cloud Console
//   GOOGLE_CLIENT_SECRET   — from Google Cloud Console
//
// OPTIONAL (for DB-backed sessions):
//   DATABASE_URL           — Neon connection string

import NextAuth from "next-auth";
import Google   from "next-auth/providers/google";

const dbReady = () =>
  !!(process.env.DATABASE_URL &&
     !process.env.DATABASE_URL.includes("placeholder") &&
     process.env.DATABASE_URL !== "REPLACE_ME");

// Lazily build adapter — only when DB is configured
async function makeAdapter() {
  if (!dbReady()) return undefined;
  const { DrizzleAdapter } = await import("@auth/drizzle-adapter");
  const { db }              = await import("@/lib/db/client");
  const schema              = await import("@/lib/db/schema");
  return DrizzleAdapter(db, {
    usersTable:              schema.users,
    accountsTable:           schema.accounts,
    sessionsTable:           schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  });
}

export const { handlers, signIn, signOut, auth } = NextAuth(async () => {
  const adapter = await makeAdapter();

  return {
    adapter,
    // JWT always — stateless signed-token sessions, no DB session lookups.
    session: { strategy: "jwt" },

    providers: [
      Google({
        clientId:     process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      }),
    ],

    pages: {
      signIn:  "/login",
      signOut: "/",
      error:   "/login",
    },

    callbacks: {
      // On sign-in, stamp the user id into the token so it survives in the JWT.
      async jwt({ token, user }) {
        if (user?.id) token.id = user.id;
        return token;
      },
      // Expose the user id on the session from the token.
      async session({ session, token }) {
        if (session.user) {
          session.user.id = (token.id as string | undefined) ?? token.sub ?? session.user.id;
        }
        return session;
      },
    },
  };
});
