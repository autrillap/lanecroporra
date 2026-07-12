"use client";

import GroupManagementModal from "@/components/group-management-modal";
import { LeaderBoardCard } from "@/components/leaderboard-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getGroupById, leaveGroup } from "@/lib/db/groups";
import { getUserById, resolveUserId } from "@/lib/db/users";
import { timeAgo } from "@/lib/time-ago";
import { getTimeLeft } from "@/lib/time-left";
import { BetDoc } from "@/models/Bet";
import { GroupDoc } from "@/models/Group";
import { UserDoc } from "@/models/User";
import { useAuth } from "@/providers/auth-provider";
import { useSidebar } from "@/providers/sidebar-provider";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  Menu,
  Settings,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const router = useRouter();
  const { currentUser, loading } = useAuth();
  const [user, setUser] = useState<UserDoc | undefined | null>(undefined);

  const [group, setGroup] = useState<GroupDoc | undefined | null>(undefined);
  const [showGroupManagement, setShowGroupManagement] = useState(false);

  const [timeLeft, setTimeLeft] = useState<{
    months: number;
    days: number;
    expired: boolean;
  } | null>(null);

  const { setOpen } = useSidebar();

  const [showMemberListModal, setShowMemberListModal] = useState(false);
  const [selectedMemberList, setSelectedMemberList] = useState<{
    name: string;
    list: BetDoc[];
  } | null>(null);

  const fetchGroupData = useCallback(async () => {
    const { groupId } = await params;
    if (groupId && currentUser) {
      const fetchedGroup = await getGroupById(groupId, currentUser?.id);
      setGroup(fetchedGroup);
    }
  }, [params, currentUser]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  useEffect(() => {
    if (group) {
      const updateCountdown = () => {
        setTimeLeft(getTimeLeft(new Date(group.deadline)));
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 3600000);

      return () => clearInterval(interval);
    }
  }, [group]);

  useEffect(() => {
    if (currentUser && !loading) {
      const fetchUser = async () => {
        const userData = await getUserById(currentUser.id);
        if (!userData) {
          console.error("User not found");
          setUser(null);
          return;
        }
        setUser(userData);
      };
      fetchUser();
    }
  }, [currentUser, loading]);

  useEffect(() => {
    console.log(group);
    if (group === null) router.push("/dashboard");
  }, [group, router]);

  const handleViewMemberList = async (playerUid: string) => {
    if (!group || !group.members) return;
    const memberName = await resolveUserId(playerUid);
    const memberList = group.members[playerUid]?.list?.bets;
    if (!memberList || !memberName) return;
    setSelectedMemberList({ name: memberName, list: memberList });
    setShowMemberListModal(true);
  };

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeaveGroup = async () => {
    if (!group || !user) return;
    setIsLeaving(true);
    try {
      await leaveGroup(user.id, group.id);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLeaving(false);
    }
  };

  if (loading || user === undefined || group === undefined) {
    return (
      <div className="flex flex-1 w-full h-full items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (user === null) {
    redirect("/login");
  }

  if (!group || !group.members) {
    return;
  }

  const isAdmin = group?.members
    ? group?.members[user.id].role === "admin"
    : false;

  return (
    <div className="flex flex-1 max-w-screen h-{dvh} bg-background relative">
      {/* Right Panel - Group Details */}
      <div className="relative flex flex-1 flex-col min-w-0">
        <>
          <div className="lg:hidden p-4 border-b border-border bg-card flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setOpen()}>
              <Menu className="w-4 h-4" />
            </Button>
            <h2 className="font-semibold truncate text-center flex-1">
              {group.name}
            </h2>
            {group.creator_id !== user.id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeaveDialog(true)}
              >
                <LogOut className="w-4 h-4 text-red-500" />
              </Button>
            )}

            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGroupManagement(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="lg:hidden left-0 right-0 z-30 bg-card border-b border-border p-2">
            <div className="grid grid-cols-3 gap-2">
              <Card className="shadow-none border-muted p-0">
                <CardContent className="p-2 text-center h-full flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <Users className="w-3 h-3 text-muted-foreground mb-1" />
                    <p className="text-xs font-medium">
                      {Object.keys(group.members!).length}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      miembros
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none border-muted overflow-hidden p-0">
                <CardContent className="p-3 text-center h-full flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    {/* 1. ESTADO: EN TIEMPO (Draft y con tiempo restante) */}
                    {timeLeft &&
                      !timeLeft.expired &&
                      group.status !== "activo" && (
                        <>
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground mb-1" />
                          <p className="text-xs font-bold">
                            {timeLeft.months > 0 && `${timeLeft.months}m `}
                            {timeLeft.days}d
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                            restantes
                          </p>
                        </>
                      )}

                    {/* 2. ESTADO: PRÓRROGA (Expirado pero aún en Draft) */}
                    {timeLeft?.expired && group.status === "draft" && (
                      <>
                        <Timer className="w-3.5 h-3.5 text-amber-500 mb-1 animate-pulse" />
                        <p className="text-xs font-bold text-amber-600">
                          En Prórroga
                        </p>
                        <p className="text-[9px] leading-tight text-muted-foreground px-1">
                          Cierre inminente. Termina tu lista ya.
                        </p>
                      </>
                    )}

                    {/* 3. ESTADO: JUEGO EN CURSO (Status Activo) */}
                    {group.status === "activo" && (
                      <>
                        <Lock className="w-3.5 h-3.5 text-green-600 mb-1" />
                        <p className="text-xs font-bold text-green-600">
                          Lista Cerrada
                        </p>
                        <p className="text-[9px] leading-tight text-muted-foreground px-1">
                          Puntos contando. Edición deshabilitada.
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none border-muted p-0">
                <CardContent className="p-2 text-center h-full flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <Trophy className="w-3 h-3 text-muted-foreground mb-1" />
                    <p className="text-xs font-medium">
                      {
                        Object.values(group.members || {}).filter(
                          (member) => Object.keys(member.list?.bets || {}).length > 0
                        ).length
                      }
                      /{Object.keys(group.members!).length}
                    </p>
                    <p className="text-[10px] text-muted-foreground">listas</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="hidden lg:block p-6 border-b border-border bg-card">
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold truncate">{group.name}</h2>
                </div>
                <p className="text-muted-foreground">{group.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Botón Salir (Solo para no-creadores) */}
                {group.creator_id !== user.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLeaveDialog(true)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Abandonar
                  </Button>
                )}

                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGroupManagement(true)}
                    className="bg-transparent"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Gestionar
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {Object.keys(group.members!).length} Miembro
                        {Object.keys(group.members!).length > 1 && "s"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        En el grupo
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      {timeLeft &&
                        !timeLeft.expired &&
                        group.status !== "activo" && (
                          <>
                            <p className="text-sm font-bold">
                              {timeLeft.months > 0 && `${timeLeft.months}m `}
                              {timeLeft.days}d
                            </p>
                            <p className="text-xs text-muted-foreground uppercase tracking-tight">
                              restantes
                            </p>
                          </>
                        )}
                      {timeLeft?.expired && group.status === "draft" && (
                        <>
                          <p className="text-sm font-bold text-amber-600">
                            En Prórroga
                          </p>
                          <p className="text-xs leading-tight text-muted-foreground">
                            Cierre inminente. Termina tu lista ya.
                          </p>
                        </>
                      )}
                      {group.status === "activo" && (
                        <>
                          <p className="text-sm font-bold text-green-600">
                            Lista Cerrada
                          </p>
                          <p className="text-xs leading-tight text-muted-foreground">
                            Puntos contando. Edición deshabilitada.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {
                          Object.values(group.members || {}).filter(
                            (member) => Object.keys(member.list?.bets || {}).length > 0
                          ).length
                        }
                        /{Object.keys(group.members!).length} Listas
                      </p>
                      <p className="text-xs text-muted-foreground">Enviadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="p-4 lg:p-6 lg:pt-6 ">
            <div className="flex flex-col gap-4 lg:gap-6">
              <Card>
                <CardHeader className="pb-3 lg:pb-6">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span>Mi Lista</span>
                    <Button size="sm" className="w-full sm:w-auto" asChild>
                      <Link
                        href={group.id + "/edit-list"}
                        className="flex items-center gap-1"
                      >
                        {group.status === "draft"
                          ? "Editar Lista"
                          : "Ver Lista"}
                        {/* Warning if any deceased before deadline */}
                        {(group.members![user.id]?.list?.bets || []).some(
                          (p) => p.status === "deceased"
                        ) &&
                          group.status === "draft" && (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                      </Link>
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Tu lista de famosos para este grupo
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-y-auto max-h-[55vh]">
                  {group.members![user.id] &&
                  Object.keys(group.members![user.id]?.list?.bets || []).length > 0 ? (
                    <div className="space-y-3 max-w-full">
                      {(group.members![user.id]?.list?.bets || []).map(
                        (person, index) => {
                          // Lógica de iconos de estado
                          const isDeceased = person.status === "deceased";
                          const isGroupActive = group.status === "activo";

                          return (
                            <div
                              key={person.wikidata_id}
                              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20"
                            >
                              {/* Position number */}
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                {index + 1}
                              </div>

                              {/* Info */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium text-sm lg:text-base truncate">
                                    {person.name}
                                  </p>

                                  {/* Visualización de estados */}
                                  {isDeceased && (
                                    <>
                                      {isGroupActive ? (
                                        // Caso: Grupo activo (Punto conseguido)
                                        <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
                                          <span className="text-[10px] font-bold hidden sm:inline">
                                            ACIERTO
                                          </span>
                                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                        </div>
                                      ) : (
                                        // Caso: Grupo en draft/prórroga (Inválido/Alerta)
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="flex items-center gap-1 text-red-600">
                                                <span className="text-[10px] font-bold hidden sm:inline">
                                                  INVÁLIDO
                                                </span>
                                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p className="text-xs">
                                                Esta persona ya ha fallecido.
                                                Debes cambiarla antes del
                                                inicio.
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                    </>
                                  )}
                                </div>

                                <p className="text-xs text-muted-foreground truncate">
                                  <span className="capitalize">
                                    {person.snippet} •{" "}
                                  </span>
                                  {person.age !== null
                                    ? `${person.age} años`
                                    : "Edad desconocida"}
                                </p>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 lg:py-8 text-muted-foreground">
                      <Trophy className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm lg:text-base">
                        Aún no has creado tu lista
                      </p>
                      <p className="text-xs lg:text-sm">
                        Tienes hasta el 31 de diciembre
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Leaderboard Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg lg:text-xl">
                    Clasificación Actual
                  </CardTitle>
                  <CardDescription>
                    Puntuación de todos los miembros del grupo
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-y-scroll max-h-[35vh]">
                  <div className="space-y-3 lg:space-y-4">
                    {group.members &&
                      Object.entries(group.members).map(
                        ([playerUid, playerData], index) => {
                          if (!currentUser) return null;
                          return (
                            <LeaderBoardCard
                              key={index}
                              index={index + 1}
                              currentUser={currentUser}
                              onClick={handleViewMemberList}
                              playerUid={playerUid}
                              playerData={playerData}
                            />
                          );
                        }
                      )}

                    {/* Total Points */}
                    {group.members && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold flex-shrink-0">
                            Σ
                          </div>
                          <span className="text-sm lg:text-base font-semibold truncate">
                            Total
                          </span>
                        </div>
                        <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="font-semibold text-sm lg:text-base">
                              {Object.values(group.members || {}).reduce(
                                (sum, member) =>
                                  sum + ((member.list?.points || 0) || 0),
                                0
                              )}{" "}
                              pts
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg lg:text-xl">
                    Actividad Reciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm max-h-80 overflow-y-auto">
                    {(group?.activity_logs || [])
                      .slice()
                      .reverse()
                      .map((log, index) => (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-border gap-1 last:border-b-0"
                        >
                          <span>{log.message}</span>
                          <span className="text-muted-foreground text-xs sm:text-sm">
                            {timeAgo(new Date(log.created_at || log.timestamp || ''))}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      </div>

      {/* Group Management Modal */}
      {isAdmin && group && (
        <GroupManagementModal
          isOpen={showGroupManagement}
          onClose={() => setShowGroupManagement(false)}
          group={group}
          reloadGroupData={fetchGroupData}
        />
      )}

      {/* Member List Modal */}
      <Dialog open={showMemberListModal} onOpenChange={setShowMemberListModal}>
        <DialogContent className="max-w-md mx-auto max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg lg:text-xl">
              Lista de {selectedMemberList?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedMemberList?.list.length === 0
                ? "Este miembro aún no ha enviado su lista"
                : `${selectedMemberList?.list.length} personas en la lista`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {selectedMemberList?.list.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <EyeOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No hay lista disponible</p>
                <p className="text-xs mt-1">
                  Este miembro aún no ha enviado su lista
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedMemberList?.list.map((person, index) => (
                  <div
                    key={person.wikidata_id || index}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {person.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        <span className="capitalize">{person.snippet} • </span>
                        {person.age !== null
                          ? `${person.age} años`
                          : "Edad desconocida"}{" "}
                        •{" "}
                        {person.status === "deceased"
                          ? "Fallecido/a"
                          : "Vivo/a"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setShowMemberListModal(false)}
              className="w-full"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Estás seguro de que quieres salir?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Perderás tu lista de famosos y tu posición en la clasificación de
              &quot;{group.name}&quot;. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleLeaveGroup();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isLeaving}
            >
              {isLeaving ? "Saliendo..." : "Sí, abandonar grupo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
