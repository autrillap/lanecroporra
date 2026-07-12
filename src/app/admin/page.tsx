"use client";

import { AdminGroupsTable } from "@/components/admin/tables/groups-table";
import { AdminUsersTable } from "@/components/admin/tables/users-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllGroups } from "@/lib/firestore/groups";
import { reviewAllRecords } from "@/lib/firestore/review-record";
import { getAllUsers, getUserById } from "@/lib/firestore/users";
import { GroupDoc } from "@/models/Group";
import { UserDoc } from "@/models/User";
import { useAuth } from "@/providers/auth-provider";
import {
  AlertTriangle,
  CheckCircle,
  Layers,
  Lock,
  Play,
  RefreshCw,
  Search,
  Shield,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

function AdminContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeceaseDialog, setShowDeceaseDialog] = useState(false);
  const [showCloseAllDialog, setShowCloseAllDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("groups");

  const handleSetSelectedTab = (newTab: string) => {
    setSearchTerm("");
    setSelectedTab(newTab);
  };

  const handleChangeSelectedTabAndSearch = (
    newSearch: string,
    newTab: string
  ) => {
    setSearchTerm(newSearch);
    setSelectedTab(newTab);
  };

  const { currentUser, loading } = useAuth();
  const [user, setUser] = useState<UserDoc | undefined | null>(undefined);

  useEffect(() => {
    if (currentUser && !loading) {
      const fetchUser = async () => {
        const userData = await getUserById(currentUser.uid);
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

  const isAdmin = user?.role === "admin" || user?.role === "creator";

  // All data
  const [allUsers, setAllUsers] = useState<UserDoc[] | undefined | null>(
    undefined
  );
  const [allGroups, setAllGroups] = useState<GroupDoc[] | undefined | null>(
    undefined
  );

  // Fetch all data
  useEffect(() => {
    if (!user || !isAdmin) return;
    const fetchAllUsers = async () => {
      try {
        const result = await getAllUsers();
        setAllUsers(result);
      } catch (error) {
        console.error(error);
        setAllUsers(null);
      }
    };
    const fetchAllGroups = async () => {
      try {
        const result = await getAllGroups();
        setAllGroups(result);
      } catch (error) {
        console.error(error);
        setAllGroups(null);
      }
    };
    fetchAllUsers();
    fetchAllGroups();
  }, [user, isAdmin]);

  if (loading || user === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Verificando credenciales...
        </p>
      </div>
    );
  }

  if (!isAdmin || user === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="max-w-md w-full border-red-200 dark:border-red-900">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-950">
                <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">
              Acceso Denegado
            </CardTitle>
            <CardDescription className="text-center">
              No tienes los permisos necesarios para acceder al Panel de
              Administración.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            Esta sección es exclusiva para administradores de la Necroporra. Si
            crees que esto es un error, contacta con soporte.
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full gap-2">
                <Layers className="h-4 w-4" />
                Volver al Dashboard
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleRunDeceaseCheck = async () => {
    setIsProcessing(true);
    await reviewAllRecords();
    setIsProcessing(false);
    setShowDeceaseDialog(false);
  };

  const handleCloseAllLists = () => {
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      setShowCloseAllDialog(false);
      alert("Todas las listas han sido cerradas correctamente.");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background">
      {/* Sticky Header Responsive */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-30">
        <div className="w-[90vw] mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 shrink-0" />
              <div className="truncate">
                <h1 className="text-lg sm:text-xl font-bold truncate">
                  Admin Panel
                </h1>
                <p className="hidden xs:block text-[10px] sm:text-xs text-muted-foreground">
                  Necroporra 2025
                </p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs sm:text-sm h-8 sm:h-10"
              >
                Salir
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="w-[90vw] mx-auto px-4 py-6 space-y-6 ">
        {/* Actions Grid - 1 col on mobile, 2 on tablet+ */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-red-100 dark:border-red-900/50 hover:shadow-md transition-shadow gap-0">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-red-500" />
                Ejecutar algoritmo de detección
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="text-xs text-muted-foreground mb-4">
                Revisa todas las listas y detecta fallecimientos de los famosos
              </p>
              <Button
                onClick={() => setShowDeceaseDialog(true)}
                variant="outline"
                className="w-full text-xs sm:text-sm hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                Ejecutar Algoritmo
              </Button>
            </CardContent>
          </Card>

          <Card className="border-amber-100 dark:border-amber-900/50 hover:shadow-md transition-shadow gap-0">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" />
                Cerrar todas las listas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="text-xs text-muted-foreground mb-4">
                Finaliza el período de edición para todas las listas en
                &apos;draft&apos;.
              </p>
              <Button
                onClick={() => setShowCloseAllDialog(true)}
                variant="outline"
                className="w-full text-xs sm:text-sm hover:bg-amber-50 dark:hover:bg-amber-950/20"
              >
                Cerrar Todas
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Data Management Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight px-1 capitalize">
                {selectedTab === "groups" ? "Grupos" : "Usuarios"}
              </h2>
              <div className="relative w-full sm:w-72 lg:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                <Input
                  placeholder={`Buscar ${selectedTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  // Añadimos pr-9 para que el texto no se solape con el botón de borrar
                  className="pl-9 pr-9 h-9 sm:h-10 text-sm bg-card"
                />

                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    type="button"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <Badge
              variant="outline"
              className="w-fit self-start sm:self-auto bg-card px-3 py-1"
            >
              {selectedTab === "groups" ? allGroups?.length : allUsers?.length}{" "}
              Total
            </Badge>
          </div>

          <Tabs
            value={selectedTab}
            onValueChange={handleSetSelectedTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-muted/50">
              <TabsTrigger value="groups" className="text-xs sm:text-sm gap-2">
                <Layers className="h-3.5 w-3.5" /> Grupos
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm gap-2">
                <Users className="h-3.5 w-3.5" /> Usuarios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="groups" className="mt-4 outline-none">
              <AdminGroupsTable searchTerm={searchTerm} allGroups={allGroups} />
            </TabsContent>

            <TabsContent value="users" className="mt-4 outline-none">
              <AdminUsersTable
                searchTerm={searchTerm}
                allUsers={allUsers}
                handleChangeSelectedTabAndSearch={
                  handleChangeSelectedTabAndSearch
                }
              />
            </TabsContent>
          </Tabs>
        </section>
      </main>

      {/* Decease Check Dialog */}
      <Dialog open={showDeceaseDialog} onOpenChange={setShowDeceaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-red-500" />
              Ejecutar Algoritmo de Detección
            </DialogTitle>
            <DialogDescription>
              Esta acción revisará todas las listas activas y detectará
              fallecimientos de famosos en el sistema. El proceso puede tardar
              varios minutos.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Revisar bases de datos de noticias</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Validar fechas de fallecimiento</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Actualizar puntuaciones de usuarios</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Enviar notificaciones</span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeceaseDialog(false)}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRunDeceaseCheck}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Ejecutar Ahora
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close All Lists Dialog */}
      <Dialog open={showCloseAllDialog} onOpenChange={setShowCloseAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Cerrar Todas las Listas
            </DialogTitle>
            <DialogDescription>
              Esta acción cerrará todas las listas activas inmediatamente. Los
              usuarios no podrán modificar sus listas después de esto.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-semibold mb-1">
                    Esta acción no se puede deshacer
                  </p>
                  <p>
                    {
                      'Todas las listas en estado "activo" pasarán a estado "cerrado".'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCloseAllDialog(false)}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCloseAllLists}
              //   disabled={isProcessing}
              disabled
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Cerrando...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Cerrar Todas
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminContent />
    </Suspense>
  );
}
