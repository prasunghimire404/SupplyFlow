import { authService } from "@/services/auth.service";
import { rtdb } from "@/services/firebase";
import { router } from "expo-router";
import {
  get as dbGet,
  ref as dbRef,
  remove as dbRemove,
} from "firebase/database";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  Plus,
  Search,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ScreenTopBar } from "@/components/screen-top-bar";

interface Supplier {
  id: string;
  name: string;
  invoice: string;
  date: string;
  amount: number;
  status: "overdue" | "due_today" | "upcoming";
  dueDate: number;
  phone?: string;
  email?: string;
  items?: string;
}

export default function PendingPaymentsScreen() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filtered, setFiltered] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Overdue" | "Upcoming"
  >("All");
  const [loading, setLoading] = useState(true);

  const user = authService.getCurrentUser();

  const loadSuppliers = useCallback(async () => {
    if (!user?.activeWorkspaceId || !user?.uid) {
      setLoading(false);
      return;
    }
    try {
      const snap = await dbGet(
        dbRef(
          rtdb,
          `users/${user.uid}/workspaces/${user.activeWorkspaceId}/suppliers`,
        ),
      );
      if (snap.exists()) {
        const data = snap.val();
        const list: Supplier[] = Object.entries(data).map(
          ([id, val]: [string, any]) => ({
            id,
            name: val.name || "Unknown",
            invoice: val.invoice || `INV-${id.slice(-4)}`,
            date: val.date || new Date().toLocaleDateString(),
            amount: val.amount || 0,
            status: val.status || "upcoming",
            dueDate: val.dueDate || Date.now(),
            phone: val.phone,
            email: val.email,
            items: val.items,
          }),
        );
        setSuppliers(list);
      } else {
        setSuppliers([]);
      }
    } catch (e) {
      console.error("Error loading suppliers:", e);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [user?.activeWorkspaceId, user?.uid, user]);

  const filterData = useCallback(() => {
    let result = [...suppliers];

    if (activeFilter === "Overdue") {
      result = result.filter((s) => s.status === "overdue");
    } else if (activeFilter === "Upcoming") {
      result = result.filter(
        (s) => s.status === "upcoming" || s.status === "due_today",
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.invoice.toLowerCase().includes(q),
      );
    }

    setFiltered(result);
  }, [suppliers, searchQuery, activeFilter]);

  const markAsPaid = useCallback(
    async (supplierId: string) => {
      if (!user?.activeWorkspaceId || !user?.uid) return;
      try {
        await dbRemove(
          dbRef(
            rtdb,
            `users/${user.uid}/workspaces/${user.activeWorkspaceId}/suppliers/${supplierId}`,
          ),
        );
        setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
      } catch (e) {
        console.error("Error marking as paid:", e);
      }
    },
    [user?.activeWorkspaceId, user?.uid, user],
  );

  useEffect(() => {
    let isMounted = true;
    const initializeData = async () => {
      if (isMounted) {
        await loadSuppliers();
      }
    };
    initializeData();
    return () => {
      isMounted = false;
    };
  }, [loadSuppliers]);

  useEffect(() => {
    filterData();
  }, [suppliers, searchQuery, activeFilter, filterData]);

  const totalDue = suppliers.reduce((sum, s) => sum + s.amount, 0);
  const overdueAmount = suppliers
    .filter((s) => s.status === "overdue")
    .reduce((sum, s) => sum + s.amount, 0);
  const overdueCount = suppliers.filter((s) => s.status === "overdue").length;

  const getStatusConfig = useCallback((supplier: Supplier) => {
    const now = Date.now();
    const daysUntilDue = Math.floor((supplier.dueDate - now) / 86400000);
    const daysOverdue = Math.floor((now - supplier.dueDate) / 86400000);

    if (supplier.status === "overdue" || daysUntilDue < 0) {
      return {
        icon: AlertCircle,
        color: "#8b5cf6",
        bg: "#8b5cf620",
        text: `${Math.abs(daysOverdue)}d overdue`,
        textColor: "text-accent-violet",
      };
    }
    if (daysUntilDue === 0) {
      return {
        icon: Clock,
        color: "#f59e0b",
        bg: "#f59e0b20",
        text: "Due today",
        textColor: "text-accent-orange",
      };
    }
    return {
      icon: Calendar,
      color: "#10b981",
      bg: "#10b98120",
      text: `${daysUntilDue}d remaining`,
      textColor: "text-accent-green",
    };
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

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
            Pending Payments
          </Text>
          <Text
            className="text-text-secondary text-sm"
            style={{ fontFamily: "DMSans_400Regular" }}
          >
            Supplier payables & due invoices
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
          className={`bg-surface rounded-2xl p-3 border flex-1 mx-1 items-center ${overdueCount > 0 ? "border-accent-violet" : "border-border"}`}
        >
          <Text
            className="text-text-muted text-xs"
            style={{ fontFamily: "DMSans_400Regular" }}
          >
            Overdue
          </Text>
          <Text
            className={`font-bold mt-1 ${overdueCount > 0 ? "text-accent-violet" : "text-white"}`}
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            Rs {overdueAmount.toLocaleString("en-IN")}
          </Text>
          {overdueCount > 0 && (
            <Text
              className="text-text-muted text-xs"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              {overdueCount} inv
            </Text>
          )}
        </View>
        <View className="bg-surface rounded-2xl p-3 border border-border flex-1 mx-1 items-center">
          <Text
            className="text-text-muted text-xs"
            style={{ fontFamily: "DMSans_400Regular" }}
          >
            Suppliers
          </Text>
          <Text
            className="text-white font-bold mt-1"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            {suppliers.length}
          </Text>
        </View>
      </View>

      {/* Filters */}
      <View className="flex-row px-4 mb-3">
        {(["All", "Overdue", "Upcoming"] as const).map((filter) => (
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
            placeholder="Search supplier or invoice..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ fontFamily: "DMSans_400Regular" }}
          />
        </View>
      </View>

      {/* Suppliers List */}
      <ScrollView className="flex-1 px-4">
        {suppliers.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Calendar size={40} color="#6b7280" />
            <Text
              className="text-text-secondary mt-4"
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              No pending payments
            </Text>
            <Text
              className="text-text-muted text-sm mt-1 text-center px-8"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              Add suppliers to track your payables and due invoices
            </Text>
            <Pressable
              onPress={() => {
                // Navigate to add supplier - you can create this page later
                router.push("/settings" as any);
              }}
              className="bg-primary rounded-xl px-6 py-3 mt-6 flex-row items-center"
            >
              <Plus size={18} color="#ffffff" />
              <Text
                className="text-white font-medium ml-2"
                style={{ fontFamily: "DMSans_500Medium" }}
              >
                Add Supplier
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
          filtered.map((supplier) => {
            const config = getStatusConfig(supplier);
            const Icon = config.icon;
            return (
              <Pressable
                key={supplier.id}
                onPress={() =>
                  router.push({
                    pathname: "/unpaid-client" as any,
                    params: { id: supplier.id, type: "supplier" },
                  })
                }
                className="bg-surface rounded-2xl p-4 border border-border mb-3 flex-row items-center active:opacity-80"
              >
                <View
                  className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
                  style={{ backgroundColor: config.bg }}
                >
                  <Icon size={22} color={config.color} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-white font-medium"
                    style={{ fontFamily: "DMSans_500Medium" }}
                  >
                    {supplier.name}
                  </Text>
                  <Text
                    className="text-text-muted text-xs mt-1"
                    style={{ fontFamily: "DMSans_400Regular" }}
                  >
                    {supplier.invoice} · {formatDate(supplier.dueDate)}
                  </Text>
                </View>
                <View className="items-end mr-2">
                  <Text
                    className="text-white font-medium"
                    style={{ fontFamily: "DMSans_500Medium" }}
                  >
                    Rs {supplier.amount.toLocaleString("en-IN")}
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
