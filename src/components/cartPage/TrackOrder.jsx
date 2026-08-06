import React, { useEffect, useState } from "react";
import { Container, Spinner, Button, Row, Col } from "react-bootstrap";
import {
  FaArrowLeft,
  FaCheck,
  FaBox,
  FaTruck,
  FaTruckLoading,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaHashtag,
  FaCreditCard,
  FaCopy,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import Loading from "../../pages/Loading";
import { app, db, auth } from "../../firebase";
import { collection, query, where, getDocs, doc, getDoc, collectionGroup } from "firebase/firestore";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

/* ===============================
    Helpers
================================ */

const formatDate = (date) => {
  if (!date) return null;
  try {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return date;
  }
};

/* ===============================
    Component
================================ */

function TrackOrder() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(location.state?.order);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trackingData, setTrackingData] = useState(null);

  // Manual tracking form states
  const [searchType, setSearchType] = useState("orderId");
  const [searchValue, setSearchValue] = useState("");

  const handleManualSearch = async () => {
    if (!searchValue.trim()) return;

    try {
      setLoading(true);
      setError(null);
      let foundOrder = null;
      const val = searchValue.trim();

      const user = auth.currentUser;

      // If user is logged in, try the direct doc reference first for efficiency
      if (user) {
        const docRef = doc(db, "users", user.uid, "orders", val);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          foundOrder = { id: docSnap.id, ...docSnap.data() };
        }
      }

      if (!foundOrder) {
        try {
          const ordersGroupRef = collectionGroup(db, "orders");
          const q1 = query(ordersGroupRef, where("orderId", "==", val));
          const snap1 = await getDocs(q1);

          if (!snap1.empty) {
            foundOrder = { id: snap1.docs[0].id, ...snap1.docs[0].data() };
          } else {
            const q2 = query(ordersGroupRef, where("shiprocketOrderId", "==", val));
            const snap2 = await getDocs(q2);
            if (!snap2.empty) {
              foundOrder = { id: snap2.docs[0].id, ...snap2.docs[0].data() };
            }
          }
        } catch (groupErr) {
          console.warn("collectionGroup failed (likely missing index). Falling back to manual search.");
          // FOOLPROOF FALLBACK: Iterate through all users since the index is missing
          const usersSnap = await getDocs(collection(db, "users"));
          for (let uDoc of usersSnap.docs) {
            const userOrdersSnap = await getDocs(collection(db, "users", uDoc.id, "orders"));
            const match = userOrdersSnap.docs.find(
              d => d.data().orderId === val || d.data().shiprocketOrderId === val
            );
            if (match) {
              foundOrder = { id: match.id, ...match.data() };
              break;
            }
          }
        }
      }

      if (foundOrder) {
        setOrder(foundOrder);
        // Loading is kept true since useEffect will re-run and fetch tracking info
      } else {
        toast.error("Order not found. Please check your Order ID.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Search error:", err);
      if (err.message && err.message.toLowerCase().includes("permission")) {
        toast.error("Firebase Security Block! You must update your Firestore Rules in the Firebase Console to allow guest reads.", { autoClose: false });
      } else if (err.message && err.message.toLowerCase().includes("index")) {
        toast.error("Firebase Index Missing! Please check the console (F12) for the link to create it.", { autoClose: false });
      } else {
        toast.error("Failed to search for order: " + (err.message || "Unknown error"));
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTracking = async () => {
      if (!order?.shipmentId) {
        setLoading(false);
        return;
      }

      try {
        const functions = getFunctions(app);
        const callable = httpsCallable(functions, "trackOrder");

        const res = await callable({
          shipmentId: order.shipmentId.toString(),
        });

        setTrackingData(res.data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [order]);

  /* ===============================
      Loading & Error
  ================================= */
  if (loading) {
    return <Loading message={t("loadingTracking", "Loading tracking...")} minHeight="100vh" />;
  }

  if (error) {
    return (
      <div className="bg-light" style={{ minHeight: "100vh" }}>
        <Header navigate={navigate} />
        <Container className="text-center py-5">
          <FaExclamationTriangle size={50} color="red" />
          <h5 className="mt-3 text-body">{t("unableToLoadTracking", "Unable to load tracking")}</h5>
          <p className="text-secondary">{error}</p>
          <Button onClick={() => window.location.reload()}>
            {t("retry", "Retry")}
          </Button>
        </Container>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={isDark ? "bg-dark text-light" : "bg-light"} style={{ minHeight: "100vh" }}>
        <Header navigate={navigate} isDark={isDark} />
        <Container className="py-5 d-flex justify-content-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              backgroundColor: isDark ? "#1f2937" : "white",
              padding: "40px",
              borderRadius: "16px",
              boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.5)" : "0 8px 30px rgba(0,0,0,0.06)",
              width: "100%",
              maxWidth: "500px",
              borderTop: isDark ? "4px solid #3b82f6" : "4px solid #1a56db",
            }}
          >
            <div className="d-flex align-items-center mb-4">
              <div style={{
                backgroundColor: isDark ? "#374151" : "#e0e7ff",
                color: isDark ? "#60a5fa" : "#1a56db",
                padding: "12px",
                borderRadius: "10px",
                marginRight: "15px",
                boxShadow: isDark ? "0 4px 10px rgba(0,0,0,0.2)" : "none"
              }}>
                <FaBox size={24} />
              </div>
              <h5 className="mb-0" style={{ fontWeight: "700", color: isDark ? "#f3f4f6" : "#1f2937", fontSize: "1.25rem" }}>
                {t("trackShipmentStatus", "Track status of your shipment")}
              </h5>
            </div>

            <div className="mb-4">
              <input
                type="text"
                className="form-control"
                placeholder={t("enterOrderId", "Enter Order ID to search (e.g. KhDCl...)")}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                style={{
                  padding: "14px 18px",
                  fontSize: "15px",
                  borderRadius: "10px",
                  border: isDark ? "1px solid #4b5563" : "1px solid #d1d5db",
                  backgroundColor: isDark ? "#374151" : "white",
                  color: isDark ? "white" : "black",
                  boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.05)",
                  transition: "all 0.2s ease-in-out"
                }}
                onFocus={(e) => { e.target.style.borderColor = isDark ? "#3b82f6" : "#1a56db"; e.target.style.boxShadow = isDark ? "0 0 0 3px rgba(59, 130, 246, 0.2)" : "0 0 0 3px rgba(26, 86, 219, 0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = isDark ? "#4b5563" : "#d1d5db"; e.target.style.boxShadow = "inset 0 1px 2px rgba(0, 0, 0, 0.05)"; }}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn w-100"
              style={{
                padding: "14px",
                fontWeight: "700",
                borderRadius: "10px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                fontSize: "16px",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
              }}
              onClick={handleManualSearch}
            >
              {t("submit", "Submit")}
            </motion.button>
          </motion.div>
        </Container>
      </div>
    );
  }

  const tracking = trackingData?.tracking_data;
  const shipment = tracking?.shipment_track?.[0];

  if (!shipment) {
    const displayOrderId = order?.shiprocketOrderId || order?.orderId || "N/A";
    const displayPaymentMethod = order?.paymentMethod || order?.paymentMode || "N/A";
    const displayAmount = order?.payableAmount || order?.totalAmount || 0;

    return (
      <div className={isDark ? "bg-dark text-light" : "bg-light"} style={{ minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <Header navigate={navigate} isDark={isDark} />
        <Container className="d-flex flex-column align-items-center py-5">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              backgroundColor: isDark ? "#1f2937" : "white",
              borderRadius: "16px",
              padding: "40px 30px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: isDark ? "0 10px 40px rgba(0,0,0,0.5)" : "0 10px 40px rgba(0,0,0,0.06)",
              textAlign: "center",
              position: "relative",
              overflow: "hidden"
            }}
          >
            {/* Decorative top accent */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "6px", background: "linear-gradient(90deg, #10b981, #3b82f6)" }} />

            <div style={{ 
              width: "80px", 
              height: "80px", 
              backgroundColor: isDark ? "rgba(16, 185, 129, 0.1)" : "#ecfdf5", 
              borderRadius: "50%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              margin: "0 auto 24px auto",
              boxShadow: isDark ? "0 4px 14px rgba(16,185,129,0.3)" : "0 4px 14px rgba(16,185,129,0.15)"
            }}>
              <FaCheckCircle size={40} color="#10b981" />
            </div>

            <h4 style={{ fontWeight: "800", color: isDark ? "#f9fafb" : "#111827", marginBottom: "12px", fontSize: "1.5rem" }}>
              {t("orderConfirmedStatus", "Order Confirmed!")}
            </h4>
            <p style={{ color: isDark ? "#9ca3af" : "#6b7280", margin: "0 auto 30px auto", fontSize: "0.95rem", lineHeight: "1.6", maxWidth: "350px" }}>
              {t("trackingInfoAvailableSoonText", "Your order has been successfully placed. Tracking information will appear here once the courier picks it up.")}
            </p>

            <div style={{
              backgroundColor: isDark ? "#374151" : "#f9fafb",
              border: isDark ? "1px dashed #4b5563" : "1px dashed #d1d5db",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "left"
            }}>
              <h6 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: isDark ? "#9ca3af" : "#9ca3af", marginBottom: "20px", fontWeight: "700" }}>
                {t("orderSummary", "ORDER SUMMARY")}
              </h6>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <span style={{ color: isDark ? "#d1d5db" : "#4b5563", fontWeight: "500", fontSize: "0.95rem", display: "flex", alignContent: "center", alignItems: "center", gap: "8px" }}>
                  <FaHashtag size={14} color={isDark ? "#6b7280" : "#9ca3af"}/> {t("shiprocketOrderId", "Order ID")}
                </span>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ color: isDark ? "#f9fafb" : "#111827", fontWeight: "700", fontSize: "0.95rem" }}>{displayOrderId}</span>
                  <div 
                    className="d-flex align-items-center justify-content-center"
                    title={t("copyOrderId", "Click to copy Order ID")}
                    style={{ 
                      cursor: "pointer", 
                      color: isDark ? "#60a5fa" : "#3b82f6", 
                      backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff", 
                      padding: "6px", 
                      borderRadius: "6px", 
                      transition: "background-color 0.2s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? "rgba(59, 130, 246, 0.25)" : "#dbeafe"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff"}
                    onClick={() => {
                      navigator.clipboard.writeText(displayOrderId);
                      toast.success(t("orderIdCopied", "Order ID copied!"), { autoClose: 1500, hideProgressBar: true, position: "bottom-center" });
                    }}
                  >
                    <FaCopy size={14} />
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <span style={{ color: isDark ? "#d1d5db" : "#4b5563", fontWeight: "500", fontSize: "0.95rem", display: "flex", alignContent: "center", alignItems: "center", gap: "8px" }}>
                  <FaCreditCard size={14} color={isDark ? "#6b7280" : "#9ca3af"}/> {t("paymentMethod", "Payment")}
                </span>
                <span style={{ color: isDark ? "#f9fafb" : "#111827", fontWeight: "600", fontSize: "0.95rem", textTransform: "capitalize" }}>{displayPaymentMethod}</span>
              </div>

              <div style={{ height: "1px", backgroundColor: isDark ? "#4b5563" : "#e5e7eb", margin: "16px 0" }} />

              <div className="d-flex justify-content-between align-items-center">
                <span style={{ color: isDark ? "#f9fafb" : "#111827", fontWeight: "700", fontSize: "1.05rem" }}>{t("totalAmount", "Total")}</span>
                <span style={{ color: "#10b981", fontWeight: "800", fontSize: "1.1rem" }}>₹{Number(displayAmount).toFixed(2)}</span>
              </div>
            </div>

            <Button 
              className="mt-4 w-100" 
              variant={isDark ? "outline-light" : "outline-primary"}
              style={{ fontWeight: "600", padding: "12px", borderRadius: "8px", borderWidth: "2px" }}
              onClick={() => navigate("/")}
            >
              {t("continueShopping", "Continue Shopping")}
            </Button>
          </motion.div>
        </Container>
      </div>
    );
  }

  const rawStatus = shipment.current_status || "Order Placed";

  // Localize order status badge if we have translations
  const getLocalizedStatus = (statusStr) => {
    const s = statusStr.toUpperCase();
    if (s.includes("DELIVERED")) return t("delivered", "Delivered");
    if (s.includes("OUT")) return t("inTransit", "In Transit");
    if (s.includes("TRANSIT")) return t("inTransit", "In Transit");
    if (s.includes("SHIP")) return t("shipped", "Shipped");
    if (s.includes("PACK")) return t("packed", "Packed");
    return t("orderConfirmed", "Order Confirmed");
  };

  const status = getLocalizedStatus(rawStatus);
  const awb = shipment.awb_code || "--";
  const eta = tracking?.etd;
  const courier = shipment.courier_name || "Delhivery";

  // Order Details
  const orderDate = order?.orderDate ? formatDate(order.orderDate) : formatDate(new Date());

  // Address info
  const address = order?.shippingAddress || order?.address || {};
  const name = address.fullName || address.name || order?.userName || "John Doe";
  const line1 = address.addressLine1 || address.street || address.address || t("addressDetailsNotFound", "Address details not found");
  const city = address.city || "";
  const state = address.state || "";
  const pinCode = address.pinCode || address.pincode || address.zipCode || "";
  const phone = address.phone || address.mobile || "";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: '#f8f9fa', fontFamily: "'Inter', sans-serif" }}>
      {/* Top Banner */}
      <div style={{ backgroundColor: '#1a56db', padding: '15px 20px', color: 'white', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ cursor: "pointer" }} onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </div>

        <h5 style={{ margin: 0, fontWeight: '600', fontSize: '1.15rem' }}>{t("orderTrackingPage", "Order Tracking Page")}</h5>
      </div>

      <Container style={{ maxWidth: "850px" }} className="py-4 mt-3">
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          {/* ================= HEADER CARD ================= */}
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h5 style={{ fontWeight: '700', fontSize: '1.05rem', color: '#111827', marginBottom: '8px' }}>
                {t("orderId", "Order ID")}: #{order?.orderId || order?.shiprocketOrderId || 'SC12345678'}
              </h5>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
                {t("placedOn", "Placed on {{date}}", { date: orderDate })}
              </p>
            </div>
            <div className="text-end">
              <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '6px 14px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                {status}
              </span>
              {eta && (
                <p style={{ fontSize: '0.9rem', color: '#111827', fontWeight: '600', margin: 0, marginTop: '12px' }}>
                  {t("expectedDelivery", "Expected Delivery: {{date}}", { date: formatDate(eta) })}
                </p>
              )}
            </div>
          </div>

          <hr style={{ borderColor: '#f3f4f6', margin: '30px 0' }} />

          {/* ================= PROGRESS STEPPER ================= */}
          <Stepper status={rawStatus} tracking={tracking} orderDate={orderDate} />

        </div>

        {/* ================= BOTTOM CARDS ================= */}
        <Row className="mt-4 g-4">
          <Col md={6}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
              <h6 style={{ fontWeight: '700', color: '#111827', marginBottom: '24px', fontSize: '1rem' }}>{t("deliveryDetails", "Delivery Details")}</h6>

              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0, marginBottom: '4px' }}>{t("deliveryPartner", "Delivery Partner")}</p>
                <p style={{ fontWeight: '700', color: '#111827', margin: 0, fontSize: '0.95rem' }}>{courier}</p>
              </div>

              <div>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0, marginBottom: '4px' }}>{t("trackingId", "Tracking ID")}</p>
                <div className="d-flex align-items-center justify-content-between">
                  <p style={{ fontWeight: '700', color: '#111827', margin: 0, fontSize: '0.95rem' }}>{awb}</p>
                  <a href={`https://www.delhivery.com/track/package/${awb}`} target="_blank" rel="noreferrer" style={{ color: '#1a56db', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none' }}>
                    {t("trackOn", "Track on {{courier}}", { courier: courier })}
                  </a>
                </div>
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
              <h6 style={{ fontWeight: '700', color: '#111827', marginBottom: '24px', fontSize: '1rem' }}>{t("shippingAddress", "Shipping Address")}</h6>

              <p style={{ fontWeight: '600', color: '#111827', margin: 0, marginBottom: '10px', fontSize: '0.95rem' }}>{name}</p>
              <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: 0, lineHeight: '1.7' }}>
                {line1},<br />
                {city && `${city},`} {state} - {pinCode}<br />
                {phone && `+91 ${phone}`}
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

