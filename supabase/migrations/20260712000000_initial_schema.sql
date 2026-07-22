-- Create users table that syncs with auth.users
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'creator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.users (id, name, email, avatar_url)
VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger for new user
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- Create groups table
CREATE TABLE public.groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'activo', 'finalizado')),
  deadline TIMESTAMP WITH TIME ZONE,
  creator_id UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  max_bets INTEGER DEFAULT 0,
  invite_link TEXT
);
-- Create group members table
CREATE TABLE public.group_members (
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  points INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);
-- Create bets table (replaces embedded ListDoc.bets)
CREATE TABLE public.bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type TEXT,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'alive' CHECK (status IN ('alive', 'deceased')),
  wikidata_id TEXT,
  snippet TEXT,
  age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (group_id, user_id) REFERENCES public.group_members(group_id, user_id) ON DELETE CASCADE
);
-- Create activity logs table
CREATE TABLE public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create invites table
CREATE TABLE public.invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id),
  token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  max_uses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create review records
CREATE TABLE public.review_records (
  wikidata_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lists JSONB DEFAULT '[]'::jsonb
);
-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_records ENABLE ROW LEVEL SECURITY;
-- Complete & Robust RLS Policies
-- 1. Users policies
CREATE POLICY "Users can view everyone" ON public.users FOR
SELECT USING (true);
CREATE POLICY "Users can insert themselves" ON public.users FOR
INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update themselves" ON public.users FOR
UPDATE USING (auth.uid() = id);
-- 2. Groups policies
CREATE POLICY "Anyone can view groups" ON public.groups FOR
SELECT USING (true);
CREATE POLICY "Authenticated can create groups" ON public.groups FOR
INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Group creators can update" ON public.groups FOR
UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Group creators can delete" ON public.groups FOR DELETE USING (auth.uid() = creator_id);
-- 3. Group Members policies
CREATE POLICY "Anyone can view group members" ON public.group_members FOR
SELECT USING (true);
CREATE POLICY "Users can join groups" ON public.group_members FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can update group members" ON public.group_members FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can delete group members" ON public.group_members FOR DELETE USING (auth.uid() = user_id);
-- 4. Bets policies
CREATE POLICY "Anyone can view bets" ON public.bets FOR
SELECT USING (true);
CREATE POLICY "Users can insert their bets" ON public.bets FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can update bets" ON public.bets FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their bets" ON public.bets FOR DELETE USING (auth.uid() = user_id);
-- 5. Activity Logs policies
CREATE POLICY "Anyone can view activity logs" ON public.activity_logs FOR
SELECT USING (true);
CREATE POLICY "Authenticated can create logs" ON public.activity_logs FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
-- 6. Invites policies
CREATE POLICY "Anyone can view invites" ON public.invites FOR
SELECT USING (true);
CREATE POLICY "Group members can create invites" ON public.invites FOR
INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated can update invites" ON public.invites FOR
UPDATE USING (auth.uid() = created_by);
-- 7. Review Records policies
CREATE POLICY "Anyone can view review records" ON public.review_records FOR
SELECT USING (true);
-- Helper: check if user is admin/creator
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role IN ('admin')
  );
$$ LANGUAGE sql STABLE;
CREATE POLICY "Admins can insert review records" ON public.review_records FOR
INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update review records" ON public.review_records FOR
UPDATE USING (public.is_admin());
-- Explicit GRANTS to anon and authenticated roles since auto_expose_new_tables is disabled
GRANT USAGE ON SCHEMA public TO anon,
  authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon,
  authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon,
  authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon,
  authenticated;