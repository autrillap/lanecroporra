/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserDoc, UserStats } from "@/models/User";
import { createClient } from "@/lib/supabase/client";

export async function getAllUsers(): Promise<UserDoc[] | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users: ", error);
    return null;
  }
  return data as UserDoc[];
}

export async function getUserById(id: string): Promise<UserDoc | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as UserDoc;
}

export async function ensureUserDoc(user: { id: string; email?: string; user_metadata?: Record<string, any> }): Promise<UserDoc | null> {
  const existing = await getUserById(user.id);
  if (existing) return existing;

  const supabase = createClient();
  const newUser = {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario",
    email: user.email,
    avatar_url: user.user_metadata?.avatar_url || "",
  };

  const { data, error } = await supabase
    .from("users")
    .upsert(newUser)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error creating user doc: ", error);
    return null;
  }

  return data as UserDoc;
}

export async function resolveUserId(id: string): Promise<string | null> {
  const user = await getUserById(id);
  return user ? user.name : null;
}

export async function removeGroupFromUser(userId: string, groupId: string) {
  const supabase = createClient();
  await supabase
    .from("group_members")
    .delete()
    .match({ user_id: userId, group_id: groupId });
}

export async function getUserStats(userId: string): Promise<UserStats | null> {
  const supabase = createClient();
  
  const { data: memberData, error } = await supabase
    .from("group_members")
    .select("points, groups(status)")
    .eq("user_id", userId);

  if (error || !memberData) return null;

  let totalPoints = 0;
  let activeGroups = 0;
  let finishedGroups = 0;

  memberData.forEach((row: any) => {
    totalPoints += row.points || 0;
    if (row.groups?.status === "activo" || row.groups?.status === "draft") {
      activeGroups++;
    }
    if (row.groups?.status === "finalizado") {
      finishedGroups++;
    }
  });

  return {
    totalPoints,
    victories: 0,
    games: { active: activeGroups, finished: finishedGroups },
  };
}
