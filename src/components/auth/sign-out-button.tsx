"use client";

import { signOut } from "next-auth/react";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/login" });
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="px-2 text-xs"
      onClick={handleSignOut}
      disabled={isPending}
      aria-label="Sign out"
    >
      {isPending ? (
        <Loader2 className="h-2 animate-spin" />
      ) : (
        <LogOutIcon className="h-2" />
      )}
      Sign Out
    </Button>
  );
}
