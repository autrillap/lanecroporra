/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/client";

export async function updateRecord(
  wikidataId: string,
  userId: string,
  groupId: string
) {
  const supabase = createClient();
  
  // Fetch existing record
  const { data: existing } = await supabase
    .from("review_records")
    .select("*")
    .eq("wikidata_id", wikidataId)
    .single();

  if (!existing) {
    await supabase.from("review_records").insert({
      wikidata_id: wikidataId,
      status: "alive",
      lists: [{ userId, groupId }],
    });
  } else {
    // Append to JSONB array if not exists
    const currentLists: any[] = existing.lists || [];
    const exists = currentLists.some(
      (l) => l.userId === userId && l.groupId === groupId
    );
    if (!exists) {
      currentLists.push({ userId, groupId });
      await supabase
        .from("review_records")
        .update({ lists: currentLists })
        .eq("wikidata_id", wikidataId);
    }
  }
}

async function checkWikidataDeceasedStatus(
  ids: string[]
): Promise<Record<string, boolean>> {
  if (ids.length === 0) return {};

  const idsParam = ids.join("|");
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${idsParam}&props=claims&format=json&origin=*`;

  const res = await fetch(url);
  const data = await res.json();

  const statusMap: Record<string, boolean> = {};

  ids.forEach((id) => {
    const entity = data.entities[id];
    if (entity && entity.claims) {
      const isDeceased = !!entity.claims.P570;
      statusMap[id] = isDeceased;
    }
  });

  return statusMap;
}

export async function reviewAllRecords() {
  const supabase = createClient();
  const { data: records, error } = await supabase
    .from("review_records")
    .select("*")
    .eq("status", "alive");

  if (error || !records || records.length === 0) return "No hay registros pendientes de revisión";

  const allRecordIds = records.map((r) => r.wikidata_id);

  const CHUNK_SIZE = 50;
  const deceasedFound: string[] = [];

  for (let i = 0; i < allRecordIds.length; i += CHUNK_SIZE) {
    const chunk = allRecordIds.slice(i, i + CHUNK_SIZE);
    const results = await checkWikidataDeceasedStatus(chunk);

    Object.entries(results).forEach(([id, isDeceased]) => {
      if (isDeceased) deceasedFound.push(id);
    });
  }

  console.log(`Se han detectado ${deceasedFound.length} fallecimientos nuevos`);

  for (const wikidataId of deceasedFound) {
    // 1. Mark as deceased
    await supabase
      .from("review_records")
      .update({ status: "deceased" })
      .eq("wikidata_id", wikidataId);

    const record = records.find((r) => r.wikidata_id === wikidataId);
    if (!record || !record.lists) continue;

    // 2. Update bets and points
    for (const list of record.lists) {
      const { userId, groupId } = list;
      
      const { data: bet } = await supabase
        .from("bets")
        .select("*")
        .eq("wikidata_id", wikidataId)
        .eq("user_id", userId)
        .eq("group_id", groupId)
        .single();
        
      if (bet && bet.status === "alive") {
        await supabase
          .from("bets")
          .update({ status: "deceased" })
          .eq("id", bet.id);
          
        // Increment point
        const { data: member } = await supabase
          .from("group_members")
          .select("points")
          .eq("group_id", groupId)
          .eq("user_id", userId)
          .single();
          
        if (member) {
          await supabase
            .from("group_members")
            .update({ points: member.points + 1 })
            .eq("group_id", groupId)
            .eq("user_id", userId);
        }
      }
    }
  }
}
