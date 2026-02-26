import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Spinner,
  Alert,
  Badge,
  Row,
  Col,
  Image
} from "react-bootstrap";
import {
  FaArrowLeft,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaBoxOpen
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(val || 0));

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
    case "processing":
      return <FaBoxOpen style={{ marginRight: "6px" }} />;
    case "shipped":
      return <FaTruck style={{ marginRight: "6px" }} />;
    case "delivered":
      return <FaCheckCircle style={{ marginRight: "6px" }} />;
    case "cancelled":
      return <FaTimesCircle style={{ marginRight: "6px" }} />;
    default:
      return null;
  }
};

const getStatusBadgeStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return { background: "#fff3cd", color: "#856404" };
    case "processing":
      return { background: "#cfe2ff", color: "#084298" };
    case "shipped":
      return { background: "#d1e7dd", color: "#0f5132" };
    case "delivered":
      return { background: "#d1e7dd", color: "#0f5132" };
    case "cancelled":
      return { background: "#f8d7da", color: "#842029" };
    default:
      return { background: "#f8f9fa", color: "#666" };
  }
};

const getStatusDisplayText = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "Order Placed";
    case "processing":
      return "Processing";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    case "return_requested":
      return "Return Requested";
    case "return_approved":
      return "Return Approved";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
};

// Helper function to safely format date
const formatOrderDate = (dateValue) => {
  if (!dateValue) return "N/A";
  
  try {
    // If it's a Firestore Timestamp with toDate method
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
    
    // If it's a Date object
    if (dateValue instanceof Date) {
      return dateValue.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
    
    // If it's a string or number
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      return new Date(dateValue).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
    
    return "N/A";
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
};

const mapFirestoreOrderToLocal = (docData, docId) => {
  const status = docData.orderStatus || "Pending";

  // Format date safely
  let orderDate = formatOrderDate(docData.orderDate);

  // Ensure products array exists and has images
  const products = (docData.products || []).map((p) => ({
    id: p.id || p.productId || p.productid || "",
    name: p.name || "Product",
    quantity: p.quantity || 1,
    price: p.price || 0,
    image: p.image || p.images?.[0] || "https://via.placeholder.com/400x500?text=Product",
    images: p.images || [p.image],
    productId: p.productId || p.id,
    productImage: p.productImage || p.image
  }));

  return {
    id: docId,
    orderId: docData.orderId || docId,
    status,
    date: orderDate, // Now this is a string, not a Timestamp
    total: docData.payableAmount ?? docData.productsTotal ?? docData.totalAmount ?? 0,
    payableAmount: docData.payableAmount || 0,
    products: products,
    items: products, // For backward compatibility
    shiprocketOrderId: docData.shiprocketOrderId || null,
    shipmentId: docData.shipmentId || null,
    shiprocketStatus: docData.shiprocketStatus || null,
    // Store the original timestamp as a serializable value if needed
    originalOrderDate: docData.orderDate ? {
      seconds: docData.orderDate.seconds,
      nanoseconds: docData.orderDate.nanoseconds
    } : null,
    paymentMethod: docData.paymentMethod || "Cash on Delivery"
  };
};

function ViewOrderDetails() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [selectedTab, setSelectedTab] = useState("All");

  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else navigate("/login");
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

        const mappedOrders = snap.docs.map((d) =>
          mapFirestoreOrderToLocal(d.data(), d.id)
        );

        setOrders(mappedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  const filteredOrders =
    selectedTab === "All"
      ? orders
      : orders.filter(
          (o) =>
            o.status &&
            o.status.toLowerCase() === selectedTab.toLowerCase()
        );

  const statusTabs = [
    "All",
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
    "Return Requested"
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <div
        style={{
          padding: "20px 16px",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          gap: "16px"
        }}
      >
        <FaArrowLeft
          style={{ fontSize: "20px", cursor: "pointer", color: "#333" }}
          onClick={() => navigate(-1)}
        />
        <h1 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>
          My Orders
        </h1>
      </div>

      <Container className="py-3" style={{ maxWidth: "720px" }}>
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "24px",
            borderBottom: "2px solid #f0f0f0",
            paddingBottom: "8px",
            overflowX: "auto",
            whiteSpace: "nowrap"
          }}
        >
          {statusTabs.map((tab) => (
            <span
              key={tab}
              onClick={() => setSelectedTab(tab)}
              style={{
                fontSize: "15px",
                fontWeight: selectedTab === tab ? "600" : "400",
                color: selectedTab === tab ? "#4050b5" : "#666",
                cursor: "pointer",
                paddingBottom: "8px",
                borderBottom:
                  selectedTab === tab ? "3px solid #4050b5" : "none",
              }}
            >
              {tab}
            </span>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <Alert variant="light" className="text-center py-5">
            No {selectedTab !== "All" ? selectedTab.toLowerCase() : ""} orders found
          </Alert>
        ) : (
          filteredOrders.map((order) => (
            <Card
              key={order.id}
              className="mb-4"
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "12px",
                boxShadow: "none"
              }}
            >
              <Card.Body style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#4050b5", fontSize: "14px" }}>
                    Order #{order.orderId}
                  </span>
                  <span style={{ fontSize: "14px", color: "#666" }}>
                    {order.date}
                  </span>
                </div>

                <hr />

                {order.products.map((product, index) => (
                  <Row key={index} className={index > 0 ? "mt-3" : ""}>
                    <Col xs={4}>
                      <Image
                        src={product.image}
                        fluid
                        style={{
                          height: "100px",
                          width: "100%",
                          objectFit: "cover",
                          borderRadius: "8px",
                          backgroundColor: "#f8f9fa"
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/400x500?text=Product";
                        }}
                      />
                    </Col>

                    <Col xs={8}>
                      <div style={{ fontSize: "14px", fontWeight: "500" }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        Qty: {product.quantity}
                      </div>
                      <div style={{ fontWeight: "600", marginTop: "4px" }}>
                        {formatCurrency(product.price * product.quantity)}
                      </div>
                    </Col>
                  </Row>
                ))}

                <hr />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Badge
                    style={{
                      ...getStatusBadgeStyle(order.status),
                      borderRadius: "20px",
                      padding: "6px 16px",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    {getStatusIcon(order.status)}
                    {getStatusDisplayText(order.status)}
                  </Badge>

                  <div>
                    <span style={{ fontSize: "14px", color: "#666", marginRight: "10px" }}>
                      Total: {formatCurrency(order.total)}
                    </span>
                    <Button
                      variant="link"
                      style={{ color: "#4050b5", textDecoration: "none" }}
                      onClick={() =>
                        navigate("/order-details", { 
                          state: {
                            ...order,
                            items: order.products
                          } 
                        })
                      }
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))
        )}
      </Container>
    </div>
  );
}

export default ViewOrderDetails;