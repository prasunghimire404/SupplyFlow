import { useEffect, useRef, useState } from "react";
import { View, Text, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { Package } from "lucide-react-native";

const fadeAnimValue = new Animated.Value(0);
const slideAnimValue = new Animated.Value(50);
const progressAnimValue = new Animated.Value(0);

export default function SplashScreen() {
  const hasNavigated = useRef(false);

  const [fadeAnim] = useState(fadeAnimValue);
  const [slideAnim] = useState(slideAnimValue);
  const [progressAnim] = useState(progressAnimValue);

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    progressAnim.setValue(0);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      const { isAuthenticated: currentAuth } = useAuthStore.getState();

      if (currentAuth) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/login");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <View className="flex-1 items-center justify-center">
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          className="items-center"
        >
          <View className="w-20 h-20 bg-surface-light rounded-2xl items-center justify-center mb-6 border border-primary/30">
            <Package size={40} color="#8b7cf7" />
          </View>
          <Text
            className="text-3xl font-bold text-white mb-2"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            SupplyFlow
          </Text>
          <Text
            className="text-text-secondary text-sm"
            style={{ fontFamily: "DMSans_400Regular" }}
          >
            Manage your global inventory with surgical precision.
          </Text>
        </Animated.View>
      </View>

      <View className="absolute bottom-20 w-64 self-center">
        <View className="h-1 bg-surface-light rounded-full overflow-hidden">
          <Animated.View
            className="h-full bg-primary rounded-full"
            style={{
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            }}
          />
        </View>
        <Text
          className="text-text-muted text-xs text-center mt-3"
          style={{ fontFamily: "DMSans_400Regular" }}
        >
          Initializing Systems...
        </Text>
      </View>
    </SafeAreaView>
  );
}
