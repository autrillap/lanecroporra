"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Asumiendo que tienes estos componentes
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getGroupById } from "@/lib/db/groups";
import { ensureUserDoc, removeGroupFromUser } from "@/lib/db/users";
import { GroupDoc } from "@/models/Group";
import { UserDoc } from "@/models/User";
import { useAuth } from "@/providers/auth-provider";
import {
  Crown,
  Home,
  Loader2,
  Plus,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface SidebarContextValue {
  toggle: () => void;
  setOpen: () => void;
  setClose: () => void;
  reloadGroups: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  toggle: () => {},
  setOpen: () => {},
  setClose: () => {},
  reloadGroups: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const { currentUser, loading } = useAuth();
  const [userDoc, setUserDoc] = useState<UserDoc | undefined | null>(undefined);
  const [groups, setGroups] = useState<GroupDoc[]>([]);

  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentGroupId = params.groupId as string;

  const fetchData = useCallback(async () => {
    if (!currentUser) {
      setUserDoc(null);
      setGroups([]);
      return;
    }
    const fetchedUserDoc = await ensureUserDoc(currentUser);
    if (!fetchedUserDoc) {
      setUserDoc(null);
      setGroups([]);
      return;
    }
    setUserDoc(fetchedUserDoc);
    const fetchedGroups = await Promise.all(
      (fetchedUserDoc.groups || []).map(async (groupId: string) => {
        const fetchedGroup = await getGroupById(groupId, currentUser.id);
        if (!fetchedGroup || !fetchedGroup?.members) {
          await removeGroupFromUser(currentUser.id, groupId);
          return null;
        }
        return fetchedGroup;
      })
    );
    setGroups(fetchedGroups.filter((g): g is GroupDoc => g !== null));
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setClose = () => setIsOpen(false);
  const setOpen = () => setIsOpen(true);
  const toggle = () => setIsOpen((prev) => !prev);

  if (loading || userDoc === undefined) {
    return (
      <div className="flex h-screen w-full justify-center items-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  // Si no hay usuario, redirigimos (usamos router en useEffect para evitar errores de renderizado)
  if (!currentUser || !userDoc) {
    if (pathname !== "/login") router.push("/login");
    return null;
  }

  const handleGroupSelect = (groupId: string) => {
    router.push(`/dashboard/${groupId}`);
    if (window.innerWidth < 1024) setClose();
  };

  return (
    <SidebarContext.Provider
      value={{ toggle, setOpen, setClose, reloadGroups: fetchData }}
    >
      <div className="flex min-h-screen bg-background relative overflow-hidden">
        {/* Overlay para móviles */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setClose()}
          />
        )}

        {/* Sidebar Principal */}
        <aside
          className={`
            ${isOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 transition-transform duration-300 ease-in-out
            fixed lg:relative z-50 lg:z-auto
            w-80 h-dvh flex flex-col
            border-r border-border bg-card
          `}
        >
          {/* Header del Sidebar */}
          <div className="p-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold">Mis Grupos</h1>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setClose()}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Link
              href="/dashboard/create-group"
              onClick={() => window.innerWidth < 1024 && setClose()}
            >
              <Button size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Grupo
              </Button>
            </Link>
          </div>

          {/* Lista de Grupos (Área Scrolleable) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {groups.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground italic text-sm">
                No te has unido a ningún grupo todavía.
              </div>
            ) : (
              groups.map((group) => {
                const isActive = currentGroupId === group.id;
                const isCreator = group.creator_id === currentUser.id;

                return (
                  <div
                    key={group.id}
                    className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors relative ${
                      isActive ? "bg-muted border-r-4 border-r-primary" : ""
                    }`}
                    onClick={() => handleGroupSelect(group.id)}
                  >
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <h3 className="font-semibold text-sm truncate">
                        {group.name}
                      </h3>
                      {isCreator && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 h-4 bg-primary/5 text-primary border-primary/20 flex gap-0.5 items-center"
                        >
                          <Crown className="w-2.5 h-2.5" />
                          Creador
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">
                      {group.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {Object.keys(group.members || {}).length} miembros
                      </div>
                      <span
                        className={`capitalize font-bold ${
                          group.status === "activo" ? "text-green-500" : ""
                        }`}
                      >
                        {group.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer del Sidebar (Información de Usuario) */}
          <div className="p-4 border-t border-border bg-muted/20 shrink-0">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={userDoc.avatar_url} />
                  <AvatarFallback className="text-xs bg-primary/10">
                    {userDoc.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">
                    {userDoc.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">
                    {userDoc.tier || "Free Tier"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link href="/" className="w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-[11px] h-8"
                  >
                    <Home className="w-3 h-3 mr-1.5" /> Inicio
                  </Button>
                </Link>
                <Link
                  href="/profile"
                  className="w-full"
                  onClick={() => window.innerWidth < 1024 && setClose()}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-[11px] h-8"
                  >
                    <UserIcon className="w-3 h-3 mr-1.5" /> Perfil
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* Área de Contenido Principal */}
        <main className="flex-1 h-dvh overflow-y-auto overflow-x-hidden relative">
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
