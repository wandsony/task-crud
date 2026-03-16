-- Table to store email OTP codes for 2FA
CREATE TABLE public.mfa_email_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.mfa_email_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own codes" ON public.mfa_email_codes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own codes" ON public.mfa_email_codes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Table to store user MFA preferences
CREATE TABLE public.mfa_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email_otp_enabled boolean DEFAULT false,
  totp_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.mfa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mfa_settings" ON public.mfa_settings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mfa_settings" ON public.mfa_settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mfa_settings" ON public.mfa_settings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_mfa_settings_updated_at
  BEFORE UPDATE ON public.mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate and store email OTP (called from edge function)
CREATE OR REPLACE FUNCTION public.generate_email_otp(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  v_code := lpad(floor(random() * 1000000)::text, 6, '0');
  UPDATE public.mfa_email_codes SET used = true WHERE user_id = p_user_id AND used = false;
  INSERT INTO public.mfa_email_codes (user_id, code, expires_at)
  VALUES (p_user_id, v_code, now() + interval '5 minutes');
  RETURN v_code;
END;
$$;

-- Function to verify email OTP
CREATE OR REPLACE FUNCTION public.verify_email_otp(p_user_id uuid, p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.mfa_email_codes
    WHERE user_id = p_user_id
      AND code = p_code
      AND used = false
      AND expires_at > now()
  ) INTO v_valid;
  IF v_valid THEN
    UPDATE public.mfa_email_codes SET used = true
    WHERE user_id = p_user_id AND code = p_code;
  END IF;
  RETURN v_valid;
END;
$$;