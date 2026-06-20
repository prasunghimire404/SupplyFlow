import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import { ScreenTopBar } from "@/components/screen-top-bar";
import { useRouter } from "expo-router";
import {
  Bell,
  Settings,
  ChevronDown,
  Plus,
  TrendingUp,
  Package,
  Clock,
  AlertCircle,
  ReceiptIndianRupee,
  LayoutDashboard,
} from "lucide-react-native";
import { useAuthStore } from "@/store/auth-store";
import { getInitials } from "@/utils/helpers";
import { useState, useEffect, useRef } from "react";
import { ref as dbRef, get as dbGet } from "firebase/database";
import { rtdb } from "@/services/firebase";

interface Transaction {
  id: string;
  customerName: string;
  invoice: string;
  date: string;
  amount: number;
  status: "paid" | "pending";
  createdAt: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const [totalSales, setTotalSales] = useState(0);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [pendingCollections, setPendingCollections] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const currentUser = user || userProfile;
  const hasLoaded = useRef(false);

  // Load data on mount — NOT in useCallback
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const workspaceId = currentUser?.activeWorkspaceId;
    const uid = currentUser?.uid;
    if (!workspaceId || !uid) return;

    const loadDashboardData = async () => {
      try {
        const [billsSnap, productsSnap, suppliersSnap, customersSnap] =
          await Promise.all([
            dbGet(dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/bills`)),
            dbGet(
              dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/products`),
            ),
            dbGet(
              dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/suppliers`),
            ),
            dbGet(
              dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/customers`),
            ),
          ]);

        let sales = 0;
        let recentTransactions: Transaction[] = [];
        if (billsSnap.exists()) {
          const bills = billsSnap.val();
          const billsList = Object.entries(bills).map(
            ([id, val]: [string, any]) => ({
              id,
              customerName: val.customerName || "Unknown",
              invoice: val.invoice || `INV-${id.slice(-6)}`,
              date: val.date || new Date().toLocaleDateString(),
              amount: val.total || 0,
              status: val.status || "pending",
              createdAt: val.createdAt || Date.now(),
            }),
          );

          sales = billsList.reduce(
            (sum: number, b: any) => sum + (b.amount || 0),
            0,
          );

          recentTransactions = billsList
            .sort((a: Transaction, b: Transaction) => b.createdAt - a.createdAt)
            .slice(0, 3);
        }
        setTotalSales(sales);
        setTransactions(recentTransactions);

        let products = 0;
        if (productsSnap.exists()) {
          products = Object.keys(productsSnap.val()).length;
        }
        setInventoryCount(products);

        let payments = 0;
        if (suppliersSnap.exists()) {
          const suppliers = Object.values(suppliersSnap.val()) as any[];
          payments = suppliers.reduce(
            (sum: number, s: any) => sum + (s.amount || 0),
            0,
          );
        }
        setPendingPayments(payments);

