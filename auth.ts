// Drip Theka — NextAuth v5 configuration.
//
// Providers:
//   • Google OAuth (primary)
//   • Credentials (email-only, no password — magic link in V1.1)
//
// Adapter: @auth/drizzle-adapter → Neon Postgres
// Session strategy: JWT (works without DB for SSR; adapter persists to DB when available)
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
    // JWT strategy works even without DB (falls back gracefully)
    session: { strategy: adapter ? "database" : "jwt" },

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
      // Include user.id in session for easy lookup
      async session({ session, token, user }) {
        if (session.user) {
          if (user?.id) session.user.id = user.id;
          else if (token?.sub) session.user.id = token.sub;
        }
        return session;
      },
    },
  };
});
