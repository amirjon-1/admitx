-- Add insert policy for public.users so clients can create their own row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can insert own user row'
  ) THEN
    CREATE POLICY "Users can insert own user row" ON public.users
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Backfill missing public.users rows for existing auth.users
INSERT INTO public.users (id, email, username, credits)
SELECT au.id,
       au.email,
       SPLIT_PART(au.email, '@', 1),
       1000
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = au.id
);