        let collections = 0;
        if (customersSnap.exists()) {
          const customers = Object.values(customersSnap.val()) as any[];
          const owed = customers.filter((c: any) => (c.balance || 0) > 0);
          collections = owed.reduce(
            (sum: number, c: any) => sum + (c.balance || 0),
            0,
          );
        }
        setPendingCollections(collections);
      } catch (e) {
        console.error("Dashboard load error:", e);
      }
    };

    loadDashboardData();
  }, [currentUser?.activeWorkspaceId, currentUser?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    const workspaceId = currentUser?.activeWorkspaceId;
    const uid = currentUser?.uid;
    if (!workspaceId || !uid) {
      setRefreshing(false);
      return;
    }

    const loadDashboardData = async () => {
      try {
        const [billsSnap, productsSnap, suppliersSnap, customersSnap] =
          await Promise.all([
            dbGet(dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/bills`)),
            dbGet(
              dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/products`),
            ),
            dbGet(
              dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/suppliers`),
            ),
            dbGet(
              dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/customers`),
            ),
          ]);

        let sales = 0;
        let recentTransactions: Transaction[] = [];
        if (billsSnap.exists()) {
          const bills = billsSnap.val();
          const billsList = Object.entries(bills).map(
            ([id, val]: [string, any]) => ({
              id,
              customerName: val.customerName || "Unknown",
              invoice: val.invoice || `INV-${id.slice(-6)}`,
              date: val.date || new Date().toLocaleDateString(),
              amount: val.total || 0,
              status: val.status || "pending",
              createdAt: val.createdAt || Date.now(),
            }),
          );

          sales = billsList.reduce(
            (sum: number, b: any) => sum + (b.amount || 0),
            0,
          );

          recentTransactions = billsList
            .sort((a: Transaction, b: Transaction) => b.createdAt - a.createdAt)
            .slice(0, 3);
        }
        setTotalSales(sales);
        setTransactions(recentTransactions);

        let products = 0;
        if (productsSnap.exists()) {
          products = Object.keys(productsSnap.val()).length;
        }
        setInventoryCount(products);

        let payments = 0;
        if (suppliersSnap.exists()) {
          const suppliers = Object.values(suppliersSnap.val()) as any[];
          payments = suppliers.reduce(
            (sum: number, s: any) => sum + (s.amount || 0),
            0,
          );
        }
        setPendingPayments(payments);

        let collections = 0;
        if (customersSnap.exists()) {
          const customers = Object.values(customersSnap.val()) as any[];
          const owed = customers.filter((c: any) => (c.balance || 0) > 0);
          collections = owed.reduce(
            (sum: number, c: any) => sum + (c.balance || 0),
            0,
          );
        }
        setPendingCollections(collections);
      } catch (e) {
        console.error("Dashboard load error:", e);
      } finally {
        setRefreshing(false);
      }
    };

    loadDashboardData();
  };

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString("en-IN")}`;
  };

  const goToProfile = () => router.push("/profile");
  const goToNotifications = () => router.push("/notifications");
  const goToSettings = () => router.push("/settings");
  const goToBilling = () => router.push("/billing");
  const goToInventory = () => router.push("/inventory");
  const goToPendingPayments = () => router.push("/pending-payments");
  const goToPendingCollections = () => router.push("/pending-collections");

  const displayName =
    currentUser?.ownerName || currentUser?.displayName || "User";
  const businessName = currentUser?.businessName || "My Business";

  return (
    <View className="flex-1 bg-background">
      <ScreenTopBar>
        <View className="flex-row items-center justify-between">
          <Pressable onPress={goToProfile} className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
              <Text
                className="text-primary font-bold"
                style={{ fontFamily: "DMSans_700Bold" }}
              >
                {getInitials(displayName)}
              </Text>
            </View>
            <View>
              <Text
                className="text-white font-medium"
                style={{ fontFamily: "DMSans_500Medium" }}
              >
                {businessName}
              </Text>
              <ChevronDown size={14} color="#6b7280" />
            </View>
          </Pressable>

          <View className="flex-row items-center">
            <Pressable
              onPress={goToNotifications}
              className="w-10 h-10 rounded-full bg-surface items-center justify-center mr-3"
            >
              <Bell size={20} color="#9ca3af" />
            </Pressable>
            <Pressable
              onPress={goToSettings}
              className="w-10 h-10 rounded-full bg-surface items-center justify-center"
            >
              <Settings size={20} color="#9ca3af" />
            </Pressable>
          </View>
        </View>
      </ScreenTopBar>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8b7cf7"
          />
        }
      >
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
              This Month&apos;s sales, dues and stock overview
            </Text>
          </View>
          <Pressable
            onPress={goToBilling}
            className="bg-primary rounded-xl px-4 py-2 flex-row items-center active:opacity-80"
          >
            <Plus size={16} color="#ffffff" />
            <Text
              className="text-white font-medium text-sm ml-1"
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              New Bill
            </Text>
          </Pressable>
        </View>

        <View className="px-4">
          <Pressable
            onPress={goToBilling}
            className="bg-surface rounded-2xl p-4 border border-border active:opacity-80 mb-3"
          >
            <View className="flex-row justify-between items-start mb-2">
              <Text
                className="text-text-secondary text-sm"
                style={{ fontFamily: "DMSans_400Regular" }}
              >
                Total Sales
              </Text>
              <TrendingUp size={20} color="#6b7280" />
            </View>
            <Text
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              {formatCurrency(totalSales)}
            </Text>
            <View className="flex-row items-center mt-1">
              <TrendingUp size={14} color="#10b981" />
              <Text
                className="text-accent-green text-xs ml-1"
                style={{ fontFamily: "DMSans_500Medium" }}
              >
                +0%
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={goToInventory}
            className="bg-surface rounded-2xl p-4 border border-border active:opacity-80 mb-3"
          >
            <View className="flex-row justify-between items-start mb-2">
              <Text
                className="text-text-secondary text-sm"
                style={{ fontFamily: "DMSans_400Regular" }}
              >
                Inventory Count
              </Text>
              <Package size={20} color="#6b7280" />
            </View>
            <Text
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              {inventoryCount.toLocaleString()}
            </Text>
            <Text
              className="text-text-muted text-xs mt-1"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              {inventoryCount === 1 ? "SKU in stock" : "SKUs in stock"}
            </Text>
          </Pressable>

          <Pressable
            onPress={goToPendingPayments}
            className="bg-surface rounded-2xl p-4 border border-border active:opacity-80 mb-3"
          >
            <View className="flex-row justify-between items-start mb-2">
              <Text
                className="text-text-secondary text-sm"
                style={{ fontFamily: "DMSans_400Regular" }}
              >
                Pending Payments (DR)
              </Text>
              <Clock size={20} color="#8b7cf7" />
            </View>
            <Text
              className="text-2xl font-bold text-accent-violet"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              {formatCurrency(pendingPayments)}
            </Text>
            <Text
              className="text-text-muted text-xs mt-1"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              Supplier payables
            </Text>
          </Pressable>

          <Pressable
            onPress={goToPendingCollections}
            className="bg-surface rounded-2xl p-4 border border-border active:opacity-80 mb-3"
          >
            <View className="flex-row justify-between items-start mb-2">
              <Text
                className="text-text-secondary text-sm"
                style={{ fontFamily: "DMSans_400Regular" }}
              >
                Pending Collection (CR)
              </Text>
              <AlertCircle size={20} color="#f43f5e" />
            </View>
            <Text
              className="text-2xl font-bold text-accent-rose"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              {formatCurrency(pendingCollections)}
            </Text>
            <Text
              className="text-text-muted text-xs mt-1"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              Customer receivables
            </Text>
          </Pressable>
        </View>

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
              <LayoutDashboard size={32} color="#6b7280" />
              <Text
                className="text-text-muted text-xs mt-2"
                style={{ fontFamily: "DMSans_400Regular" }}
              >
                {totalSales > 0 ? "Chart coming soon" : "No sales data yet"}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-4 mt-6 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text
              className="text-white font-bold"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              Recent Transactions
            </Text>
            <Pressable onPress={goToBilling}>
              <Text
                className="text-primary text-sm"
                style={{ fontFamily: "DMSans_500Medium" }}
              >
                View All
              </Text>
            </Pressable>
          </View>

          {transactions.length === 0 ? (
            <View className="bg-surface rounded-2xl p-6 border border-border items-center">
              <ReceiptIndianRupee size={32} color="#6b7280" />
              <Text
                className="text-text-secondary mt-2"
                style={{ fontFamily: "DMSans_500Medium" }}
              >
                No transactions yet
              </Text>
              <Text
                className="text-text-muted text-xs mt-1"
                style={{ fontFamily: "DMSans_400Regular" }}
              >
                Create your first bill to see transactions
              </Text>
              <Pressable
                onPress={goToBilling}
                className="bg-primary rounded-xl px-6 py-2 mt-3"
              >
                <Text
                  className="text-white font-medium"
                  style={{ fontFamily: "DMSans_500Medium" }}
                >
                  Create Bill
                </Text>
              </Pressable>
            </View>
          ) : (
            transactions.map((tx) => (
              <Pressable
                key={tx.id}
                onPress={goToBilling}
                className="bg-surface rounded-xl p-4 border border-border mb-2 flex-row justify-between items-center active:opacity-80"
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
                      {tx.customerName}
                    </Text>
                    <Text
                      className="text-text-muted text-xs"
                      style={{ fontFamily: "DMSans_400Regular" }}
                    >
                      {tx.invoice} · {tx.date}
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
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
