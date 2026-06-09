/**
 * Provisions a staff (or admin) Firebase Auth account with custom claims.
 *
 * Requires Application Default Credentials, e.g.:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
 *   # or: firebase login && gcloud auth application-default login
 *
 * Usage:
 *   npx tsx scripts/provision-staff.ts <email> <password> [--admin]
 *   npx tsx scripts/provision-staff.ts existing@user.com --grant [--admin]
 *
 * --grant  Sets staff/admin claims on an existing account instead of creating one.
 */
import process from "node:process";
import admin from "firebase-admin";

function usage(): never {
  console.error(`
Usage:
  npx tsx scripts/provision-staff.ts <email> <password> [--admin]
  npx tsx scripts/provision-staff.ts <email> --grant [--admin]

Options:
  --admin  Also grant admin claim (can provision/revoke other staff accounts)
  --grant  Set claims on an existing user instead of creating a new account
`);
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) usage();

  const grantOnly = args.includes("--grant");
  const isAdmin = args.includes("--admin");
  const positional = args.filter((a) => !a.startsWith("--"));

  const email = positional[0]?.trim().toLowerCase();
  const password = positional[1];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Error: a valid email address is required.");
    usage();
  }
  if (!grantOnly && (!password || password.length < 12)) {
    console.error("Error: password must be at least 12 characters.");
    usage();
  }

  if (!admin.apps?.length) {
    admin.initializeApp();
  }
  const auth = admin.auth();

  let uid: string;

  if (grantOnly) {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`Granting claims on existing account: ${email} (${uid})`);
  } else {
    try {
      const user = await auth.createUser({
        email,
        password: password!,
        emailVerified: true,
      });
      uid = user.uid;
      console.log(`Created staff account: ${email} (${uid})`);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-exists") {
        console.error(
          "Error: account already exists. Use --grant to add claims to it."
        );
        process.exit(1);
      }
      throw err;
    }
  }

  const claims: Record<string, boolean> = { staff: true };
  if (isAdmin) claims.admin = true;

  await auth.setCustomUserClaims(uid, claims);

  console.log("Custom claims set:", claims);
  console.log(
    "\nNext steps:\n" +
      "  1. Deploy updated Firestore rules and auth blocking functions.\n" +
      "  2. Sign in on the dashboard app with the provisioned account."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
