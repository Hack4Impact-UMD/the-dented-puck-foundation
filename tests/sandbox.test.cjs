const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createLoader } = require('./helpers/load-sandbox.cjs');

function config({ dev = true, flag, os = 'ios', hostUri, override, webHost } = {}) {
  global.__DEV__ = dev;
  if (flag === undefined) delete process.env.EXPO_PUBLIC_FIREBASE_SANDBOX;
  else process.env.EXPO_PUBLIC_FIREBASE_SANDBOX = flag;
  if (override === undefined) delete process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;
  else process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST = override;
  if (webHost) global.window = { location: { hostname: webHost } };
  else delete global.window;
  return createLoader({ 'expo-constants': { expoConfig: { hostUri } }, 'react-native': { Platform: { OS: os } } })('src/config/sandbox.ts');
}

test('sandbox requires an explicit development flag and refuses a production preview', () => {
  assert.equal(config().isSandbox, false);
  assert.equal(config({ flag: '1' }).isSandbox, true);
  assert.equal(config({ dev: false }).isSandbox, false);
  assert.throws(() => config({ dev: false, flag: '1' }), /only available in development/);
});

test('emulator addressing supports web, a LAN phone, and Android/iOS simulators', () => {
  assert.equal(config({ os: 'web', webHost: 'localhost' }).sandboxHost(), 'localhost');
  assert.equal(config({ os: 'ios', hostUri: '192.168.1.42:8082' }).sandboxHost(), '192.168.1.42');
  assert.equal(config({ os: 'android', hostUri: '127.0.0.1:8082' }).sandboxHost(), '10.0.2.2');
  assert.equal(config({ os: 'ios' }).sandboxHost(), '127.0.0.1');
  assert.equal(config({ override: '192.168.1.7' }).sandboxHost(), '192.168.1.7');
});

test('fixture feeds separate affiliations, private events, and regions with stable IDs', async () => {
  const { createSandboxFixtures, teams } = await import('../sandbox/fixtures.mjs');
  const settings = require('../src/config/sandboxSettings.json');
  const now = new Date('2026-11-05T12:00:00Z');
  const first = createSandboxFixtures(settings, now);
  const second = createSandboxFixtures(settings, now);
  assert.equal(first.schedule.filter((event) => event.startTime > now).length, 8);
  assert.equal(first.upcoming.length, 26);
  assert.deepEqual(first, second);
  assert.ok(first.schedule.some((event) => event.teams.some((team) => team.id === teams.crew.id)));
  assert.ok(first.schedule.some((event) => event.teams.length === 2));
  const affiliated = new Set([...first.viewer.teamIds, ...first.viewer.followedTeamIds]);
  assert.ok(first.upcoming.every((event) => event.region === first.viewer.region && event.isPublic && !event.isTeamSpecific && event.teams.every((team) => !affiliated.has(team.id))));
  assert.ok(!first.upcoming.some((event) => ['other-region', 'private-away', 'unknown-team', 'past-practice'].includes(event.id)));
});

test('dev sign-in and the sandbox adapter refuse a real Firebase app', async () => {
  const load = createLoader({
    '@/config/sandbox': { isSandbox: false, sandboxSettings: require('../src/config/sandboxSettings.json') },
    '@/firebase': { auth: {}, db: { app: { options: { projectId: 'real-project' } } } },
    '@/services/homeService': {},
  });
  const service = load('src/services/sandboxService.ts');
  await assert.rejects(service.signInToSandbox(), /Start the local sandbox/);
  assert.throws(() => service.createSandboxHomeSource(), /Start the local sandbox/);
});

test('phone URLs use a physical LAN adapter and share the explicit emulator host override', async () => {
  const { sandboxLanHost } = await import('../scripts/sandbox-network.mjs');
  const address = (value, internal = false) => [{ address: value, family: 'IPv4', internal }];
  const interfaces = { lo0: address('127.0.0.1', true), utun2: address('172.17.12.53'), bridge100: address('192.168.64.1'), en0: address('192.168.1.41') };
  assert.equal(sandboxLanHost({}, interfaces), '192.168.1.41');
  assert.equal(sandboxLanHost({ EXPO_PUBLIC_FIREBASE_EMULATOR_HOST: '192.168.1.7' }, interfaces), '192.168.1.7');
  assert.equal(sandboxLanHost({ REACT_NATIVE_PACKAGER_HOSTNAME: '192.168.1.8' }, interfaces), '192.168.1.8');
  assert.equal(sandboxLanHost({}, { 'Wi-Fi': address('10.0.0.12') }), '10.0.0.12');
  assert.equal(sandboxLanHost({}, { utun0: address('172.17.12.53'), lo0: address('127.0.0.1', true) }), undefined);
});
