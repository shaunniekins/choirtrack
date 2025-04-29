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
        console.log("[Auth][Authorize] Attempting authorization..."); // Add entry log
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
          console.log(`[Auth][Authorize] Validated credentials for: ${email}`); // Log email

          // Find user by email
          console.log(`[Auth][Authorize] Finding user by email: ${email}`); // Log before DB call
          const user = await prisma.user.findUnique({
            where: { email: email },
          });

          if (!user) {
            console.log(
              `[Auth][Authorize] Login failed: User not found for ${email}`
            );
            return null;
          }
          console.log(`[Auth][Authorize] User found: ${user.id}`); // Log user found

          if (!user.password) {
            // Check specifically for the password field existence
            console.log(
              `[Auth][Authorize] Login failed: Password not set for user ${email} (ID: ${user.id})`
            );
            return null;
          }
          console.log(`[Auth][Authorize] User has a password hash.`); // Log password exists

          // Verify password
          console.log(`[Auth][Authorize] Verifying password for ${email}`); // Log before verification
          const isValidPassword = await verifyPassword(password, user.password);

          if (!isValidPassword) {
            console.log(
              `[Auth][Authorize] Login failed: Invalid password for ${email}`
            );
            return null; // Indicate invalid password
          }

          console.log(`[Auth][Authorize] Login successful for ${email}`);
          // Return user object if credentials are valid
          // Correctly exclude password from the returned user object
          const { password: _, ...userWithoutPassword } = user;
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
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in
      if (user) {
        console.log("[Auth][JWT] Adding user info to token:", {
          id: user.id,
          email: user.email,
        }); // Log JWT update
        token.id = user.id;
        token.email = user.email; // Add email to token
      }

      // Periodically validate that the user still exists in the database
      // This helps ensure deleted users are logged out
      if (token?.id) {
        console.log("[Auth][JWT] Checking if user still exists:", token.id);

        try {
          const userExists = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { id: true },
          });

          if (!userExists) {
            console.log(
              "[Auth][JWT] User no longer exists in database:",
              token.id
            );
            // Return an empty object to sign the user out
            return {};
          }
        } catch (error) {
          console.error("[Auth][JWT] Error checking user existence:", error);
          // On database error, continue with the current token for now
        }
      }

      console.log("[Auth][JWT] Returning token:", token); // Log token return
      return token;
    },

    // Include user ID and email in the session object
    async session({ session, token }) {
      console.log("[Auth][Session] Processing session callback. Token:", token); // Log session entry
      // If token is null (invalidated by jwt callback), session.user will be undefined
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string; // Add email to session user
        console.log("[Auth][Session] Updated session user:", session.user); // Log updated session
      } else {
        console.log(
          "[Auth][Session] Token is invalid or session.user is missing. Clearing session user."
        ); // Log invalid token case
        // Ensure session.user is cleared if token is invalid
        // session.user = undefined; // NextAuth might handle this implicitly when token is null
      }
      console.log("[Auth][Session] Returning session:", session); // Log session return
      return session;
    },
  },
  // Optional: Add debug messages in development
  debug: process.env.NODE_ENV === "development",
});
