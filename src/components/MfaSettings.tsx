import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Smartphone, Mail, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function MfaSettings() {
  const { user } = useAuth();
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [emailOtpEnabled, setEmailOtpEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    if (user) loadMfaSettings();
  }, [user]);

  const loadMfaSettings = async () => {
    setLoading(true);
    try {
      // Check TOTP factors
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasTotp = (factors?.totp?.length ?? 0) > 0;
      setTotpEnabled(hasTotp);

      // Check email OTP settings
      const { data: settings } = await supabase
        .from("mfa_settings")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (settings) {
        setEmailOtpEnabled(settings.email_otp_enabled ?? false);
      }
    } catch (err) {
      console.error("Error loading MFA settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollTotp = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });
      if (error) throw error;

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setTotpSecret(data.totp.secret);
      setShowTotpSetup(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleVerifyTotp = async () => {
    if (!factorId || verifyCode.length !== 6) return;
    setIsEnrolling(true);
    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeErr) throw challengeErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (verifyErr) throw verifyErr;

      // Update mfa_settings
      await upsertMfaSettings({ totp_enabled: true });

      setTotpEnabled(true);
      setShowTotpSetup(false);
      setVerifyCode("");
      toast.success("Autenticador configurado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Código inválido");
      setVerifyCode("");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleUnenrollTotp = async () => {
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];
      if (totp) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: totp.id });
        if (error) throw error;
      }
      await upsertMfaSettings({ totp_enabled: false });
      setTotpEnabled(false);
      toast.success("Autenticador removido.");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleEmailOtp = async (enabled: boolean) => {
    try {
      await upsertMfaSettings({ email_otp_enabled: enabled });
      setEmailOtpEnabled(enabled);
      toast.success(enabled ? "OTP por email ativado!" : "OTP por email desativado.");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const upsertMfaSettings = async (updates: Record<string, any>) => {
    const { data: existing } = await supabase
      .from("mfa_settings")
      .select("id")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("mfa_settings")
        .update(updates)
        .eq("user_id", user!.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("mfa_settings")
        .insert({ user_id: user!.id, ...updates });
      if (error) throw error;
    }
  };

  useEffect(() => {
    if (verifyCode.length === 6) {
      handleVerifyTotp();
    }
  }, [verifyCode]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">Autenticação em 2 fatores (2FA)</CardTitle>
          </div>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta com app autenticador via QR Code ou código por email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* TOTP */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">App Authenticator (TOTP)</p>
                <p className="text-xs text-muted-foreground">
                  Google Authenticator, Authy, 1Password e similares
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {totpEnabled ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <Button variant="outline" size="sm" onClick={handleUnenrollTotp}>
                    Remover
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={handleEnrollTotp} disabled={isEnrolling}>
                  {isEnrolling && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  Configurar
                </Button>
              )}
            </div>
          </div>

          {/* Email OTP */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Código por Email</p>
                <p className="text-xs text-muted-foreground">
                  Receba um código de 6 dígitos no seu email
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {emailOtpEnabled && <CheckCircle2 className="h-4 w-4 text-primary" />}
              <Switch
                checked={emailOtpEnabled}
                onCheckedChange={handleToggleEmailOtp}
              />
            </div>
          </div>

          {!totpEnabled && !emailOtpEnabled && (
            <p className="text-xs text-muted-foreground text-center">
              Nenhum método 2FA ativo. Ative pelo menos um para maior segurança.
            </p>
          )}
        </CardContent>
      </Card>

      {/* TOTP Setup Dialog */}
      <Dialog open={showTotpSetup} onOpenChange={setShowTotpSetup}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Configurar Authenticator por QR Code</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu app autenticador e digite o código gerado para concluir a ativação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="QR Code TOTP" className="w-48 h-48 rounded-lg" />
              </div>
            )}
            {totpSecret && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Ou insira manualmente:</p>
                <code className="text-xs bg-muted px-2 py-1 rounded select-all break-all">
                  {totpSecret}
                </code>
              </div>
            )}
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={verifyCode} onChange={setVerifyCode}>
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
              className="w-full"
              onClick={handleVerifyTotp}
              disabled={verifyCode.length !== 6 || isEnrolling}
            >
              {isEnrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verificar e Ativar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
