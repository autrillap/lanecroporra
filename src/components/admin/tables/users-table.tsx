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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserDoc } from "@/models/User";
import {
  ArrowUpDown,
  Ban,
  Calendar,
  Eye,
  Shield,
  Trash2,
  UserIcon,
} from "lucide-react";
import { useState } from "react";
import { FilterHeader } from "./filter-header";

export const AdminUsersTable = ({
  searchTerm,
  allUsers,
  handleChangeSelectedTabAndSearch,
}: {
  searchTerm: string;
  allUsers?: UserDoc[] | undefined | null;
  handleChangeSelectedTabAndSearch: (newSearch: string, newTab: string) => void;
}) => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof UserDoc | "groupsLength";
    direction: "asc" | "desc";
  }>({
    key: "created_at",
    direction: "desc",
  });

  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [tierFilter, setTierFilter] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDoc | null>(null);

  if (!allUsers) return;

  const handleSort = (key: keyof UserDoc | "groupsLength") => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
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

  const filteredUsers = [...(allUsers || [])].filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(u.status || "");
    const matchesRole =
      roleFilter.length === 0 || roleFilter.includes(u.role || "user");
    const matchesTier =
      tierFilter.length === 0 || tierFilter.includes(u.tier || "free");

    return matchesSearch && matchesStatus && matchesRole && matchesTier;
  });

  const sortedUsers = filteredUsers.sort((a, b) => {
    if (sortConfig.key === "groupsLength") {
      const aVal = a.groups?.length || 0;
      const bVal = b.groups?.length || 0;
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    }
    const aValue = a[sortConfig.key as keyof UserDoc] || "";
    const bValue = b[sortConfig.key as keyof UserDoc] || "";
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortConfig.direction === "asc"
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }
    return sortConfig.direction === "asc"
      ? String(aValue).localeCompare(String(bValue), "es", {
          sensitivity: "base",
          numeric: true,
        })
      : String(bValue).localeCompare(String(aValue), "es", {
          sensitivity: "base",
          numeric: true,
        });
  });

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
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>
            {sortedUsers.length} usuarios encontrados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <TooltipProvider delayDuration={300}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-3/12">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("name")}
                        className="p-0 hover:bg-transparent font-bold"
                      >
                        Usuario <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell w-2/12">
                      Email
                    </TableHead>
                    <TableHead className="hidden lg:table-cell w-1/12">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("groupsLength")}
                        className="hover:bg-transparent p-0 flex items-center gap-1"
                      >
                        Grupos <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>

                    <TableHead className="hidden lg:table-cell w-1/12">
                      <div className="w-full flex justify-center">
                        <FilterHeader
                          label="Estado"
                          options={["active", "banned"]}
                          current={statusFilter}
                          setter={setStatusFilter}
                          toggleFilter={toggleFilter}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="hidden md:table-cell w-1/12 items-center">
                      <div className="w-full flex justify-center">
                        <FilterHeader
                          label="Rol"
                          options={["user", "admin", "creator"]}
                          current={roleFilter}
                          setter={setRoleFilter}
                          toggleFilter={toggleFilter}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="hidden xl:table-cell text-center w-1/12">
                      <div className="w-full flex justify-center">
                        <FilterHeader
                          label="Tier"
                          options={["free", "pro", "premium"]}
                          current={tierFilter}
                          setter={setTierFilter}
                          toggleFilter={toggleFilter}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell w-1/12">
                      <div className="w-full flex justify-center">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("created_at")}
                          className="p-0 hover:bg-transparent font-bold"
                        >
                          Registro <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead className="text-right px-4 w-2/12">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="group hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold truncate max-w-[120px] sm:max-w-none">
                            {user.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground lg:hidden truncate max-w-[120px]">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs font-mono italic">
                        {user.email}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        <Badge variant="outline" className="font-mono">
                          {user.groups?.length || 0}
                        </Badge>
                      </TableCell>

                      <TableCell className="hidden lg:table-cell text-center">
                        <Badge
                          className="capitalize"
                          variant={
                            user.status === "active" ? "default" : "destructive"
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell uppercase tracking-tighter text-[10px] text-center">
                        <Badge
                          variant={
                            user.role === "admin" ? "default" : "outline"
                          }
                          className="h-5"
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-center uppercase text-[10px] font-bold">
                        {user.tier || "free"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground whitespace-nowrap text-center">
                        {formatDate(new Date(user.created_at))}
                      </TableCell>
                      <TableCell className="text-right px-4">
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="h-4 w-4 text-blue-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Detalles completos</TooltipContent>
                          </Tooltip>

                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${
                              user.status === "banned"
                                ? "text-green-500"
                                : "text-amber-500"
                            }`}
                          >
                            <Ban className="h-4 w-4" />
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
      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UserIcon className="h-5 w-5 text-primary" />
              Detalles del Usuario
            </DialogTitle>
            <DialogDescription>ID: {selectedUser?.id}</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">
                    Nombre
                  </p>
                  <p className="text-sm font-semibold">
                    {selectedUser.name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">
                    Email
                  </p>
                  <p className="text-sm font-mono truncate">
                    {selectedUser.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">
                    Rol
                  </p>
                  <Badge className="w-fit capitalize">
                    {selectedUser.role}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">
                    Miembro desde
                  </p>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />{" "}
                    {formatDate(new Date(selectedUser.created_at))}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Grupos Inscritos ({selectedUser.groups?.length || 0})
                </h4>
                <div className="max-h-[200px] overflow-y-auto border rounded-md divide-y custom-scrollbar">
                  {selectedUser.groups && selectedUser.groups.length > 0 ? (
                    selectedUser.groups.map((groupId) => (
                      <div
                        key={groupId}
                        className="p-3 text-xs flex justify-between items-center hover:bg-muted/50 transition-colors"
                      >
                        <span className="font-medium">ID: {groupId}</span>

                        <Badge
                          onClick={() => {
                            handleChangeSelectedTabAndSearch(groupId, "groups");
                          }}
                          variant="secondary"
                          className="text-[10px] cursor-pointer"
                        >
                          Ver Grupo
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-center text-xs text-muted-foreground italic">
                      Este usuario no pertenece a ningún grupo todavía.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
