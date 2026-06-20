import { authService } from "@/services/auth.service";
import { rtdb } from "@/services/firebase";
import {
  get as dbGet,
  ref as dbRef,
  remove as dbRemove,
  set as dbSet,
} from "firebase/database";
import {
  AlertTriangle,
  Minus,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScreenTopBar } from "@/components/screen-top-bar";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  maxStock: number;
  unit: string;
  lowStockThreshold: number;
}

interface Category {
  id: string;
  name: string;
}

export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Grocery",
    price: "",
    stock: "",
    maxStock: "",
    unit: "pcs",
    lowStockThreshold: "10",
  });

  const user = authService.getCurrentUser();

  const loadData = useCallback(async () => {
    if (!user?.activeWorkspaceId || !user?.uid) {
      setLoading(false);
      return;
    }
    try {
      const workspaceId = user.activeWorkspaceId;
      const uid = user.uid;

      const productsSnap = await dbGet(
        dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/products`),
      );
      if (productsSnap.exists()) {
        const data = productsSnap.val();
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          name: val.name || "Unknown",
          category: val.category || "Uncategorized",
          price: val.price || 0,
          stock: val.stock || 0,
          maxStock: val.maxStock || 100,
          unit: val.unit || "pcs",
          lowStockThreshold: val.lowStockThreshold || 10,
        }));
        setProducts(list);
      }

      const categoriesSnap = await dbGet(
        dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/categories`),
      );
      if (categoriesSnap.exists()) {
        const data = categoriesSnap.val();
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          name: val.name,
        }));
        setCategories([{ id: "all", name: "All" }, ...list]);
      } else {
        setCategories([{ id: "all", name: "All" }]);
      }
    } catch (e) {
      console.error("Error loading inventory:", e);
    } finally {
      setLoading(false);
    }
  }, [user?.activeWorkspaceId, user?.uid]);

  const filterProducts = useCallback(() => {
    let result = [...products];
    if (activeCategory !== "All") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    setFiltered(result);
  }, [products, searchQuery, activeCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const addProduct = async () => {
    if (!user?.activeWorkspaceId || !user?.uid || !newProduct.name.trim())
      return;

    const workspaceId = user.activeWorkspaceId;
    const uid = user.uid;
    const productId = `prod_${Date.now()}`;

    try {
      await dbSet(
        dbRef(
          rtdb,
          `users/${uid}/workspaces/${workspaceId}/products/${productId}`,
        ),
        {
          name: newProduct.name,
          category: newProduct.category,
          price: parseFloat(newProduct.price) || 0,
          stock: parseInt(newProduct.stock) || 0,
          maxStock: parseInt(newProduct.maxStock) || 100,
          unit: newProduct.unit,
          lowStockThreshold: parseInt(newProduct.lowStockThreshold) || 10,
          createdAt: Date.now(),
        },
      );

      const categoryExists = categories.some(
        (c) => c.name === newProduct.category,
      );
      if (!categoryExists) {
        const catId = `cat_${Date.now()}`;
        await dbSet(
          dbRef(
            rtdb,
            `users/${uid}/workspaces/${workspaceId}/categories/${catId}`,
          ),
          {
            name: newProduct.category,
          },
        );
      }

      setNewProduct({
        name: "",
        category: "Grocery",
        price: "",
        stock: "",
        maxStock: "",
        unit: "pcs",
        lowStockThreshold: "10",
      });
      setShowAddModal(false);
      loadData();
    } catch (e) {
      console.error("Error adding product:", e);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!user?.activeWorkspaceId || !user?.uid) return;
    Alert.alert("Delete Product", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await dbRemove(
            dbRef(
              rtdb,
              `users/${user.uid}/workspaces/${user.activeWorkspaceId}/products/${productId}`,
            ),
          );
          loadData();
        },
      },
    ]);
  };

  const updateStock = async (productId: string, delta: number) => {
    if (!user?.activeWorkspaceId || !user?.uid) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const newStock = Math.max(0, product.stock + delta);
    await dbSet(
      dbRef(
        rtdb,
        `users/${user.uid}/workspaces/${user.activeWorkspaceId}/products/${productId}/stock`,
      ),
      newStock,
    );
    loadData();
  };

  const totalProducts = products.length;
  const lowStock = products.filter(
    (p) => p.stock <= p.lowStockThreshold,
  ).length;
  const healthy = products.filter((p) => p.stock > p.lowStockThreshold).length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  const getStockPercentage = (stock: number, max: number) => {
    return Math.min(100, (stock / max) * 100);
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
        <View className="flex-row justify-between items-center">
          <View>
            <Text
              className="text-white text-2xl font-bold"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              Inventory
            </Text>
            <Text
              className="text-text-secondary text-sm"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              {totalProducts} products · ₹{totalValue.toLocaleString("en-IN")}
            </Text>
          </View>
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="bg-primary rounded-xl px-4 py-2 flex-row items-center active:scale-95"
          >
            <Plus size={16} color="#ffffff" />
            <Text
              className="text-white font-medium text-sm ml-1"
              style={{ fontFamily: "DMSans_500Medium" }}
            >
              Add Item
            </Text>
          </Pressable>
        </View>
      </ScreenTopBar>

      <ScrollView className="flex-1">
        <View className="flex-row px-4 mt-2 mb-4">
          <View className="bg-surface rounded-2xl p-4 border border-border flex-1 mx-1 items-center">
            <Text
              className="text-xl font-bold text-white"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              {totalProducts}
            </Text>
            <Text
              className="text-text-muted text-xs mt-1"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              Products
            </Text>
          </View>
          <View className="bg-surface rounded-2xl p-4 border border-border flex-1 mx-1 items-center">
            <Text
              className="text-xl font-bold text-accent-orange"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              {lowStock}
            </Text>
            <Text
              className="text-text-muted text-xs mt-1"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              Low Stock
            </Text>
          </View>
          <View className="bg-surface rounded-2xl p-4 border border-border flex-1 mx-1 items-center">
            <Text
              className="text-xl font-bold text-accent-green"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              {healthy}
            </Text>
            <Text
              className="text-text-muted text-xs mt-1"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              Healthy
            </Text>
          </View>
        </View>

        <View className="px-4 mb-3">
          <View className="bg-surface-light rounded-xl px-4 py-3 border border-border flex-row items-center">
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
        </View>

        <ScrollView
          horizontal
          className="px-4 mb-4"
          showsHorizontalScrollIndicator={false}
        >
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setActiveCategory(cat.name)}
              className={`rounded-full px-4 py-2 mr-2 ${
                activeCategory === cat.name
                  ? "bg-primary"
                  : "bg-surface-light border border-border"
              }`}
            >
              <Text
                className={`text-sm ${activeCategory === cat.name ? "text-white" : "text-text-secondary"}`}
                style={{ fontFamily: "DMSans_500Medium" }}
              >
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View className="px-4 pb-6">
          {products.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Package size={40} color="#6b7280" />
              <Text
                className="text-text-secondary mt-4"
                style={{ fontFamily: "DMSans_500Medium" }}
              >
                No products yet
              </Text>
              <Text
                className="text-text-muted text-sm mt-1 text-center px-8"
                style={{ fontFamily: "DMSans_400Regular" }}
              >
                Add your first product to start tracking inventory
              </Text>
              <Pressable
                onPress={() => setShowAddModal(true)}
                className="bg-primary rounded-xl px-6 py-3 mt-6 flex-row items-center"
              >
                <Plus size={18} color="#ffffff" />
                <Text
                  className="text-white font-medium ml-2"
                  style={{ fontFamily: "DMSans_500Medium" }}
                >
                  Add Product
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
                No products found
              </Text>
            </View>
          ) : (
            filtered.map((product) => {
              const isLow = product.stock <= product.lowStockThreshold;
              const stockPercent = getStockPercentage(
                product.stock,
                product.maxStock,
              );

              return (
                <View
                  key={product.id}
                  className="bg-surface rounded-2xl p-4 border border-border mb-3"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text
                          className="text-white font-medium"
                          style={{ fontFamily: "DMSans_500Medium" }}
                        >
                          {product.name}
                        </Text>
                        {isLow && (
                          <View className="bg-accent-red/20 rounded-full px-2 py-0.5 ml-2 flex-row items-center">
                            <AlertTriangle size={10} color="#ef4444" />
                            <Text
                              className="text-accent-red text-xs ml-1"
                              style={{ fontFamily: "DMSans_500Medium" }}
                            >
                              Low
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        className="text-text-muted text-xs mt-1"
                        style={{ fontFamily: "DMSans_400Regular" }}
                      >
                        {product.category} · ₹{product.price}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Pressable
                        onPress={() => updateStock(product.id, -1)}
                        className="w-8 h-8 rounded-full bg-surface-light items-center justify-center mr-2"
                      >
                        <Minus size={14} color="#ffffff" />
                      </Pressable>
                      <Pressable
                        onPress={() => updateStock(product.id, 1)}
                        className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-2"
                      >
                        <Plus size={14} color="#ffffff" />
                      </Pressable>
                      <Pressable onPress={() => deleteProduct(product.id)}>
                        <Trash2 size={18} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>

                  <View className="mt-3">
                    <View className="h-2 bg-surface-light rounded-full overflow-hidden">
                      <View
                        className={`h-full rounded-full ${isLow ? "bg-accent-red" : "bg-primary"}`}
                        style={{ width: `${stockPercent}%` }}
                      />
                    </View>
                    <View className="flex-row justify-between mt-1">
                      <Text
                        className="text-text-muted text-xs"
                        style={{ fontFamily: "DMSans_400Regular" }}
                      >
                        {product.stock}/{product.maxStock} {product.unit}
                      </Text>
                      <Text
                        className={`text-xs ${isLow ? "text-accent-red" : "text-text-muted"}`}
                        style={{ fontFamily: "DMSans_500Medium" }}
                      >
                        {product.stock} {product.unit}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text
                className="text-white text-xl font-bold"
                style={{ fontFamily: "DMSans_700Bold" }}
              >
                Add Product
              </Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <X size={24} color="#ffffff" />
              </Pressable>
            </View>

            <TextInput
              className="bg-surface-light rounded-xl px-4 py-3 text-white border border-border mb-3"
              placeholder="Product name"
              placeholderTextColor="#6b7280"
              value={newProduct.name}
              onChangeText={(text) =>
                setNewProduct({ ...newProduct, name: text })
              }
              style={{ fontFamily: "DMSans_400Regular" }}
            />

            <TextInput
              className="bg-surface-light rounded-xl px-4 py-3 text-white border border-border mb-3"
              placeholder="Category"
              placeholderTextColor="#6b7280"
              value={newProduct.category}
              onChangeText={(text) =>
                setNewProduct({ ...newProduct, category: text })
              }
              style={{ fontFamily: "DMSans_400Regular" }}
            />

            <View className="flex-row mb-3">
              <TextInput
                className="flex-1 bg-surface-light rounded-xl px-4 py-3 text-white border border-border mr-2"
                placeholder="Price ₹"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                value={newProduct.price}
                onChangeText={(text) =>
                  setNewProduct({ ...newProduct, price: text })
                }
                style={{ fontFamily: "DMSans_400Regular" }}
              />
              <TextInput
                className="flex-1 bg-surface-light rounded-xl px-4 py-3 text-white border border-border"
                placeholder="Unit (pcs/kg)"
                placeholderTextColor="#6b7280"
                value={newProduct.unit}
                onChangeText={(text) =>
                  setNewProduct({ ...newProduct, unit: text })
                }
                style={{ fontFamily: "DMSans_400Regular" }}
              />
            </View>

            <View className="flex-row mb-3">
              <TextInput
                className="flex-1 bg-surface-light rounded-xl px-4 py-3 text-white border border-border mr-2"
                placeholder="Current stock"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                value={newProduct.stock}
                onChangeText={(text) =>
                  setNewProduct({ ...newProduct, stock: text })
                }
                style={{ fontFamily: "DMSans_400Regular" }}
              />
              <TextInput
                className="flex-1 bg-surface-light rounded-xl px-4 py-3 text-white border border-border"
                placeholder="Max stock"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                value={newProduct.maxStock}
                onChangeText={(text) =>
                  setNewProduct({ ...newProduct, maxStock: text })
                }
                style={{ fontFamily: "DMSans_400Regular" }}
              />
            </View>

            <TextInput
              className="bg-surface-light rounded-xl px-4 py-3 text-white border border-border mb-6"
              placeholder="Low stock alert threshold"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              value={newProduct.lowStockThreshold}
              onChangeText={(text) =>
                setNewProduct({ ...newProduct, lowStockThreshold: text })
              }
              style={{ fontFamily: "DMSans_400Regular" }}
            />

            <Pressable
              onPress={addProduct}
              className="bg-primary rounded-xl py-4 items-center"
            >
              <Text
                className="text-white font-medium"
                style={{ fontFamily: "DMSans_500Medium" }}
              >
                Add to Inventory
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
