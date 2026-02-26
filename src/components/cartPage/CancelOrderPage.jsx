import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Image,
  Form,
  Badge,
  Modal,
  Spinner,
  Alert
} from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaTruck
} from "react-icons/fa";
import axios from "axios";
import { db, auth } from "../../firebase";
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
  setDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(val || 0));

function CancelOrderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state;

  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [orderStatus, setOrderStatus] = useState(order?.orderStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  if (!order) return <Alert variant="danger">No Order Found</Alert>;

  const product = order.items?.[0];
  const firestoreDocId = order.id;
  const orderIdNumber = order.orderId;
  const shiprocketOrderId = order.shiprocketOrderId;
  const shipmentId = order.shipmentId;

  const cancelReasons = [
    "Ordered by mistake",
    "Found cheaper elsewhere",
    "Delivery taking too long",
    "Need to change address/phone",
    "Change of mind",
    "Ordered wrong product",
    "Other"
  ];

  const isCancelled =
    orderStatus?.toLowerCase() === "cancelled";

  const shiprocketStatus =
    order.shiprocketStatus?.toLowerCase() || "";

  const isShipped =
    shiprocketStatus.includes("shipped") ||
    shiprocketStatus.includes("in_transit") ||
    shiprocketStatus.includes("out_for_delivery");

  /* ================= CANCEL FUNCTION ================= */

  const handleCancelOrder = async () => {
    try {
      if (!userId) return setError("User not logged in");

      if (!firestoreDocId || !orderIdNumber)
        return setError("Order ID missing");

      setLoading(true);
      setError("");

      let finalReason = selectedReason;
      if (selectedReason === "Other" && otherReason.trim()) {
        finalReason = `Other: ${otherReason.trim()}`;
      }

      const cancelRef = collection(db, "users", userId, "orderCancel");

      // 🔍 Check duplicate cancel
      const q = query(cancelRef, where("orderId", "==", orderIdNumber));
      const existingCancel = await getDocs(q);
      if (!existingCancel.empty) {
        throw new Error("Order already cancelled");
      }

      /* =========================================================
         🔥 CASE 1 — NO SHIPROCKET ID (Manual Reconcile)
      ========================================================== */

      if (!shiprocketOrderId) {
        await addDoc(cancelRef, {
          cancelledBy: userId,
          needsReconcile: true,
          orderDocId: firestoreDocId,
          orderId: orderIdNumber,
          reason: finalReason,
          shipmentId: shipmentId || null,
          shiprocketOrderId: null,
          shiprocketAttemptedResponse: {
            note: "Shiprocket ID missing on client",
            orderDocId: orderIdNumber
          },
          requestedAt: serverTimestamp(),
          cancellationStatus: "pending_reconcile",
          userId
        });

        await updateDoc(
          doc(db, "users", userId, "orders", firestoreDocId),
          {
            orderStatus: "Cancelled",
            cancelledAt: serverTimestamp(),
            cancellationReason: finalReason
          }
        );

        alert("Cancel request recorded for manual reconciliation.");
        navigate("/orders");
        return;
      }

      /* =========================================================
         🔥 CASE 2 — LIVE SHIPROCKET CANCELLATION
      ========================================================== */


      let shiprocketResponseData = null;

      try {
        console.log("🔥 Shiprocket Order ID:", shiprocketOrderId);
        const response = await axios.post(
          "https://cancelshipment-cij4erke6a-uc.a.run.app",
          { orderId: shiprocketOrderId },
          { headers: { "Content-Type": "application/json" } }
        );

        shiprocketResponseData = response.data;

        // ✅ Correct success check (backend returns { success: true })
        if (!response.data.success) {
          throw new Error("Shiprocket cancellation failed");
        }

      } catch (shipErr) {
        await addDoc(cancelRef, {
          cancelledBy: userId,
          needsReconcile: true,
          orderDocId: firestoreDocId,
          orderId: orderIdNumber,
          reason: finalReason,
          shipmentId: shipmentId || null,
          shiprocketOrderId,
          shiprocketAttemptedResponse:
            shiprocketResponseData || "API Failed",
          requestedAt: serverTimestamp(),
          cancellationStatus: "shiprocket_failed",
          userId
        });

        throw new Error("Shiprocket API failed. Logged for reconciliation.");
      }

      /* 🔥 Save successful cancel */

      await addDoc(cancelRef, {
        cancelledBy: userId,
        needsReconcile: false,
        orderDocId: firestoreDocId,
        orderId: orderIdNumber,
        reason: finalReason,
        shipmentId: shipmentId || null,
        shiprocketOrderId,
        shiprocketAttemptedResponse: shiprocketResponseData,
        requestedAt: serverTimestamp(),
        cancellationStatus: "completed",
        userId
      });

      /* 🔥 Update user order */
      await updateDoc(
        doc(db, "users", userId, "orders", firestoreDocId),
        {
          orderStatus: "Cancelled",
          cancelledAt: serverTimestamp(),
          cancellationReason: finalReason,
          shiprocketStatus: "cancelled"
        }
      );

      /* 🔥 Update main orders collection */
      await setDoc(
        doc(db, "orders", orderIdNumber),
        {
          status: "cancelled",
          cancelledAt: serverTimestamp(),
          cancellationReason: finalReason,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      setOrderStatus("Cancelled");

      alert("Order Cancelled Successfully");
      navigate("/orders");

    } catch (err) {
      console.error("Cancellation error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  /* ================= SHIPPED BLOCK ================= */

  if (isShipped) {
    return (
      <Container className="py-5 text-center">
        <FaTruck size={60} className="text-success" />
        <h3 className="mt-3">Order Shipped</h3>
        <p>Your order has already been shipped and cannot be cancelled.</p>
        <Button onClick={() => navigate("/orders")}>
          Go Back
        </Button>
      </Container>
    );
  }

  /* ================= UI ================= */

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}
      >
        <FaArrowLeft
          onClick={() => navigate("/orders")}
          style={{ cursor: "pointer" }}
        />
        <h5 style={{ margin: 0 }}>Cancel Order</h5>
      </div>

      <Container className="py-4" style={{ maxWidth: "600px" }}>
        <div className="text-center mb-4">
          <Image
            src={product?.image}
            fluid
            style={{ maxHeight: "250px" }}
          />
        </div>

        <Card className="mb-4">
          <Card.Body>
            <h6>{product?.name}</h6>

            <div className="d-flex justify-content-between mt-3">
              <span>Subtotal</span>
              <strong>{formatCurrency(order.total)}</strong>
            </div>

            <div className="text-center mt-3">
              <Badge bg={isCancelled ? "danger" : "success"}>
                {isCancelled ? <FaTimesCircle /> : <FaCheckCircle />}{" "}
                {orderStatus}
              </Badge>
            </div>
          </Card.Body>
        </Card>

        {error && <Alert variant="danger">{error}</Alert>}

        {!isCancelled && (
          <Card>
            <Card.Body>
              <Form.Group>
                <Form.Label>Select Reason</Form.Label>
                <Form.Select
                  value={selectedReason}
                  onChange={(e) =>
                    setSelectedReason(e.target.value)
                  }
                >
                  <option value="">Select reason</option>
                  {cancelReasons.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {selectedReason === "Other" && (
                <Form.Control
                  as="textarea"
                  className="mt-3"
                  rows={3}
                  value={otherReason}
                  onChange={(e) =>
                    setOtherReason(e.target.value)
                  }
                />
              )}

              <div className="text-center mt-4">
                <Button
                  variant="danger"
                  disabled={!selectedReason || loading}
                  onClick={() => setShowConfirm(true)}
                >
                  Cancel Order
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}
      </Container>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Cancel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to cancel this order?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            No
          </Button>
          <Button variant="danger" onClick={handleCancelOrder}>
            {loading ? <Spinner size="sm" /> : "Yes, Cancel Order"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default CancelOrderPage;