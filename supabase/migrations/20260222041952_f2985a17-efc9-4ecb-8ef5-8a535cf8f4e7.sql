
-- Add length constraint and validation trigger for display_name
CREATE OR REPLACE FUNCTION public.validate_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_name IS NOT NULL THEN
    NEW.display_name = trim(NEW.display_name);
    IF char_length(NEW.display_name) > 100 THEN
      RAISE EXCEPTION 'Display name must be 100 characters or fewer';
    END IF;
    IF char_length(NEW.display_name) = 0 THEN
      NEW.display_name = NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_profile_before_insert_update
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_profile_fields();
