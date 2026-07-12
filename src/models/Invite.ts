export interface InviteDoc {
  id: string;
  group_id: string;
  token: string;
  used: boolean;
  expires_at?: string;
  created_by: string;
  created_at: string;
}
