"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { Chrome } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { Provider } from "@supabase/supabase-js";

export function AuthCard() {
  const supabase = createClient();
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);

  const handleSignIn = async (provider: Provider) => {
    try {
      setLoadingProvider(provider);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          // Para Azure (Microsoft) se recomienda solicitar explícitamente el email
          scopes: provider === "azure" ? "email" : undefined,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setLoadingProvider(null);
    }
  };

  return (
    <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-black dark:text-white font-serif">
          La Necroporra
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Inicia sesión para crear o unirte a una party
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          {/* Google Login Button */}
          <Button
            onClick={() => handleSignIn("google")}
            disabled={loadingProvider !== null}
            className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 h-12 shadow-sm transition-all"
            size="lg"
          >
            <Chrome className="h-5 w-5 mr-3" />
            {loadingProvider === "google" ? "Conectando..." : "Continuar con Google"}
          </Button>

          {/* Microsoft Login Button (Azure) */}
          <Button
            onClick={() => handleSignIn("azure")}
            disabled={loadingProvider !== null}
            className="w-full bg-[#2F2F2F] hover:bg-[#1f1f1f] text-white border border-transparent h-12 shadow-sm transition-all"
            size="lg"
          >
            {/* Microsoft Logo Icon */}
            <svg className="h-5 w-5 mr-3" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
              <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
            </svg>
            {loadingProvider === "azure" ? "Conectando..." : "Continuar con Microsoft"}
          </Button>
        </div>

        <div className="relative">
          <Separator className="bg-gray-200 dark:bg-gray-700" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-white dark:bg-gray-900 px-3 text-sm text-gray-500 dark:text-gray-400">
              Sobre la autenticación
            </span>
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-black dark:bg-white rounded-full mt-2 flex-shrink-0"></div>
            <span>Acceso rápido y seguro sin crear otra contraseña</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-black dark:bg-white rounded-full mt-2 flex-shrink-0"></div>
            <span>Solo usamos tu email y nombre para identificarte</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-black dark:bg-white rounded-full mt-2 flex-shrink-0"></div>
            <span>No accedemos a ningún otro dato de tu cuenta</span>
          </div>
        </div>

        {/* Terms */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Al continuar, aceptas y entiendes que este juego es solo
          entretenimiento y no pretende faltar al respeto a nadie.
        </div>
      </CardContent>
    </Card>
  );
}
