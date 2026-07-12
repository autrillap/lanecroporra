export interface BetDoc {
  id: string;
  group_id: string;
  user_id: string;
  type: string;
  name: string;
  status: "deceased" | "alive";
  wikidata_id: string;
  snippet?: string;
  age?: number | null;
  created_at: string;
}
