import { authService } from "@/services/auth.service";
import { rtdb } from "@/services/firebase";
import { router } from "expo-router";
import { get as dbGet, ref as dbRef } from "firebase/database";
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Clock,
  Plus,
  Search,
  Users,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ScreenTopBar } from "@/components/screen-top-bar";

interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number;
  lastBilled: number;
  status: "overdue" | "pending";
}

export default function PendingCollectionsScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Overdue" | "Recent"
  >("All");
  const [loading, setLoading] = useState(true);

  const user = authService.getCurrentUser();

  const loadCustomers = useCallback(async () => {
    if (!user?.activeWorkspaceId || !user?.uid) {
      setLoading(false);
      return;
    }
    try {
      const snap = await dbGet(
        dbRef(
          rtdb,
          `users/${user.uid}/workspaces/${user.activeWorkspaceId}/customers`,
        ),
      );
      if (snap.exists()) {
        const data = snap.val();
        const list: Customer[] = Object.entries(data)
          .map(([id, val]: [string, any]) => ({
            id,
            name: val.name || "Unknown",
            phone: val.phone || "",
            balance: val.balance || 0,
            lastBilled: val.lastBilled || val.createdAt || Date.now(),
            status: val.balance > 0 ? val.status || "pending" : "settled",
          }))
          .filter((c: Customer) => c.balance > 0);
        setCustomers(list);
      } else {
        setCustomers([]);
      }
    } catch (e) {
      console.error("Error loading customers:", e);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [user?.activeWorkspaceId, user?.uid, user]);

  const filterData = useCallback(() => {
    let result = [...customers];

    if (activeFilter === "Overdue") {
      result = result.filter((c) => c.status === "overdue");
    } else if (activeFilter === "Recent") {
      result = result.filter((c) => c.status === "pending");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q),
      );
    }

    setFiltered(result);
  }, [customers, searchQuery, activeFilter]);

  // Load data on mount
  useEffect(() => {
    let isMounted = true;
    const initializeData = async () => {
      if (isMounted) {
        await loadCustomers();
      }
    };
    initializeData();
    return () => {
      isMounted = false;
    };
  }, [loadCustomers]);

  // Re-filter whenever customers, search query, or active filter changes
  useEffect(() => {
    filterData();
  }, [customers, searchQuery, activeFilter, filterData]);

  const totalDue = customers.reduce((sum, c) => sum + c.balance, 0);
  const overdueAmount = customers
    .filter((c) => c.status === "overdue")
    .reduce((sum, c) => sum + c.balance, 0);
  const overdueCount = customers.filter((c) => c.status === "overdue").length;

  const getStatusConfig = useCallback((customer: Customer) => {
    const daysSince = Math.floor((Date.now() - customer.lastBilled) / 86400000);

    if (customer.status === "overdue") {
      return {
        icon: AlertCircle,
        color: "#ef4444",
        bg: "#ef444420",
        text: `${daysSince}d overdue`,
        textColor: "text-accent-red",
      };
    }
    return {
      icon: Clock,
      color: daysSince > 7 ? "#f59e0b" : "#10b981",
      bg: daysSince > 7 ? "#f59e0b20" : "#10b98120",
      text: `${daysSince}d since bill`,
      textColor: daysSince > 7 ? "text-accent-orange" : "text-accent-green",
    };
  }, []);

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

  return (
    <View className="flex-1 bg-background">
      <ScreenTopBar>
        <View className="flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={24} color="#ffffff" />
        </Pressable>
        <View className="flex-1">
          <Text
            className="text-white text-xl font-bold"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            Pending Collection
          </Text>
          <Text
            className="text-text-secondary text-sm"
            style={{ fontFamily: "DMSans_400Regular" }}
          >
            Customer dues & receivables
          </Text>
        </View>
        </View>
      </ScreenTopBar>

      {/* Stats */}
      <View className="flex-row px-4 mt-2 mb-4">
        <View className="bg-surface rounded-2xl p-3 border border-border flex-1 mx-1 items-center">
          <Text
            className="text-text-muted text-xs"
            style={{ fontFamily: "DMSans_400Regular" }}
          >
            Total Due
          </Text>
          <Text
            className="text-white font-bold mt-1"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            Rs {totalDue.toLocaleString("en-IN")}
          </Text>
        </View>
        <View
          className={`bg-surface rounded-2xl p-3 border flex-1 mx-1 items-center ${overdueCount > 0 ? "border-accent-red" : "border-border"}`}
        >
          <Text
            className="text-text-muted text-xs"
            style={{ fontFamily: "DMSans_400Regular" }}
          >
            Overdue
          </Text>
          <Text
            className={`font-bold mt-1 ${overdueCount > 0 ? "text-accent-red" : "text-white"}`}
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            Rs {overdueAmount.toLocaleString("en-IN")}
          </Text>
        </View>
        <View className="bg-surface rounded-2xl p-3 border border-border flex-1 mx-1 items-center">
          <Text
            className="text-text-muted text-xs"
            style={{ fontFamily: "DMSans_400Regular" }}
          >
            Customers
          </Text>
          <Text
            className="text-white font-bold mt-1"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            {customers.length}
          </Text>
        </View>
      </View>

      {/* Filters */}
      <View className="flex-row px-4 mb-3">
        {(["All", "Overdue", "Recent"] as const).map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setActiveFilter(filter)}
            className={`rounded-full px-4 py-2 mr-2 ${
              activeFilter === filter
                ? "bg-primary"
                : "bg-surface-light border border-border"
            }`}
          >
            <Text
              className={`text-sm ${activeFilter === filter ? "text-white" : "text-text-secondary"}`}
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              {filter}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Search */}
      <View className="px-4 mb-3">
        <View className="bg-surface-light rounded-xl px-4 py-3 border border-border flex-row items-center">
          <Search size={18} color="#6b7280" />
          <TextInput
            className="flex-1 ml-2 text-white"
            placeholder="Search customer or phone..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ fontFamily: "DMSans_400Regular" }}
          />
        </View>
      </View>

      {/* Customers List */}
      <ScrollView className="flex-1 px-4">
        {customers.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Users size={40} color="#6b7280" />
            <Text
              className="text-text-secondary mt-4"
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              No pending collections
            </Text>
            <Text
              className="text-text-muted text-sm mt-1 text-center px-8"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              Add customers to track receivables and dues
            </Text>
            <Pressable
              onPress={() => router.push("/khata/add-client" as any)}
              className="bg-primary rounded-xl px-6 py-3 mt-6 flex-row items-center"
            >
              <Plus size={18} color="#ffffff" />
              <Text
                className="text-white font-medium ml-2"
                style={{ fontFamily: "DMSans_500Medium" }}
              >
                Add Customer
              </Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Search size={40} color="#6b7280" />
            <Text
              className="text-text-secondary mt-4"
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              No results found
            </Text>
            <Text
              className="text-text-muted text-sm mt-1"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          filtered.map((customer) => {
            const config = getStatusConfig(customer);
            const Icon = config.icon;
            return (
              <Pressable
                key={customer.id}
                onPress={() => router.push(`/khata/${customer.id}` as any)}
                className="bg-surface rounded-2xl p-4 border border-border mb-3 flex-row items-center active:opacity-80"
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: config.bg }}
                >
                  <Icon size={22} color={config.color} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-white font-medium"
                    style={{ fontFamily: "DMSans_500Medium" }}
                  >
                    {customer.name}
                  </Text>
                  <Text
                    className="text-text-muted text-xs mt-1"
                    style={{ fontFamily: "DMSans_400Regular" }}
                  >
                    {customer.phone}
                  </Text>
                </View>
                <View className="items-end mr-2">
                  <Text
                    className="text-white font-medium"
                    style={{ fontFamily: "DMSans_500Medium" }}
                  >
                    Rs {customer.balance.toLocaleString("en-IN")}
                  </Text>
                  <Text
                    className={`text-xs mt-1 ${config.textColor}`}
                    style={{ fontFamily: "DMSans_500Medium" }}
                  >
                    {config.text}
                  </Text>
                </View>
                <ChevronRight size={18} color="#6b7280" />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
