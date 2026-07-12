/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/client";
import { GroupDoc, MemberDoc, UpdateGroupDoc } from "@/models/Group";
import { ListDoc } from "@/models/List";
import { BetDoc } from "@/models/Bet";
import { resolveUserId } from "./users";
import { updateRecord } from "./review-record";

export async function getAllGroups(): Promise<GroupDoc[] | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("groups")
    .select("*, members:group_members(*, bets(*))")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching groups: ", error);
    return null;
  }
  
  // Transform members array into a map
  const groups = data.map((g: any) => {
    const membersMap: Record<string, any> = {};
    if (g.members) {
      g.members.forEach((m: any) => {
        membersMap[m.user_id] = { ...m, list: { bets: m.bets || [], points: m.points || 0 } };
      });
    }
    return { ...g, members: membersMap };
  });

  return groups as unknown as GroupDoc[];
}

export async function getGroupById(
  groupId: string,
  userId?: string
): Promise<GroupDoc | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("groups")
    .select("*, members:group_members(*, bets(*)), activity_logs(*)")
    .eq("id", groupId)
    .single();

  if (error || !data) return null;
  
  // Transform members array into a map
  const membersMap: Record<string, any> = {};
  if (data.members) {
    data.members.forEach((m: any) => {
      membersMap[m.user_id] = { ...m, list: { bets: m.bets || [], points: m.points || 0 } };
    });
  }
  const group = { ...data, members: membersMap };

  return group as unknown as GroupDoc;
}

export async function createGroup(
  groupData: Omit<GroupDoc, "id" | "status" | "activity_logs" | "created_at" | "members">
): Promise<{ groupId: string }> {
  const supabase = createClient();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", groupData.creator_id)
    .single();

  if (userError || !user) throw new Error("El usuario no existe");

  // TODO: Implement tier checks if we add 'tier' to the SQL users table later.

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name: groupData.name,
      description: groupData.description,
      status: "draft",
      deadline: groupData.deadline,
      creator_id: groupData.creator_id,
      max_bets: groupData.max_bets,
    })
    .select()
    .single();

  if (groupError) throw groupError;

  const creatorUsername = await resolveUserId(groupData.creator_id);

  await supabase.from("activity_logs").insert([
    { group_id: group.id, message: `Grupo ${groupData.name} creado por ${creatorUsername}` },
    { group_id: group.id, message: `${creatorUsername} se unió al grupo` },
  ]);

  await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: groupData.creator_id,
    role: "admin",
  });

  return { groupId: group.id };
}

export async function updateList(
  groupId: string,
  userId: string,
  newList: ListDoc
) {
  const supabase = createClient();

  // Get old list (bets)
  const { data: oldBets } = await supabase
    .from("bets")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", userId);

  const oldIds = new Set(oldBets?.map((bet) => bet.wikidata_id) || []);
  const newIds = new Set(newList.bets.map((bet) => bet.wikidata_id) || []);

  const added = [...newIds].filter((id) => !oldIds.has(id));
  const removed = [...oldIds].filter((id) => !newIds.has(id));

  // Process removals
  if (removed.length > 0) {
    await supabase
      .from("bets")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .in("wikidata_id", removed);
  }

  // Process additions
  for (const id of added) {
    const bet = newList.bets.find((b) => b.wikidata_id === id);
    if (!bet) continue;

    await supabase.from("bets").insert({
      group_id: groupId,
      user_id: userId,
      type: bet.type,
      name: bet.name,
      status: bet.status,
      wikidata_id: bet.wikidata_id,
      snippet: bet.snippet,
      age: bet.age,
    });

    await updateRecord(id, userId, groupId);
  }
}

export async function joinGroup(userId: string, tokenId: string) {
  const supabase = createClient();
  const { data: invite, error: inviteError } = await supabase
    .from("invites")
    .select("*")
    .eq("token", tokenId)
    .single();

  if (inviteError || !invite) throw new Error("Invite not found!");

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("name")
    .eq("id", userId)
    .single();

  if (userError || !user) throw new Error("User not found!");

  await supabase.from("group_members").insert({
    group_id: invite.group_id,
    user_id: userId,
    role: "member",
  });

  await supabase.from("activity_logs").insert({
    group_id: invite.group_id,
    message: `${user.name} se unió al grupo`,
  });
}

export async function leaveGroup(userId: string, groupId: string) {
  const supabase = createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("creator_id")
    .eq("id", groupId)
    .single();

  if (!group) throw new Error("El grupo no existe");

  if (group.creator_id === userId) {
    throw new Error("Como creador, no puedes abandonar el grupo. Debes eliminarlo si quieres salir.");
  }

  await supabase.from("group_members").delete().match({ group_id: groupId, user_id: userId });
}

export async function updateGroup(groupId: string, newGroupData: UpdateGroupDoc) {
  const supabase = createClient();
  await supabase
    .from("groups")
    .update({
      name: newGroupData.name,
      description: newGroupData.description,
      deadline: newGroupData.deadline,
      max_bets: newGroupData.max_bets,
      status: newGroupData.status,
    })
    .eq("id", groupId);
}

export async function deleteGroup(groupId: string, userId: string) {
  const supabase = createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("creator_id")
    .eq("id", groupId)
    .single();

  if (!group) throw new Error("El grupo no existe");
  if (group.creator_id !== userId) throw new Error("No tienes permisos para eliminar este grupo.");

  // Because of ON DELETE CASCADE, deleting the group will also delete members, bets, activity_logs, and invites.
  await supabase.from("groups").delete().eq("id", groupId);
}

export async function promoteToAdmin(groupId: string, memberId: string) {
  const supabase = createClient();
  await supabase
    .from("group_members")
    .update({ role: "admin" })
    .match({ group_id: groupId, user_id: memberId });
}

export async function closeGroupLists(groupId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("groups")
    .update({ status: "activo" })
    .eq("id", groupId);

  if (!error) {
    await supabase.from("activity_logs").insert({
      group_id: groupId,
      message: `Listas cerradas oficialmente. El juego ha comenzado.`,
    });
    return true;
  }
  return false;
}

export async function getUserList(groupId: string, userId: string) {
  const supabase = createClient();
  const { data: bets } = await supabase
    .from("bets")
    .select("*")
    .match({ group_id: groupId, user_id: userId });
    
  const { data: member } = await supabase
    .from("group_members")
    .select("points")
    .match({ group_id: groupId, user_id: userId })
    .single();

  if (!bets || !member) return null;
  return { bets: bets as BetDoc[], points: member.points };
}

export async function setNameStatusAcrossGroup(
  groupId: string,
  name: string,
  status: "alive" | "deceased"
) {
  const supabase = createClient();
  const { data: bets } = await supabase
    .from("bets")
    .select("*")
    .eq("group_id", groupId)
    .ilike("name", name); // Use ilike for case-insensitive matching similar to normalize

  if (!bets || bets.length === 0) return;

  const toUpdate = bets.filter((b) => b.status !== status);
  if (toUpdate.length === 0) return;

  // We should do this within a transaction or RPC in production, but for now we loop
  for (const bet of toUpdate) {
    await supabase.from("bets").update({ status }).eq("id", bet.id);

    // Update points
    const pointsDelta = status === "deceased" ? 1 : -1;
    const { data: member } = await supabase
      .from("group_members")
      .select("points")
      .eq("group_id", groupId)
      .eq("user_id", bet.user_id)
      .single();

    if (member) {
      await supabase
        .from("group_members")
        .update({ points: member.points + pointsDelta })
        .eq("group_id", groupId)
        .eq("user_id", bet.user_id);
    }
  }
}

