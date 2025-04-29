import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";

// Wrapper component to allow SignInForm to use useSearchParams
function LoginPageContent() {
  return <SignInForm />;
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginPageContent />
      </Suspense>
    </main>
  );
}
