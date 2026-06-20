import { authService } from "@/services/auth.service";
import { rtdb } from "@/services/firebase";
import { router, useLocalSearchParams } from "expo-router";
import { get as dbGet, ref as dbRef } from "firebase/database";
import { ArrowLeft, Phone, Mail, MapPin } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ScreenTopBar } from "@/components/screen-top-bar";

interface CustomerDetail {
  name: string;
  phone: string;
  email: string;
  address: string;
  balance: number;
  createdAt: number;
}

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const user = authService.getCurrentUser();

  const loadCustomer = useCallback(async () => {
    if (!user?.activeWorkspaceId || !id) {
      setLoading(false);
      return;
    }
    try {
      const snap = await dbGet(
        dbRef(rtdb, `workspaces/${user.activeWorkspaceId}/customers/${id}`),
      );
      if (snap.exists()) {
        setCustomer(snap.val());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user?.activeWorkspaceId, id, user]);

  useEffect(() => {
    let isMounted = true;
    const initializeData = async () => {
      if (isMounted) {
        await loadCustomer();
      }
    };
    initializeData();
    return () => {
      isMounted = false;
    };
  }, [loadCustomer]);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text
          className="text-text-muted"
          style={{ fontFamily: "DMSans_400Regular" }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  if (!customer) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text
          className="text-text-secondary"
          style={{ fontFamily: "DMSans_500Medium" }}
        >
          Customer not found
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text
            className="text-primary"
            style={{ fontFamily: "DMSans_500Medium" }}
          >
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  const getInitial = (name: string) => name.charAt(0).toUpperCase();
  const colors = [
    "#8b7cf7",
    "#f59e0b",
    "#10b981",
    "#ef4444",
    "#ec4899",
    "#8b5cf6",
  ];
  const color = colors[customer.name.charCodeAt(0) % colors.length];

  const infoItems = [
    { icon: Phone, label: "Phone", value: customer.phone || "Not provided" },
    { icon: Mail, label: "Email", value: customer.email || "Not provided" },
    {
      icon: MapPin,
      label: "Address",
      value: customer.address || "Not provided",
    },
  ];

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
          Customer Details
        </Text>
        </View>
      </ScreenTopBar>

      <ScrollView className="flex-1 px-4">
        {/* Profile Card */}
        <View className="items-center mt-4 mb-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: color + "30" }}
          >
            <Text
              className="text-white text-2xl font-bold"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              {getInitial(customer.name)}
            </Text>
          </View>
          <Text
            className="text-white text-xl font-bold"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            {customer.name}
          </Text>
          <View
            className={`rounded-full px-4 py-1 mt-2 ${customer.balance > 0 ? "bg-accent-red/20" : "bg-surface-light"}`}
          >
            <Text
              className={`text-sm ${customer.balance > 0 ? "text-accent-red" : "text-text-muted"}`}
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              {customer.balance > 0
                ? `Rs ${customer.balance.toLocaleString("en-IN")} Due`
                : "Settled"}
            </Text>
          </View>
        </View>

        {/* Info */}
        {infoItems.map((item, index) => (
          <View
            key={index}
            className="bg-surface rounded-2xl p-4 border border-border mb-3 flex-row items-center"
          >
            <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center mr-3">
              <item.icon size={18} color="#8b7cf7" />
            </View>
            <View>
              <Text
                className="text-text-muted text-xs"
                style={{ fontFamily: "DMSans_400Regular" }}
              >
                {item.label}
              </Text>
              <Text
                className="text-white font-medium"
                style={{ fontFamily: "DMSans_500Medium" }}
              >
                {item.value}
              </Text>
            </View>
          </View>
        ))}

        {/* Added Date */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
          <Text
            className="text-text-muted text-xs"
            style={{ fontFamily: "DMSans_400Regular" }}
          >
            Client since
          </Text>
          <Text
            className="text-white font-medium mt-1"
            style={{ fontFamily: "DMSans_500Medium" }}
          >
            {customer.createdAt
              ? new Date(customer.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Unknown"}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
