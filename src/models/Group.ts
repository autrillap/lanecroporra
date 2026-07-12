import { BetDoc } from "./Bet";
import { UserDoc } from "./User";

export interface Log {
  id: string;
  group_id: string;
  message: string;
  timestamp?: string;
  created_at?: string;
}

export interface MemberDoc {
  group_id: string;
  user_id: string;
  role: "admin" | "member";
  points: number;
  joined_at: string;
  
  // Relations (populated via join)
  user?: UserDoc;
  bets?: BetDoc[];
  list?: import("./List").ListDoc;
}

export type MembersMap = Record<string, MemberDoc>;

export interface GroupDoc {
  id: string;
  name: string;
  description: string;
  status: "draft" | "activo" | "finalizado";
  deadline: string;
  creator_id: string;
  created_at: string;
  max_bets: number;
  invite_link?: string;
  
  // Relations (populated via join)
  members?: MembersMap;
  activity_logs?: Log[];
}

export interface UpdateGroupDoc {
  name?: string;
  description?: string;
  deadline?: string;
  max_bets?: number;
  status?: "draft" | "activo" | "finalizado";
}
