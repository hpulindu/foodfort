import * as admin from "firebase-admin";
import { beforeUserCreated, beforeUserSignedIn } from "firebase-functions/v2/identity";
import { onCall, HttpsError } from "firebase-functions/v2/https";

const FUNCTION_REGION = "us-central1";

function getAuth(): admin.auth.Auth {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.auth();
}

function isStaffClaim(claims: Record<string, unknown> | undefined): boolean {
  return claims?.staff === true;
}

function isAdminClaim(claims: Record<string, unknown> | undefined): boolean {
  return claims?.admin === true;
}

// ─── Block client-side account creation ───────────────────────────────────────
// Users created via Admin SDK (provision script / Cloud Function) are exempt.
export const blockPublicSignup = beforeUserCreated(() => {
  throw new HttpsError(
    "permission-denied",
    "Public sign-up is disabled. Contact your administrator for access."
  );
});

// ─── Reject sign-in for accounts without the staff custom claim ───────────────
export const enforceStaffSignIn = beforeUserSignedIn((event) => {
  const claims = event.data?.customClaims as Record<string, unknown> | undefined;
  if (!isStaffClaim(claims)) {
    throw new HttpsError(
      "permission-denied",
      "This account is not authorized for staff access."
    );
  }
});

// ─── Provision staff accounts (admin-only, server-side) ───────────────────────
interface ProvisionStaffData {
  email: string;
  password: string;
  displayName?: string;
}

export const provisionStaffAccount = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }
    if (!isAdminClaim(request.auth.token)) {
      throw new HttpsError("permission-denied", "Admin privileges required.");
    }

    const data = request.data as ProvisionStaffData;
    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    const password = typeof data.password === "string" ? data.password : "";
    const displayName =
      typeof data.displayName === "string" ? data.displayName.trim() : undefined;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpsError("invalid-argument", "A valid email address is required.");
    }
    if (password.length < 12) {
      throw new HttpsError(
        "invalid-argument",
        "Password must be at least 12 characters."
      );
    }

    const auth = getAuth();
    let user: admin.auth.UserRecord;
    try {
      user = await auth.createUser({
        email,
        password,
        displayName: displayName || undefined,
        emailVerified: true,
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-exists") {
        throw new HttpsError("already-exists", "An account with this email already exists.");
      }
      console.error("provisionStaffAccount createUser error:", err);
      throw new HttpsError("internal", "Unable to create staff account.");
    }

    await auth.setCustomUserClaims(user.uid, { staff: true });

    return { uid: user.uid, email: user.email };
  }
);

// ─── Revoke staff access (admin-only) ───────────────────────────────────────
interface RevokeStaffData {
  uid: string;
}

export const revokeStaffAccess = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }
    if (!isAdminClaim(request.auth.token)) {
      throw new HttpsError("permission-denied", "Admin privileges required.");
    }

    const uid = (request.data as RevokeStaffData).uid;
    if (typeof uid !== "string" || !uid.trim()) {
      throw new HttpsError("invalid-argument", "A valid user ID is required.");
    }

    if (uid === request.auth.uid) {
      throw new HttpsError("failed-precondition", "You cannot revoke your own access.");
    }

    const auth = getAuth();
    try {
      await auth.setCustomUserClaims(uid, { staff: false, admin: false });
      await auth.revokeRefreshTokens(uid);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "auth/user-not-found") {
        throw new HttpsError("not-found", "User not found.");
      }
      console.error("revokeStaffAccess error:", err);
      throw new HttpsError("internal", "Unable to revoke staff access.");
    }

    return { uid, revoked: true };
  }
);
