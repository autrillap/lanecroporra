import { safeResolveInviteGroup } from "@/lib/db/invites";
import { Metadata } from "next";
import InvitePage from "./invite-client";

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;

  try {
    const group = await safeResolveInviteGroup(token);
    if (!group) return { title: "Invitación no encontrada" };

    return {
      title: `Únete a ${group.name} en La Necroporra`,
      description:
        group.description ||
        `Has sido invitado a participar en el grupo ${group.name}. ¡Prepara tu lista de famosos!`,
      openGraph: {
        title: `Invitación: ${group.name}`,
        description:
          group.description ||
          `Has sido invitado a participar en el grupo ${group.name}. ¡Prepara tu lista de famosos!`,
        images: ["/logo.png"],
      },
    };
  } catch (error) {
    console.error("Error en metadata:", error);
    return { title: "Invitación a La Necroporra" };
  }
}

export default async function Page({ params }: Props) {
  const { token } = await params;
  return <InvitePage token={token} />;
}
