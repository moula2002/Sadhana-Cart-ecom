// ======================================================
// 🔥 COMPLETE FIXED PRODUCTION FUNCTIONS FILE
// ======================================================

const { onRequest, onCall } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const axios = require("axios");
const express = require("express");
const cors = require("cors");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

let cachedToken = null;
let tokenExpiry = null;
const TOKEN_CACHE_DURATION = 3600000;

async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    console.error("❌ Shiprocket credentials not found in env");
    throw new Error("Shiprocket credentials not found in environment variables");
  }

  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const loginRes = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      { email, password },
      { timeout: 10000, headers: { "Content-Type": "application/json" } }
    );

    if (!loginRes.data?.token) {
      throw new Error("No token received from Shiprocket");
    }

    cachedToken = loginRes.data.token;
    tokenExpiry = Date.now() + TOKEN_CACHE_DURATION;
    return cachedToken;
  } catch (error) {
    cachedToken = null;
    tokenExpiry = null;
    throw new Error(`Shiprocket authentication failed: ${error.response?.data?.message || error.message}`);
  }
}

// ======================================================
// 🚚 CREATE FORWARD SHIPROCKET ORDER (/adhoc)
// ======================================================
exports.createShiprocketOrder = onRequest(
  {
    region: "us-central1",
    secrets: ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD"],
    cors: true   // 🔥 ADD THIS LINE
  },
  async (req, res) => {

    try {
      const token = await getShiprocketToken();

      let phone = req.body.billing_phone?.toString()?.replace(/\D/g, "") || "";
      if (phone.length < 10) {
        return res.status(400).json({ success: false, error: "Phone number must have at least 10 digits" });
      }
      phone = phone.substring(phone.length - 10);

      req.body.billing_phone = phone;
      req.body.billing_pincode = (req.body.billing_pincode || "000000").toString();
      req.body.sub_total = (req.body.sub_total || "0").toString();
      req.body.payment_method = req.body.payment_method || "Prepaid";
      req.body.length = req.body.length || 1;
      req.body.breadth = req.body.breadth || 1;
      req.body.height = req.body.height || 1;
      req.body.weight = req.body.weight || 1;

      if (!req.body.order_items?.length) {
        return res.status(400).json({ success: false, error: "order_items cannot be empty" });
      }

      req.body.order_items = req.body.order_items.map((item) => ({
        name: item.name || "Product",
        sku: item.sku || `sku_${Date.now()}`,
        units: Number(item.units) || 1,
        selling_price: (item.selling_price || "0").toString(),
      }));

      const orderRes = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
        req.body,
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          timeout: 30000,
        }
      );

      return res.status(200).json(orderRes.data);
    } catch (error) {
      return res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data,
      });
    }
  }
);

