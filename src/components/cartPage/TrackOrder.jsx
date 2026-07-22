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
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useTranslation } from "react-i18next";
import Loading from "../../pages/Loading";
import { app } from "../../firebase";

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
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trackingData, setTrackingData] = useState(null);

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

  const tracking = trackingData?.tracking_data;
  const shipment = tracking?.shipment_track?.[0];

  if (!shipment) {
    return (
      <div className="bg-light" style={{ minHeight: "100vh" }}>
        <Header navigate={navigate} />
        <Container className="text-center py-5">
          <FaTruck size={60} className="text-secondary" />
          <h5 className="mt-3 text-body">
            {t("trackingAvailableSoon", "Tracking will be available soon")}
          </h5>
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

const Header = ({ navigate }) => {
  const { t } = useTranslation();
  return (
    <div
      style={{
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        backgroundColor: "#1a56db",
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