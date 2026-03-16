import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Shield, Loader2, Mail, Smartphone, QrCode } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getEmailMfaStorageKey } from "@/lib/mfa";

export default function MfaVerify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isMfaPending, mfaMethod, refreshMfaStatus } = useAuth();
  const method = (searchParams.get("method") || mfaMethod || "totp") as "totp" | "email";
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (!isMfaPending && method !== "email") {
      navigate("/tasks", { replace: true });
      return;
    }

    if (method === "totp") {
      initTotpChallenge();
    } else if (method === "email" && !emailSent) {
      sendEmailOtp();
    }
  }, [method, user]);

  const initTotpChallenge = async () => {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totp = factors?.totp?.[0];
    if (!totp) {
      toast.error("Nenhum fator TOTP encontrado.");
      navigate("/login");
      return;
    }
    setFactorId(totp.id);
    const { data: challenge, error } = await supabase.auth.mfa.challenge({ factorId: totp.id });
    if (error) {
      toast.error(error.message);
      return;
    }
    setChallengeId(challenge.id);
  };

  const sendEmailOtp = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await supabase.functions.invoke("send-email-otp", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error) throw res.error;
      setEmailSent(true);
      toast.success("Código enviado para seu email!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar código");
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6 || !user) return;
    setIsVerifying(true);

    try {
      if (method === "totp" && factorId && challengeId) {
        const { error } = await supabase.auth.mfa.verify({
          factorId,
          challengeId,
          code,
        });
        if (error) {
          toast.error("Código inválido. Tente novamente.");
          setCode("");
          return;
        }
      } else if (method === "email") {
        const { data, error } = await supabase.rpc("verify_email_otp", {
          p_user_id: user.id,
          p_code: code,
        });
        if (error || !data) {
          toast.error("Código inválido ou expirado.");
          setCode("");
          return;
        }
        sessionStorage.setItem(getEmailMfaStorageKey(user.id), "true");
      }

      await refreshMfaStatus();
      toast.success("Verificação concluída!");
      navigate("/tasks", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Erro na verificação");
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (code.length === 6) {
      handleVerify();
    }
  }, [code]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-2">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-xl">Verificação em 2 etapas</CardTitle>
          <CardDescription>
            {method === "totp"
              ? "Digite o código do app autenticador configurado pelo QR Code"
              : "Digite o código de 6 dígitos enviado para seu email"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {method === "totp" ? (
              <><QrCode className="h-4 w-4" /><Smartphone className="h-4 w-4" /> App Authenticator</>
            ) : (
              <><Mail className="h-4 w-4" /> Email OTP</>
            )}
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            {method === "totp"
              ? "Abra o Google Authenticator, Authy ou app similar e informe o código atual de 6 dígitos."
              : "O código tem validade curta. Se expirar, use o botão abaixo para reenviar."}
          </div>

          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            className="w-full font-display font-semibold"
            onClick={handleVerify}
            disabled={code.length !== 6 || isVerifying}
          >
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar
          </Button>

          {method === "email" && (
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={sendEmailOtp}
            >
              Reenviar código
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
