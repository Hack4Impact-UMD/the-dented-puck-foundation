/**
 * Adds an `isTeamSpecific` boolean to every document in a Firestore collection.
 *
 * Rule: isTeamSpecific = true  if the doc has a non-empty `teamIds` array
 *       isTeamSpecific = false otherwise (missing, null, or empty array)
 *
 * Setup:
 *   npm install firebase-admin
 *   Download a service account key from Firebase Console:
 *     Project Settings > Service accounts > Generate new private key
 *
 * Usage:
 *   node addIsTeamSpecific.js --key ./serviceAccountKey.json --collection events
 *   node addIsTeamSpecific.js --key ./serviceAccountKey.json --collection events --dry-run
 *   node addIsTeamSpecific.js --key ./serviceAccountKey.json --collection events --overwrite
 *
 * Flags:
 *   --dry-run     Print what would change without writing anything
 *   --overwrite   Also update docs that already have isTeamSpecific (default: skip them)
 */

const path = require("path");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// ---- CLI args ----
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const hasFlag = (name) => args.includes(`--${name}`);

const keyPath = getArg("key", "./serviceAccountKey.json");
const collectionName = getArg("collection", "Events"); // <-- change to your collection name
const dryRun = hasFlag("dry-run");
const overwrite = hasFlag("overwrite");

initializeApp({
  credential: cert(require(path.resolve(keyPath))),
});
const db = getFirestore();

const BATCH_LIMIT = 400; // Firestore max is 500 writes per batch

function computeIsTeamSpecific(data) {
  return Array.isArray(data.teamIds) && data.teamIds.length > 0;
}

async function main() {
  console.log(
    `Collection: ${collectionName} | dry run: ${dryRun} | overwrite: ${overwrite}`
  );

  const snapshot = await db.collection(collectionName).get();
  console.log(`Found ${snapshot.size} documents.`);

  let batch = db.batch();
  let pending = 0;
  let updated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (!overwrite && typeof data.isTeamSpecific === "boolean") {
      skipped++;
      continue;
    }

    const value = computeIsTeamSpecific(data);
    console.log(
      `${dryRun ? "[dry-run] " : ""}${doc.id} (${data.title || "untitled"}) -> isTeamSpecific: ${value}`
    );

    if (!dryRun) {
      batch.update(doc.ref, { isTeamSpecific: value });
      pending++;

      if (pending >= BATCH_LIMIT) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }
    updated++;
  }

  if (!dryRun && pending > 0) {
    await batch.commit();
  }

  console.log(
    `\nDone. ${dryRun ? "Would update" : "Updated"}: ${updated} | Skipped: ${skipped}`
  );
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});