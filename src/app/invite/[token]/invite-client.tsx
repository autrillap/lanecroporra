"use client";

import { ResolveUserId } from "@/components/resolve-user-id";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { joinGroup } from "@/lib/db/groups";
import { resolveInviteGroup } from "@/lib/db/invites";
import { GroupDoc } from "@/models/Group";
import { useAuth } from "@/providers/auth-provider";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CircleChevronDown,
  Loader2,
  Lock,
  Timer,
} from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function InviteClientPage({ token }: { token: string }) {
  const { currentUser, loading: userLoading } = useAuth();

  const [groupData, setGroupData] = useState<GroupDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (userLoading || !token) return;
    const loadGroupData = async () => {
      try {
        if (!currentUser) {
          setGroupData(null);
          return;
        }
        const data = await resolveInviteGroup(token);
        setGroupData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadGroupData();
  }, [token, currentUser, userLoading]);

  const handleJoinGroup = async () => {
    if (!token) return;
    setJoining(true);
    if (!groupData || !currentUser) {
      setJoining(false);
      return;
    }
    await joinGroup(currentUser?.id, token);
    setJoining(false);
    redirect("/dashboard");
  };

  const calculateTimeLeft = (deadline: Date) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();

    if (timeDiff <= 0) {
      return { months: 0, days: 0, expired: true };
    }

    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;

    return { months, days: remainingDays, expired: false };
  };

  if (loading || userLoading) {
    return (
      <div className="flex flex-1 w-full items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sesión no iniciada</h2>
              <p className="text-muted-foreground mb-4">
                Inicia sesión para aceptar esta invitación
              </p>
              <Button
                onClick={() => redirect(`/login?returnUrl=/invite/${token}`)}
                className="w-full"
              >
                Iniciar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CircleChevronDown className="w-12 h-12 text-blue-500 mx-auto mb-4" />

              <h2 className="text-xl font-semibold mb-2">Enlace Inválido</h2>
              <p className="text-muted-foreground mb-4">
                El enlace ha caducado o es inválido
              </p>
              <Button onClick={() => redirect("/dashboard")} className="w-full">
                Volver al Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isMember: boolean =
    !!currentUser &&
    !!groupData?.members &&
    !!groupData.members[currentUser.id];

  const timeLeft = calculateTimeLeft(new Date(groupData.deadline));
  const isGroupActive = groupData.status === "activo";
  const isProrroga = timeLeft.expired && !isGroupActive;
  const canJoin = !isGroupActive && !isMember;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl lg:text-3xl mb-2">
            Invitación a Grupo
          </CardTitle>
          <CardDescription className="text-base">
            Has sido invitado a unirte a este grupo de La Necroporra
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Group Info */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-xl lg:text-2xl font-bold">
                {groupData.name}
              </h3>
            </div>
            <p className="text-muted-foreground">{groupData.description}</p>
            <div className="text-sm text-muted-foreground">
              <p>Creado por </p>
              <span className="font-medium">
                <ResolveUserId userId={groupData.creator_id} />
              </span>
            </div>
          </div>

          {/* Group Stats */}
          <div className="grid grid-cols-1 gap-4">
            <Card
              className={`border-none ${
                isGroupActive
                  ? "bg-red-50 dark:bg-red-950/20"
                  : isProrroga
                  ? "bg-amber-50 dark:bg-amber-950/20"
                  : "bg-muted/20"
              }`}
            >
              <CardContent className="p-4 text-center">
                {!timeLeft.expired ? (
                  <>
                    <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="font-bold text-lg">
                      {timeLeft.months}m {timeLeft.days}d
                    </p>
                    <p className="text-xs text-muted-foreground uppercase">
                      Tiempo restante para editar lista
                    </p>
                  </>
                ) : isGroupActive ? (
                  <>
                    <Lock className="w-6 h-6 mx-auto mb-2 text-red-500" />
                    <p className="font-bold text-red-600">
                      Inscripciones Cerradas
                    </p>
                    <p className="text-xs text-muted-foreground">
                      El juego ya ha comenzado para este grupo
                    </p>
                  </>
                ) : (
                  <>
                    <Timer className="w-6 h-6 mx-auto mb-2 text-amber-500 animate-pulse" />
                    <p className="font-bold text-amber-600">En Prórroga</p>
                    <p className="text-xs text-muted-foreground uppercase">
                      Última oportunidad para entrar
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleJoinGroup}
              disabled={joining || !canJoin}
              className={`flex-1 h-12 text-base`}
            >
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uniéndose...
                </>
              ) : isMember ? (
                "Ya eres miembro"
              ) : isGroupActive ? (
                "Grupo Cerrado"
              ) : (
                "Unirse ahora"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => redirect("/dashboard")}
              className="flex-1 h-12 bg-transparent"
            >
              Volver
            </Button>
          </div>

          <div className="space-y-3">
            {isMember && (
              <div className="flex items-center gap-2 justify-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                Ya formas parte de este grupo. Revisa tu lista en el dashboard.
              </div>
            )}

            {isProrroga && !isMember && (
              <div className="flex flex-col items-center gap-1 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  ¡Atención! Período de prórroga
                </div>
                <p className="text-center opacity-90">
                  La fecha límite ha pasado. Si te unes ahora, debes completar
                  tu lista inmediatamente antes de que el administrador cierre
                  el grupo.
                </p>
              </div>
            )}

            {isGroupActive && !isMember && (
              <div className="flex flex-col items-center gap-1 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm">
                <div className="flex items-center gap-2 font-bold">
                  <Lock className="w-4 h-4" />
                  Acceso denegado
                </div>
                <p className="text-center opacity-90">
                  Este grupo ha comenzado la competición. No se permiten nuevos
                  ingresos para mantener la justicia en las puntuaciones.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
