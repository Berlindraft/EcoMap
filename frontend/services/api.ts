/**
 * EcoMap API client — communicates with the FastAPI backend.
 *
 * Change API_BASE_URL to your machine's IP when testing on a physical device.
 * Android emulator uses 10.0.2.2 to reach host localhost.
 */
import { Platform } from "react-native";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000");

// ─── helpers ───────────────────────────

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}/api${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers as any,
      },
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${res.status}: ${text}`);
    }
    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ─── Auth / Users ─────────────────────

export async function registerUser(uid: string, full_name: string, email: string) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ uid, full_name, email }),
  });
}

export async function fetchUser(uid: string) {
  return request(`/users/${uid}`);
}

export async function updateUser(uid: string, data: Record<string, any>) {
  return request(`/users/${uid}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ─── Reports ──────────────────────────

export async function fetchReports(params?: { waste_type?: string; severity?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.waste_type) query.set("waste_type", params.waste_type);
  if (params?.severity) query.set("severity", params.severity);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return request(`/reports${qs ? `?${qs}` : ""}`);
}

export async function fetchUserReports(uid: string) {
  return request(`/users/${uid}/reports`);
}

export async function submitReport(data: {
  user_id: string;
  image_url: string;
  geo_lat: number;
  geo_lng: number;
  heading?: number;
  waste_type: string;
  severity: string;
  ai_confidence: number;
  trash_count?: number;
  description?: string;
}) {
  return request("/reports", { method: "POST", body: JSON.stringify(data) });
}

// ─── Jobs ─────────────────────────────

export async function fetchJobs() {
  return request("/jobs");
}

export async function createJob(data: {
  posted_by: string;
  title: string;
  job_type?: string;
  description?: string;
  location?: string;
  pay_amount?: number;
  token_reward?: number;
  credits_cost?: number;
  image_url?: string;
}) {
  return request("/jobs", { method: "POST", body: JSON.stringify(data) });
}

export async function applyToJob(jobId: string, applicantId: string) {
  return request(`/jobs/${jobId}/apply`, {
    method: "POST",
    body: JSON.stringify({ job_id: jobId, applicant_id: applicantId }),
  });
}

// ─── Admin: Job Approval ──────────────

export async function fetchPendingJobs() {
  return request("/admin/jobs/pending");
}

export async function approveJob(jobId: string, reviewerId: string) {
  return request(`/admin/jobs/${jobId}/approve`, {
    method: "PUT",
    body: JSON.stringify({ reviewer_id: reviewerId }),
  });
}

export async function rejectJob(jobId: string, reviewerId: string) {
  return request(`/admin/jobs/${jobId}/reject`, {
    method: "PUT",
    body: JSON.stringify({ reviewer_id: reviewerId }),
  });
}

// ─── Eco Tokens & Credits ─────────────

export async function purchaseTokens(userId: string, amount: number) {
  return request("/tokens/purchase", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, amount, php_amount: amount }),
  });
}

export async function convertPointsToCredits(userId: string, pointsToConvert: number) {
  return request("/tokens/convert-points", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, points_to_convert: pointsToConvert }),
  });
}

export async function fetchTokenTransactions(userId: string) {
  return request(`/users/${userId}/tokens`);
}

// ─── Rewards ──────────────────────────

export async function fetchRewards() {
  return request("/rewards");
}

export async function createReward(data: {
  name: string;
  description?: string;
  points_required: number;
  stock: number;
  icon?: string;
  partner_name?: string;
  partner_id?: string;
}) {
  return request("/rewards", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateReward(rewardId: string, data: Record<string, any>) {
  return request(`/rewards/${rewardId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteReward(rewardId: string) {
  return request(`/rewards/${rewardId}`, { method: "DELETE" });
}

export async function redeemReward(userId: string, rewardId: string) {
  return request("/rewards/redeem", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, reward_id: rewardId }),
  });
}

// ─── Eco-Points ───────────────────────

export async function fetchUserPoints(uid: string) {
  return request(`/users/${uid}/points`);
}

// ─── Image Upload ─────────────────────

export async function uploadImage(fileUri: string) {
  const formData = new FormData();
  const filename = fileUri.split("/").pop() || "photo.jpg";
  formData.append("file", {
    uri: fileUri,
    name: filename,
    type: "image/jpeg",
  } as any);

  const url = `${API_BASE_URL}/api/upload/image`;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    headers: {},
  });
  if (!res.ok) throw new Error("Image upload failed");
  return res.json(); // { url: "https://..." }
}

// ─── AI Analysis (now handled directly via roboflow.ts) ──
// analyzeWaste and detectObjects have been moved to frontend/services/roboflow.ts
// for direct Roboflow API calls, bypassing the backend server.

// ─── Cleanup Verification ─────────────

export async function verifyCleanup(
  reportId: string,
  userId: string,
  imageBase64: string,
): Promise<{
  success: boolean;
  waste_detected: number;
  message: string;
  points_awarded: number;
  cleanup_image_url: string;
}> {
  return request(`/reports/${reportId}/cleanup`, {
    method: "POST",
    body: JSON.stringify({
      report_id: reportId,
      user_id: userId,
      image_base64: imageBase64,
    }),
  });
}

// ─── Dashboard ────────────────────────

export async function fetchDashboardStats() {
  return request("/dashboard/stats");
}

// ─── Admin: User Management ───────────

export async function fetchAllUsers() {
  return request("/admin/users");
}

export async function updateUserRole(uid: string, role: string) {
  return request(`/admin/users/${uid}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}

// ─── Partner Products ─────────────────

export async function fetchProducts(partnerId?: string) {
  const qs = partnerId ? `?partner_id=${partnerId}` : "";
  return request(`/products${qs}`);
}

export async function createProduct(data: {
  partner_id: string;
  name: string;
  description?: string;
  price?: number;
  points_price?: number;
  category?: string;
  stock?: number;
  image_url?: string;
}) {
  return request("/products", { method: "POST", body: JSON.stringify(data) });
}

export async function updateProduct(productId: string, data: Record<string, any>) {
  return request(`/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(productId: string) {
  return request(`/products/${productId}`, { method: "DELETE" });
}