/* ===============================
    Header Component (Fallback)
================================ */

const Header = ({ navigate, isDark }) => {
  const { t } = useTranslation();
  return (
    <div
      style={{
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        backgroundColor: isDark ? "#111827" : "#1a56db",
        color: "white"
      }}
    >
      <FaArrowLeft
        style={{ cursor: "pointer" }}
        onClick={() => navigate(-1)}
      />
      <h5 style={{ margin: 0, fontWeight: '600' }}>{t("trackOrder", "Track Order")}</h5>
    </div>
  );
};

/* ===============================
    Stepper (Horizontal)
================================ */

const Stepper = ({ status, tracking, orderDate }) => {
  const { t } = useTranslation();
  const steps = [
    { title: t("orderConfirmed", "Order Confirmed"), icon: <FaCheck />, date: orderDate },
    { title: t("packed", "Packed"), icon: <FaBox />, date: "" },
    { title: t("shipped", "Shipped"), icon: <FaTruckLoading />, date: "" },
    { title: t("inTransit", "In Transit"), icon: <FaTruck />, date: "" },
    { title: t("delivered", "Delivered"), icon: <FaMapMarkerAlt />, date: "" },
  ];

  const getCurrentStep = () => {
    const s = (status || "").toUpperCase();
    if (s.includes("DELIVERED")) return 4;
    if (s.includes("OUT")) return 3;
    if (s.includes("TRANSIT")) return 3; // using 3 to show truck active
    if (s.includes("SHIP")) return 2;
    if (s.includes("PACK")) return 1;
    return 0; // Confirmed
  };

  const current = getCurrentStep();

  return (
    <div style={{ padding: '10px 0 20px', position: 'relative' }}>
      <div style={{ display: 'flex', justifycontent: 'space-between', position: 'relative', zIndex: 2 }}>
        {steps.map((step, i) => {
          const isCompleted = i < current;
          const isActive = i === current;

          let bgColor = '#f3f4f6'; // default grey
          let iconColor = '#9ca3af';
          let textColor = '#9ca3af';

          if (isCompleted) {
            bgColor = '#10b981'; // Green
            iconColor = 'white';
            textColor = '#111827';
          } else if (isActive) {
            bgColor = '#1a56db'; // Blue
            iconColor = 'white';
            textColor = '#1a56db';
          }

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%', position: 'relative' }}>

              {/* Line connector */}
              {i !== steps.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '50%',
                  width: '100%',
                  height: '3px',
                  backgroundColor: isCompleted ? '#10b981' : (isActive ? '#1a56db' : '#f3f4f6'),
                  zIndex: -1
                }}></div>
              )}

              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: iconColor,
                marginBottom: '12px',
                fontSize: '1.1rem'
              }}>
                {step.icon}
              </div>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: isActive ? '700' : '600',
                color: textColor,
                textAlign: 'center'
              }}>
                {step.title}
              </div>
              {/* Date below text for completed steps */}
              {(isCompleted || isActive) && step.date && (
                <div style={{ fontSize: '0.75rem', color: '#1a56db', marginTop: '4px', fontWeight: '600' }}>
                  {step.date}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackOrder;