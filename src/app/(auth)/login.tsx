import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Package,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react-native";
import { useAuthStore } from "@/store/auth-store";
import { signInSchema, SignInFormData } from "@/validation/auth";
import { useScreenTopInset } from "@/components/screen-top-bar";

export default function LoginScreen() {
  const { signIn, isLoading } = useAuthStore();
  const topInset = useScreenTopInset(24);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      setError("");
      await signIn(data);
      // After successful login, go to tabs
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingTop: topInset }}
      >
        <View className="items-center mb-8">
          <View className="w-16 h-16 bg-surface-light rounded-2xl items-center justify-center mb-4 border border-primary/30">
            <Package size={32} color="#8b7cf7" />
          </View>
          <Text
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            SupplyFlow
          </Text>
          <Text
            className="text-text-secondary mt-1"
            style={{ fontFamily: "DMSans_400Regular" }}
          >
            Manage your global inventory with surgical precision.
          </Text>
        </View>

        <View className="bg-surface rounded-3xl p-6 border border-border">
          <Text
            className="text-text-muted text-xs mb-1 uppercase tracking-wider"
            style={{ fontFamily: "DMSans_500Medium" }}
          >
            Business Email
          </Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <View className="flex-row items-center bg-surface-light rounded-xl px-4 border border-border mb-1">
                <Mail size={18} color="#6b7280" />
                <TextInput
                  className="flex-1 py-3 px-3 text-white"
                  placeholder="name@company.com"
                  placeholderTextColor="#6b7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  style={{ fontFamily: "DMSans_400Regular" }}
                />
              </View>
            )}
          />
          {errors.email && (
            <Text className="text-accent-red text-xs mb-3">
              {errors.email.message}
            </Text>
          )}

          <View className="flex-row justify-between items-center mt-4 mb-1">
            <Text
              className="text-text-muted text-xs uppercase tracking-wider"
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              Password
            </Text>
            <Pressable>
              <Text
                className="text-primary text-xs"
                style={{ fontFamily: "DMSans_500Medium" }}
              >
                FORGOT PASSWORD?
              </Text>
            </Pressable>
          </View>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <View className="flex-row items-center bg-surface-light rounded-xl px-4 border border-border mb-1">
                <Lock size={18} color="#6b7280" />
                <TextInput
                  className="flex-1 py-3 px-3 text-white"
                  placeholder="••••••••"
                  placeholderTextColor="#6b7280"
                  secureTextEntry={!showPassword}
                  value={value}
                  onChangeText={onChange}
                  style={{ fontFamily: "DMSans_400Regular" }}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={18} color="#6b7280" />
                  ) : (
                    <Eye size={18} color="#6b7280" />
                  )}
                </Pressable>
              </View>
            )}
          />
          {errors.password && (
            <Text className="text-accent-red text-xs mb-3">
              {errors.password.message}
            </Text>
          )}

          {error ? (
            <Text className="text-accent-red text-sm text-center mt-2">
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            className={`bg-primary rounded-xl py-4 mt-6 items-center active:scale-95 transition-transform ${isLoading ? "opacity-60" : ""}`}
          >
            <View className="flex-row items-center">
              <Text
                className="text-white font-medium mr-2"
                style={{ fontFamily: "DMSans_500Medium" }}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Text>
              {!isLoading && <ArrowRight size={18} color="#ffffff" />}
            </View>
          </Pressable>

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-border" />
            <Text
              className="text-text-muted text-xs mx-4"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              OR CONTINUE WITH
            </Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          <Pressable className="bg-surface-light border border-border rounded-xl py-3 items-center flex-row justify-center">
            <Text
              className="text-white font-medium"
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              G Google
            </Text>
          </Pressable>
        </View>

        <View className="flex-row justify-center mt-6">
          <Text
            className="text-text-secondary"
            style={{ fontFamily: "DMSans_400Regular" }}
          >
            New to SupplyFlow?{" "}
          </Text>
          <Pressable onPress={() => router.push("/signup")}>
            <Text
              className="text-primary font-medium"
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              Create Account
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
