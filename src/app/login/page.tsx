"use client";

import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { ArrowLeft, Loader2 } from "lucide-react";

import Link from "next/link";
import { redirect, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

export default function LoginPageWrapped() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 w-full items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}

function LoginPage() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const error = searchParams.get("error");

  useEffect(() => {
    if (error === "auth") {
      // Si venimos rebotados del callback con error
      console.error("Authentication error from callback");
    }
  }, [error]);

  useEffect(() => {
    if (currentUser) {
      window.location.href = returnUrl || "/dashboard";
    }
  }, [currentUser, returnUrl]);

  if (currentUser) {
    return (
      <div className="flex flex-1 w-full items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <main className="container max-w-md mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/">
          <Button
            variant="ghost"
            className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </Link>
      </div>

      {/* Login Card */}
      <AuthCard />

      {/* Additional Info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          ¿Primera vez?
          <Link
            href="/"
            className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white ml-1 underline"
          >
            Aprende cómo funciona
          </Link>
        </p>
      </div>
    </main>
  );
}
