"use client";
import { resolveUserId } from "@/lib/db/users";
import { useEffect, useState } from "react";

export function ResolveUserId({ userId }: { userId: string }) {
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchUserName() {
      try {
        const name = await resolveUserId(userId);
        setUserName(name);
      } catch (error) {
        console.error("Error resolving user ID:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserName();
  }, [userId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <div className="truncate">{userName || "User not found"}</div>;
}
