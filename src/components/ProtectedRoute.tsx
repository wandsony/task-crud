import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireMfa?: boolean;
}

export function ProtectedRoute({ children, requireMfa = true }: ProtectedRouteProps) {
  const { user, isLoading, isMfaPending, mfaMethod } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireMfa && isMfaPending) {
    return <Navigate to={`/mfa-verify?method=${mfaMethod ?? "totp"}`} replace />;
  }

  return <>{children}</>;
}
