"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { getGroupById, updateList } from "@/lib/db/groups";
import { BetDoc } from "@/models/Bet";
import { GroupDoc } from "@/models/Group";
import { ListDoc } from "@/models/List";
import { useAuth } from "@/providers/auth-provider";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Info,
  Loader2,
  Lock,
  Plus,
  Save,
  Search,
  Timer,
  Trash2,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

type WikiSuggestion = {
  id: string;
  name: string;
  snippet: string;
  wikidata_id: string;
  isAlive: boolean;
  age: number | null;
};

export default function EditListPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const [groupId, setGroupId] = useState<string | null>(null);

  const { currentUser, loading } = useAuth();
  const [groupData, setGroupData] = useState<GroupDoc | undefined | null>(
    undefined
  );
  const [currentList, setCurrentList] = useState<ListDoc>({
    bets: [],
    points: 0,
  });

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0 });
  const [hasChanges, setHasChanges] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    WikiSuggestion[]
  >([]);

  useEffect(() => {
    const initPage = async () => {
      const { groupId } = await params;
      if (!groupId) {
        redirect("/dashboard");
      }
      setGroupId(groupId);
    };
    initPage();
  }, [params]);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId) return;
      setGroupData(undefined);
      const data = await getGroupById(groupId, currentUser?.id);
      if (data) {
        setGroupData(data);
        if (currentUser?.id && data.members![currentUser?.id].list) {
          setCurrentList(data.members![currentUser?.id].list!);
        }
        return;
      }
      setGroupData(null);
    };
    fetchGroupData();
  }, [groupId, currentUser]);

  useEffect(() => {
    const updateTimeLeft = () => {
      if (!groupData) return;
      const now = new Date();
      const diff = new Date(groupData.deadline).getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );

      setTimeLeft({ days, hours });
    };

    updateTimeLeft();
  }, [groupData]);

  useEffect(() => {
    const fetchPeople = async () => {
      if (!debouncedSearch) {
        setFilteredSuggestions([]);
        return;
      }

      try {
        // Step 1: Search Wikidata
        const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
          debouncedSearch
        )}&language=es&format=json&origin=*&type=item`;

        const res = await fetch(searchUrl);
        const data = await res.json();

        // Step 2: For each result, fetch details to confirm it's a human
        const humanResults = await Promise.all(
          data.search.map(
            async (item: {
              id: string;
              label: string;
              description: string;
            }) => {
              try {
                const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${item.id}.json`;
                const entityRes = await fetch(entityUrl);
                const entityData = await entityRes.json();

                const entity = entityData.entities[item.id];

                const label =
                  entity.labels?.es?.value ||
                  entity.labels?.en?.value ||
                  item.label;
                const description =
                  entity.descriptions?.es?.value ||
                  entity.descriptions?.en?.value ||
                  item.description ||
                  "Persona";
                const claims = entity?.claims ?? {};

                // Check "instance of" human
                const isHuman = (claims.P31 || []).some(
                  (c: { mainsnak: { datavalue: { value: { id: string } } } }) =>
                    c.mainsnak.datavalue?.value?.id === "Q5"
                );
                if (!isHuman) return null;

                // Extract birth & death dates
                const birthClaim =
                  claims.P569?.[0]?.mainsnak?.datavalue?.value?.time;
                const deathClaim =
                  claims.P570?.[0]?.mainsnak?.datavalue?.value?.time;

                const birthDate = birthClaim
                  ? new Date(birthClaim.replace("+", ""))
                  : null;
                const deathDate = deathClaim
                  ? new Date(deathClaim.replace("+", ""))
                  : null;

                let age: number | null = null;
                let isAlive = true;

                if (birthDate) {
                  const endDate = deathDate || new Date();
                  age =
                    endDate.getFullYear() -
                    birthDate.getFullYear() -
                    (endDate <
                    new Date(
                      endDate.getFullYear(),
                      birthDate.getMonth(),
                      birthDate.getDate()
                    )
                      ? 1
                      : 0);
                }

                if (deathDate) {
                  isAlive = false;
                }

                return {
                  id: item.id,
                  name: label,
                  snippet: description || "Person",
                  wikidata_id: item.id,
                  isAlive,
                  age,
                };
              } catch (err) {
                console.warn("Failed to load entity", item.id, err);
                return null;
              }
            }
          )
        );

        setFilteredSuggestions(humanResults.filter(Boolean));
      } catch (err) {
        console.error("Wikidata search error", err);
      }
    };

    fetchPeople();
  }, [debouncedSearch]);

  const addBetToList = (newBet: BetDoc) => {
    setCurrentList((prev) => {
      if (Object.keys(prev.bets).length >= groupData!.max_bets)
        return prev;
      if (prev.bets.some((bet) => bet.wikidata_id === newBet.wikidata_id))
        return prev;

      return { ...prev, bets: [...prev.bets, newBet] };
    });
    setHasChanges(true);
  };

  const removeBetFromList = (index: number) => {
    setCurrentList((prev) => {
      return { ...prev, bets: prev.bets.filter((_, i) => i !== index) };
    });
    setHasChanges(true);
  };

  const saveList = async () => {
    await updateList(groupId!, currentUser!.id, currentList);
    setHasChanges(false);
    redirect("/dashboard/" + groupId);
  };

  const isExpired = timeLeft.days <= 0 && timeLeft.hours <= 0;
  const isGroupActive = groupData?.status === "activo";
  const isReadOnly = isGroupActive;
  const isProrroga = isExpired && !isGroupActive;

  if (groupData === undefined || loading) {
    return (
      <div className="flex flex-1 w-full items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (groupData === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Grupo no encontrado</h1>
          <Button onClick={() => redirect("/dashboard")}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (
    !(
      currentUser &&
      groupData.members &&
      Object.keys(groupData.members!).includes(currentUser.id)
    )
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">
            No tienes permiso para editar esta lista.
          </p>
          <Button onClick={() => redirect("/dashboard")}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-[dvh] bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border container mx-auto md:px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => redirect(`/dashboard/${groupId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">
              {groupData.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isReadOnly ? "Consultando mi lista" : "Editando mi lista"}
            </p>
          </div>
        </div>

        <div className="flex flex-col ms:px-0 px-4 sm:flex-row sm:items-center gap-3 sm:gap-4">
          {!isReadOnly && (
            <Button
              onClick={saveList}
              disabled={!hasChanges}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              Guardar Lista
            </Button>
          )}
          {isReadOnly && (
            <Badge
              variant="outline"
              className="text-green-600 border-green-200 bg-green-50 gap-1 py-1"
            >
              <Lock className="w-3 h-3" /> Lista Validada
            </Badge>
          )}
        </div>
      </div>

      <div className="md:container mx-auto h-auto px-4 py-6">
        {/* Current List */}
        <div
          className={`grid grid-cols-1 ${
            isReadOnly ? "max-w-2xl mx-auto" : "lg:grid-cols-2"
          } lg:grid-cols-2 h-full gap-6`}
        >
          <div className="space-y-4">
            <Card className={isReadOnly ? "border-green-100 shadow-sm" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Mi Selección</span>
                  <Badge
                    variant={
                      currentList.bets.length === groupData!.max_bets
                        ? "default"
                        : "secondary"
                    }
                  >
                    {currentList.bets.length} / {groupData!.max_bets}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {isReadOnly
                    ? "El período de edición ha finalizado. Esta es tu lista oficial para el año."
                    : `Añade hasta ${groupData!.max_bets} famosos.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentList.bets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground italic">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No seleccionaste a nadie.</p>
                  </div>
                ) : (
                  <div className="h-[50vh] flex overflow-y-auto">
                    <div className="space-y-3 w-full">
                      {currentList.bets.map((bet, index) => (
                        <div
                          key={index}
                          className="flex w-full items-center justify-between p-4 rounded-xl border bg-card transition-all"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <span className="text-sm font-black text-muted-foreground/50 w-4">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold truncate">{bet.name}</p>
                              <p className="text-xs text-muted-foreground truncate capitalize">
                                {bet.snippet} • {bet.age} años
                              </p>
                            </div>
                          </div>
                          {!isReadOnly && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBetFromList(index)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deadline Warning */}
            {isGroupActive ? (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-300 font-medium">
                  <strong>Juego en curso:</strong> Las listas están selladas y
                  los puntos se están contabilizando. ¡Buena suerte!
                </AlertDescription>
              </Alert>
            ) : isProrroga ? (
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <Timer className="h-4 w-4 text-amber-600 animate-pulse" />
                <AlertDescription className="text-amber-800 dark:text-amber-300">
                  <strong>Período de Prórroga:</strong> El tiempo oficial ha
                  terminado, pero el administrador aún no ha cerrado el grupo.
                  ¡Aprovecha para guardar tus cambios ahora!
                </AlertDescription>
              </Alert>
            ) : isExpired ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  La fecha límite ha pasado. No se permiten más modificaciones.
                </AlertDescription>
              </Alert>
            ) : (
              timeLeft.days <= 7 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    Quedan menos de {timeLeft.days} días. Asegúrate de completar
                    tu lista antes del cierre.
                  </AlertDescription>
                </Alert>
              )
            )}
          </div>

          {/* Search and Add People */}
          {!isReadOnly && (
            <div className="h-full">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">Buscador de Famosos</CardTitle>
                  <CardDescription>
                    Solo se permiten personas vivas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Ej: Julio Iglesias, Clint Eastwood..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredSuggestions.length > 0 ? (
                      <div className="space-y-2">
                        {filteredSuggestions.map((person) => {
                          const isInList = currentList.bets.some(
                            (b) => b.wikidata_id === person.wikidata_id
                          );
                          const canAdd =
                            person.isAlive &&
                            currentList.bets.length <
                              groupData!.max_bets &&
                            !isInList;

                          return (
                            <div
                              key={person.id}
                              onClick={() =>
                                canAdd &&
                                addBetToList({
                                  ...person,
                                  status: "alive",
                                  type: "default",
                                } as unknown as BetDoc)
                              }
                              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                isInList
                                  ? "bg-green-50 border-green-200 opacity-60"
                                  : canAdd
                                  ? "hover:border-primary hover:bg-muted/50 cursor-pointer"
                                  : "opacity-40 grayscale pointer-events-none"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm truncate">
                                  {person.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate uppercase tracking-wider font-medium">
                                  {person.snippet} • {person.age ?? "??"} años
                                </p>
                              </div>
                              {isInList ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <Plus className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      searchTerm && (
                        <div className="text-center py-10 text-muted-foreground">
                          <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">
                            No se encontraron resultados para &quot;{searchTerm}
                            &quot;
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
