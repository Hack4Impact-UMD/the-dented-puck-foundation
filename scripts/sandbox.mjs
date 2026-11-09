import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { seedSandbox, settings } from './seed-sandbox.mjs';
import { sandboxLanHost } from './sandbox-network.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const children = [];
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children.reverse()) {
    if (!child.pid || child.exitCode !== null) continue;
    try {
      if (child.sandboxProcessGroup) process.kill(-child.pid, 'SIGINT');
      else child.kill('SIGINT');
    } catch { /* Already exited. */ }
  }
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

function launch(command, args, env = process.env, ownGroup = true) {
  const sandboxProcessGroup = ownGroup && process.platform !== 'win32';
  const child = spawn(command, args, { cwd: root, env, stdio: 'inherit', detached: sandboxProcessGroup });
  child.sandboxProcessGroup = sandboxProcessGroup;
  children.push(child);
  return child;
}

async function assertPortFree(port) {
  const server = createServer();
  server.listen(port, '0.0.0.0');
  try { await once(server, 'listening'); }
  catch { throw new Error(`Port ${port} is already in use. Stop the previous sandbox before restarting.`); }
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function start() {
  for (const port of [settings.authPort, settings.firestorePort, settings.uiPort, 4400, 4500, 9150, settings.expoPort]) {
    await assertPortFree(port);
  }
  console.log(`Starting isolated Firebase sandbox (${settings.projectId}). No cloud credentials are used.`);
  const firebase = launch('firebase', [
    'emulators:start', '--only', 'auth,firestore', '--project', settings.projectId,
    '--config', 'firebase.sandbox.json',
  ]);
  firebase.on('error', () => { console.error('Firebase CLI could not start. Install it separately; see docs/sandbox.md.'); stop(1); });
  firebase.on('exit', (code) => { if (!stopping) stop(code || 1); });

  let ready = false;
  const deadline = Date.now() + 120_000;
  while (!stopping && Date.now() < deadline) {
    try {
      const response = await fetch('http://127.0.0.1:4400/emulators', { signal: AbortSignal.timeout(1000) });
      const emulators = await response.json();
      if (emulators.auth?.port === settings.authPort && emulators.firestore?.port === settings.firestorePort) { ready = true; break; }
    } catch { /* Wait for both emulators, including Firestore's rules compilation. */ }
    await delay(500);
  }
  if (stopping) return;
  if (!ready) throw new Error('Firebase emulators did not become ready within two minutes.');
  await seedSandbox();
  if (stopping) return;
  const lanHost = sandboxLanHost();
  console.log(`\n${lanHost ? `Phone (open manually in Expo Go): exp://${lanHost}:${settings.expoPort}\n` : ''}Web (open manually): http://localhost:${settings.expoPort}\nDatabase (open manually): http://localhost:${settings.uiPort}/firestore/default/data\nTap "Fake login (dev)" on the Home sign-in prompt. Ctrl+C stops the sandbox.\n`);
  const extraArgs = process.argv.slice(2);
  const expo = launch(process.execPath, [
    fileURLToPath(new URL('../node_modules/expo/bin/cli', import.meta.url)),
    'start', '--port', String(settings.expoPort), ...(extraArgs.length ? extraArgs : ['--lan']),
  ], {
    ...process.env,
    ...(lanHost ? { REACT_NATIVE_PACKAGER_HOSTNAME: lanHost } : {}),
    EXPO_PUBLIC_FIREBASE_SANDBOX: '1', EXPO_NO_DOTENV: '1',
  }, false);
  expo.on('error', (error) => { console.error(error.message); stop(1); });
  expo.on('exit', (code) => { if (!stopping) stop(code || 0); });
}

start().catch((error) => { console.error(error.message); stop(1); });
