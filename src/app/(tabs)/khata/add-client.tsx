import { authService } from "@/services/auth.service";
import { rtdb } from "@/services/firebase";
import { router } from "expo-router";
import { ref as dbRef, set as dbSet } from "firebase/database";
import { ArrowLeft, UserPlus } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScreenTopBar } from "@/components/screen-top-bar";

export default function AddClientScreen() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const user = authService.getCurrentUser();

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter client name");
      return;
    }
    if (!user?.activeWorkspaceId) {
      Alert.alert("Error", "No active workspace");
      return;
    }

    setSaving(true);
    try {
      const customerId = `cust_${Date.now()}`;
      await dbSet(
        dbRef(
          rtdb,
          `workspaces/${user.activeWorkspaceId}/customers/${customerId}`,
        ),
        {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          balance: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      );
      router.back();
    } catch (e) {
      console.error("Error adding client:", e);
      Alert.alert("Error", "Failed to add client");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenTopBar>
        <View className="flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={24} color="#ffffff" />
        </Pressable>
        <Text
          className="text-white text-xl font-bold"
          style={{ fontFamily: "DMSans_700Bold" }}
        >
          Add Client
        </Text>
        </View>
      </ScreenTopBar>

      <ScrollView className="flex-1 px-4 mt-4">
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
          <Text
            className="text-text-secondary text-sm mb-3"
            style={{ fontFamily: "DMSans_500Medium" }}
          >
            Client Details
          </Text>

          <TextInput
            className="bg-surface-light rounded-xl px-4 py-3 text-white border border-border mb-3"
            placeholder="Full name *"
            placeholderTextColor="#6b7280"
            value={name}
            onChangeText={setName}
            style={{ fontFamily: "DMSans_400Regular" }}
          />

          <TextInput
            className="bg-surface-light rounded-xl px-4 py-3 text-white border border-border mb-3"
            placeholder="Phone number"
            placeholderTextColor="#6b7280"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            style={{ fontFamily: "DMSans_400Regular" }}
          />

          <TextInput
            className="bg-surface-light rounded-xl px-4 py-3 text-white border border-border mb-3"
            placeholder="Email (optional)"
            placeholderTextColor="#6b7280"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={{ fontFamily: "DMSans_400Regular" }}
          />

          <TextInput
            className="bg-surface-light rounded-xl px-4 py-3 text-white border border-border"
            placeholder="Address (optional)"
            placeholderTextColor="#6b7280"
            value={address}
            onChangeText={setAddress}
            style={{ fontFamily: "DMSans_400Regular" }}
          />
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          className={`rounded-xl py-4 items-center flex-row justify-center ${saving ? "bg-primary/50" : "bg-primary"}`}
        >
          <UserPlus size={18} color="#ffffff" />
          <Text
            className="text-white font-medium ml-2"
            style={{ fontFamily: "DMSans_500Medium" }}
          >
            {saving ? "Saving..." : "Add Client"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
