// End to end: real sign-ins against the Auth emulator, then the profile write the app will
// make, checked by firestore.rules in the Firestore emulator.
import { type RulesTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { deleteApp, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  applyActionCode,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  signInAnonymously,
  signInWithCredential,
} from "firebase/auth";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore/lite";
import { clearAuthEmulator, emulatorHost, getVerifyEmailCode, initRulesEnv, PROJECT_ID, profile } from "./helpers";

let rulesEnv: RulesTestEnvironment;
let clientCount = 0;
let client: ReturnType<typeof createClient>;

// The same Firebase JS SDK the app uses, pointed at the emulators.
function createClient() {
  const app = initializeApp({ apiKey: "fake-api-key", projectId: PROJECT_ID }, `client-${clientCount++}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${emulatorHost("FIREBASE_AUTH_EMULATOR_HOST")}`, { disableWarnings: true });
  const db = getFirestore(app);
  const [host, port] = emulatorHost("FIRESTORE_EMULATOR_HOST").split(":");
  connectFirestoreEmulator(db, host, Number(port));
  return { app, auth, db };
}

// The Auth emulator accepts an unsigned JSON string in place of a Google ID token.
async function signInWithGoogle(email = "maya.thompson@gmail.com", emailVerified = true) {
  const credential = GoogleAuthProvider.credential(JSON.stringify({ sub: `google-${email}`, email, email_verified: emailVerified }));
  return (await signInWithCredential(client.auth, credential)).user;
}

function writeProfile(uid: string, data: object) {
  return setDoc(doc(client.db, "Users", uid), data);
}

// Reads the doc with rules bypassed, like the Firebase Console would.
async function storedProfile(uid: string) {
  let data: unknown;
  await rulesEnv.withSecurityRulesDisabled(async (ctx) => {
    data = (await ctx.firestore().doc(`Users/${uid}`).get()).data();
  });
  return data;
}

beforeAll(async () => {
  rulesEnv = await initRulesEnv();
});

beforeEach(async () => {
  await Promise.all([rulesEnv.clearFirestore(), clearAuthEmulator()]);
  client = createClient();
});

afterEach(async () => {
  await deleteApp(client.app);
});

afterAll(async () => {
  await rulesEnv.cleanup();
});

describe("signing up", () => {
  it("lets a Google user create and read their player profile", async () => {
    const user = await signInWithGoogle();
    const data = { ...profile, email: user.email };

    await assertSucceeds(writeProfile(user.uid, data));

    expect((await getDoc(doc(client.db, "Users", user.uid))).data()).toEqual(data);
  });

  it("blocks signed-out users", async () => {
    await assertFails(writeProfile("someone", { ...profile, email: "someone@example.com" }));
  });

  it("blocks a Google account whose email isn't verified", async () => {
    const user = await signInWithGoogle("unverified@example.com", false);

    await assertFails(writeProfile(user.uid, { ...profile, email: user.email }));
    expect(await storedProfile(user.uid)).toBeUndefined();
  });

  it("blocks anonymous sign-in", async () => {
    const { user } = await signInAnonymously(client.auth);

    await assertFails(writeProfile(user.uid, { ...profile, email: "anon@example.com" }));
  });

  it("blocks email/password users, even after they verify their email", async () => {
    const { user } = await createUserWithEmailAndPassword(client.auth, "denise@example.com", "correct-horse-battery");
    await sendEmailVerification(user);
    await applyActionCode(client.auth, await getVerifyEmailCode("denise@example.com"));
    await user.reload();
    await user.getIdToken(true);
    expect(user.emailVerified).toBe(true);

    await assertFails(writeProfile(user.uid, { ...profile, email: user.email }));
    expect(await storedProfile(user.uid)).toBeUndefined();
  });

  it("blocks choosing a role other than player", async () => {
    const user = await signInWithGoogle();

    await assertFails(writeProfile(user.uid, { ...profile, role: "global-admin", email: user.email }));
  });

  it("blocks an email that doesn't match the signed-in account", async () => {
    const user = await signInWithGoogle();

    await assertFails(writeProfile(user.uid, { ...profile, email: "someone.else@example.com" }));
  });

  it("blocks overwriting an existing profile", async () => {
    const user = await signInWithGoogle();
    const data = { ...profile, email: user.email };
    await writeProfile(user.uid, data);

    await assertFails(writeProfile(user.uid, { ...data, username: "new.name" }));
    expect(await storedProfile(user.uid)).toEqual(data);
  });

  it("blocks creating a profile for someone else", async () => {
    const user = await signInWithGoogle();

    await assertFails(writeProfile("someone-else", { ...profile, email: user.email }));
  });
});
