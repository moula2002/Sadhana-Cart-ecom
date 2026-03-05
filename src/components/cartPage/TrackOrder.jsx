import React, { useEffect, useState } from "react";
import { Container, Card, Spinner, Button } from "react-bootstrap";
import {
  FaArrowLeft,
  FaTruck,
  FaCheckCircle,
  FaCircle,
  FaMapMarkerAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
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
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return date;
  }
};

/* ===============================
    Component
================================ */

function TrackOrder() {
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
      Loading
  ================================= */
  if (loading) {
    return (
      <div className="bg-body" style={{ minHeight: "100vh" }}>
        <Header navigate={navigate} />
        <Container className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-body">Loading tracking...</p>
        </Container>
      </div>
    );
  }

  /* ===============================
      Error
  ================================= */
  if (error) {
    return (
      <div className="bg-body" style={{ minHeight: "100vh" }}>
        <Header navigate={navigate} />
        <Container className="text-center py-5">
          <FaExclamationTriangle size={50} color="red" />
          <h5 className="mt-3 text-body">Unable to load tracking</h5>
          <p className="text-secondary">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Container>
      </div>
    );
  }

  const tracking = trackingData?.tracking_data;
  const shipment = tracking?.shipment_track?.[0];
  const activities =
    tracking?.shipment_track_activities || [];

  if (!shipment) {
    return (
      <div className="bg-body" style={{ minHeight: "100vh" }}>
        <Header navigate={navigate} />
        <Container className="text-center py-5">
          <FaTruck size={60} className="text-secondary" />
          <h5 className="mt-3 text-body">
            Tracking will be available soon
          </h5>
        </Container>
      </div>
    );
  }

  const status = shipment.current_status || "Order Placed";
  const awb = shipment.awb_code || "--";
  const eta = tracking?.etd;

  return (
    <div className="bg-body" style={{ minHeight: "100vh" }}>
      <Header navigate={navigate} />

      <Container style={{ maxWidth: "650px" }} className="py-4">
        {/* ================= STATUS CARD ================= */}
        <Card className="mb-3 shadow-sm bg-body border">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 style={{ color: "#6366f1" }}>
                  {status}
                </h5>
                {eta && (
                  <p className="mb-1 text-body">
                    Delivery by {formatDate(eta)}
                  </p>
                )}
              </div>
              <span className="text-secondary" style={{ fontSize: "13px" }}>
                Order #{order?.shiprocketOrderId}
              </span>
            </div>

            <div className="mt-3">
              <span className="badge bg-secondary-subtle text-secondary-emphasis me-2">
                AWB: {awb}
              </span>
              {eta && (
                <span className="badge bg-secondary-subtle text-secondary-emphasis">
                  ETA: {formatDate(eta)}
                </span>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* ================= PROGRESS STEPPER ================= */}
        <Card className="mb-3 shadow-sm bg-body border">
          <Card.Body>
            <h6 className="mb-3 text-body">Delivery Progress</h6>
            <Stepper status={status} />
          </Card.Body>
        </Card>

        {/* ================= HISTORY ================= */}
        {activities.length > 0 && (
          <Card className="shadow-sm bg-body border">
            <Card.Body>
              <h6 className="mb-3 text-body">Tracking History</h6>
              {activities.map((a, i) => (
                <div key={i} className="mb-3">
                  <div className="d-flex gap-2">
                    <FaMapMarkerAlt color="#6366f1" />
                    <div>
                      <div
                        className="text-body"
                        style={{
                          fontWeight: 500,
                          fontSize: "14px",
                        }}
                      >
                        {a.activity}
                      </div>
                      <div
                        className="text-secondary"
                        style={{
                          fontSize: "12px",
                        }}
                      >
                        {a.location}
                      </div>
                      <div
                        className="text-secondary-emphasis"
                        style={{
                          fontSize: "11px",
                          opacity: 0.7
                        }}
                      >
                        {formatDate(a.date)}
                      </div>
                    </div>
                  </div>
                  {i !== activities.length - 1 && <hr className="text-secondary" />}
                </div>
              ))}
            </Card.Body>
          </Card>
        )}
      </Container>
    </div>
  );
}

/* ===============================
    Header
================================ */

const Header = ({ navigate }) => (
  <div
    className="border-bottom"
    style={{
      padding: "16px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      backgroundColor: "var(--bs-body-bg)"
    }}
  >
    <FaArrowLeft
      className="text-body"
      style={{ cursor: "pointer" }}
      onClick={() => navigate(-1)}
    />
    <h5 className="text-body" style={{ margin: 0 }}>Track Order</h5>
  </div>
);

/* ===============================
    Stepper
================================ */

const Stepper = ({ status }) => {
  const steps = [
    "Confirmed",
    "Shipped",
    "In Transit",
    "Out for Delivery",
    "Delivered",
  ];

  const getCurrentStep = () => {
    const s = (status || "").toUpperCase();
    if (s.includes("DELIVERED")) return 4;
    if (s.includes("OUT")) return 3;
    if (s.includes("TRANSIT")) return 2;
    if (s.includes("SHIP") || s.includes("PICK")) return 1;
    return 0;
  };

  const current = getCurrentStep();

  return (
    <>
      {steps.map((step, i) => {
        const active = i <= current;
        return (
          <div
            key={i}
            className="d-flex align-items-start mb-3"
          >
            <div className="me-2">
              {active ? (
                <FaCheckCircle color="#6366f1" />
              ) : (
                <FaCircle className="text-secondary" style={{ opacity: 0.3 }} />
              )}
            </div>
            <div className={active ? "text-body" : "text-secondary"} style={{ fontSize: "14px" }}>
              {step}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default TrackOrder;