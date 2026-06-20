import { Platform, StatusBar as RNStatusBar, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar"; // <-- ADD THIS IMPORT
import { STATUS_BAR_BACKGROUND } from "@/components/screen-top-bar";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import "../global.css";

configureReanimatedLogger({
  strict: false,
  level: ReanimatedLogLevel.warn,
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 bg-background">
        <RNStatusBar
          barStyle="light-content"
          backgroundColor={STATUS_BAR_BACKGROUND}
          translucent={Platform.OS === "android"}
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View className="flex-1 bg-background">
          <RNStatusBar
            barStyle="light-content"
            backgroundColor={STATUS_BAR_BACKGROUND}
            translucent={Platform.OS === "android"}
          />
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="notifications"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
          </Stack>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
