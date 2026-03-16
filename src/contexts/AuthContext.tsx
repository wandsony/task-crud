import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getEmailMfaStorageKey, MfaMethod, resolveMfaRequirement } from "@/lib/mfa";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isMfaPending: boolean;
  mfaMethod: MfaMethod;
  refreshMfaStatus: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isMfaPending: false,
  mfaMethod: null,
  refreshMfaStatus: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMfaPending, setIsMfaPending] = useState(false);
  const [mfaMethod, setMfaMethod] = useState<MfaMethod>(null);

  const clearMfaState = useCallback((userId?: string | null) => {
    if (userId) {
      sessionStorage.removeItem(getEmailMfaStorageKey(userId));
    }
    setIsMfaPending(false);
    setMfaMethod(null);
  }, []);

  const refreshMfaStatus = useCallback(async (currentSession?: Session | null) => {
    const activeSession = currentSession ?? session;

    if (!activeSession?.user) {
      clearMfaState();
      return;
    }

    try {
      const [{ data: aalData }, { data: settings }] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase
          .from("mfa_settings")
          .select("email_otp_enabled")
          .eq("user_id", activeSession.user.id)
          .maybeSingle(),
      ]);

      const emailVerifiedForUser =
        sessionStorage.getItem(getEmailMfaStorageKey(activeSession.user.id)) === "true";

      const { method, pending } = resolveMfaRequirement({
        currentLevel: aalData?.currentLevel,
        nextLevel: aalData?.nextLevel,
        emailOtpEnabled: settings?.email_otp_enabled,
        emailVerifiedForUser,
      });

      setMfaMethod(method);
      setIsMfaPending(pending);
    } catch (error) {
      console.error("Error evaluating MFA status:", error);
      setMfaMethod(null);
      setIsMfaPending(false);
    }
  }, [clearMfaState, session]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);

      if (event === "SIGNED_OUT") {
        clearMfaState(nextSession?.user?.id ?? session?.user?.id ?? null);
        setIsLoading(false);
        return;
      }

      if (!nextSession) {
        clearMfaState();
        setIsLoading(false);
        return;
      }

      queueMicrotask(() => {
        refreshMfaStatus(nextSession).finally(() => setIsLoading(false));
      });
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      refreshMfaStatus(currentSession).finally(() => setIsLoading(false));
    });

    return () => subscription.unsubscribe();
  }, [clearMfaState, refreshMfaStatus, session?.user?.id]);

  const signOut = async () => {
    clearMfaState(session?.user?.id ?? null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        isMfaPending,
        mfaMethod,
        refreshMfaStatus: () => refreshMfaStatus(),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
