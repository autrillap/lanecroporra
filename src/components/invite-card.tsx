import { resolveInvite } from "@/lib/db/invites";
import { resolveUserId } from "@/lib/db/users";
import { InviteDoc } from "@/models/Invite";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

function timeAgo(date: Date) {
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000; // seconds difference

  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

  if (diff < 60) return rtf.format(-Math.floor(diff), "second");
  if (diff < 3600) return rtf.format(-Math.floor(diff / 60), "minute");
  if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), "hour");
  return rtf.format(-Math.floor(diff / 86400), "day");
}

export function InviteCard({ tokenId }: { tokenId: string }) {
  const [inviteData, setInviteData] = useState<InviteDoc | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  // const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | undefined | null>(
    undefined
  );

  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const fetchInviteData = async () => {
      try {
        const inviteData = await resolveInvite(tokenId);
        if (inviteData) {
          setInviteData(inviteData);
          // setError(null);
        }
      } catch (err) {
        console.error("Error fetching invite data:", err);
        // setError(err instanceof Error ? err.message : "Error loading invite data");
      } finally {
        setLoading(false);
      }
    };
    fetchInviteData();
  }, [tokenId]);

  useEffect(() => {
    if (!inviteData) return;
    const fetchDisplayName = async () => {
      try {
        setDisplayName(undefined);
        const name = await resolveUserId(inviteData.created_by);
        setDisplayName(name);
      } catch (error) {
        console.error("Error resolving user ID:", error);
        setDisplayName(null);
      }
    };
    fetchDisplayName();
  }, [inviteData]);

  const copyInviteLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/invite/${tokenId}`
    );
    setCopied(true);
  };

  if (!inviteData && !loading) {
    return null;
  }

  return (
    <>
      <div className="flex gap-2 items-center justify-between p-3 border border-border rounded-lg">
        <div className="overflow-hidden">
          <p className="font-medium text-xs text-nowrap overflow-x-hidden text-ellipsis">
            {tokenId}
          </p>
          <p className="text-xs text-muted-foreground">
            {inviteData
              ? `Creado ${timeAgo(new Date(inviteData.created_at))} por ${
                  displayName ?? "..."
                }`
              : "Cargando..."}
          </p>
        </div>
        <Button
          onClick={copyInviteLink}
          variant="outline"
          className="bg-transparent"
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
      {copied && (
        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
          ¡Enlace copiado al portapapeles!
        </p>
      )}
    </>
  );
}