// ======================================================
// 🔄 CREATE SHIPROCKET RETURN ORDER (/return)
// ======================================================
exports.createShiprocketReturnOrder = onRequest(
  { region: "us-central1", secrets: ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD"] },
  async (req, res) => {
    try {
      const token = await getShiprocketToken();
      const { originalShiprocketOrderId, order_date, billing_customer_name, billing_address, billing_city, billing_pincode, billing_state, billing_country, billing_email, billing_phone, return_items, reason_for_return } = req.body;

      // Validate address
      if (!billing_address || billing_address.trim() === "" || billing_address === "N/A") {
        return res.status(400).json({ success: false, error: "Valid billing_address is required (cannot be N/A or empty)" });
      }
      if (!billing_city || billing_city.trim() === "" || billing_city === "N/A") {
        return res.status(400).json({ success: false, error: "Valid billing_city is required (cannot be N/A or empty)" });
      }
      if (!billing_state || billing_state.trim() === "" || billing_state === "N/A") {
        return res.status(400).json({ success: false, error: "Valid billing_state is required (cannot be N/A or empty)" });
      }
      if (!billing_pincode || billing_pincode.toString().trim() === "000000") {
        return res.status(400).json({ success: false, error: "Valid billing_pincode is required (6 digits, not 000000)" });
      }

      if (!originalShiprocketOrderId) {
        return res.status(400).json({ success: false, error: "originalShiprocketOrderId is required for return" });
      }

      let phone = billing_phone.toString().replace(/\D/g, "");
      if (phone.length < 10) {
        return res.status(400).json({ success: false, error: "billing_phone must be at least 10 digits" });
      }
      phone = phone.substring(phone.length - 10);

      const returnOrderData = {
        order_id: originalShiprocketOrderId, // ✅ ORIGINAL FORWARD ORDER ID
        order_date: order_date || new Date().toISOString().split("T")[0],
        billing_customer_name: billing_customer_name || "Customer",
        billing_last_name: billing_customer_name || "Return",
        billing_address: billing_address.trim(),
        billing_city: billing_city.trim(),
        billing_pincode: billing_pincode.toString().trim(),
        billing_state: billing_state.trim(),
        billing_country: billing_country || "India",
        billing_email: billing_email || "noreply@sadhana.com",
        billing_phone: phone,
        shipping_is_billing: true,
        order_items: return_items.map((item) => ({
          name: (item.name || "Product").trim(),
          sku: item.sku || `sku_${Date.now()}`,
          units: Number(item.units) || 1,
          selling_price: (item.selling_price || "0").toString(),
        })),
        payment_method: "Return",
        sub_total: "0",
        length: 1,
        breadth: 1,
        height: 1,
        weight: 1,
        is_return: true,
        reason_for_return: reason_for_return || "Customer Return",
      };

      const returnRes = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/orders/create/return",
        returnOrderData,
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          timeout: 30000,
        }
      );

      return res.status(200).json(returnRes.data);
    } catch (error) {
      return res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data,
      });
    }
  }
);

