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
  Modal,
  ListGroup,
  Image
} from "react-bootstrap";
import {
  FaMapMarkerAlt,
  FaTruck,
  FaCreditCard
} from "react-icons/fa";
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

/* ================= MAP FIRESTORE DATA ================= */
const mapFirestoreOrderToLocal = (docData, docId) => {
  const status = docData.orderStatus || "Processing";

  let orderDate = "N/A";
  if (docData.orderDate?.toDate) {
    orderDate = docData.orderDate.toDate().toLocaleString("en-IN");
  }

  // ✅ TOTAL FIX HERE
  const calculatedItemsTotal = (docData.products || []).reduce(
    (sum, p) => sum + (p.price || 0) * (p.quantity || 1),
    0
  );

  const finalTotal =
    docData.productsTotal ??
    docData.totalAmount ??
    calculatedItemsTotal;

  return {
    id: docId,
    orderId: docData.orderId || "N/A",
    status,
    date: orderDate,
    total: finalTotal, // ✅ updated total
    paymentMethod: docData.paymentMethod || "N/A",
    paymentId: docData.paymentId || null,
    shipmentId: docData.shipmentId || null,
    shiprocketOrderId: docData.shiprocketOrderId || null,
    shiprocketStatus: docData.shiprocketStatus || "N/A",

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
      image: p.images?.[0] || null,
      sku: p.sizevariants?.sku || "N/A",
      stock: p.sizevariants?.stock || 0,
      selectedSize: p.selectedSize || "N/A",
    })),
  };
};

/* ================= MAIN COMPONENT ================= */
function ViewOrderDetails() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else navigate("/login");
      setLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      try {
        const ref = collection(db, "users", userId, "orders");
        const q = query(ref, orderBy("orderDate", "desc"));
        const snap = await getDocs(q);
        setOrders(snap.docs.map((d) => mapFirestoreOrderToLocal(d.data(), d.id)));
      } catch (err) {
        console.error(err);
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
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {orders.length === 0 ? (
        <Alert variant="warning">No Orders Found</Alert>
      ) : (
        orders.map((order) => (
          <Card key={order.id} className="mb-3 shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-bold mb-1">{order.shippingAddress.name}</h6>
                <small>{order.date}</small>
                <div>
                  <Badge bg="warning">{order.status}</Badge>
                </div>
              </div>
              <div className="text-end">
                {/* ✅ CARD TOTAL FIXED */}
                <h5 className="text-primary">
                  {formatCurrency(order.total)}
                </h5>
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowModal(true);
                  }}
                >
                  Details
                </Button>
              </div>
            </Card.Body>
          </Card>
        ))
      )}

      {/* ================= MODAL ================= */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        {selectedOrder && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Order Details</Modal.Title>
            </Modal.Header>

            <Modal.Body>

              <Alert variant="secondary">
                <strong>Order ID:</strong> {selectedOrder.orderId}
                <br />
                <strong>Transaction ID:</strong> {selectedOrder.id}
              </Alert>

              <h6 className="fw-bold">Shipping Address</h6>
              <p>
                {selectedOrder.shippingAddress.name} <br />
                {selectedOrder.shippingAddress.address} <br />
                📞 {selectedOrder.shippingAddress.phone}
              </p>

              <h6 className="fw-bold mt-3">
                <FaCreditCard className="me-2" />
                Payment
              </h6>
              <p>
                Method: {selectedOrder.paymentMethod} <br />
                Payment ID: {selectedOrder.paymentId || "N/A"}
              </p>

              <h6 className="fw-bold mt-3">
                <FaTruck className="me-2" />
                Shipment Details
              </h6>
              <p>
                Shipment ID: {selectedOrder.shipmentId || "N/A"} <br />
                Shiprocket Order ID: {selectedOrder.shiprocketOrderId || "N/A"} <br />
                Status: <Badge bg="info">{selectedOrder.shiprocketStatus}</Badge>
              </p>

              <h6 className="fw-bold mt-4">Products</h6>
              <ListGroup variant="flush">
                {selectedOrder.items.map((item, i) => (
                  <ListGroup.Item key={i}>
                    <Row>
                      <Col md={3}>
                        {item.image && (
                          <Image src={item.image} fluid rounded />
                        )}
                      </Col>
                      <Col md={9}>
                        <h6>{item.name}</h6>
                        Qty: {item.quantity} <br />
                        Price: {formatCurrency(item.price)} <br />
                        SKU: {item.sku} <br />
                        Size: {item.selectedSize}
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              <hr />

              {/* ✅ MODAL TOTAL FIXED */}
              <div className="text-end fw-bold fs-4">
                Total: {formatCurrency(selectedOrder.total)}
              </div>

            </Modal.Body>

            <Modal.Footer>
              {selectedOrder.shippingAddress.latitude &&
                selectedOrder.shippingAddress.longitude && (
                  <Button
                    variant="outline-success"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps?q=${selectedOrder.shippingAddress.latitude},${selectedOrder.shippingAddress.longitude}`,
                        "_blank"
                      )
                    }
                  >
                    <FaMapMarkerAlt className="me-1" />
                    View Location
                  </Button>
                )}
              <Button variant="dark" onClick={() => setShowModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </Container>
  );
}

export default ViewOrderDetails;
