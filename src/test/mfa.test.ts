import { describe, expect, it } from "vitest";
import { getEmailMfaStorageKey, resolveMfaRequirement } from "@/lib/mfa";

describe("resolveMfaRequirement", () => {
  it("prioriza TOTP quando o usuário ainda precisa subir de AAL1 para AAL2", () => {
    expect(
      resolveMfaRequirement({
        currentLevel: "aal1",
        nextLevel: "aal2",
        emailOtpEnabled: true,
        emailVerifiedForUser: true,
      }),
    ).toEqual({ method: "totp", pending: true });
  });

  it("exige email OTP quando configurado e ainda não validado", () => {
    expect(
      resolveMfaRequirement({
        currentLevel: "aal1",
        nextLevel: "aal1",
        emailOtpEnabled: true,
        emailVerifiedForUser: false,
      }),
    ).toEqual({ method: "email", pending: true });
  });

  it("não bloqueia quando nenhum MFA está pendente", () => {
    expect(
      resolveMfaRequirement({
        currentLevel: "aal2",
        nextLevel: "aal2",
        emailOtpEnabled: false,
        emailVerifiedForUser: true,
      }),
    ).toEqual({ method: null, pending: false });
  });
});

describe("getEmailMfaStorageKey", () => {
  it("gera uma chave por usuário", () => {
    expect(getEmailMfaStorageKey("abc")).toBe("email_mfa_verified:abc");
  });
});
