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

export function AuthCard() {
  const supabase = createClient();

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    }
  };
  return (
    <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-black dark:text-white font-serif">
          La Necroporra
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Inicia sesión para crear o unirte a una party
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Google Login Button */}
        <Button
          onClick={handleSignIn}
          className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 h-12"
          size="lg"
        >
          <Chrome className="h-5 w-5 mr-3" />
          Continuar con Google
        </Button>

        <div className="relative">
          <Separator className="bg-gray-200 dark:bg-gray-700" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-white dark:bg-gray-900 px-3 text-sm text-gray-500 dark:text-gray-400">
              ¿Por qué Google?
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
