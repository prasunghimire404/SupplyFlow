import { authService } from "@/services/auth.service";
import { rtdb } from "@/services/firebase";
import { router } from "expo-router";
import {
  get as dbGet,
  ref as dbRef,
  set as dbSet,
  push,
} from "firebase/database";
import {
  Check,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Minus,
  Package,
  Plus,
  Printer,
  QrCode,
  Save,
  ScanLine,
  Search,
  Share2,
  Trash2,
  User,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScreenTopBar } from "@/components/screen-top-bar";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
  total: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

export default function BillingScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savedBills, setSavedBills] = useState<any[]>([]);
  const [showSavedBills, setShowSavedBills] = useState(false);
  const user = authService.getCurrentUser();

  const loadData = useCallback(async () => {
    if (!user?.activeWorkspaceId || !user?.uid) {
      setLoading(false);
      return;
    }
    try {
      const workspaceId = user.activeWorkspaceId;
      const uid = user.uid;

      // Load products
      const productsSnap = await dbGet(
        dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/products`),
      );
      if (productsSnap.exists()) {
        const data = productsSnap.val();
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          name: val.name,
          price: val.price || 0,
          stock: val.stock || 0,
        }));
        setProducts(list);
      }

      // Load customers
      const customersSnap = await dbGet(
        dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/customers`),
      );
      if (customersSnap.exists()) {
        const data = customersSnap.val();
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          name: val.name,
          phone: val.phone || "",
        }));
        setCustomers(list);
      }

      // Load saved bills
      const billsSnap = await dbGet(
        dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/bills`),
      );
      if (billsSnap.exists()) {
        const data = billsSnap.val();
        const list = Object.entries(data)
          .map(([id, val]: [string, any]) => ({
            id,
            ...val,
          }))
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 5);
        setSavedBills(list);
      }
    } catch (e) {
      console.error("Error loading billing data:", e);
    } finally {
      setLoading(false);
    }
  }, [user?.activeWorkspaceId, user?.uid]);

  useEffect(() => {
    const initializeData = async () => {
      await loadData();
    };
    initializeData();
  }, []);

  const updateQty = useCallback((cartId: string, delta: number) => {
    setCartItems((items) =>
      items.map((item) => {
        if (item.id === cartId) {
          const newQty = Math.max(1, item.qty + delta);
          return { ...item, qty: newQty, total: item.price * newQty };
        }
        return item;
      }),
    );
  }, []);

  const removeItem = useCallback((cartId: string) => {
    setCartItems((items) => items.filter((item) => item.id !== cartId));
  }, []);

  const addToCart = useCallback(
    (product: Product) => {
      if (product.stock <= 0) return;
      const existing = cartItems.find((item) => item.productId === product.id);
      if (existing) {
        updateQty(existing.id, 1);
        return;
      }
      const id = `cart_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const newItem: CartItem = {
        id,
        productId: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        total: product.price,
      };
      setCartItems([...cartItems, newItem]);
      setShowProductSearch(false);
    },
    [cartItems, updateQty],
  );

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;

  const numberToWords = (num: number): string => {
    // Simple implementation - you can expand this
    return `${num.toLocaleString("en-IN")} Rupees Only`;
  };

  const saveBill = useCallback(async () => {
    if (!user?.activeWorkspaceId || !user?.uid || cartItems.length === 0)
      return;

    const workspaceId = user.activeWorkspaceId;
    const uid = user.uid;
    const billRef = push(
      dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/bills`),
    );

    try {
      // Update product stock
      for (const item of cartItems) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          const newStock = Math.max(0, product.stock - item.qty);
          await dbSet(
            dbRef(
              rtdb,
              `users/${uid}/workspaces/${workspaceId}/products/${item.productId}/stock`,
            ),
            newStock,
          );
        }
      }

      // Save bill
      await dbSet(billRef, {
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || "Walk-in Customer",
        lineItems: cartItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          qty: item.qty,
          price: item.price,
        })),
        subtotal,
        gst,
        total,
        status: "pending",
        createdAt: Date.now(),
        date: new Date().toLocaleDateString("en-IN"),
      });

      // Update customer balance if linked
      if (selectedCustomer) {
        const customerRef = dbRef(
          rtdb,
          `users/${uid}/workspaces/${workspaceId}/customers/${selectedCustomer.id}`,
        );
        const customerSnap = await dbGet(customerRef);
        if (customerSnap.exists()) {
          const currentBalance = customerSnap.val().balance || 0;
          await dbSet(
            dbRef(
              rtdb,
              `users/${uid}/workspaces/${workspaceId}/customers/${selectedCustomer.id}/balance`,
            ),
            currentBalance + total,
          );
          await dbSet(
            dbRef(
              rtdb,
              `users/${uid}/workspaces/${workspaceId}/customers/${selectedCustomer.id}/lastBilled`,
            ),
            Date.now(),
          );
        }
      }

      // Clear cart
      setCartItems([]);
      setSelectedCustomer(null);
      loadData();
    } catch (e) {
      console.error("Error saving bill:", e);
    }
  }, [
    user?.activeWorkspaceId,
    user?.uid,
    cartItems,
    products,
    selectedCustomer,
    subtotal,
    gst,
    total,
    loadData,
  ]);

  const filteredProducts = searchQuery
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : products;

  const filteredCustomers = searchQuery
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : customers;

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
        <View className="flex-row justify-between items-center">
          <View>
            <Text
              className="text-white text-2xl font-bold"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              Billing
            </Text>
            <Text
              className="text-text-secondary text-sm"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              {cartItems.length} items in cart
            </Text>
          </View>
          <View className="flex-row space-x-2">
            <Pressable
              onPress={() => setShowSavedBills(true)}
              className="w-10 h-10 rounded-full bg-surface items-center justify-center border border-border"
            >
              <FileText size={18} color="#9ca3af" />
            </Pressable>
            <Pressable className="w-10 h-10 rounded-full bg-surface items-center justify-center border border-border">
              <ScanLine size={18} color="#9ca3af" />
            </Pressable>
            <Pressable className="w-10 h-10 rounded-full bg-surface items-center justify-center border border-border">
              <QrCode size={18} color="#9ca3af" />
            </Pressable>
          </View>
        </View>
      </ScreenTopBar>

      <ScrollView className="flex-1">
        {/* Link Customer */}
        <Pressable
          onPress={() => {
            setSearchQuery("");
            setShowCustomerSearch(true);
          }}
          className="mx-4 bg-surface-light rounded-xl px-4 py-3 border border-border mb-3 flex-row items-center"
        >
          <User size={18} color="#6b7280" />
          <Text
            className="text-text-muted ml-3 flex-1"
            style={{ fontFamily: "DMSans_400Regular" }}
          >
            {selectedCustomer
              ? `${selectedCustomer.name} · ${selectedCustomer.phone}`
              : "Link client to bill..."}
          </Text>
          <ChevronDown size={18} color="#6b7280" />
        </Pressable>

        {/* Search Products */}
        <Pressable
          onPress={() => {
            setSearchQuery("");
            setShowProductSearch(true);
          }}
          className="mx-4 bg-surface-light rounded-xl px-4 py-3 border border-border mb-4 flex-row items-center"
        >
          <Search size={18} color="#6b7280" />
          <Text
            className="text-text-muted ml-3"
            style={{ fontFamily: "DMSans_400Regular" }}
          >
            Search & add products...
          </Text>
        </Pressable>

        {/* Cart Items */}
        {cartItems.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-4xl mb-3">🛒</Text>
            <Text
              className="text-text-secondary"
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              Your cart is empty
            </Text>
            <Text
              className="text-text-muted text-sm mt-1"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              Search products to add
            </Text>
          </View>
        ) : (
          <View className="mx-4">
            {cartItems.map((item) => (
              <View
                key={item.id}
                className="bg-surface rounded-2xl p-4 border border-border mb-3"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text
                      className="text-white font-medium"
                      style={{ fontFamily: "DMSans_500Medium" }}
                    >
                      {item.name}
                    </Text>
                    <Text
                      className="text-text-muted text-xs mt-1"
                      style={{ fontFamily: "DMSans_400Regular" }}
                    >
                      Rs {item.price} each
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Pressable
                      onPress={() => updateQty(item.id, -1)}
                      className="w-8 h-8 rounded-full bg-surface-light items-center justify-center"
                    >
                      <Minus size={16} color="#ffffff" />
                    </Pressable>
                    <Text
                      className="text-white mx-3"
                      style={{ fontFamily: "DMSans_500Medium" }}
                    >
                      {item.qty}
                    </Text>
                    <Pressable
                      onPress={() => updateQty(item.id, 1)}
                      className="w-8 h-8 rounded-full bg-primary items-center justify-center"
                    >
                      <Plus size={16} color="#ffffff" />
                    </Pressable>
                    <Text
                      className="text-white ml-4 font-medium"
                      style={{ fontFamily: "DMSans_500Medium" }}
                    >
                      Rs {item.total}
                    </Text>
                    <Pressable
                      onPress={() => removeItem(item.id)}
                      className="ml-3"
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}

            {/* Invoice Summary */}
            <View className="bg-surface rounded-2xl p-4 border border-border mt-2">
              <Text
                className="text-white font-bold mb-3"
                style={{ fontFamily: "DMSans_700Bold" }}
              >
                Invoice Summary
              </Text>
              <View className="flex-row justify-between mb-2">
                <Text
                  className="text-text-secondary"
                  style={{ fontFamily: "DMSans_400Regular" }}
                >
                  Subtotal
                </Text>
                <Text
                  className="text-white"
                  style={{ fontFamily: "DMSans_500Medium" }}
                >
                  Rs {subtotal.toLocaleString("en-IN")}
                </Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text
                  className="text-text-secondary"
                  style={{ fontFamily: "DMSans_400Regular" }}
                >
                  GST (5%)
                </Text>
                <Text
                  className="text-white"
                  style={{ fontFamily: "DMSans_500Medium" }}
                >
                  Rs {gst}
                </Text>
              </View>
              <View className="border-t border-border pt-3 flex-row justify-between">
                <Text
                  className="text-white font-bold"
                  style={{ fontFamily: "DMSans_700Bold" }}
                >
                  Total
                </Text>
                <Text
                  className="text-white text-xl font-bold"
                  style={{ fontFamily: "DMSans_700Bold" }}
                >
                  Rs {total.toLocaleString("en-IN")}
                </Text>
              </View>
              <Text
                className="text-text-muted text-xs mt-2 italic"
                style={{ fontFamily: "DMSans_400Regular" }}
              >
                In words: {numberToWords(total)}
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row mt-4 mb-2">
              <Pressable
                onPress={saveBill}
                className="flex-1 bg-primary rounded-xl py-3 items-center mr-2 flex-row justify-center"
              >
                <Save size={18} color="#ffffff" />
                <Text
                  className="text-white font-medium ml-2"
                  style={{ fontFamily: "DMSans_500Medium" }}
                >
                  Save Record
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setCartItems([]);
                  setSelectedCustomer(null);
                }}
                className="flex-1 bg-surface-light border border-border rounded-xl py-3 items-center"
              >
                <Text
                  className="text-white font-medium"
                  style={{ fontFamily: "DMSans_500Medium" }}
                >
                  New
                </Text>
              </Pressable>
            </View>

            <View className="flex-row mt-2 mb-6">
              <Pressable className="flex-1 bg-surface-light border border-border rounded-xl py-3 items-center mr-2 flex-row justify-center">
                <Printer size={18} color="#ffffff" />
                <Text
                  className="text-white font-medium ml-2"
                  style={{ fontFamily: "DMSans_500Medium" }}
                >
                  Print PDF
                </Text>
              </Pressable>
              <Pressable className="flex-1 bg-surface-light border border-border rounded-xl py-3 items-center mr-2 flex-row justify-center">
                <Share2 size={18} color="#ffffff" />
                <Text
                  className="text-white font-medium ml-2"
                  style={{ fontFamily: "DMSans_500Medium" }}
                >
                  Share PDF
                </Text>
              </Pressable>
              <Pressable className="flex-1 bg-surface-light border border-border rounded-xl py-3 items-center flex-row justify-center">
                <ImageIcon size={18} color="#ffffff" />
                <Text
                  className="text-white font-medium ml-2"
                  style={{ fontFamily: "DMSans_500Medium" }}
                >
                  Image
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Product Search Modal */}
      <Modal
        visible={showProductSearch}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProductSearch(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className="text-white text-xl font-bold"
                style={{ fontFamily: "DMSans_700Bold" }}
              >
                Add Products
              </Text>
              <Pressable onPress={() => setShowProductSearch(false)}>
                <X size={24} color="#ffffff" />
              </Pressable>
            </View>

            <View className="bg-surface-light rounded-xl px-4 py-3 border border-border flex-row items-center mb-4">
              <Search size={18} color="#6b7280" />
              <TextInput
                className="flex-1 ml-2 text-white"
                placeholder="Search products..."
                placeholderTextColor="#6b7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ fontFamily: "DMSans_400Regular" }}
              />
            </View>

            {products.length === 0 ? (
              <View className="items-center py-10">
                <Package size={32} color="#6b7280" />
                <Text
                  className="text-text-secondary mt-2"
                  style={{ fontFamily: "DMSans_400Regular" }}
                >
                  No products in inventory
                </Text>
              </View>
            ) : filteredProducts.length === 0 ? (
              <View className="items-center py-10">
                <Text
                  className="text-text-secondary"
                  style={{ fontFamily: "DMSans_400Regular" }}
                >
                  No products found
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => addToCart(item)}
                    className="bg-surface rounded-xl p-4 border border-border mb-2 flex-row justify-between items-center"
                  >
                    <View>
                      <Text
                        className="text-white font-medium"
                        style={{ fontFamily: "DMSans_500Medium" }}
                      >
                        {item.name}
                      </Text>
                      <Text
                        className="text-text-muted text-xs"
                        style={{ fontFamily: "DMSans_400Regular" }}
                      >
                        Stock: {item.stock} · Rs {item.price}
                      </Text>
                    </View>
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center ${item.stock > 0 ? "bg-primary" : "bg-surface-light"}`}
                    >
                      <Plus size={16} color="#ffffff" />
                    </View>
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Customer Search Modal */}
      <Modal
        visible={showCustomerSearch}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomerSearch(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className="text-white text-xl font-bold"
                style={{ fontFamily: "DMSans_700Bold" }}
              >
                Select Customer
              </Text>
              <Pressable onPress={() => setShowCustomerSearch(false)}>
                <X size={24} color="#ffffff" />
              </Pressable>
            </View>

            <View className="bg-surface-light rounded-xl px-4 py-3 border border-border flex-row items-center mb-4">
              <Search size={18} color="#6b7280" />
              <TextInput
                className="flex-1 ml-2 text-white"
                placeholder="Search customers..."
                placeholderTextColor="#6b7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ fontFamily: "DMSans_400Regular" }}
              />
            </View>

            <Pressable
              onPress={() => {
                setSelectedCustomer(null);
                setShowCustomerSearch(false);
              }}
              className="bg-surface rounded-xl p-4 border border-border mb-2"
            >
              <Text
                className="text-white font-medium"
                style={{ fontFamily: "DMSans_500Medium" }}
              >
                Walk-in Customer
              </Text>
            </Pressable>

            {customers.length === 0 ? (
              <View className="items-center py-10">
                <User size={32} color="#6b7280" />
                <Text
                  className="text-text-secondary mt-2"
                  style={{ fontFamily: "DMSans_400Regular" }}
                >
                  No customers found
                </Text>
                <Pressable
                  onPress={() => {
                    setShowCustomerSearch(false);
                    router.push("/khata/add-client" as any);
                  }}
                  className="mt-3"
                >
                  <Text
                    className="text-primary"
                    style={{ fontFamily: "DMSans_500Medium" }}
                  >
                    Add Customer
                  </Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      setSelectedCustomer(item);
                      setShowCustomerSearch(false);
                    }}
                    className="bg-surface rounded-xl p-4 border border-border mb-2 flex-row justify-between items-center"
                  >
                    <View>
                      <Text
                        className="text-white font-medium"
                        style={{ fontFamily: "DMSans_500Medium" }}
                      >
                        {item.name}
                      </Text>
                      <Text
                        className="text-text-muted text-xs"
                        style={{ fontFamily: "DMSans_400Regular" }}
                      >
                        {item.phone}
                      </Text>
                    </View>
                    {selectedCustomer?.id === item.id && (
                      <Check size={18} color="#10b981" />
                    )}
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Saved Bills Modal */}
      <Modal
        visible={showSavedBills}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSavedBills(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className="text-white text-xl font-bold"
                style={{ fontFamily: "DMSans_700Bold" }}
              >
                Bill Records
              </Text>
              <Pressable onPress={() => setShowSavedBills(false)}>
                <X size={24} color="#ffffff" />
              </Pressable>
            </View>

            {savedBills.length === 0 ? (
              <View className="items-center py-10">
                <FileText size={32} color="#6b7280" />
                <Text
                  className="text-text-secondary mt-2"
                  style={{ fontFamily: "DMSans_400Regular" }}
                >
                  No saved bills
                </Text>
              </View>
            ) : (
              <FlatList
                data={savedBills}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View className="bg-surface rounded-xl p-4 border border-border mb-2">
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text
                          className="text-white font-medium"
                          style={{ fontFamily: "DMSans_500Medium" }}
                        >
                          {item.customerName}
                        </Text>
                        <Text
                          className="text-text-muted text-xs"
                          style={{ fontFamily: "DMSans_400Regular" }}
                        >
                          {item.date} · {item.lineItems?.length || 0} items · Rs{" "}
                          {item.total}
                        </Text>
                      </View>
                      <View className="flex-row">
                        <Pressable className="mr-3">
                          <FileText size={18} color="#8b7cf7" />
                        </Pressable>
                        <Pressable>
                          <Trash2 size={18} color="#ef4444" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
