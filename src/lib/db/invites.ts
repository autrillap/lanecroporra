import { createClient } from "@/lib/supabase/client";
import { getGroupById } from "./groups";

export async function getInviteByToken(token: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !data) return null;
  return data;
}

export async function createInvite(groupId: string, userId: string) {
  const supabase = createClient();
  const token = crypto.randomUUID(); 
  
  const { data, error } = await supabase
    .from("invites")
    .insert({
      group_id: groupId,
      token,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating invite", error);
    throw error;
  }
  
  return data;
}

export async function markInviteAsUsed(tokenId: string) {
  const supabase = createClient();
  await supabase
    .from("invites")
    .update({ used: true })
    .eq("id", tokenId);
}

// Wrappers for UI compatibility
export async function resolveInviteGroup(tokenId: string) {
  const invite = await getInviteByToken(tokenId);
  if (!invite) return null;
  const group = await getGroupById(invite.group_id);
  return group || null;
}

export async function safeResolveInviteGroup(tokenId: string) {
  try {
    return await resolveInviteGroup(tokenId);
  } catch {
    return null;
  }
}

export async function generateInvite(groupId: string, userId: string) {
  const invite = await createInvite(groupId, userId);
  return invite.token;
}

export async function resolveInvite(tokenId: string) {
  return await getInviteByToken(tokenId);
}
