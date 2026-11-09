import { networkInterfaces } from 'node:os';

/** Prefer a LAN interface over VPNs/virtual adapters for the phone's Metro URL.
 * One explicit host override applies to both Metro and Firebase emulators.
 */
export function sandboxLanHost(env = process.env, interfaces = networkInterfaces()) {
  const explicit = env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || env.REACT_NATIVE_PACKAGER_HOSTNAME;
  if (explicit) return explicit;
  const candidates = Object.entries(interfaces).flatMap(([name, addresses]) =>
    (addresses ?? []).filter((address) => !address.internal && address.family === 'IPv4' &&
      /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address.address) &&
      !/utun|\btun|\btap|vpn|docker|veth|bridge|vbox|vmnet/i.test(name))
      .map((address) => ({ name, address: address.address })),
  );
  candidates.sort((a, b) => Number(!/^(en\d+|eth\d+|wlan\d+|wi-fi|ethernet)/i.test(a.name)) - Number(!/^(en\d+|eth\d+|wlan\d+|wi-fi|ethernet)/i.test(b.name)));
  return candidates[0]?.address;
}
