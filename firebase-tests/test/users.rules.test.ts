// Every Users rule, checked with fake ID tokens. signup.test.ts covers real sign-ins.
import { type RulesTestEnvironment, type TokenOptions, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { initRulesEnv, profile } from "./helpers";

const email = "alice@example.com";
const alice = { ...profile, email };
const googleToken: TokenOptions = { email, email_verified: true, firebase: { sign_in_provider: "google.com" } };

let rulesEnv: RulesTestEnvironment;

beforeAll(async () => {
  rulesEnv = await initRulesEnv();
});

beforeEach(async () => {
  await rulesEnv.clearFirestore();
});

afterAll(async () => {
  await rulesEnv.cleanup();
});

function aliceDb(token: TokenOptions = googleToken) {
  return rulesEnv.authenticatedContext("alice", token).firestore();
}

describe("creating a profile", () => {
  it("accepts a valid profile", async () => {
    await assertSucceeds(aliceDb().doc("Users/alice").set(alice));
  });

  it.each<[string, TokenOptions]>([
    ["an unverified Google email", { ...googleToken, email_verified: false }],
    ["verified email/password sign-in", { ...googleToken, firebase: { sign_in_provider: "password" } }],
    ["phone sign-in", { ...googleToken, firebase: { sign_in_provider: "phone" } }],
    ["anonymous sign-in", { firebase: { sign_in_provider: "anonymous" } }],
  ])("rejects %s", async (_, token) => {
    await assertFails(aliceDb(token).doc("Users/alice").set(alice));
  });

  it.each([
    ["role", "team-staff"],
    ["email", "ALICE@example.com"],
    ["username", "ab"],
    ["username", "a".repeat(31)],
    ["username", "Alice"],
    ["username", "has space"],
    ["username", 42],
    ["region", ""],
    ["region", "   "],
    ["region", "x".repeat(65)],
    ["age", 0],
    ["age", 121],
    ["age", 12.5],
    ["age", "12"],
    ["phoneNumber", "555-0109"],
    ["phoneNumber", "1".repeat(16)],
    ["phoneNumber", "(410) 555-0109" + " ".repeat(20)],
    ["phoneNumber", 4105550109],
  ])("rejects %s = %p", async (field, value) => {
    await assertFails(aliceDb().doc("Users/alice").set({ ...alice, [field]: value }));
  });

  it.each(["role", "username", "region", "age", "email", "phoneNumber"])("rejects a profile missing %s", async (field) => {
    const { [field as keyof typeof alice]: _, ...rest } = alice;
    await assertFails(aliceDb().doc("Users/alice").set(rest));
  });

  it.each(["linkedPlayerId", "createdAt"])("rejects the extra field %s", async (field) => {
    await assertFails(aliceDb().doc("Users/alice").set({ ...alice, [field]: "x" }));
  });
});

describe("existing profiles", () => {
  beforeEach(async () => {
    await rulesEnv.withSecurityRulesDisabled((ctx) => ctx.firestore().doc("Users/alice").set(alice));
  });

  it("lets a verified user read their own profile", async () => {
    await assertSucceeds(aliceDb().doc("Users/alice").get());
  });

  it("blocks reading your own profile before the email is verified", async () => {
    await assertFails(aliceDb({ ...googleToken, email_verified: false }).doc("Users/alice").get());
  });

  it("blocks reading someone else's profile", async () => {
    const bob = rulesEnv.authenticatedContext("bob", { ...googleToken, email: "bob@example.com" }).firestore();
    await assertFails(bob.doc("Users/alice").get());
  });

  it("blocks signed-out reads", async () => {
    await assertFails(rulesEnv.unauthenticatedContext().firestore().doc("Users/alice").get());
  });

  it("blocks changing your own role", async () => {
    await assertFails(aliceDb().doc("Users/alice").update({ role: "global-admin" }));
  });

  it("blocks deleting your profile", async () => {
    await assertFails(aliceDb().doc("Users/alice").delete());
  });
});

describe("other collections", () => {
  it("are denied until they have rules", async () => {
    await assertFails(aliceDb().doc("Teams/team_201").get());
    await assertFails(aliceDb().doc("Teams/team_201").set({ name: "Harbor Hawks" }));
  });
});
