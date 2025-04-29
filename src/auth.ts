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
              "Invalid credentials format:",
              parsedCredentials.error
            );
            return null; // Indicate invalid credentials format
          }

          const { email, password } = parsedCredentials.data;

          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: email },
          });

          if (!user || !user.password) {
            // User not found or password not set
            console.log(
              `Login failed: User not found or no password for ${email}`
            );
            return null;
          }

          // Verify password
          const isValidPassword = await verifyPassword(password, user.password);

          if (!isValidPassword) {
            console.log(`Login failed: Invalid password for ${email}`);
            return null; // Indicate invalid password
          }

          console.log(`Login successful for ${email}`);
          // Return user object if credentials are valid
          // Exclude password from the returned user object
          const { ...userWithoutPassword } = user;
          return userWithoutPassword;
        } catch (error) {
          console.error("Error during authorization:", error);
          // Returning null signifies failure, Auth.js will handle the error display
          return null;
        }
      },
    }),
  ],
  session: {
    // Use JWT strategy for sessions as we are using Credentials provider primarily
    strategy: "jwt",
  },
  pages: {
    signIn: "/login", // Redirect users to `/login` page for sign-in
    // error: '/auth/error', // Optional: Custom error page
    // signOut: '/auth/signout', // Optional: Custom signout page
  },
  callbacks: {
    // Include user ID and email in the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email; // Add email to token
      }
      return token;
    },
    // Include user ID and email in the session object
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string; // Add email to session user
      }
      return session;
    },
  },
  // Optional: Add debug messages in development
  debug: process.env.NODE_ENV === "development",
});
