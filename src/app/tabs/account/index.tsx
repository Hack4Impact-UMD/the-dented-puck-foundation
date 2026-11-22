import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router, type Href } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Pencil, User } from 'lucide-react-native';
import { auth } from '@/firebase';
import { useProfile, useUploadPhoto } from '@/hooks/useProfile';
import { announce } from '@/utils/accessibility';
import { ageFromBirthday, formatPhone } from '@/utils/profileFormat';

type FieldKey = 'name' | 'gender' | 'age' | 'email' | 'phone' | 'usaHockey' | 'locationAccess';
type Field = { key: FieldKey; label: string; value?: string };

const ROUTES: Record<FieldKey, Href> = {
  name: '/tabs/account/name',
  gender: '/tabs/account/gender',
  age: '/tabs/account/birthday',
  email: '/tabs/account/email',
  phone: '/tabs/account/phone',
  usaHockey: '/tabs/account/hockey',
  locationAccess: '/tabs/account/location',
};

function DetailRow({ field, onPress }: { field: Field; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${field.label}, ${field.value || 'not added'}`}
      className="flex-row items-center py-3.5 active:opacity-60"
    >
      <Text className="text-xl font-sans-bold text-white">{field.label}</Text>
      <View className="flex-1 flex-row items-center justify-end">
        {field.value ? <Text className="mr-2 text-lg font-sans text-white">{field.value}</Text> : null}
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <ChevronRight color="#FFFFFF" size={20} />
        </View>
      </View>
    </Pressable>
  );
}

export default function AccountScreen() {
  const { data: profile, status } = useProfile();
  const uploadPhoto = useUploadPhoto();
  const queryClient = useQueryClient();
  const [photoError, setPhotoError] = useState<string>();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string>();

  if (!auth.currentUser) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6">
        <Text className="text-center text-lg font-sans text-white">Sign in to see your account.</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6">
        <Text className="text-center text-lg font-sans text-white">Couldn&apos;t load your account. Try again later.</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();

  const fields: Field[] = [
    { key: 'name', label: 'Name', value: fullName },
    { key: 'gender', label: 'Gender', value: profile.gender },
    { key: 'age', label: 'Age', value: ageFromBirthday(profile.birthDate) },
    { key: 'email', label: 'Email', value: profile.email },
    { key: 'phone', label: 'Phone #', value: formatPhone(profile.phoneNumber ?? '') },
    { key: 'usaHockey', label: 'USA Hockey #', value: profile.usaHockeyNumber ?? undefined },
    {
      key: 'locationAccess',
      label: 'Location Access',
      value: profile.allowLocation === undefined ? undefined : profile.allowLocation ? 'Yes' : 'No',
    },
  ];

  const onEditPhoto = async () => {
    setPhotoError(undefined);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      setPhotoError("Couldn't read that photo. Try another one.");
      return;
    }
    uploadPhoto.mutate(
      { base64: asset.base64, mimeType: asset.mimeType ?? 'image/jpeg' },
      {
        onSuccess: () => announce('Profile photo updated'),
        onError: () => {
          setPhotoError("Couldn't upload your photo. Try again.");
          announce("Couldn't upload your photo");
        },
      },
    );
  };

  const onLogOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError(undefined);
    try {
      await signOut(auth);
      router.replace('/auth/login');
      queryClient.removeQueries({ queryKey: ['profile'] });
    } catch {
      setLogoutError("Couldn't log out. Try again.");
      announce("Couldn't log out");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-black">
      <ScrollView contentContainerClassName="px-4 pb-8" showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" className="mt-4 text-center text-3xl font-sans-bold text-white">
          {fullName || 'Account'}
        </Text>

        <View className="mt-8 items-center">
          <Pressable
            onPress={onEditPhoto}
            disabled={uploadPhoto.isPending}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            accessibilityState={{ busy: uploadPhoto.isPending }}
            className="w-24"
          >
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-neutral-600">
                {uploadPhoto.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : profile.photoURL ? (
                  <Image source={{ uri: profile.photoURL }} className="h-full w-full" />
                ) : (
                  <User color="#E5C9A8" size={48} />
                )}
              </View>
              <View className="-mt-8 ml-16 h-8 w-8 items-center justify-center rounded-full bg-brand">
                <Pencil color="#000000" size={16} />
              </View>
            </View>
          </Pressable>
          {photoError ? (
            <Text accessibilityRole="alert" className="mt-3 text-center text-base font-sans text-red-400">
              {photoError}
            </Text>
          ) : null}
        </View>

        <View className="mt-8">
          {fields.map((field) => (
            <DetailRow key={field.key} field={field} onPress={() => router.push(ROUTES[field.key])} />
          ))}
        </View>

        <Pressable
          onPress={onLogOut}
          disabled={loggingOut}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          accessibilityState={{ busy: loggingOut }}
          className="mt-6 items-center justify-center rounded-sm bg-brand py-4 active:opacity-80"
        >
          {loggingOut ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text className="text-[22px] font-sans-bold leading-7 text-black">Log out</Text>
          )}
        </Pressable>
        {logoutError ? (
          <Text accessibilityRole="alert" className="mt-3 text-center text-base font-sans text-red-400">
            {logoutError}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