// ======================================================
// 📦 TRACK ORDER (HTTP & Callable)
// ======================================================
exports.getTrackingDetails = onRequest(
  { region: "us-central1", secrets: ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD"] },
  async (req, res) => {
    try {
      const shipmentId = req.query.shipmentId;
      if (!shipmentId) return res.status(400).json({ success: false, error: "shipmentId is required" });

      const token = await getShiprocketToken();
      const response = await axios.get(
        `https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${shipmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.status(200).json(response.data);
    } catch (error) {
      return res.status(500).json({ success: false, error: error.response?.data || error.message });
    }
  }
);

exports.trackOrder = onCall(
  { region: "us-central1", secrets: ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD"] },
  async (request) => {
    const shipmentId = request.data.shipmentId;
    if (!shipmentId) throw new Error("shipmentId is required");

    const token = await getShiprocketToken();
    const response = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${shipmentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
);

// ======================================================
// ❌ CANCEL SHIPMENT
// ======================================================
exports.cancelShipment = onRequest(
  { region: "us-central1", secrets: ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD"] },
  async (req, res) => {
    try {
      const orderId = req.body.orderId;
      if (!orderId) return res.status(400).json({ success: false, message: "orderId is required" });

      const token = await getShiprocketToken();
      const response = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/orders/cancel",
        { ids: [orderId] },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      return res.status(200).json({ success: true, data: response.data });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.response?.data || error.message });
    }
  }
);

// ======================================================
// 🔥 SINGLE FIRESTORE TRIGGER: CREATE SHIPROCKET RETURN (FIXED)
// ✅ Uses originalShiprocketOrderId + Fixed Phone Logic
// ======================================================
exports.onReturnRequestWritten = onDocumentWritten(
  { region: "us-central1", document: "users/{userId}/return_requests/{returnId}" },
  async (event) => {
    try {
      const { userId, returnId } = event.params;
      const afterData = event.data?.after?.data?.();
      if (!afterData || afterData.shiprocketOrderId || afterData.shiprocketAttempted) return;

      const prevStatus = event.data?.before?.data?.()?.status;
      const newStatus = afterData.status;
      if (prevStatus === newStatus || !["approved", "refund_approved"].includes(newStatus)) return;

      const orderSnap = await db.collection("users").doc(userId).collection("orders").doc(afterData.orderId).get();
      const orderDoc = orderSnap.exists ? orderSnap.data() : null;
      if (!orderDoc) return;

      // ✅ CRITICAL: Use ORIGINAL SHIPROCKET ORDER ID FROM FORWARD ORDER
      const originalShiprocketOrderId = orderDoc.shiprocketOrderId;
      if (!originalShiprocketOrderId) {
        console.log(`❌ No shiprocketOrderId found in order ${afterData.orderId}`);
        return;
      }

      // ✅ FIXED PHONE LOGIC
      const cleanPhone = (orderDoc.phoneNumber || "").toString().replace(/\D/g, "");
      const phone = cleanPhone.length >= 10
        ? cleanPhone.substring(cleanPhone.length - 10)
        : cleanPhone;

      const payload = {
        order_id: originalShiprocketOrderId, // ✅ CORRECT: Original Forward Order ID
        order_date: new Date().toISOString().split("T")[0],
        billing_customer_name: afterData.userName || "Customer",
        billing_address: orderDoc.addressLine || "",
        billing_city: orderDoc.city || "",
        billing_pincode: orderDoc.shippingPincode || "",
        billing_state: orderDoc.state || "",
        billing_country: "India",
        billing_phone: phone, // ✅ FIXED
        billing_email: orderDoc.billing_email || "noreply@sadhana.com",
        shipping_is_billing: true,
        order_items: [{
          name: afterData.productName || "Returned Item",
          sku: afterData.productId || `sku_${Date.now()}`,
          units: afterData.quantity || 1,
          selling_price: (afterData.refundAmount || 0).toString(),
        }],
        payment_method: "Return",
        sub_total: "0",
        length: 1, breadth: 1, height: 1, weight: 1,
        is_return: true,
        reason_for_return: afterData.reason || "Customer Return",
      };

      const token = await getShiprocketToken();
      const shipRes = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/orders/create/return",
        payload,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, timeout: 30000 }
      );

      await db.collection("users").doc(userId).collection("return_requests").doc(returnId).update({
        shiprocketOrderId: shipRes.data.order_id,
        shipmentId: shipRes.data.shipment_id,
        shiprocketStatus: shipRes.data.status || "created",
        shiprocketRawResponse: shipRes.data,
        shiprocketCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        shiprocketAttempted: true,
      });

      console.log(`✅ Shiprocket return created for ${returnId}: ${shipRes.data.shipment_id}`);
    } catch (e) {
      console.error("onReturnRequestWritten error:", e);
    }
  }
);

// ======================================================
// 📱 OTP SECTION
// ======================================================
let otpStore = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.sendOtp = onRequest(
  { region: "us-central1", secrets: ["FAST2SMS_API_KEY"] },
  async (req, res) => {
    try {
      const phone = req.body.phone;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: "Phone number required",
        });
      }

      const otp = generateOTP();
      otpStore[phone] = otp;

      await axios.post(
        "https://www.fast2sms.com/dev/bulkV2",
        {
          route: "otp",
          variables_values: otp,
          numbers: phone,
        },
        {
          headers: {
            authorization: process.env.FAST2SMS_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
      });
    } catch (error) {
      console.error(
        "OTP send error:",
        error.response?.data || error.message
      );

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

exports.verifyOtp = onRequest(
  { region: "us-central1" },
  async (req, res) => {
    try {
      const { phone, otp } = req.body;

      if (!phone || !otp) {
        return res.status(400).json({
          success: false,
          message: "Phone and OTP required",
        });
      }

      if (otpStore[phone] === otp) {
        delete otpStore[phone];
        return res.status(200).json({
          success: true,
          message: "OTP verified successfully",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    } catch (error) {
      console.error("OTP verify error:", error.message);

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ======================================================
// 💰 MANUAL REFUND (CALLABLE)
// ======================================================
exports.completeRefund = onCall(
  { region: "us-central1" },
  async (request) => {
    const { userId, returnId } = request.data;

    if (!userId || !returnId) {
      throw new Error("Missing parameters");
    }

    await processRefund(userId, returnId);

    return { success: true };
  }
);

// ======================================================
// 🔥 AUTO REFUND TRIGGER (FIRESTORE)
// ======================================================
exports.autoCompleteRefund = onDocumentWritten(
  {
    document: "users/{userId}/return_requests/{returnId}",
    region: "us-central1",
  },
  async (event) => {
    const before = event.data.before?.data();
    const after = event.data.after?.data();

    if (!after) return;
    if (before?.status === after.status) return;
    if (after.status !== "refund_approved") return;

    console.log("🔥 REFUND APPROVED DETECTED");

    await processRefund(event.params.userId, event.params.returnId);

    console.log("✅ Refund processed automatically");
  }
);

// ======================================================
// 🔁 SHARED REFUND PROCESSOR
// ======================================================
async function processRefund(userId, returnId) {
  const returnRef = db
    .collection("users")
    .doc(userId)
    .collection("return_requests")
    .doc(returnId);

  await db.runTransaction(async (tx) => {
    const returnSnap = await tx.get(returnRef);
    if (!returnSnap.exists) {
      throw new Error("Return not found");
    }

    const data = returnSnap.data();

    if (data.status === "refund_completed") {
      return;
    }

    const coinsToRefund = Number(data.coinsToRefund || 0);
    const refundType = data.refundType || "wallet";
    const orderId = data.orderId;
    const productId = data.productId;

    const orderRef = db
      .collection("users")
      .doc(userId)
      .collection("orders")
      .doc(orderId);

    const orderSnap = await tx.get(orderRef);

    if (refundType === "wallet" && coinsToRefund > 0) {
      const walletRef = db
        .collection("users")
        .doc(userId)
        .collection("wallet")
        .doc("data");

      const walletTxnRef = db
        .collection("users")
        .doc(userId)
        .collection("wallet_transactions")
        .doc(`return_refund_${returnId}`);

      tx.set(
        walletRef,
        {
          coins: admin.firestore.FieldValue.increment(coinsToRefund),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(walletTxnRef, {
        type: "credit",
        coins: coinsToRefund,
        reason: "Return Refund",
        returnId,
        orderId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    tx.update(returnRef, {
      status: "refund_completed",
      refundCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (orderSnap.exists) {
      const products = orderSnap.data().products || [];

      const updatedProducts = products.map((p) => {
        if (p.productid === productId) {
          return {
            ...p,
            returnStatus: "refund_completed",
          };
        }
        return p;
      });

      tx.update(orderRef, { products: updatedProducts });
    }
  });
}

// ======================================================
// 🔐 ADMIN: CREATE SHIPROCKET RETURN FOR EXISTING RETURN
// ✅ Uses originalShiprocketOrderId + Fixed Phone Logic
// ======================================================
exports.createShiprocketReturnAdmin = onRequest(
  {
    region: "us-central1",
    secrets: ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD", "ADMIN_SECRET"],
  },
  async (req, res) => {
    try {
      const adminSecret = process.env.ADMIN_SECRET;
      const provided = req.headers["x-admin-secret"] || req.query.admin_secret;
      if (!adminSecret || provided !== adminSecret) {
        return res
          .status(401)
          .json({ success: false, error: "Unauthorized - invalid admin secret" });
      }

      const { userId, returnId } = req.body || req.query;
      if (!userId || !returnId) {
        return res
          .status(400)
          .json({ success: false, error: "userId and returnId are required" });
      }

      const returnRef = db
        .collection("users")
        .doc(userId)
        .collection("return_requests")
        .doc(returnId);
      const returnSnap = await returnRef.get();
      if (!returnSnap.exists) {
        return res
          .status(404)
          .json({ success: false, error: "Return request not found" });
      }

      const returnData = returnSnap.data();
      if (returnData.shiprocketOrderId || returnData.shipmentId) {
        return res.status(200).json({
          success: true,
          message: "Shiprocket order already exists",
          data: {
            shiprocketOrderId: returnData.shiprocketOrderId,
            shipmentId: returnData.shipmentId,
          },
        });
      }

      const orderSnap = await db
        .collection("users")
        .doc(userId)
        .collection("orders")
        .doc(returnData.orderId)
        .get();
      const orderDoc = orderSnap.exists ? orderSnap.data() : null;
      if (!orderDoc) {
        return res
          .status(400)
          .json({ success: false, error: "Order document not found" });
      }

      // ✅ CRITICAL: Use ORIGINAL SHIPROCKET ORDER ID
      const originalShiprocketOrderId = orderDoc.shiprocketOrderId;
      if (!originalShiprocketOrderId) {
        return res.status(400).json({
          success: false,
          error: "No original shiprocketOrderId found in order document"
        });
      }

      // ✅ FIXED PHONE LOGIC
      const cleanPhone = (orderDoc.phoneNumber || "").toString().replace(/\D/g, "");
      const phone = cleanPhone.length >= 10
        ? cleanPhone.substring(cleanPhone.length - 10)
        : cleanPhone;

      const payload = {
        order_id: originalShiprocketOrderId, // ✅ CORRECT: Original Forward Order ID
        order_date: new Date().toISOString().split("T")[0],
        billing_customer_name: returnData.userName || "Customer",
        billing_address: orderDoc.addressLine || "",
        billing_city: orderDoc.city || "",
        billing_pincode: orderDoc.shippingPincode || "",
        billing_state: orderDoc.state || "",
        billing_country: orderDoc.country || "India",
        billing_phone: phone, // ✅ FIXED
        billing_email: orderDoc.billing_email || returnData.email || "noreply@sadhana.com",
        shipping_is_billing: true,
        order_items: [{
          name: returnData.productName || "Returned Item",
          sku: returnData.productId || `sku_${Date.now()}`,
          units: returnData.quantity || 1,
          selling_price: (returnData.refundAmount || 0).toString(),
        }],
        payment_method: "Return",
        sub_total: "0",
        length: 1, breadth: 1, height: 1, weight: 1,
        is_return: true,
        reason_for_return: returnData.reason || "Customer Return",
      };

      const token = await getShiprocketToken();
      const shipRes = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/orders/create/return",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      await returnRef.update({
        shiprocketOrderId: shipRes.data.order_id,
        shipmentId: shipRes.data.shipment_id,
        shiprocketStatus: shipRes.data.status || "created",
        shiprocketRawResponse: shipRes.data,
        shiprocketCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        shiprocketAttempted: true,
      });

      return res.status(200).json({ success: true, data: shipRes.data });
    } catch (e) {
      console.error("createShiprocketReturnAdmin error:", e);
      return res.status(500).json({ success: false, error: e.message });
    }
  }
);

// ======================================================
// 🌐 EXPRESS APP FOR MULTIPLE ROUTES
// ======================================================

const app = express();

app.use(cors({
  origin: "*", // for testing
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Example protected route with admin secret
app.post("/admin/health-check", (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  const provided = req.headers["x-admin-secret"];
  
  if (!adminSecret || provided !== adminSecret) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  
  res.status(200).json({ success: true, message: "Admin access granted" });
});

// ======================================================
// 🚀 EXPORT EXPRESS APP AS CLOUD FUNCTION
// ======================================================
exports.api = onRequest(
  { 
    region: "us-central1",
    secrets: ["ADMIN_SECRET"] // Add other secrets as needed
  },
  app
);