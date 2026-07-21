import { useTranslation } from "react-i18next";
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
  FaBoxOpen,
  FaUndo,
  FaCheckDouble,
  FaMoneyBillWave,
  FaUser,
  FaShoppingBag,
  FaHeart,
  FaMapMarkerAlt,
  FaGift,
  FaCreditCard,
  FaCog,
  FaSignOutAlt
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../firebase";
import "../../pages/Profile.css";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(val || 0));

// Add getStatusIcon function
const getStatusIcon = (status) => {
  const statusLower = status?.toLowerCase() || "";

  if (statusLower === "return_requested") {
    return <FaUndo style={{ marginRight: "6px" }} />;
  }
  if (statusLower === "return_approved") {
    return <FaCheckDouble style={{ marginRight: "6px" }} />;
  }
  if (statusLower === "refund_completed" || statusLower === "refunded") {
    return <FaMoneyBillWave style={{ marginRight: "6px" }} />;
  }

  switch (statusLower) {
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
  const statusLower = status?.toLowerCase() || "";

  // Return/Refund status styling
  if (statusLower === "return_requested") {
    return { background: "#e2e3ff", color: "#4050b5" };
  }
  if (statusLower === "return_approved") {
    return { background: "#d1ecf1", color: "#0c5460" };
  }
  if (statusLower === "refund_completed" || statusLower === "refunded") {
    return { background: "#d4edda", color: "#155724" };
  }
  if (statusLower === "returned") {
  return { background: "#007bff", color: "#fff" };
}

  // Regular order status styling
  switch (statusLower) {
    case "pending":
      return { background: "#0d6efd", color: "#ffffff" }; // Blue background, white text for Order Placed
    case "processing":
      return { background: "#cfe2ff", color: "#084298" };
    case "shipped":
      return { background: "#d1e7dd", color: "#0f5132" };
    case "delivered":
      return { background: "#d1e7dd", color: "#0f5132" };
    case "cancelled":
      return { background: "#f8d7da", color: "#842029" };
    default:
      return { background: "#0d6efd", color: "#ffffff" };
  }
};

const getStatusDisplayText = (status) => {
  const statusLower = status?.toLowerCase() || "";

  // Return/Refund status display text
  if (statusLower === "return_requested") {
    return "Return Requested";
  }
  if (statusLower === "return_approved") {
    return "Return Approved";
  }
  if (statusLower === "refund_completed" || statusLower === "refunded") {
    return t("refundCompleted", "Refund Completed");
  }

  // Regular order status display text
  switch (statusLower) {
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
    default:
      return status || "Order Placed";
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
  let status = docData.orderStatus || "Pending";

  // If any product has returnStatus, use that as the order status
  if (docData.products && docData.products.length > 0) {
    const returnedProduct = docData.products.find(p => p.returnStatus);

// ✅ PRIORITY: returned / refund_completed FIRST
if (
  docData.orderStatus === "returned" ||
  docData.orderStatus === "refund_completed"
) {
  status = docData.orderStatus;
}
else if (returnedProduct?.returnStatus) {
  status = returnedProduct.returnStatus;
}
  }

  // Format date safely
  let orderDate = formatOrderDate(docData.orderDate);

  // Ensure products array exists and has images
 const products = (docData.products || []).map((p) => ({
  id: p.id || p.productId || p.productid || "",
  name: p.name || "Product",
  quantity: p.quantity || 1,
  price: p.price || 0,
  image: p.images?.[0] || p.image || p.productImage || "https://via.placeholder.com/400x500?text=Product",
  images: p.images || [],
  productId: p.productId || p.id,
  productImage: p.productImage || p.image,
  returnStatus: p.returnStatus || null
}));

  return {
    id: docId,
    orderId: docData.orderId || docId,
    status,
    date: orderDate,
    total: docData.payableAmount ?? docData.productsTotal ?? docData.totalAmount ?? 0,
    payableAmount: docData.payableAmount || 0,
    products: products,
    items: products, // For backward compatibility
    shiprocketOrderId: docData.shiprocketOrderId || null,
    shipmentId: docData.shipmentId || null,
    shiprocketStatus: docData.shiprocketStatus || null,
    originalOrderDate: docData.orderDate ? {
      seconds: docData.orderDate.seconds,
      nanoseconds: docData.orderDate.nanoseconds
    } : null,
    paymentMethod: docData.paymentMethod || "Cash on Delivery"
  };
};

function ViewOrderDetails() { 
  const { t } = useTranslation();
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

  const filteredOrders = selectedTab === "All"
    ? orders
    : orders.filter((o) => {
      if (!o.status) return false;

      const normalizedStatus = o.status.toLowerCase().replace(/_/g, " ");
      const selectedNormalized = selectedTab.toLowerCase();

      // Handle special cases for return/refund statuses
      if (selectedNormalized === "return requested") {
        return o.status.toLowerCase() === "return_requested";
      }
      if (selectedNormalized === "return approved") {
        return o.status.toLowerCase() === "return_approved";
      }
      if (selectedNormalized === "refund completed") {
        return o.status.toLowerCase() === "refund_completed" ||
          o.status.toLowerCase() === "refunded";
      }

      return normalizedStatus === selectedNormalized;
    });

  const statusTabs = [
    t("all", "All"),
    t("pending", "Pending"),
    t("processing", "Processing"),
    t("shipped", "Shipped"),
    t("delivered", "Delivered"),
    t("cancelled", "Cancelled"),
    t("returnRequested", "Return Requested"),
    t("returnApproved", "Return Approved"),
    t("refundCompleted", "Refund Completed")
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const handleLogoutClick = () => {
    const auth = getAuth();
    auth.signOut().then(() => navigate("/login"));
  };

  return (
    <div className="profile-dashboard-wrapper" style={{ padding: "20px" }}>
      <div className="profile-dashboard-container address-container" style={{ maxWidth: "1200px", margin: "0 auto", borderRadius: "10px", overflow: "hidden" }}>
        
        {/* Title */}
        <div className="profile-title-header d-flex align-items-center" style={{ gap: "12px", padding: "16px 24px", margin: 0, borderRadius: 0 }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>{t("myOrdersPage", "My Orders Page")}</h2>
        </div>

        {/* Outer Dashboard Grid */}
        <div className="dashboard-grid-layout" style={{ margin: 0, borderRadius: "0 0 10px 10px", gap: 0 }}>
          
          {/* Sidebar Menu */}
          <div className="dashboard-sidebar" style={{ padding: "24px 16px", minHeight: "600px", borderRadius: 0, marginTop: 0 }}>
            <ul className="sidebar-menu-list" style={{ marginTop: "10px" }}>
              <li className="sidebar-menu-item" onClick={() => navigate("/profile")}>
                <FaUser className="menu-icon" />
                <span>{t("myProfile", "My Profile")}</span>
              </li>
              <li className="sidebar-menu-item active" onClick={() => navigate("/orders")}>
                <FaShoppingBag className="menu-icon" />
                <span style={{ fontWeight: "bold" }}>{t("myOrders", "My Orders")}</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => navigate("/wishlist")}>
                <FaHeart className="menu-icon" />
                <span>{t("wishlistLabel", "Wishlist")}</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => navigate("/save-address")}>
                <FaMapMarkerAlt className="menu-icon" />
                <span>{t("myAddresses", "My Addresses")}</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => navigate("/rewards")}>
                <FaGift className="menu-icon" />
                <span>{t("sadhanaRewards", "Sadhana Rewards")}</span>
              </li>
              <li className="sidebar-menu-item">
                <FaCreditCard className="menu-icon" />
                <span>{t("paymentMethods", "Payment Methods")}</span>
              </li>
              <li className="sidebar-menu-item">
                <FaCog className="menu-icon" />
                <span>{t("accountSettings", "Account Settings")}</span>
              </li>
              <li className="sidebar-menu-item logout-item" onClick={handleLogoutClick} style={{ marginTop: "40px" }}>
                <FaSignOutAlt className="menu-icon" />
                <span>{t("logout", "Logout")}</span>
              </li>
            </ul>
          </div>

          {/* Main Dashboard Section */}
          <div className="dashboard-main-content" style={{ padding: "32px", display: "block" }}>
            <h4 className="fw-bold mb-4 order-num-id" style={{ fontSize: "18px" }}>{t("myOrders", "My Orders")}</h4>
            
            <div className="d-flex gap-4 mb-4 sidebar-divider" style={{ borderBottom: "1px solid", borderBottomColor: 'inherit' }}>
              {statusTabs.slice(0, 5).map((tab) => (
                <span
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  style={{
                    fontSize: "14px",
                    fontWeight: selectedTab === tab ? "bold" : "500",
                    color: selectedTab === tab ? "#0a45bd" : "#666",
                    cursor: "pointer",
                    paddingBottom: "12px",
                    borderBottom: selectedTab === tab ? "2px solid #0a45bd" : "2px solid transparent",
                    marginBottom: "-2px"
                  }}
                >
                  {tab}
                </span>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <Alert variant="light" className="text-center py-5 empty-address-view">
                {t("noOrdersFound", "No orders found")}
              </Alert>
            ) : (
              filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className="mb-4 overview-card"
                  style={{ borderRadius: "12px" }}
                >
                  <Card.Body className="p-4 d-flex justify-content-between align-items-center">
                    {/* Left Column: ID and Images */}
                    <div style={{ flex: "1" }}>
                      <div className="order-num-id fw-bold mb-3" style={{ fontSize: "14px" }}>
                        {t("orderId", "Order ID:")} <span className="order-num-id">#{order.orderId}</span>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {order.products.map((product, index) => (
                          <div key={index} style={{ width: "65px", height: "85px", overflow: "hidden", borderRadius: "6px", backgroundColor: "#f8f9fa", border: "1px solid #eee" }}>
                            <Image
                              src={product.image}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/400x500?text=Product";
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Middle Column: Date and Items count */}
                    <div style={{ flex: "1", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "125px" }}>
                      <div className="order-item-date" style={{ fontSize: "14px", marginTop: "2px" }}>
                        {order.date}
                      </div>
                      <div className="order-num-id fw-bold" style={{ fontSize: "14px", marginTop: "auto" }}>
                        {order.products.reduce((acc, p) => acc + (p.quantity || 1), 0)} items
                      </div>
                    </div>

                    {/* Right Column: Status and Details link */}
                    <div style={{ flex: "1", textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end", height: "125px" }}>
                      <div>
                        <Badge
                          style={{
                            ...getStatusBadgeStyle(order.status),
                            padding: "8px 16px",
                            borderRadius: "6px",
                            fontWeight: "600",
                            fontSize: "12px",
                            letterSpacing: "0.3px",
                            border: order.status.toLowerCase() === 'delivered' ? '1px solid #c3e6cb' : 
                                    order.status.toLowerCase() === 'shipped' ? '1px solid #b8daff' : 
                                    order.status.toLowerCase() === 'processing' ? '1px solid #ffeeba' : 'none',
                            background: order.status.toLowerCase() === 'delivered' ? '#e2f5ec' : 
                                        order.status.toLowerCase() === 'shipped' ? '#e6f0ff' : 
                                        order.status.toLowerCase() === 'processing' ? '#fff6e0' : 
                                        order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'order placed' ? '#0d6efd' : getStatusBadgeStyle(order.status).background,
                            color: order.status.toLowerCase() === 'delivered' ? '#22a061' : 
                                   order.status.toLowerCase() === 'shipped' ? '#0a45bd' : 
                                   order.status.toLowerCase() === 'processing' ? '#e59223' : 
                                   order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'order placed' ? '#ffffff' : getStatusBadgeStyle(order.status).color
                          }}
                        >
                          {getStatusDisplayText(order.status)}
                        </Badge>
                      </div>
                      <Button
                        variant="link"
                        className="p-0 fw-bold"
                        style={{ color: "#0a45bd", textDecoration: "none", fontSize: "15px", marginTop: "auto" }}
                        onClick={() =>
                          navigate("/order-details", {
                            state: {
                              ...order,
                              userId: userId,
                              orderId: order.orderId || order.id,
                              items: order.products
                            }
                          })
                        }
                      >
                        View Details
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))
            )}
            
            {filteredOrders.length > 0 && (
              <div className="mt-4">
                <Button variant="link" className="p-0 fw-bold" style={{ color: "#0a45bd", textDecoration: "none", fontSize: "15px" }} onClick={() => setSelectedTab("All")}>
                  View All Orders
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewOrderDetails;