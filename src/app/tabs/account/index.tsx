import { Image, Pressable, Text, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Pencil, User } from 'lucide-react-native';

type FieldKey = "name" | "gender" | "age" | "email" | "phone" | "usaHockey" | "locationAccess"

type Field = {key : FieldKey; label : string; value?: string}

// temp info before pulling from firebase
const user = {
  name: 'Jordan Lee',
  photoUri: undefined as string | undefined,
  gender: 'Male',
  age: '24',
  email: 'jordan.lee@example.com',
  phone: '123-456-7890',
  usaHockey: '128',
  locationAccess: 'Yes',
};

const fields: Field[] = [
  { key: 'name', label: 'Name', value: user.name },
  { key: 'gender', label: 'Gender', value: user.gender },
  { key: 'age', label: 'Age', value: user.age },
  { key: 'email', label: 'Email', value: user.email },
  { key: 'phone', label: 'Phone #', value: user.phone },
  { key: 'usaHockey', label: 'USA Hockey #', value: user.usaHockey },
  { key: 'locationAccess', label: 'Location Access', value: user.locationAccess },
];

function DetailRow({field, onPress}: {field: Field; onPress: () => void}) {
  return (
    <Pressable 
    onPress={onPress}
    accessible
    accessibilityRole="button"
    accessibilityLabel={`${field.label}, ${field.value || 'not added'}`}
    className="flex-row items-center py-3.5 active:opacity-60">
      <Text className="text-xl font-bold text-white">{field.label}</Text>
      <View className="flex-1 flex-row items-center justify-end">
        {field.value ? (<Text className="mr-2 text-lg text-white">{field.value}</Text>) : null}
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
        <ChevronRight color="#FFFFFF" size={20} />
        </View>
      </View>
    </Pressable>
  );
}

export default function AccountScreen() {
  const onEditPhoto = () => {
    // To Do: photo selection for profile picture
  }

  const onEditField = (key: FieldKey) => {
    // To Do: Navigate to edit page 
  }

  const onLogOut = () => {
    // To Do: signout 
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-black">
      <ScrollView
        contentContainerClassName="px-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        <Text
          accessibilityRole="header"
          className="mt-4 text-center text-3xl font-bold text-white"
        >
          {user.name}
        </Text>

        <View className="mt-8 items-center">
          <Pressable
            onPress={onEditPhoto}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            className="w-24"
          >
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-neutral-600">
                {user.photoUri ? (
                  <Image source={{ uri: user.photoUri }} className="h-full w-full" />
                ) : (
                  <User color="#E5C9A8" size={48} />
                )}
              </View>
              <View className="-mt-8 ml-16 h-8 w-8 items-center justify-center rounded-full bg-[#F8D348]">
                 <Pencil color="#000000" size={16} />
              </View>
            </View>
          </Pressable>
        </View>

        <View className="mt-8">
          {fields.map((field) => (
            <DetailRow
              key={field.key}
              field={field}
              onPress={() => onEditField(field.key)}
            />
          ))}
        </View>

        <Pressable
          onPress={onLogOut}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          className="mt-6 items-center justify-center rounded-sm bg-[#F8D348] py-4 active:opacity-80"
        >
          <Text className="text-xl font-bold text-black">Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
