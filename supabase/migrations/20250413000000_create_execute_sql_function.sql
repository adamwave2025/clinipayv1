
-- Create a function that can execute SQL statements for administration purposes
CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE sql INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'detail', SQLSTATE,
    'sql', sql
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;
-- Grant execute permission to service_role (for automated calls)
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO service_role;
