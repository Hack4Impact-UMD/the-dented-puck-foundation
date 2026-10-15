// Adds the test data in seed.json to Cloud Firestore without deleting anything.
//
// Setup (run from the repo root, with seed.json next to this script):
//   npm install --save-dev firebase-admin --legacy-peer-deps
//   node scripts/seed-firestore.mjs path/to/serviceAccountKey.json
//
// To try it safely against the local emulator instead (no key needed):
//   FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/seed-firestore.mjs --emulator <project-id>

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const [arg1, arg2] = process.argv.slice(2);
if (!arg1) {
  console.error("Usage: node seed-firestore.mjs <serviceAccountKey.json>\n" +
                "   or: node seed-firestore.mjs --emulator <project-id>");
  process.exit(1);
}
if (arg1 === "--emulator") {
  if (!process.env.FIRESTORE_EMULATOR_HOST) process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  initializeApp({ projectId: arg2 ?? "demo-dented-puck" });
} else {
  initializeApp({ credential: cert(JSON.parse(readFileSync(arg1, "utf8"))) });
}

const db = getFirestore();
const here = dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(join(here, "seed.json"), "utf8"));

// ISO strings with mixed offsets don't sort correctly; Firestore Timestamps do.
const ts = (iso) => Timestamp.fromDate(new Date(iso));

const writes = []; // [docPath, data]
for (const [key, u] of Object.entries(seed.Users)) writes.push([`Users/${key}`, u]);
for (const [key, t] of Object.entries(seed.Teams)) writes.push([`Teams/${key}`, t]);
for (const [key, m] of Object.entries(seed.UserToTeam)) writes.push([`UserToTeam/${key}`, m]);
for (const [key, e] of Object.entries(seed.Events)) {
  writes.push([`Events/${key}`, { ...e, startTime: ts(e.startTime), endTime: ts(e.endTime) }]);
}
for (const [key, c] of Object.entries(seed.Conversations)) {
  const { messages, ...meta } = c;
  // Messages go in a subcollection so loading a conversation list doesn't pull every message.
  writes.push([`Conversations/${key}`, meta]);
  for (const [msgKey, m] of Object.entries(messages)) {
    writes.push([`Conversations/${key}/messages/${msgKey}`, { ...m, timeSent: ts(m.timeSent) }]);
  }
}

// Firestore batches hold at most 500 writes.
for (let i = 0; i < writes.length; i += 500) {
  const batch = db.batch();
  for (const [path, data] of writes.slice(i, i + 500)) batch.set(db.doc(path), data, { merge: true });
  await batch.commit();
}
console.log(`Wrote ${writes.length} documents.`);
