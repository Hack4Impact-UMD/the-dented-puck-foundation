import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type RulesTestEnvironment, initializeTestEnvironment } from "@firebase/rules-unit-testing";

// Matches .firebaserc and the `npm test` script. "demo-" projects only exist in the emulators.
export const PROJECT_ID = "demo-dented-puck";

// A valid new profile in main's User schema (src/types/index.ts), minus the email.
export const profile = { role: "player", username: "maya.thompson", region: "Maryland", age: 12, phoneNumber: "(410) 555-0109" };

// Refuse to run unless `firebase emulators:exec` set these, so tests never touch a real project.
export function emulatorHost(name: "FIRESTORE_EMULATOR_HOST" | "FIREBASE_AUTH_EMULATOR_HOST"): string {
  const host = process.env[name];
  if (!host) throw new Error(`${name} is not set. Run these tests with \`npm test\` from firebase-tests/.`);
  return host;
}

// Loads firestore.rules into the Firestore emulator and gives access that bypasses them.
export async function initRulesEnv(): Promise<RulesTestEnvironment> {
  const [host, port] = emulatorHost("FIRESTORE_EMULATOR_HOST").split(":");
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host, port: Number(port), rules: readFileSync(resolve(__dirname, "../../firestore.rules"), "utf8") },
  });
}

export async function clearAuthEmulator(): Promise<void> {
  const auth = emulatorHost("FIREBASE_AUTH_EMULATOR_HOST");
  await fetch(`http://${auth}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: "DELETE" });
}

// The Auth emulator "sends" verification emails by storing the out-of-band code instead.
export async function getVerifyEmailCode(email: string): Promise<string> {
  const auth = emulatorHost("FIREBASE_AUTH_EMULATOR_HOST");
  const res = await fetch(`http://${auth}/emulator/v1/projects/${PROJECT_ID}/oobCodes`);
  const { oobCodes } = (await res.json()) as { oobCodes: { email: string; oobCode: string; requestType: string }[] };
  const code = oobCodes.find((c) => c.email === email && c.requestType === "VERIFY_EMAIL");
  if (!code) throw new Error(`No verification email was sent to ${email}`);
  return code.oobCode;
}
