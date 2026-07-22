"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { actionCreateGroup } from "@/actions/groups";
import { useAuth } from "@/providers/auth-provider";
import { useSidebar } from "@/providers/sidebar-provider";
import { ArrowLeft, ArrowRight, Settings, Users } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function CreateGroup() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [groupData, setGroupData] = useState({
    name: "",
    description: "",
    max_bets: 10,
    deadline: `${new Date().getFullYear()}-12-31`,
  });
  const { reloadGroups } = useSidebar();

  const handleNext = async () => {
    try {
      if (currentStep < 2) {
        setCurrentStep(currentStep + 1);
      } else {
        const { groupId } = await actionCreateGroup({
          name: groupData.name,
          description: groupData.description,
          deadline: new Date(groupData.deadline).toISOString(),
          max_bets: groupData.max_bets,
        });
        reloadGroups();
        router.push(`/dashboard/${groupId}`);
      }
    } catch (error) {
      toast.error(`${error}`);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      redirect("/dashboard");
    }
  };

  const isStep1Valid =
    groupData.name.trim() !== "" && groupData.description.trim() !== "";
  const isStep2Valid = groupData.max_bets > 0 && groupData.deadline !== "";

  return (
    <div className="min-h-screen flex flex-1 bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 w-full sm:w-auto justify-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? "Volver al Dashboard" : "Paso Anterior"}
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep >= 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                1
              </div>
              <span
                className={`text-sm ${
                  currentStep >= 1 ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                Información Básica
              </span>
            </div>

            <div
              className={`h-px flex-1 ${
                currentStep >= 2 ? "bg-primary" : "bg-muted"
              } hidden sm:block`}
            />
            <div
              className={`w-px h-4 ${
                currentStep >= 2 ? "bg-primary" : "bg-muted"
              } sm:hidden mx-4`}
            />

            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep >= 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
              <span
                className={`text-sm ${
                  currentStep >= 2 ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                Configuración
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <CardTitle className="text-lg sm:text-xl">
                  Información del Grupo
                </CardTitle>
              </div>
              <CardDescription className="text-sm sm:text-base">
                Proporciona la información básica para tu nuevo grupo de
                necroporra
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nombre del Grupo *
                </Label>
                <Input
                  id="name"
                  placeholder="Ej: Amigos del Barrio 2024"
                  value={groupData.name}
                  onChange={(e) =>
                    setGroupData({ ...groupData, name: e.target.value })
                  }
                  className="text-base sm:text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Elige un nombre único y memorable para tu grupo
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Descripción *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe tu grupo, las reglas especiales, o cualquier información relevante..."
                  value={groupData.description}
                  onChange={(e) =>
                    setGroupData({ ...groupData, description: e.target.value })
                  }
                  rows={4}
                  className="text-base sm:text-sm resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Esta descripción será visible para todos los miembros del
                  grupo
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleNext}
                  disabled={!isStep1Valid}
                  className="w-full sm:w-auto"
                >
                  Siguiente Paso
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Configuration */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                <CardTitle className="text-lg sm:text-xl">
                  Configuración del Juego
                </CardTitle>
              </div>
              <CardDescription className="text-sm sm:text-base">
                Define las reglas y límites para las apuestas en tu grupo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="max_bets" className="text-sm font-medium">
                  Número máximo de apuestas por persona *
                </Label>
                <Input
                  id="max_bets"
                  type="number"
                  min="1"
                  max="50"
                  value={groupData.max_bets}
                  onChange={(e) =>
                    setGroupData({
                      ...groupData,
                      max_bets: Number.parseInt(e.target.value) || 0,
                    })
                  }
                  className="text-base sm:text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Cada miembro podrá apostar por un máximo de{" "}
                  {groupData.max_bets} famosos
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-sm font-medium">
                  Fecha límite para enviar listas *
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={groupData.deadline}
                  onChange={(e) =>
                    setGroupData({ ...groupData, deadline: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="text-base sm:text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Los miembros tendrán hasta esta fecha para completar sus
                  listas
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-sm sm:text-base">
                  Próximamente:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Restricciones de edad (máx. 2 mayores de 80 años)</li>
                  <li>
                    • Categorías especiales (deportistas, actores, políticos)
                  </li>
                  <li>• Puntuación personalizada por categorías</li>
                  <li>• Reglas de bonificación</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="w-full sm:w-auto order-2 sm:order-1 bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Paso Anterior
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!isStep2Valid}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  Crear Grupo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
