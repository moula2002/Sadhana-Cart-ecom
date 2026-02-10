import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import { FaCoins } from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

/* ================= HELPERS ================= */
const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(val || 0));

const formatCoins = (val) =>
  `${Number(val || 0).toFixed(4)} COINS`;

const mapFirestoreOrderToLocal = (docData, docId) => {
  const status = docData.orderStatus || "Processing";

  let orderDate = "N/A";
  if (docData.orderDate?.toDate) {
    orderDate = docData.orderDate.toDate().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return {
    id: docId,
    status,
    date: orderDate,
    total: docData.discountedAmount ?? docData.totalAmount ?? 0,
    paymentMethod: docData.paymentMethod || "N/A",
    shippingAddress: {
      name: docData.name || "N/A",
      address: docData.address || "N/A",
      latitude: docData.latitude || null,
      longitude: docData.longitude || null,
      phone: docData.phoneNumber || "N/A",
    },
    items: (docData.products || []).map((p) => ({
      name: p.name,
      quantity: p.quantity || 1,
      price: p.price || 0,
      coinsUsed: p.coinsUsed || 0,          // ✅ ADD
      coinDiscount: p.coinDiscount || 0,    // ✅ ADD
    })),
  };
};


/* ================= ORDER CARD ================= */
const OrderCard = ({ order, navigate }) => (
  <Card className="mb-4 shadow-sm border-0 rounded-3">
    <Card.Header className="bg-light d-flex justify-content-between align-items-center">
      <h5 className="mb-0 text-primary fw-bold">
        Order ID: <span className="text-dark">{order.id}</span>
      </h5>
      <span
        className={`fw-bold ${
          order.status === "Delivered" ? "text-success" : "text-warning"
        }`}
      >
        {order.status}
      </span>
    </Card.Header>

    <Card.Body>
      <Row>
        <Col md={6}>
          <p className="mb-1">
            <strong>Order Date:</strong> {order.date}
          </p>
          <p className="mb-1">
            <strong>Total:</strong>{" "}
            <span className="text-danger fw-bold">
              {formatCurrency(order.total)}
            </span>
          </p>
          <p className="mb-0">
            <strong>Payment:</strong> {order.paymentMethod}
          </p>
        </Col>

        <Col md={6} className="mt-3 mt-md-0">
          <h6 className="fw-bold mb-2">Shipping To:</h6>
          <p className="mb-1">{order.shippingAddress?.name}</p>
          <p className="mb-1 small text-muted">
            {order.shippingAddress?.address}
          </p>
          <p className="mb-0 small text-muted">
            Ph: {order.shippingAddress?.phone}
          </p>
        </Col>
      </Row>

      {/* ================= ITEMS ================= */}
      {order.items?.length > 0 && (
        <div className="mt-3 border-top pt-3">
          <h6 className="fw-bold mb-2">Items:</h6>

          {order.items.map((item, idx) => {
           const showCoinPrice = item.coinsUsed && item.coinsUsed > 0;

const discountedPrice =
  (item.price * item.quantity) - (item.coinDiscount || 0);


            return (
              <div
                key={idx}
                className="d-flex justify-content-between align-items-center small mb-2"
              >
                <span>
                  {item.name} × {item.quantity}
                </span>

               <span className="fw-bold">
  {showCoinPrice ? (
    <>
      <Badge bg="warning" className="me-2">
        <FaCoins className="me-1" />
        {item.coinsUsed} Coins
      </Badge>

      <div className="text-end">
        <span className="text-success fw-bold">
          {formatCurrency(discountedPrice)}
        </span>
        <small className="text-muted d-block">
          <s>{formatCurrency(item.price * item.quantity)}</s>
        </small>
      </div>
    </>
  ) : (
    formatCurrency(item.price * item.quantity)
  )}
</span>

              </div>
            );
          })}
        </div>
      )}
    </Card.Body>

    <Card.Footer className="bg-light text-center">
      <Button
        variant="info"
        size="sm"
        className="me-2"
        onClick={() =>
          window.open(
            `https://www.google.com/maps?q=${order.shippingAddress.latitude},${order.shippingAddress.longitude}`,
            "_blank"
          )
        }
      >
        View on Map
      </Button>
      <Button variant="outline-dark" size="sm" onClick={() => navigate("/")}>
        Buy Again
      </Button>
    </Card.Footer>
  </Card>
);

/* ================= MAIN PAGE ================= */
function ViewOrderDetails() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  /* ===== AUTH CHECK ===== */
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else navigate("/login");
      setLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  /* ===== FETCH ORDERS ===== */
  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const ref = collection(db, "users", userId, "orders");
        const q = query(ref, orderBy("orderDate", "desc"));
        const snap = await getDocs(q);

        setOrders(
          snap.docs.map((d) =>
            mapFirestoreOrderToLocal(d.data(), d.id)
          )
        );
      } catch (err) {
        console.error("❌ Fetch Orders Error:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Loading your orders...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={9}>
          <h2 className="mb-4 fw-bold">
            Your Orders{" "}
            <span className="text-muted fs-6">({orders.length})</span>
          </h2>

          {orders.length === 0 ? (
            <Alert variant="warning" className="text-center">
              You haven’t placed any orders yet.
              <div className="mt-2">
                <Button onClick={() => navigate("/")}>
                  Start Shopping
                </Button>
              </div>
            </Alert>
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                navigate={navigate}
              />
            ))
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default ViewOrderDetails;
