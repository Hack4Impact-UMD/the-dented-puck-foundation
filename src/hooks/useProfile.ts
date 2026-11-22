import { useState } from 'react';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auth } from '@/firebase';
import {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  type Profile,
} from '@/services/profileService';
import { announce } from '@/utils/accessibility';

export const profileKey = (uid?: string) => ['profile', uid] as const;

export function useProfile() {
  const uid = auth.currentUser?.uid;
  return useQuery({
    queryKey: profileKey(uid),
    enabled: !!uid,
    queryFn: () => getProfile(uid!),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const uid = auth.currentUser?.uid;
  return useMutation({
    mutationFn: (changes: Partial<Profile>) => updateProfile(uid!, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey(uid) }),
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  const uid = auth.currentUser?.uid;
  return useMutation({
    mutationFn: (photo: { base64: string; mimeType: string }) => uploadProfilePhoto(uid!, photo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey(uid) }),
  });
}

// Save, announce for screen readers, and return to Account.
export function useSaveProfile(successMessage: string) {
  const update = useUpdateProfile();
  const [saveError, setSaveError] = useState<string>();

  const save = (changes: Partial<Profile>) => {
    setSaveError(undefined);
    update.mutate(changes, {
      onSuccess: () => {
        announce(successMessage);
        router.back();
      },
      onError: (error) => {
        console.error('Failed to save profile changes', error);
        setSaveError("Couldn't save your changes. Try again.");
      },
    });
  };

  return { save, isSaving: update.isPending, saveError };
}
