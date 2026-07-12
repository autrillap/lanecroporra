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
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { closeGroupLists } from "@/lib/db/groups";
import { GroupDoc } from "@/models/Group";
import {
  Activity,
  AlertCircle,
  ArrowUpDown,
  Calendar,
  Eye,
  ListChecks,
  Lock,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FilterHeader } from "./filter-header";

type SortKey = "name" | "members" | "deadline" | "created_at";

export const AdminGroupsTable = ({
  searchTerm,
  allGroups,
}: {
  searchTerm: string;
  allGroups: GroupDoc[] | undefined | null;
}) => {
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "asc" | "desc";
  }>({
    key: "name",
    direction: "asc",
  });

  const [groupToClose, setGroupToClose] = useState<GroupDoc | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupDoc | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  if (!allGroups) return null;

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };
  const toggleFilter = (
    current: string[],
    value: string,
    setter: (val: string[]) => void
  ) => {
    setter(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    );
  };

  const filteredGroups = [...(allGroups || [])].filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.includes(searchTerm);

    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(u.status);

    return matchesSearch && matchesStatus;
  });

  const sortedGroups = [...(filteredGroups || [])].sort((a, b) => {
    const { key, direction } = sortConfig;
    let comparison = 0;

    if (key === "members") {
      comparison =
        Object.keys(a.members || {}).length -
        Object.keys(b.members || {}).length;
    } else if (key === "deadline" || key === "created_at") {
      comparison = (new Date(a[key] as string || 0).getTime()) - (new Date(b[key] as string || 0).getTime());
    } else {
      const aVal = String(a[key as keyof typeof a] || "");
      const bVal = String(b[key as keyof typeof b] || "");
      comparison = aVal.localeCompare(bVal, "es", {
        sensitivity: "base",
        numeric: true,
      });
    }
    return direction === "asc" ? comparison : -comparison;
  });

  const handleCloseGroupStatus = async () => {
    if (!groupToClose) return;
    setIsUpdating(true);
    try {
      const result = await closeGroupLists(groupToClose.id);
      if (result === true) toast.success("Listas cerradas, buena suerte!");
    } catch (error) {
      console.error("Error closing group:", error);
      toast.error("Error cerrando las listas");
    } finally {
      setIsUpdating(false);
      setGroupToClose(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle>Gestión de Grupos</CardTitle>
          <CardDescription>
            {sortedGroups.length} grupos en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <TooltipProvider delayDuration={300}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("name")}
                        className="p-0 font-bold"
                      >
                        Nombre <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell text-center">
                      <div className="w-full flex justify-center">
                        <FilterHeader
                          label="Estado"
                          options={["draft", "activo", "finalizado"]}
                          current={statusFilter}
                          setter={setStatusFilter}
                          toggleFilter={toggleFilter}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("members")}
                        className="p-0 font-bold"
                      >
                        Miembros <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("deadline")}
                        className="p-0 font-bold"
                      >
                        Límite <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("created_at")}
                        className="p-0 font-bold"
                      >
                        Creación <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell text-right">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGroups.map((group) => (
                    <TableRow
                      key={group.id}
                      className="group hover:bg-muted/50"
                    >
                      <TableCell className="font-medium max-w-[150px] truncate">
                        {group.name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center">
                        <Badge
                          variant={
                            group.status === "activo" ? "default" : "outline"
                          }
                          className="capitalize"
                        >
                          {group.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center">
                        <Badge variant="secondary">
                          {Object.keys(group.members || {}).length}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs italic text-center">
                        {formatDate(new Date(group.deadline))}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs italic text-center">
                        {formatDate(new Date(group.created_at))}
                      </TableCell>
                      <TableCell className="text-right px-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-500"
                            onClick={() => setSelectedGroup(group)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600"
                            disabled={group.status === "activo"}
                            onClick={() => setGroupToClose(group)}
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hidden sm:inline-flex"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
      {selectedGroup && (
        <Dialog
          open={!!selectedGroup}
          onOpenChange={(open) => !open && setSelectedGroup(null)}
        >
          <DialogContent className="max-h-[90vh] flex flex-col p-0 overflow-auto">
            <div className="p-6 pb-2 border-b">
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className="text-2xl font-bold">
                      {selectedGroup.name}
                    </DialogTitle>
                    <DialogDescription className="font-mono text-[10px]">
                      ID: {selectedGroup.id}
                    </DialogDescription>
                  </div>
                  <Badge
                    variant={
                      selectedGroup.status === "activo"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedGroup.status}
                  </Badge>
                </div>
              </DialogHeader>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Info General */}
                <div className="md:col-span-2 space-y-6">
                  <section>
                    <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4" /> Descripción
                    </h4>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border">
                      {selectedGroup.description ||
                        "Sin descripción disponible."}
                    </p>
                  </section>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                        Creador (UID)
                      </p>
                      <p className="text-xs font-mono truncate">
                        {selectedGroup.creator_id}
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                        Fecha Límite
                      </p>
                      <p className="text-sm flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3" />{" "}
                        {formatDate(new Date(selectedGroup.deadline))}
                      </p>
                    </div>
                  </div>

                  <section>
                    <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
                      <ListChecks className="w-4 h-4" /> Miembros (
                      {Object.keys(selectedGroup.members || {}).length})
                    </h4>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="h-8 text-[10px]">
                              Usuario ID
                            </TableHead>
                            <TableHead className="h-8 text-[10px]">
                              Rol
                            </TableHead>
                            <TableHead className="h-8 text-[10px] text-right">
                              Unión
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(selectedGroup.members || {}).map(
                            ([uid, m]) => (
                              <TableRow key={uid} className="text-xs">
                                <TableCell className="font-mono py-2">
                                  {uid.substring(0, 12)}...
                                </TableCell>
                                <TableCell className="py-2">
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] uppercase"
                                  >
                                    {m.role}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2 text-right text-muted-foreground">
                                  {formatDate(new Date(m.joined_at))}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </section>
                </div>

                {/* Sidebar Info (Settings & Activity) */}
                <div className="space-y-6">
                  <section className="bg-muted/20 p-4 rounded-xl border border-border/50">
                    <h4 className="text-sm font-bold flex items-center gap-2 mb-4 text-primary">
                      <Settings className="w-4 h-4" /> Ajustes
                    </h4>
                    <div className="space-y-3">
                      {Object.entries({ max_bets: selectedGroup.max_bets }).map(
                        ([key, val]) => (
                          <div
                            key={key}
                            className="flex justify-between items-center border-b border-dashed pb-1"
                          >
                            <span className="text-[11px] text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, " $1")}
                            </span>
                            <span className="text-xs font-bold">
                              {String(val)}
                            </span>
                          </div>
                        )
                      )}
                      <div className="pt-2">
                        <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase">
                          Link de Invitación
                        </p>
                        <p className="text-[10px] bg-background p-2 rounded border truncate font-mono text-blue-500">
                          {selectedGroup.invite_link || "No generado"}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4" /> Registro de Actividad
                    </h4>
                    <div className="space-y-3 border-l-2 ml-2 pl-4">
                      {selectedGroup.activity_logs
                        ?.slice(-5)
                        .reverse()
                        .map((log, i) => (
                          <div key={i} className="relative space-y-1">
                            <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-primary" />
                            <p className="text-[11px] leading-tight font-medium">
                              {log.message}
                            </p>
                            <p className="text-[9px] text-muted-foreground italic">
                              {formatDate(
                                new Date(log.created_at || new Date())
                              )}
                            </p>
                          </div>
                        ))}
                    </div>
                  </section>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
      <AlertDialog
        open={!!groupToClose}
        onOpenChange={(open) => !open && setGroupToClose(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              ¿Confirmar cierre de &quot;{groupToClose?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-foreground">
              {groupToClose && new Date(groupToClose.deadline).getTime() > Date.now() ? (
                <span className="font-bold text-red-600 dark:text-red-400">
                  ¡ATENCIÓN!: La fecha límite aún no ha pasado (
                  {formatDate(new Date(groupToClose.deadline))}). Si cierras el grupo
                  ahora, los usuarios ya NO podrán editar sus listas antes de
                  tiempo.
                </span>
              ) : (
                "La fecha límite ya ha pasado o es hoy. Al activar el grupo, las listas quedarán bloqueadas para empezar el juego."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCloseGroupStatus();
              }}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={isUpdating}
            >
              {isUpdating ? "Procesando..." : "Sí, cerrar listas"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
