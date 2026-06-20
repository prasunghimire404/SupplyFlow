import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Package,
  User,
  Building2,
  Mail,
  MapPin,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Camera,
  Check,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/store/auth-store";
import { signUpSchema, SignUpFormData } from "@/validation/auth";
import { useScreenTopInset } from "@/components/screen-top-bar";

type Step = 1 | 2 | 3;

export default function SignupScreen() {
  const { signUp, isLoading } = useAuthStore();
  const topInset = useScreenTopInset(16);
  const [step, setStep] = useState<Step>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const {
    control,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      ownerName: "",
      businessName: "",
      email: "",
      address: "",
      phone: "",
      password: "",
    },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const validateStep = async (currentStep: Step): Promise<boolean> => {
    const fieldsToValidate: Record<Step, (keyof SignUpFormData)[]> = {
      1: ["ownerName", "businessName"],
      2: ["email", "phone", "password"],
      3: [],
    };

    const isValid = await trigger(fieldsToValidate[currentStep]);
    return isValid;
  };

  const nextStep = async () => {
    if (await validateStep(step)) {
      if (!completedSteps.includes(step)) {
        setCompletedSteps([...completedSteps, step]);
      }
      if (step < 3) setStep((step + 1) as Step);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setError("");
      await signUp({
        ...data,
        photoUri,
      });
      // NO OTP - directly go to app
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row items-center justify-center mb-6">
      {[1, 2, 3].map((s) => (
        <View key={s} className="flex-row items-center">
          <View
            className={`w-8 h-8 rounded-full items-center justify-center ${
              completedSteps.includes(s) || s === step
                ? "bg-primary"
                : "bg-surface-light border border-border"
            }`}
          >
            {completedSteps.includes(s) ? (
              <Check size={16} color="#ffffff" />
            ) : (
              <Text
                className={`text-sm font-medium ${s === step ? "text-white" : "text-text-muted"}`}
              >
                {s}
              </Text>
            )}
          </View>
          {s < 3 && (
            <View
              className={`w-12 h-0.5 mx-1 ${completedSteps.includes(s) ? "bg-primary" : "bg-border"}`}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View>
      <Text
        className="text-white text-lg font-bold mb-1"
        style={{ fontFamily: "DMSans_700Bold" }}
      >
        Tell us about you
      </Text>
      <Text
        className="text-text-secondary text-sm mb-6"
        style={{ fontFamily: "DMSans_400Regular" }}
      >
        Step 1 of 3 — your details
      </Text>

      <View className="items-center mb-6">
        <Pressable onPress={pickImage} className="relative">
          <View className="w-24 h-24 rounded-full bg-surface-light border-2 border-primary/30 items-center justify-center overflow-hidden">
            {photoUri ? (
              <Image source={{ uri: photoUri }} className="w-full h-full" />
            ) : (
              <Camera size={28} color="#8b7cf7" />
            )}
          </View>
          <View className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full items-center justify-center">
            <Camera size={14} color="#ffffff" />
          </View>
        </Pressable>
        <Text
          className="text-text-muted text-xs mt-2"
          style={{ fontFamily: "DMSans_400Regular" }}
        >
          {photoUri ? "Tap to change photo" : "Add profile photo (optional)"}
        </Text>
      </View>

      <Text
        className="text-text-muted text-xs mb-1 uppercase tracking-wider"
        style={{ fontFamily: "DMSans_500Medium" }}
      >
        Full Name
      </Text>
      <Controller
        control={control}
        name="ownerName"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row items-center bg-surface-light rounded-xl px-4 border border-border mb-1">
            <User size={18} color="#6b7280" />
            <TextInput
              className="flex-1 py-3 px-3 text-white"
              placeholder="Alex Sterling"
              placeholderTextColor="#6b7280"
              value={value}
              onChangeText={onChange}
              style={{ fontFamily: "DMSans_400Regular" }}
            />
          </View>
        )}
      />
      {errors.ownerName && (
        <Text className="text-accent-red text-xs mb-3">
          {errors.ownerName.message}
        </Text>
      )}

      <Text
        className="text-text-muted text-xs mb-1 uppercase tracking-wider mt-4"
        style={{ fontFamily: "DMSans_500Medium" }}
      >
        Business Name
      </Text>
      <Controller
        control={control}
        name="businessName"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row items-center bg-surface-light rounded-xl px-4 border border-border mb-1">
            <Building2 size={18} color="#6b7280" />
            <TextInput
              className="flex-1 py-3 px-3 text-white"
              placeholder="Sterling Logistics Solutions"
              placeholderTextColor="#6b7280"
              value={value}
              onChangeText={onChange}
              style={{ fontFamily: "DMSans_400Regular" }}
            />
          </View>
        )}
      />
      {errors.businessName && (
        <Text className="text-accent-red text-xs mb-3">
          {errors.businessName.message}
        </Text>
      )}

      <Pressable
        onPress={nextStep}
        className="bg-primary rounded-xl py-4 mt-6 items-center active:scale-95 transition-transform"
      >
        <View className="flex-row items-center">
          <Text
            className="text-white font-medium mr-2"
            style={{ fontFamily: "DMSans_500Medium" }}
          >
            Continue
          </Text>
          <ArrowRight size={18} color="#ffffff" />
        </View>
      </Pressable>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text
        className="text-white text-lg font-bold mb-1"
        style={{ fontFamily: "DMSans_700Bold" }}
      >
        How can we reach you?
      </Text>
      <Text
        className="text-text-secondary text-sm mb-6"
        style={{ fontFamily: "DMSans_400Regular" }}
      >
        Step 2 of 3 — contact & password
      </Text>

      <Text
        className="text-text-muted text-xs mb-1 uppercase tracking-wider"
        style={{ fontFamily: "DMSans_500Medium" }}
      >
        Email Address
      </Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row items-center bg-surface-light rounded-xl px-4 border border-border mb-1">
            <Mail size={18} color="#6b7280" />
            <TextInput
              className="flex-1 py-3 px-3 text-white"
              placeholder="alex@business.com"
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

      <Text
        className="text-text-muted text-xs mb-1 uppercase tracking-wider mt-4"
        style={{ fontFamily: "DMSans_500Medium" }}
      >
        Address / Location
      </Text>
      <Controller
        control={control}
        name="address"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row items-center bg-surface-light rounded-xl px-4 border border-border mb-1">
            <MapPin size={18} color="#6b7280" />
            <TextInput
              className="flex-1 py-3 px-3 text-white"
              placeholder="123 Business Street, City"
              placeholderTextColor="#6b7280"
              value={value}
              onChangeText={onChange}
              style={{ fontFamily: "DMSans_400Regular" }}
            />
          </View>
        )}
      />
      {errors.address && (
        <Text className="text-accent-red text-xs mb-3">
          {errors.address.message}
        </Text>
      )}

      <Text
        className="text-text-muted text-xs mb-1 uppercase tracking-wider mt-4"
        style={{ fontFamily: "DMSans_500Medium" }}
      >
        Phone Number
      </Text>
      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row items-center bg-surface-light rounded-xl px-4 border border-border mb-1">
            <Phone size={18} color="#6b7280" />
            <TextInput
              className="flex-1 py-3 px-3 text-white"
              placeholder="+1 (555) 000-0000"
              placeholderTextColor="#6b7280"
              keyboardType="phone-pad"
              value={value}
              onChangeText={onChange}
              style={{ fontFamily: "DMSans_400Regular" }}
            />
          </View>
        )}
      />
      {errors.phone && (
        <Text className="text-accent-red text-xs mb-3">
          {errors.phone.message}
        </Text>
      )}

      <Text
        className="text-text-muted text-xs mb-1 uppercase tracking-wider mt-4"
        style={{ fontFamily: "DMSans_500Medium" }}
      >
        Password
      </Text>
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
      <Text
        className="text-text-muted text-xs mb-3"
        style={{ fontFamily: "DMSans_400Regular" }}
      >
        Must be at least 8 characters with a number and symbol.
      </Text>

      <View className="flex-row mt-4 gap-3">
        <Pressable
          onPress={prevStep}
          className="flex-1 bg-surface-light border border-border rounded-xl py-4 items-center active:scale-95 transition-transform"
        >
          <View className="flex-row items-center">
            <ArrowLeft size={18} color="#ffffff" />
            <Text
              className="text-white font-medium ml-2"
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              Back
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={nextStep}
          className="flex-1 bg-primary rounded-xl py-4 items-center active:scale-95 transition-transform"
        >
          <View className="flex-row items-center">
            <Text
              className="text-white font-medium mr-2"
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              Continue
            </Text>
            <ArrowRight size={18} color="#ffffff" />
          </View>
        </Pressable>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text
        className="text-white text-lg font-bold mb-1"
        style={{ fontFamily: "DMSans_700Bold" }}
      >
        Review & Create
      </Text>
      <Text
        className="text-text-secondary text-sm mb-6"
        style={{ fontFamily: "DMSans_400Regular" }}
      >
        Step 3 of 3 — confirm your details
      </Text>

      <View className="bg-surface-light rounded-xl p-4 border border-border mb-6">
        <View className="flex-row items-center mb-4">
          <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-3">
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <User size={20} color="#8b7cf7" />
            )}
          </View>
          <View>
            <Text
              className="text-white font-medium"
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              {getValues("ownerName")}
            </Text>
            <Text
              className="text-text-secondary text-sm"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              {getValues("businessName")}
            </Text>
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center">
            <Mail size={16} color="#6b7280" />
            <Text
              className="text-text-secondary text-sm ml-3"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              {getValues("email")}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Phone size={16} color="#6b7280" />
            <Text
              className="text-text-secondary text-sm ml-3"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              {getValues("phone")}
            </Text>
          </View>
          <View className="flex-row items-center">
            <MapPin size={16} color="#6b7280" />
            <Text
              className="text-text-secondary text-sm ml-3"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              {getValues("address")}
            </Text>
          </View>
        </View>
      </View>

      <Text
        className="text-text-secondary text-sm mb-4 text-center"
        style={{ fontFamily: "DMSans_400Regular" }}
      >
        By creating an account, you agree to our Terms of Service and Privacy
        Policy.
      </Text>

      {error ? (
        <Text className="text-accent-red text-sm text-center mb-3">
          {error}
        </Text>
      ) : null}

      <View className="flex-row mt-2 gap-3">
        <Pressable
          onPress={prevStep}
          className="flex-1 bg-surface-light border border-border rounded-xl py-4 items-center active:scale-95 transition-transform"
        >
          <View className="flex-row items-center">
            <ArrowLeft size={18} color="#ffffff" />
            <Text
              className="text-white font-medium ml-2"
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              Back
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          className="flex-1 bg-primary rounded-xl py-4 items-center active:scale-95 transition-transform"
        >
          <View className="flex-row items-center">
            <Text
              className="text-white font-medium mr-2"
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              {isLoading ? "Creating..." : "Create Account"}
            </Text>
            {!isLoading && <ArrowRight size={18} color="#ffffff" />}
          </View>
        </Pressable>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingTop: topInset }}
      >
        <View className="items-center mb-6">
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

        {renderStepIndicator()}

        <View className="bg-surface rounded-3xl p-6 border border-border">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </View>

        <View className="flex-row justify-center mt-6">
          <Text
            className="text-text-secondary"
            style={{ fontFamily: "DMSans_400Regular" }}
          >
            Already have an account?{" "}
          </Text>
          <Pressable onPress={() => router.push("/login")}>
            <Text
              className="text-primary font-medium"
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              Log in
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
