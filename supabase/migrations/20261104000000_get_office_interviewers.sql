CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL DEFAULT 'member',
  office_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Profiles are viewable by owner"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Profiles are editable by owner"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.get_office_interviewers()
RETURNS TABLE (id uuid, email text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, u.email::text, p.role::text
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.office_id::text = (SELECT me.office_id::text FROM public.profiles me WHERE me.id = auth.uid())
    AND p.role::text <> 'superadmin'
$$;

REVOKE ALL ON FUNCTION public.get_office_interviewers() FROM public;
GRANT EXECUTE ON FUNCTION public.get_office_interviewers() TO authenticated;
