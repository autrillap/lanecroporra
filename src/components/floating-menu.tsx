"use client";

import { Button } from "@/components/ui/button";
import { getUserById } from "@/lib/db/users";
import { UserDoc } from "@/models/User";
import { useAuth } from "@/providers/auth-provider";
import { Menu, ShieldUser, User as UserIcon, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ModeToggle } from "./mode-toggle";

export function FloatingMenu() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentUser, loading } = useAuth();
  const [user, setUser] = useState<UserDoc | undefined | null>(undefined);

  useEffect(() => {
    if (currentUser && !loading) {
      const fetchUser = async () => {
        const userData = await getUserById(currentUser.id);
        if (userData) setUser(userData);
      };
      fetchUser();
    }
  }, [currentUser, loading]);

  // Corrección en la lógica de admin
  const isAdmin = user?.role === "admin" || user?.role === "creator";

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex items-center">
        <div
          className={`flex items-center transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded
              ? "opacity-100 translate-x-0 max-w-[300px] gap-3 mr-3"
              : "opacity-0 translate-x-8 max-w-0 gap-0 mr-0 pointer-events-none"
          }`}
        >
          {/* Admin button */}
          {isAdmin && (
            <Link href="/admin">
              <Button
                size="icon"
                variant="outline"
                className="h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border-2 shadow-lg shrink-0"
              >
                <ShieldUser className="h-5 w-5" />
              </Button>
            </Link>
          )}

          {/* Profile button */}
          {user && (
            <Link href={currentUser ? "/profile" : "/login"}>
              <Button
                size="icon"
                variant="outline"
                className="h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border-2 hover:bg-accent transition-all duration-200 shadow-lg"
              >
                <UserIcon className="h-5 w-5" />
              </Button>
            </Link>
          )}

          <div className="shrink-0">
            <ModeToggle />
          </div>
        </div>

        {/* Main toggle button */}
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          size="icon"
          className="h-14 w-14 rounded-full bg-foreground text-background hover:bg-foreground/90 hover:scale-110 transition-all duration-200 shadow-xl relative z-10"
        >
          <Menu
            className={`h-6 w-6 transition-all duration-300 ${
              isExpanded ? "rotate-90 scale-0" : "rotate-0 scale-100"
            }`}
          />
          <X
            className={`absolute h-6 w-6 transition-all duration-300 ${
              isExpanded ? "rotate-0 scale-100" : "-rotate-90 scale-0"
            }`}
          />
          <span className="sr-only">Menú</span>
        </Button>
      </div>
    </div>
  );
}
