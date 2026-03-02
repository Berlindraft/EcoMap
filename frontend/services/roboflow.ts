/**
 * Roboflow direct inference client — FAST path.
 *
 * Uses the direct model inference endpoint (not the slower Workflow endpoint)
 * to get object detection results in ~1-3 seconds instead of ~15-17 seconds.
 *
 * Endpoint: POST https://detect.roboflow.com/{model_id}/{version}?api_key=...
 * Body: base64 image string (raw, not JSON-wrapped)
 */

// ─── Config ─────────────────────────────
const ROBOFLOW_API_KEY = process.env.EXPO_PUBLIC_ROBOFLOW_API_KEY || "";
const ROBOFLOW_MODEL_ID = process.env.EXPO_PUBLIC_ROBOFLOW_MODEL_ID || "";
const ROBOFLOW_MODEL_VERSION = process.env.EXPO_PUBLIC_ROBOFLOW_MODEL_VERSION || "1";

// Fallback: workflow endpoint (slower, only if model ID is not set)
const ROBOFLOW_WORKSPACE = process.env.EXPO_PUBLIC_ROBOFLOW_WORKSPACE || "raymunds-workspace";
const ROBOFLOW_WORKFLOW_ID = process.env.EXPO_PUBLIC_ROBOFLOW_WORKFLOW_ID || "detect-count-and-visualize-2";

// ─── Types ──────────────────────────────

export type Detection = {
  x: number;
  y: number;
  width: number;
  height: number;
  class_name: string;
  confidence: number;
  waste_type: string;
  color: string;
};

export type DetectionResult = {
  detections: Detection[];
  summary: { total_count: number; waste_type: string; severity: string };
  image_width: number;
  image_height: number;
};

export type AnalysisResult = {
  waste_type: string;
  severity: string;
  confidence: number;
  action: string;
};

// ─── Helpers (ported from backend inference.py) ──

const WASTE_COLORS: Record<string, string> = {
  plastic: "#FF6B6B",
  biodegradable: "#51CF66",
  hazardous: "#FF922B",
  "e-waste": "#845EF7",
  metal: "#339AF0",
  paper: "#FFA94D",
  glass: "#66D9E8",
  cigarette: "#868E96",
  mixed: "#FCC419",
};

function mapClassToWasteType(className: string): string {
  const cl = className.toLowerCase();
  if (["plastic", "bottle", "bag", "cup", "straw", "lid", "container", "wrapper", "styrofoam"].some(k => cl.includes(k))) return "plastic";
  if (["food", "organic", "bio", "fruit", "vegetable"].some(k => cl.includes(k))) return "biodegradable";
  if (["battery", "chemical", "hazard", "syringe", "medical"].some(k => cl.includes(k))) return "hazardous";
  if (["electronic", "e-waste", "device", "phone", "wire", "cable"].some(k => cl.includes(k))) return "e-waste";
  if (["can", "aluminum", "metal", "tin", "foil", "cap"].some(k => cl.includes(k))) return "metal";
  if (["paper", "cardboard", "carton", "magazine", "newspaper", "tissue"].some(k => cl.includes(k))) return "paper";
  if (["glass", "broken glass", "jar"].some(k => cl.includes(k))) return "glass";
  if (["cigarette", "butt", "tobacco"].some(k => cl.includes(k))) return "cigarette";
  return "mixed";
}

function severityFromCount(count: number): string {
  if (count >= 10) return "critical";
  if (count >= 5) return "high";
  if (count >= 2) return "medium";
  return "low";
}

function actionAdvice(wasteType: string, severity: string): string {
  const advice: Record<string, string> = {
    plastic: "Separate recyclable plastics. Do not burn.",
    biodegradable: "Compost if possible. Keep separate from recyclables.",
    hazardous: "Do not handle directly. Contact local waste authority.",
    "e-waste": "Drop off at designated e-waste collection points.",
    metal: "Collect and bring to scrap metal recycler.",
    mixed: "Requires manual segregation before collection.",
  };
  let base = advice[wasteType] || "Sort and dispose properly.";
  if (severity === "critical" || severity === "high") {
    base += " URGENT: Report to authorities immediately.";
  }
  return base;
}

