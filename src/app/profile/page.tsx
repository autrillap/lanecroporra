"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { getUserById, getUserStats } from "@/lib/db/users";
import { UserDoc, UserStats } from "@/models/User";
import { useAuth } from "@/providers/auth-provider";
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();
  const [user, setUser] = useState<UserDoc | undefined | null>(undefined);
  const [userStats, setUserStats] = useState<UserStats | undefined | null>(
    undefined
  );

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/login");
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    if (currentUser && !loading) {
      const fetchUser = async () => {
        try {
          const userData = await getUserById(currentUser.id);
          if (!userData) {
            setUser(null);
            return;
          }
          setUser(userData);
          const stats = await getUserStats(userData.id);
          setUserStats(stats || null);
        } catch (error) {
          console.error("Error fetching profile:", error);
          setUser(null);
        }
      };
      fetchUser();
    }
  }, [currentUser, loading]);

  if (loading || (currentUser && user === undefined)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Cargando perfil...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser || !user) return;

  return (
    <div className="min-h-screen max-w-screen bg-slate-50/50 dark:bg-background pb-12">
      {/* Header Sticky */}
      <div className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Mi Perfil</h1>
                <p className="hidden sm:block text-xs text-muted-foreground">
                  Gestiona tu identidad y revisa tus logros
                </p>
              </div>
            </div>
            {user.role === "admin" && (
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                <ShieldCheck className="w-3 h-3 mr-1" /> Admin
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-6 sm:py-8 max-w-screen lg:max-w-6xl">
        <div className="w-full grid gap-6 lg:grid-cols-12">
          {/* Sidebar: Profile Info (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-lg flex flex-col max-w-full">
              <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-background" />
              <CardHeader className="relative pt-0 flex flex-col items-center text-center">
                <div className="-mt-12 mb-4">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                    <AvatarImage
                      src={user.avatar_url}
                      alt={user.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                      {user.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">
                  {user.name}
                </CardTitle>
                <CardDescription className="text-sm font-medium">
                  {user.email}
                </CardDescription>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-muted/50 text-[10px] uppercase tracking-wider py-1"
                  >
                    <Calendar className="w-3 h-3 mr-1" /> Desde{" "}
                    {new Intl.DateTimeFormat("es-ES", {
                      month: "short",
                      year: "numeric",
                    }).format(new Date(user.created_at))}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase tracking-wider py-1"
                  >
                    {user.tier || "Free Member"}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Quick Actions (Desktop Only) */}
            <Card className="hidden lg:block border-muted/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Configuración
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs font-semibold h-9"
                  disabled
                >
                  Editar Perfil
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs font-semibold h-9"
                  disabled
                >
                  Privacidad
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-xs font-semibold h-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    router.push("/login");
                  }}
                >
                  Cerrar Sesión
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content: Stats and Activity (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              {[
                {
                  label: "Victorias",
                  val: userStats?.victories,
                  icon: Trophy,
                  color:
                    "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500",
                },
                {
                  label: "En Curso",
                  val: userStats?.games?.active,
                  icon: Target,
                  color:
                    "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500",
                },
                {
                  label: "Finalizadas",
                  val: userStats?.games?.finished,
                  icon: CheckCircle2,
                  color:
                    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                },
                {
                  label: "Puntos",
                  val: userStats?.totalPoints,
                  icon: Zap,
                  color:
                    "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500",
                },
              ].map((stat, i) => (
                <Card
                  key={i}
                  className="border-none shadow-md hover:shadow-lg transition-shadow bg-card/50"
                >
                  <CardContent className="p-4 sm:p-6 text-center space-y-2">
                    <div
                      className={`mx-auto p-2.5 rounded-xl w-fit ${stat.color}`}
                    >
                      <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-black tracking-tighter">
                        {userStats === undefined ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        ) : (
                          (stat.val || 0).toLocaleString()
                        )}
                      </p>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest leading-none mt-1">
                        {stat.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Achievements Section */}
            <Card className="border-muted/60">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" /> Logros
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Tu progreso en la competición
                    </CardDescription>
                  </div>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* {mockData.achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                        achievement.earned
                          ? "bg-primary/[0.03] border-primary/20"
                          : "bg-muted/10 border-transparent opacity-60 grayscale"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          achievement.earned
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <achievement.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">
                          {achievement.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-none mt-1">
                          {achievement.description}
                        </p>
                      </div>
                      {achievement.earned && (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                  ))} */}
                  Los logros no están implementados todavía
                </div>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            {/* <Card className="border-muted/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" /> Historial
                  Reciente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y border-t">
                  {mockData.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group"
                    >
                      <div
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          activity.type === "win"
                            ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                            : activity.type === "hit"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                          {activity.action}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {activity.date}
                        </p>
                      </div>
                      {activity.points > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 dark:bg-green-950/20 text-green-600 border-green-200 ml-auto h-6"
                        >
                          +{activity.points} pts
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  ))}
                </div>
              </CardContent>
              <div className="p-3 bg-muted/20 text-center border-t">
                <Button
                  variant="link"
                  className="text-xs font-bold h-auto p-0 text-muted-foreground"
                >
                  Ver todo el historial
                </Button>
              </div>
            </Card> */}
          </div>
        </div>
      </div>
    </div>
  );
}
