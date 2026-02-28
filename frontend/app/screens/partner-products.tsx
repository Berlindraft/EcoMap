import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  createReward,
  updateReward,
  deleteReward,
} from "../../services/api";
import { useDataCache } from "../../contexts/DataCache";
import ResultModal from "../../components/ResultModal";

type Product = {
  product_id: string;
  partner_id: string;
  partner_name?: string;
  name: string;
  description: string;
  price: number;
  points_price: number;
  category: string;
  stock: number;
  image_url: string;
  created_at: string;
  is_reward?: boolean; // true for default admin rewards from rewards collection
};

const CATEGORIES = ["general", "food", "drink", "merchandise", "service", "other"];

export default function PartnerProductsScreen() {
  const { profile } = useAuth();
  const role = profile?.role || "user";
  const isAdmin = role === "admin";

  const {
    products: cachedProducts,
    rewards: cachedRewards,
    productsLoading,
    refreshProducts: refreshCacheProducts,
    refreshRewards: refreshCacheRewards,
  } = useDataCache();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form modal
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [pointsPrice, setPointsPrice] = useState("");
  const [category, setCategory] = useState("general");
  const [stock, setStock] = useState("");

  // Result modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<{
    success: boolean;
    title: string;
    message: string;
  }>({ success: false, title: "", message: "" });

  // Merge cached products + rewards (for admin) into local state
  useEffect(() => {
    if (productsLoading) return;
    const data = cachedProducts;
    if (isAdmin) {
      const rewardProducts: Product[] = cachedRewards
        .filter((r: any) => !data.some((p: any) => p.product_id === r.reward_id))
        .map((r: any) => ({
          product_id: r.reward_id,
          partner_id: r.partner_id || "",
          partner_name: r.partner_name || "EcoMap",
          name: r.name,
          description: r.description || "",
          price: 0,
          points_price: r.points_required || 0,
          category: "general",
          stock: r.stock || 0,
          image_url: "",
          created_at: "",
          is_reward: true,
        }));
      setProducts([...rewardProducts, ...data]);
    } else {
      setProducts(data);
    }
    setLoading(false);
  }, [cachedProducts, cachedRewards, productsLoading, isAdmin]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshCacheProducts(), refreshCacheRewards()]);
    setRefreshing(false);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setPointsPrice("");
    setCategory("general");
    setStock("");
    setEditingProduct(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description);
    setPrice(String(p.price || ""));
    setPointsPrice(String(p.points_price || ""));
    setCategory(p.category || "general");
    setStock(String(p.stock || ""));
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!profile?.uid || !name.trim()) return;
    setSaving(true);
    try {
      if (editingProduct) {
        if (editingProduct.is_reward) {
          // Update in rewards collection
          await updateReward(editingProduct.product_id, {
            name: name.trim(),
            description: description.trim(),
            points_required: parseInt(pointsPrice) || 0,
            stock: parseInt(stock) || 0,
          });
        } else {
          await updateProduct(editingProduct.product_id, {
            name: name.trim(),
            description: description.trim(),
            price: parseFloat(price) || 0,
            points_price: parseInt(pointsPrice) || 0,
            category,
            stock: parseInt(stock) || 0,
          });
        }
        setModalData({ success: true, title: "Updated", message: `"${name}" has been updated.` });
      } else {
        if (isAdmin && !parseFloat(price)) {
          // Admin creating a reward (no peso price = reward)
          await createReward({
            name: name.trim(),
            description: description.trim(),
            points_required: parseInt(pointsPrice) || 0,
            stock: parseInt(stock) || 0,
            partner_name: "EcoMap",
            partner_id: profile.uid,
          });
          setModalData({ success: true, title: "Reward Added", message: `"${name}" has been created.` });
        } else {
          await createProduct({
            partner_id: profile.uid,
            name: name.trim(),
            description: description.trim(),
            price: parseFloat(price) || 0,
            points_price: parseInt(pointsPrice) || 0,
            category,
            stock: parseInt(stock) || 0,
          });
          setModalData({ success: true, title: "Product Added", message: `"${name}" has been created.` });
        }
      }
      setShowForm(false);
      resetForm();
      setModalVisible(true);
      refreshCacheProducts();
      if (isAdmin) refreshCacheRewards();
    } catch {
      setModalData({ success: false, title: "Error", message: "Could not save. Try again." });
      setModalVisible(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    try {
      if (p.is_reward) {
        await deleteReward(p.product_id);
      } else {
        await deleteProduct(p.product_id);
      }
      setModalData({ success: true, title: "Deleted", message: `"${p.name}" has been removed.` });
      setModalVisible(true);
      refreshCacheProducts();
      if (isAdmin) refreshCacheRewards();
    } catch {
      setModalData({ success: false, title: "Error", message: "Could not delete." });
      setModalVisible(true);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#84cc16" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={s.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#84cc16" />}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>
            {isAdmin ? "All Products" : "My Products"}
          </Text>
          <TouchableOpacity onPress={openCreate} style={s.addBtn}>
            <Ionicons name="add" size={24} color="#84cc16" />
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Ionicons name="storefront" size={20} color="#84cc16" />
            <Text style={s.summaryNum}>{products.length}</Text>
            <Text style={s.summaryLabel}>Products</Text>
          </View>
          <View style={s.summaryCard}>
            <Ionicons name="cube" size={20} color="#3b82f6" />
            <Text style={s.summaryNum}>{products.reduce((a, p) => a + p.stock, 0)}</Text>
            <Text style={s.summaryLabel}>Total Stock</Text>
          </View>
        </View>

        {products.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="storefront-outline" size={56} color="#3f3f46" />
            <Text style={s.emptyText}>No products yet</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={openCreate}>
              <Ionicons name="add-circle" size={18} color="#000" />
              <Text style={s.emptyBtnText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        ) : (
          products.map((p) => (
            <View key={p.product_id} style={s.card}>
              <View style={s.cardTop}>
                <View style={s.cardIconWrap}>
                  <Ionicons name={p.is_reward ? "gift" : "pricetag"} size={22} color={p.is_reward ? "#f59e0b" : "#84cc16"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardName}>{p.name}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={s.cardCat}>{p.category}</Text>
                    {p.is_reward && (
                      <View style={{ backgroundColor: "rgba(245,158,11,0.15)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ color: "#f59e0b", fontSize: 9, fontWeight: "700" }}>Default Reward</Text>
                      </View>
                    )}
                {!p.is_reward && (
                      <View style={{ backgroundColor: "rgba(132,204,22,0.1)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ color: "#84cc16", fontSize: 9, fontWeight: "600" }}>{p.partner_name}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={s.cardActions}>
                  <TouchableOpacity onPress={() => openEdit(p)} style={s.iconBtn}>
                    <Ionicons name="pencil" size={16} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(p)} style={s.iconBtn}>
                    <Ionicons name="trash" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {p.description ? (
                <Text style={s.cardDesc} numberOfLines={2}>{p.description}</Text>
              ) : null}

              <View style={s.cardMeta}>
                <View style={s.metaChip}>
                  <Text style={s.metaLabel}>₱{p.price.toFixed(2)}</Text>
                </View>
                {p.points_price > 0 && (
                  <View style={[s.metaChip, { backgroundColor: "rgba(132,204,22,0.15)" }]}>
                    <Ionicons name="leaf" size={12} color="#84cc16" />
                    <Text style={[s.metaLabel, { color: "#84cc16" }]}>{p.points_price} pts</Text>
                  </View>
                )}
                <View style={[s.metaChip, { backgroundColor: "rgba(59,130,246,0.12)" }]}>
                  <Text style={[s.metaLabel, { color: "#3b82f6" }]}>Stock: {p.stock}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ─── Create / Edit Modal ─────────── */}
      <Modal visible={showForm} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.modalOverlay}>
          <View style={s.formCard}>
            <View style={s.formHeader}>
              <Text style={s.formTitle}>{editingProduct ? "Edit Product" : "New Product"}</Text>
              <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={s.label}>Name *</Text>
              <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Product name" placeholderTextColor="#555" />

              <Text style={s.label}>Description</Text>
              <TextInput style={[s.input, { height: 70 }]} value={description} onChangeText={setDescription} placeholder="Optional description" placeholderTextColor="#555" multiline />

              <Text style={s.label}>Price (₱)</Text>
              <TextInput style={s.input} value={price} onChangeText={setPrice} placeholder="0.00" placeholderTextColor="#555" keyboardType="decimal-pad" />

              <Text style={s.label}>Points Price (eco-pts)</Text>
              <TextInput style={s.input} value={pointsPrice} onChangeText={setPointsPrice} placeholder="0 = not redeemable with points" placeholderTextColor="#555" keyboardType="number-pad" />

              <Text style={s.label}>Category</Text>
              <View style={s.catRow}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[s.catChip, category === c && s.catChipActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[s.catChipText, category === c && s.catChipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>Stock</Text>
              <TextInput style={s.input} value={stock} onChangeText={setStock} placeholder="0" placeholderTextColor="#555" keyboardType="number-pad" />
            </ScrollView>

            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving || !name.trim()}>
              {saving ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={s.saveBtnText}>{editingProduct ? "Update Product" : "Add Product"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ResultModal
        visible={modalVisible}
        success={modalData.success}
        title={modalData.title}
        message={modalData.message}
        onDismiss={() => setModalVisible(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#18181b",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { padding: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  addBtn: { padding: 8 },
  summaryRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginTop: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#27272a",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  summaryNum: { color: "#fff", fontSize: 22, fontWeight: "900" },
  summaryLabel: { color: "#9ca3af", fontSize: 10, fontWeight: "600" },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: "#9ca3af", fontSize: 15 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#84cc16",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: { color: "#000", fontWeight: "700" },
  card: {
    backgroundColor: "#27272a",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(132,204,22,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cardCat: { color: "#9ca3af", fontSize: 11, textTransform: "capitalize", marginTop: 1 },
  cardActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#18181b",
    alignItems: "center",
    justifyContent: "center",
  },
  cardDesc: { color: "#a1a1aa", fontSize: 13, marginTop: 10 },
  cardMeta: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaLabel: { color: "#d4d4d8", fontSize: 12, fontWeight: "600" },

  // Form Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  formCard: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  formTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  label: { color: "#9ca3af", fontSize: 12, fontWeight: "600", marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: "#27272a",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  catRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#27272a",
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  catChipActive: { backgroundColor: "#84cc16", borderColor: "#84cc16" },
  catChipText: { color: "#9ca3af", fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  catChipTextActive: { color: "#000" },
  saveBtn: {
    backgroundColor: "#84cc16",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnText: { color: "#000", fontWeight: "800", fontSize: 16 },
});
