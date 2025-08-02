import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";
import { verifyPassword } from "./lib/password";
import { z } from "zod";

// Define schema for input validation
const CredentialsSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      // The name to display on the sign in form (optional)
      name: "Credentials",
      // `credentials` is used to generate a form on the sign in page.
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Validate input using Zod
          const parsedCredentials = CredentialsSchema.safeParse(credentials);

          if (!parsedCredentials.success) {
            console.error(
              "[Auth][Authorize] Invalid credentials format:",
              parsedCredentials.error.flatten() // Log flattened errors
            );
            return null; // Indicate invalid credentials format
          }

          const { email, password } = parsedCredentials.data;

          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: email },
          });

          if (!user) {
            return null;
          }

          if (!user.password) {
            return null;
          }

          // Verify password

          const isValidPassword = await verifyPassword(password, user.password);

          if (!isValidPassword) {
            return null; // Indicate invalid password
          }

          // Return user object if credentials are valid
          // Correctly exclude password from the returned user object
          const { ...userWithoutPassword } = user;
          return userWithoutPassword;
        } catch (error) {
          console.error("[Auth][Authorize] Error during authorization:", error);
          // Returning null signifies failure, Auth.js will handle the error display
          return null;
        }
      },
    }),
  ],
  session: {
    // Use JWT strategy for sessions as we are using Credentials provider primarily
    strategy: "jwt",
    // Set a shorter maxAge to ensure tokens are validated more frequently
    maxAge: 24 * 60 * 60, // 1 day
  },
  pages: {
    signIn: "/login", // Redirect users to `/login` page for sign-in
    // error: '/auth/error', // Optional: Custom error page
    // signOut: '/auth/signout', // Optional: Custom signout page
  },
  callbacks: {
    // Include user ID and email in the JWT token
    async jwt({ token, user }) {
      // Initial sign-in
      if (user) {
        token.id = user.id;
        token.email = user.email; // Add email to token
      }

      // Periodically validate that the user still exists in the database
      // This helps ensure deleted users are logged out
      if (token?.id) {
        try {
          const userExists = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { id: true },
          });

          if (!userExists) {
            // Return an empty object to sign the user out
            return {};
          }
        } catch (error) {
          console.error("[Auth][JWT] Error checking user existence:", error);
          // On database error, continue with the current token for now
        }
      }

      return token;
    },

    // Include user ID and email in the session object
    async session({ session, token }) {
      // If token is null (invalidated by jwt callback), session.user will be undefined
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string; // Add email to session user
      } else {
        // Ensure session.user is cleared if token is invalid
        // session.user = undefined; // NextAuth might handle this implicitly when token is null
      }

      return session;
    },
  },
  // Optional: Add debug messages in development
  debug: process.env.NODE_ENV === "development",
});
