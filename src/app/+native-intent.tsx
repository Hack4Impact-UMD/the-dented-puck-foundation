// Expo Router calls this for every link that opens the app. Firebase's password reset email links to
// https://<project>.firebaseapp.com/__/auth/links?link=<the actual action link>, and that action link
// carries mode=resetPassword and oobCode.
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  try {
    const url = new URL(path, "https://placeholder.invalid");
    const actionLink = url.searchParams.get("link");
    const params = actionLink
      ? new URL(actionLink).searchParams
      : url.searchParams;
    const code = params.get("oobCode");

    if (params.get("mode") === "resetPassword" && code) {
      return `/auth/reset-password?oobCode=${encodeURIComponent(code)}`;
    }
    return path;
  } catch {
    return path;
  }
}
