import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ClipboardList, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getEmailMfaStorageKey, resolveMfaRequirement } from "@/lib/mfa";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setIsLoading(false);
      toast.error(error.message);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      sessionStorage.removeItem(getEmailMfaStorageKey(userId));

      const [{ data: aalData }, { data: mfaSettings }] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase
          .from("mfa_settings")
          .select("email_otp_enabled")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      const { method, pending } = resolveMfaRequirement({
        currentLevel: aalData?.currentLevel,
        nextLevel: aalData?.nextLevel,
        emailOtpEnabled: mfaSettings?.email_otp_enabled,
        emailVerifiedForUser: false,
      });

      if (pending && method) {
        setIsLoading(false);
        navigate(`/mfa-verify?method=${method}`);
        return;
      }
    }

    setIsLoading(false);
    navigate("/tasks");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-2">
            <ClipboardList className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-xl">Entrar</CardTitle>
          <CardDescription>Acesse sua conta para gerenciar tasks com segurança extra por QR Code</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-left">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4 text-primary" />
                Proteção adicional com 2FA
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Depois do login, sua conta pode pedir verificação pelo app autenticador com QR Code.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full font-display font-semibold" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
            <div className="flex items-center gap-3 w-full">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">ou</span>
              <Separator className="flex-1" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (error) toast.error(error.message);
              }}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continuar com Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth("apple", {
                  redirect_uri: window.location.origin,
                });
                if (error) toast.error(error.message);
              }}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              Continuar com Apple
            </Button>
            <p className="text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link to="/signup" className="text-primary hover:underline font-medium">Cadastre-se</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
