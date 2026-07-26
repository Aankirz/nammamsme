import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const AUTH_ENABLED = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: AUTH_ENABLED
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
      ]
    : [],
  pages: { signIn: "/sign-in" },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
