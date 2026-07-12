export interface UserDoc {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role?: "user" | "admin" | "creator";
  status?: string;
  groups?: string[];
  tier?: string;
  created_at: string;
}

export interface UserStats {
  totalPoints: number;
  victories: number;
  games: { active: number; finished: number };
}
