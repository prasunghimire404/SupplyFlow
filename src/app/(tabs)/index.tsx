import { rtdb } from "@/services/firebase";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency, getInitials } from "@/utils/helpers";
import { ref as dbRef, onValue } from "firebase/database";
import {
  AlertCircle,
  Bell,
  ChevronDown,
  Clock,
  Package,
  Plus,
  ReceiptIndianRupee,
  Settings,
  TrendingUp,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ScreenTopBar } from "@/components/screen-top-bar";

export default function DashboardScreen() {
  const { user, userProfile } = useAuthStore();

  const [kpis, setKpis] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Only LISTEN to existing data — never write defaults
  useEffect(() => {
    if (!userProfile?.activeWorkspaceId || !userProfile?.uid) {
      setLoading(false);
      return;
    }

    const dashboardRef = dbRef(
      rtdb,
      `users/${userProfile.uid}/workspaces/${userProfile.activeWorkspaceId}/dashboard`,
    );

    const unsubscribe = onValue(dashboardRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setKpis(data.kpis);
        setTransactions(data.transactions || []);
      } else {
        // No data in DB — show empty state, do NOT write anything
        setKpis(null);
        setTransactions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.activeWorkspaceId, userProfile?.uid]);

  const getKpiData = () => {
    if (!kpis) {
      return [
        {
          title: "Total Sales",
          value: "Rs 0",
          change: "+0%",
          icon: TrendingUp,
          color: "text-white",
          accent: false,
        },
        {
          title: "Inventory Count",
          value: "0",
          subtitle: "SKUs in stock",
          icon: Package,
          color: "text-white",
          accent: false,
        },
        {
          title: "Pending Payments (DR)",
          value: "Rs 0",
          subtitle: "0 invoices due",
          icon: Clock,
          color: "text-accent-violet",
          accent: true,
        },
        {
          title: "Pending Collection (CR)",
          value: "Rs 0",
          subtitle: "0 customers owe",
          icon: AlertCircle,
          color: "text-accent-rose",
          accent: true,
        },
      ];
    }
    return [
      {
        ...kpis.totalSales,
        icon: TrendingUp,
        color: "text-white",
        accent: false,
      },
      {
        ...kpis.inventoryCount,
        icon: Package,
        color: "text-white",
        accent: false,
      },
      {
        ...kpis.pendingPayments,
        icon: Clock,
        color: "text-accent-violet",
        accent: true,
      },
      {
        ...kpis.pendingCollection,
        icon: AlertCircle,
        color: "text-accent-rose",
        accent: true,
      },
    ];
  };

  const kpiData = getKpiData();

  return (
    <View className="flex-1 bg-background">
      <ScreenTopBar>
        <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
            <Text
              className="text-primary font-bold"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              {getInitials(userProfile?.ownerName || user?.displayName || "M")}
            </Text>
          </View>
          <View>
            <Text
              className="text-white font-medium"
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              {userProfile?.businessName || "My Business"}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <Text className="text-text-muted text-xs mr-1">
                Owner: {userProfile?.ownerName || "Loading..."}
              </Text>
              <ChevronDown size={12} color="#6b7280" />
            </View>
          </View>
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable className="w-10 h-10 rounded-full bg-surface items-center justify-center">
            <Bell size={20} color="#9ca3af" />
          </Pressable>
          <Pressable className="w-10 h-10 rounded-full bg-surface items-center justify-center">
            <Settings size={20} color="#9ca3af" />
          </Pressable>
        </View>
        </View>
      </ScreenTopBar>

      <ScrollView className="flex-1">
        {/* Dashboard Header */}
        <View className="px-4 py-4 flex-row justify-between items-center">
        <View>
          <Text
            className="text-white text-2xl font-bold"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            Dashboard
          </Text>
          <Text
            className="text-text-secondary text-sm"
            style={{ fontFamily: "DMSans_400Regular" }}
          >
            Today's sales, dues and stock overview
          </Text>
        </View>
        <Pressable className="bg-primary rounded-xl px-4 py-2 flex-row items-center active:scale-95">
          <Plus size={16} color="#ffffff" />
          <Text
            className="text-white font-medium text-sm ml-1"
            style={{ fontFamily: "DMSans_500Medium" }}
          >
            New Bill
          </Text>
        </Pressable>
      </View>

      {/* KPI Cards — use margin-bottom instead of gap */}
      <View className="px-4">
        {kpiData.map((kpi, index) => (
          <Pressable
            key={index}
            className="bg-surface rounded-2xl p-4 border border-border active:scale-95 mb-3"
          >
            <View className="flex-row justify-between items-start mb-2">
              <Text
                className="text-text-secondary text-sm"
                style={{ fontFamily: "DMSans_400Regular" }}
              >
                {kpi.title}
              </Text>
              <kpi.icon size={20} color={kpi.accent ? "#8b7cf7" : "#6b7280"} />
            </View>
            <Text
              className={`text-2xl font-bold ${kpi.accent ? "text-accent-violet" : "text-white"}`}
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              {kpi.value}
            </Text>
            {kpi.subtitle && (
              <Text
                className="text-text-muted text-xs mt-1"
                style={{ fontFamily: "DMSans_400Regular" }}
              >
                {kpi.subtitle}
              </Text>
            )}
            {kpi.change && (
              <View className="flex-row items-center mt-1">
                <TrendingUp size={14} color="#10b981" />
                <Text
                  className="text-accent-green text-xs ml-1"
                  style={{ fontFamily: "DMSans_500Medium" }}
                >
                  {kpi.change}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Sales Overview Chart Placeholder */}
      <View className="px-4 mt-6">
        <View className="bg-surface rounded-2xl p-4 border border-border">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text
                className="text-white font-bold"
                style={{ fontFamily: "DMSans_700Bold" }}
              >
                Sales Overview
              </Text>
              <Text
                className="text-text-secondary text-xs"
                style={{ fontFamily: "DMSans_400Regular" }}
              >
                Weekly performance
              </Text>
            </View>
            <Pressable className="bg-surface-light rounded-lg px-3 py-1 border border-border">
              <Text
                className="text-white text-xs"
                style={{ fontFamily: "DMSans_500Medium" }}
              >
                Weekly ▼
              </Text>
            </Pressable>
          </View>
          <View className="h-32 bg-surface-light rounded-xl items-center justify-center border border-border">
            <Text
              className="text-text-muted"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              [Chart Area]
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Transactions */}
      <View className="px-4 mt-6 mb-6">
        <View className="flex-row justify-between items-center mb-3">
          <Text
            className="text-white font-bold"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            Recent Transactions
          </Text>
          <Pressable>
            <Text
              className="text-primary text-sm"
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              View All
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View className="bg-surface rounded-xl p-6 border border-border items-center justify-center">
            <Text className="text-text-muted text-sm">
              Loading transactions...
            </Text>
          </View>
        ) : transactions.length === 0 ? (
          <View className="bg-surface rounded-xl p-6 border border-border items-center justify-center">
            <Text className="text-text-muted text-sm">
              No transactions yet.
            </Text>
          </View>
        ) : (
          transactions.map((tx, index) => (
            <View
              key={index}
              className="bg-surface rounded-xl p-4 border border-border mb-2 flex-row justify-between items-center"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                  <ReceiptIndianRupee size={18} color="#8b7cf7" />
                </View>
                <View>
                  <Text
                    className="text-white font-medium"
                    style={{ fontFamily: "DMSans_500Medium" }}
                  >
                    {tx.name}
                  </Text>
                  <Text
                    className="text-text-muted text-xs"
                    style={{ fontFamily: "DMSans_400Regular" }}
                  >
                    {tx.invoice} • {tx.date}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text
                  className="text-white font-medium"
                  style={{ fontFamily: "DMSans_500Medium" }}
                >
                  {formatCurrency(tx.amount)}
                </Text>
                <Text
                  className={`text-xs ${tx.status === "paid" ? "text-accent-green" : "text-accent-orange"}`}
                  style={{ fontFamily: "DMSans_500Medium" }}
                >
                  {tx.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
      </ScrollView>
    </View>
  );
}