const CROP_RATIO = 0.95;

function isInCenter(pred: { x: number; y: number }, imgW: number, imgH: number): boolean {
  const marginX = imgW * (1 - CROP_RATIO) / 2;
  const marginY = imgH * (1 - CROP_RATIO) / 2;
  return pred.x >= marginX && pred.x <= imgW - marginX && pred.y >= marginY && pred.y <= imgH - marginY;
}

// ─── Direct Model Inference (FAST) ──────

type RoboflowPrediction = {
  x: number;
  y: number;
  width: number;
  height: number;
  class: string;
  confidence: number;
  [key: string]: any;
};

/**
 * Call Roboflow's direct model inference endpoint.
 * This is MUCH faster than the workflow endpoint (~1-3s vs ~15s).
 *
 * POST https://detect.roboflow.com/{model_id}/{version}?api_key=KEY
 * Body: base64 image (as application/x-www-form-urlencoded)
 */
async function callDirectModel(imageBase64: string): Promise<{
  predictions: RoboflowPrediction[];
  imageInfo: { width: number; height: number };
}> {
  // detect.roboflow.com works for all model types (detection + segmentation)
  const url = `https://detect.roboflow.com/${ROBOFLOW_MODEL_ID}/${ROBOFLOW_MODEL_VERSION}?api_key=${ROBOFLOW_API_KEY}&confidence=25&overlap=50`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    console.log("[Roboflow Direct] Calling model inference...");
    const startTime = Date.now();

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: imageBase64,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Roboflow ${res.status}: ${text}`);
    }

    const data = await res.json();
    console.log(`[Roboflow Direct] Model response in ${elapsed}ms`);

    // Direct model endpoint returns: { predictions: [...], image: { width, height } }
    const predictions: RoboflowPrediction[] = data.predictions || [];
    const imageInfo = data.image || { width: 0, height: 0 };

    console.log(`[Roboflow Direct] Got ${predictions.length} predictions`);
    if (predictions.length > 0) {
      console.log("[Roboflow Direct] Sample:", JSON.stringify(predictions[0]).slice(0, 200));
    }

    return { predictions, imageInfo };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ─── Workflow Fallback (slower) ─────────

function extractPredictions(result: any): { predictions: RoboflowPrediction[]; imageInfo: { width: number; height: number } } {
  if (!result) return { predictions: [], imageInfo: { width: 0, height: 0 } };

  const entries = Array.isArray(result) ? result : [result];
  if (entries.length === 0) return { predictions: [], imageInfo: { width: 0, height: 0 } };

  const entry = entries[0];
  if (typeof entry !== "object") return { predictions: [], imageInfo: { width: 0, height: 0 } };

  let imageInfo: { width: number; height: number } = { width: 0, height: 0 };

  for (const key of ["predictions", "model_predictions", "output", "detections", "result"]) {
    if (key in entry) {
      const val = entry[key];
      if (typeof val === "object" && !Array.isArray(val)) {
        if (val.image && typeof val.image === "object") imageInfo = val.image;
        if (Array.isArray(val.predictions)) return { predictions: val.predictions, imageInfo };
      }
      if (Array.isArray(val)) return { predictions: val, imageInfo };
    }
  }

  for (const [, val] of Object.entries(entry)) {
    if (typeof val === "object" && val !== null && !Array.isArray(val) && "predictions" in val) {
      const v = val as any;
      if (v.image && typeof v.image === "object") imageInfo = v.image;
      if (Array.isArray(v.predictions)) return { predictions: v.predictions, imageInfo };
    }
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
      if ("class" in val[0] || "class_name" in val[0] || "class_id" in val[0]) {
        return { predictions: val as RoboflowPrediction[], imageInfo };
      }
    }
  }

  console.log("[Roboflow Workflow] Could not find predictions. Keys:", Object.keys(entry));
  return { predictions: [], imageInfo: { width: 0, height: 0 } };
}

async function callWorkflowFallback(imageBase64: string): Promise<{
  predictions: RoboflowPrediction[];
  imageInfo: { width: number; height: number };
}> {
  const url = `https://detect.roboflow.com/infer/workflows/${ROBOFLOW_WORKSPACE}/${ROBOFLOW_WORKFLOW_ID}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    console.log("[Roboflow Workflow] Calling workflow (fallback)...");
    const startTime = Date.now();

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: ROBOFLOW_API_KEY,
        inputs: { image: { type: "base64", value: imageBase64 } },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Roboflow Workflow ${res.status}: ${text}`);
    }

    const data = await res.json();
    console.log(`[Roboflow Workflow] Response in ${elapsed}ms`);

    return extractPredictions(data.outputs || data);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ─── Smart Router ───────────────────────

async function callRoboflow(imageBase64: string): Promise<{
  predictions: RoboflowPrediction[];
  imageInfo: { width: number; height: number };
}> {
  // Use direct model endpoint if model ID is configured (FAST ~1-3s)
  if (ROBOFLOW_MODEL_ID) {
    return callDirectModel(imageBase64);
  }
  // Fallback to workflow endpoint (SLOW ~15s)
  console.log("[Roboflow] No EXPO_PUBLIC_ROBOFLOW_MODEL_ID set, falling back to workflow");
  return callWorkflowFallback(imageBase64);
}

// ─── Public API ─────────────────────────

/**
 * Combined detect + analyze in a single Roboflow call.
 * Returns both DetectionResult and AnalysisResult.
 */
export async function detectAndAnalyze(
  imageBase64: string,
  origWidth?: number,
  origHeight?: number,
): Promise<{ detection: DetectionResult; analysis: AnalysisResult }> {
  try {
    const { predictions, imageInfo } = await callRoboflow(imageBase64);

    const roboW = imageInfo.width || origWidth || 640;
    const roboH = imageInfo.height || origHeight || 480;

    const outW = origWidth || roboW;
    const outH = origHeight || roboH;
    const sx = outW / roboW;
    const sy = outH / roboH;

    // Build detections list (filter edge detections)
    const detections: Detection[] = [];
    for (const p of predictions) {
      if (!isInCenter(p, roboW, roboH)) continue;

      const wasteType = mapClassToWasteType(p.class || "");
      detections.push({
        x: p.x * sx,
        y: p.y * sy,
        width: p.width * sx,
        height: p.height * sy,
        class_name: p.class || "unknown",
        confidence: Math.round((p.confidence || 0) * 1000) / 1000,
        waste_type: wasteType,
        color: WASTE_COLORS[wasteType] || "#FCC419",
      });
    }

    const primaryType = detections.length > 0
      ? detections.reduce((best, d) => d.confidence > best.confidence ? d : best).waste_type
      : "mixed";

    const detection: DetectionResult = {
      detections,
      summary: {
        total_count: detections.length,
        waste_type: primaryType,
        severity: severityFromCount(detections.length),
      },
      image_width: outW,
      image_height: outH,
    };

    let analysis: AnalysisResult;
    if (predictions.length === 0) {
      analysis = {
        waste_type: "mixed",
        severity: "low",
        confidence: 0.0,
        action: "No waste detected. If this is wrong, please submit manually.",
      };
    } else {
      const best = predictions.reduce((a, b) => (b.confidence || 0) > (a.confidence || 0) ? b : a);
      const wasteType = mapClassToWasteType(best.class || "");
      const severity = severityFromCount(predictions.length);
      analysis = {
        waste_type: wasteType,
        severity,
        confidence: Math.round((best.confidence || 0) * 1000) / 1000,
        action: actionAdvice(wasteType, severity),
      };
    }

    return { detection, analysis };
  } catch (error) {
    console.error("[Roboflow Direct] Error:", error);

    return {
      detection: {
        detections: [],
        summary: { total_count: 0, waste_type: "mixed", severity: "low" },
        image_width: origWidth || 0,
        image_height: origHeight || 0,
      },
      analysis: {
        waste_type: "mixed",
        severity: "medium",
        confidence: 0.75,
        action: "AI analysis unavailable. Requires manual segregation. Do not burn.",
      },
    };
  }
}
