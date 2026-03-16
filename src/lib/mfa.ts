export type MfaMethod = "totp" | "email" | null;

export interface MfaResolutionInput {
  currentLevel?: string | null;
  nextLevel?: string | null;
  emailOtpEnabled?: boolean | null;
  emailVerifiedForUser?: boolean;
}

export function resolveMfaRequirement({
  currentLevel,
  nextLevel,
  emailOtpEnabled,
  emailVerifiedForUser = false,
}: MfaResolutionInput): { method: MfaMethod; pending: boolean } {
  const needsTotp = currentLevel === "aal1" && nextLevel === "aal2";

  if (needsTotp) {
    return { method: "totp", pending: true };
  }

  if (emailOtpEnabled && !emailVerifiedForUser) {
    return { method: "email", pending: true };
  }

  return { method: null, pending: false };
}

export function getEmailMfaStorageKey(userId?: string | null) {
  return userId ? `email_mfa_verified:${userId}` : "email_mfa_verified";
}
