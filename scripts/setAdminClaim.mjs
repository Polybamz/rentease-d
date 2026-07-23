// One-off admin script: grants the RentEase "admin" role to a user.
//
// This can't be done from the client (see firestore.rules — the client is
// blocked from ever writing role: "admin"), so it's a small trusted-backend
// script instead. It sets both:
//   1. a Firebase Auth custom claim { admin: true }  (fast, enforceable in
//      security rules and in the app without a Firestore read)
//   2. the users/{uid}.role field the app currently reads (kept in sync so
//      existing role.tsx logic keeps working without changes)
//
// Usage:
//   1. Firebase Console -> Project settings -> Service accounts ->
//      Generate new private key. Save it, e.g. as serviceAccountKey.json
//      (do NOT commit this file — it's a full-access credential).
//   2. npm install firebase-admin --no-save   (or bun add -d firebase-admin)
//   3. GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
//        node scripts/setAdminClaim.mjs someone@example.com [password]
//
// If the account doesn't exist yet and a password is given, it's created
// (email/password) before being promoted — handy for standing up the very
// first admin without needing to sign up through the app UI first.
//
// To revoke: node scripts/setAdminClaim.mjs someone@example.com --revoke

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const [, , email, second] = process.argv;
const revoke = second === "--revoke";
const password = revoke ? undefined : second;

if (!email) {
  console.error("Usage: node scripts/setAdminClaim.mjs <email> [password] [--revoke]");
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });

const auth = getAuth();
const db = getFirestore();

let user;
try {
  user = await auth.getUserByEmail(email);
} catch (err) {
  if (err.code !== "auth/user-not-found" || revoke || !password) throw err;
  console.log(`No account for ${email} yet — creating one.`);
  user = await auth.createUser({ email, password, emailVerified: true });
}

await auth.setCustomUserClaims(user.uid, revoke ? {} : { admin: true });

await db.doc(`users/${user.uid}`).set(
  { role: revoke ? null : "admin", email, updatedAt: Date.now() },
  { merge: true },
);

console.log(
  `${revoke ? "Revoked" : "Granted"} admin for ${email} (uid: ${user.uid}). ` +
    "They must sign out and back in for the custom claim to take effect.",
);
