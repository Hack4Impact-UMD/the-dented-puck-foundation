const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createLoader } = require('./helpers/load-sandbox.cjs');

function locationService({ permission = 'granted', services = true, coords = { latitude: 39.4143, longitude: -77.4105 }, fail = false } = {}) {
  const calls = [];
  const service = createLoader({ 'expo-location': {
    Accuracy: { Balanced: 3 },
    async requestForegroundPermissionsAsync() { calls.push('permission'); return { status: permission }; },
    async hasServicesEnabledAsync() { calls.push('services'); return services; },
    async getCurrentPositionAsync(options) { calls.push(options); if (fail) throw new Error('Position unavailable'); return { coords }; },
  } })('src/services/discoveryLocationService.ts');
  return { ...service, calls };
}

test('device coordinates come from a foreground permission and current position request', async () => {
  const { requestDiscoveryLocation, calls } = locationService();
  assert.deepEqual(await requestDiscoveryLocation(), { latitude: 39.4143, longitude: -77.4105, label: 'your current location', source: 'device' });
  assert.deepEqual(calls, ['permission', 'services', { accuracy: 3 }]);
});

test('denial and disabled services stop before the position request, preserving manual fallback', async () => {
  for (const config of [{ permission: 'denied' }, { services: false }]) {
    const { requestDiscoveryLocation, calls } = locationService(config);
    await assert.rejects(requestDiscoveryLocation(), /[Cc]hoose a city/);
    assert.ok(!calls.some((call) => typeof call === 'object'));
  }
});

test('invalid coordinates and unavailable positions cannot become the discovery origin', async () => {
  await assert.rejects(locationService({ coords: { latitude: NaN, longitude: 0 } }).requestDiscoveryLocation(), /unavailable location/);
  await assert.rejects(locationService({ fail: true }).requestDiscoveryLocation(), /Position unavailable/);
});
