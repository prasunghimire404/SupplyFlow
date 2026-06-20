import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function NotFoundScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <View className="flex-1 items-center justify-center px-6">
      <Text
        className="text-white text-2xl font-bold mb-2"
        style={{ fontFamily: "DMSans_700Bold" }}
      >
        This page didn't load
      </Text>
      <Text
        className="text-text-secondary text-center mb-6"
        style={{ fontFamily: "DMSans_400Regular" }}
      >
        Something went wrong on our end. You can try refreshing or head back
        home.
      </Text>
      <View className="flex-row space-x-3">
        <Pressable
          onPress={() => router.replace("/")}
          className="bg-primary rounded-xl px-6 py-3"
        >
          <Text
            className="text-white font-medium"
            style={{ fontFamily: "DMSans_500Medium" }}
          >
            Try again
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace("/")}
          className="bg-surface-light border border-border rounded-xl px-6 py-3"
        >
          <Text
            className="text-white font-medium"
            style={{ fontFamily: "DMSans_500Medium" }}
          >
            Go home
          </Text>
        </Pressable>
      </View>
      </View>
    </SafeAreaView>
  );
}
