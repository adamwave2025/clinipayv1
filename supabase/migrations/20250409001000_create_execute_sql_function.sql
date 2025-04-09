
-- Create a function to execute SQL from edge functions
CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Create function to set up the auth user trigger
CREATE OR REPLACE FUNCTION public.create_auth_user_trigger()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create function to handle new users
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER SET search_path = public
  AS $$
  BEGIN
    -- Insert into users table
    INSERT INTO public.users (id, email, role, verified)
    VALUES (NEW.id, NEW.email, 'clinic', false)
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
  END;
  $$;

  -- Create or replace the trigger
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  
  -- Return success
  RETURN;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating auth trigger: %', SQLERRM;
END;
$$;
