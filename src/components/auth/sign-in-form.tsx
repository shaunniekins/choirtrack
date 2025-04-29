"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react"; // Use client-side signIn for Credentials

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(
    error ? "Invalid credentials. Please try again." : null
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null); // Clear previous errors
    startTransition(async () => {
      const result = await signIn("credentials", {
        redirect: false, // Prevent automatic redirection, handle manually
        email: email,
        password: password,
        callbackUrl: callbackUrl, // Pass the intended redirect URL
      });

      if (result?.error) {
        // Handle sign-in errors (e.g., invalid credentials)
        console.error("Sign-in error:", result.error);
        setFormError("Invalid email or password."); // Set a user-friendly error message
      } else if (result?.url) {
        // Sign-in successful, redirect manually
        window.location.href = result.url;
      } else {
        // Handle unexpected cases where result is null or doesn't have url/error
        setFormError("An unexpected error occurred during sign-in.");
      }
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to access ChoirTrack.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
