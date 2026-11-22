import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
} from 'firebase/auth';
import { auth } from '@/firebase';

export async function startEmailChange(newEmail: string, password: string) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('not-signed-in');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  await verifyBeforeUpdateEmail(user, newEmail);
}

export async function resendEmailChange(newEmail: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('not-signed-in');
  await verifyBeforeUpdateEmail(user, newEmail);
}

export async function isEmailChangeComplete(newEmail: string) {
  const user = auth.currentUser;
  if (!user) return false;
  await user.reload();
  return user.email?.toLowerCase() === newEmail.toLowerCase();
}

export function errorCode(error: unknown): string | undefined {
  return (error as { code?: string } | null)?.code;
}
