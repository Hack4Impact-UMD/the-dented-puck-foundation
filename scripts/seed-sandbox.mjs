import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createSandboxFixtures } from '../sandbox/fixtures.mjs';

export const settings = JSON.parse(await readFile(new URL('../src/config/sandboxSettings.json', import.meta.url), 'utf8'));
// Fixed loopback endpoints and a demo project: this seed cannot target cloud Firestore.
if (!settings.projectId.startsWith('demo-')) throw new Error('Sandbox seeding requires a demo- project ID.');

async function request(url, body, admin = false) {
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(admin ? { Authorization: 'Bearer owner' } : {}) },
    body: JSON.stringify(body), signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? `Sandbox request failed: ${response.status}`);
  return data;
}

function firestoreValue(value) {
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  if (value && typeof value === 'object') return { mapValue: { fields: firestoreFields(value) } };
  throw new Error('Unsupported sandbox fixture value.');
}
function firestoreFields(data) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, firestoreValue(value)]));
}

export async function seedSandbox({ authPort = settings.authPort, firestorePort = settings.firestorePort } = {}) {
  // Tests can use separate local emulator ports without changing a running demo.
  if (![authPort, firestorePort].every((port) => Number.isInteger(port) && port > 0 && port <= 65535)) {
    throw new Error('Invalid local emulator port.');
  }
  const authOrigin = `http://127.0.0.1:${authPort}`;
  const firestoreOrigin = `http://127.0.0.1:${firestorePort}`;
  const account = { email: settings.email, password: settings.password, returnSecureToken: true };
  let user;
  try {
    user = await request(`${authOrigin}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=sandbox-only-api-key`, account);
  } catch (error) {
    if (error.message !== 'EMAIL_EXISTS') throw error;
    user = await request(`${authOrigin}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=sandbox-only-api-key`, account);
  }
  await request(`${authOrigin}/identitytoolkit.googleapis.com/v1/accounts:update?key=sandbox-only-api-key`, {
    idToken: user.idToken, displayName: settings.name,
  });
  const fixtures = createSandboxFixtures(settings);
  const prefix = `projects/${settings.projectId}/databases/(default)/documents`;
  const documents = [
    [`Users/${user.localId}`, {
      age: 28, email: settings.email, 'phone-number': '', regionId: 1,
      role: 'player', userId: 1, username: settings.name,
    }],
    [`SandboxViewers/${user.localId}`, fixtures.viewer],
    ...['schedule', 'upcoming'].flatMap((section) => fixtures[section].map(({ id, ...data }) =>
      [`SandboxViewers/${user.localId}/${section}/${id}`, data])),
  ];
  await request(`${firestoreOrigin}/v1/projects/${settings.projectId}/databases/(default)/documents:commit`, {
    writes: documents.map(([path, data]) => ({ update: { name: `${prefix}/${path}`, fields: firestoreFields(data) } })),
  }, true);
  console.log(`Sandbox seeded: ${fixtures.schedule.filter((event) => event.startTime > new Date()).length} scheduled events, ${fixtures.upcoming.length} discovery events. Login: ${settings.email}`);
  return { uid: user.localId, fixtures };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  seedSandbox().catch((error) => {
    console.error(`Sandbox seed failed: ${error.message}. Start the emulators with npm run sandbox.`);
    process.exitCode = 1;
  });
}
