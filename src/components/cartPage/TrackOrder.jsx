import React, { useState, useEffect } from "react";
import { Container, Card, Button, Spinner } from "react-bootstrap";
import { FaArrowLeft, FaTruck, FaBox, FaCheckCircle, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";

// Helper function for currency formatting
const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(val || 0));

// Helper function to format date
const formatDate = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    if (dateValue instanceof Date) {
      return dateValue.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      return new Date(dateValue).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return null;
  } catch (error) {
    console.error("Error formatting date:", error);
    return null;
  }
};

function TrackOrder() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state;
  
  const [loading, setLoading] = useState(true);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const fetchTrackingInfo = async () => {
      if (!orderData) {
        setLoading(false);
        return;
      }

      try {
        const { order, orderId } = orderData;
        const userId = order?.userId || auth.currentUser?.uid;

        if (userId && orderId) {
          // Try to fetch from user's orders first
          const orderRef = doc(db, "users", userId, "orders", orderId);
          const orderSnap = await getDoc(orderRef);
          
          if (orderSnap.exists()) {
            const freshData = orderSnap.data();
            setOrderDetails(freshData);
            
            // Check if there's tracking information
            if (freshData.trackingInfo) {
              setTrackingInfo(freshData.trackingInfo);
            } else {
              // Create mock tracking steps based on order status
              const status = freshData.orderStatus || "pending";
              const steps = [
                { 
                  status: "Order Placed", 
                  completed: true, 
                  date: freshData.orderDate,
                  description: "Your order has been placed successfully"
                },
                { 
                  status: "Order Confirmed", 
                  completed: status !== "pending", 
                  date: freshData.confirmedDate,
                  description: "Your order has been confirmed"
                },
                { 
                  status: "Processing", 
                  completed: ["processing", "shipped", "delivered"].includes(status?.toLowerCase()), 
                  date: freshData.processingDate,
                  description: "Your order is being processed"
                },
                { 
                  status: "Shipped", 
                  completed: ["shipped", "delivered"].includes(status?.toLowerCase()), 
                  date: freshData.shippedDate,
                  description: freshData.trackingNumber ? 
                    `Shipped via ${freshData.carrier || 'Courier'} - Tracking: ${freshData.trackingNumber}` :
                    "Your order has been shipped"
                },
                { 
                  status: "Out for Delivery", 
                  completed: status?.toLowerCase() === "delivered", 
                  date: freshData.outForDeliveryDate,
                  description: "Your order is out for delivery"
                },
                { 
                  status: "Delivered", 
                  completed: status?.toLowerCase() === "delivered", 
                  date: freshData.deliveredDate,
                  description: "Your order has been delivered"
                },
              ];
              setTrackingInfo({ steps });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching tracking info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingInfo();
  }, [orderData]);

  // If no order data, show message
  if (!orderData) {
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
          <h1 style={{ fontSize: "20px", fontWeight: "600", margin: 0, color: "#333" }}>
            Track Order
          </h1>
        </div>
        <Container className="py-5 text-center">
          <h3>No Tracking Information Found</h3>
          <Button 
            variant="primary" 
            onClick={() => navigate("/orders")}
            className="mt-3"
          >
            Go Back to Orders
          </Button>
        </Container>
      </div>
    );
  }

  if (loading) {
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
          <h1 style={{ fontSize: "20px", fontWeight: "600", margin: 0, color: "#333" }}>
            Track Order
          </h1>
        </div>
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading tracking information...</p>
        </Container>
      </div>
    );
  }

  const { order, product, orderStatus, orderId, estimatedDelivery, trackingNumber, carrier } = orderData;
  const displayOrder = orderDetails || order;
  const displayProduct = product || displayOrder?.products?.[0];

  // Use tracking info if available, otherwise create default steps
  const steps = trackingInfo?.steps || [
    { status: "Order Placed", completed: true, date: displayOrder?.orderDate, description: "Your order has been placed" },
    { status: "Order Confirmed", completed: orderStatus !== "pending", description: "Order confirmation received" },
    { status: "Processing", completed: ["processing", "shipped", "delivered"].includes(orderStatus?.toLowerCase()), description: "Order is being processed" },
    { status: "Shipped", completed: ["shipped", "delivered"].includes(orderStatus?.toLowerCase()), description: trackingNumber ? `Tracking: ${trackingNumber}` : "Order shipped" },
    { status: "Out for Delivery", completed: orderStatus?.toLowerCase() === "delivered", description: "Out for delivery" },
    { status: "Delivered", completed: orderStatus?.toLowerCase() === "delivered", description: "Order delivered" },
  ];

  // Find current step index
  const currentStepIndex = steps.findIndex(step => !step.completed) - 1;
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : steps[steps.length - 1];

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          padding: "20px 16px",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          position: "sticky",
          top: 0,
          background: "#fff",
          zIndex: 100
        }}
      >
        <FaArrowLeft
          style={{ fontSize: "20px", cursor: "pointer", color: "#333" }}
          onClick={() => navigate(-1)}
        />
        <h1 style={{ fontSize: "20px", fontWeight: "600", margin: 0, color: "#333" }}>
          Track Order
        </h1>
      </div>

      <Container className="py-4" style={{ maxWidth: "600px" }}>
        {/* Order Info Card */}
        <Card style={{
          border: "1px solid #e0e0e0",
          borderRadius: "12px",
          boxShadow: "none",
          marginBottom: "20px",
          background: "#f8f9fa"
        }}>
          <Card.Body style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "14px", color: "#666" }}>Order ID:</span>
              <span style={{ fontSize: "14px", fontWeight: "500", color: "#333" }}>
                {orderId || displayOrder?.orderId || displayOrder?.id || "N/A"}
              </span>
            </div>
            
            {trackingNumber && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "14px", color: "#666" }}>Tracking #:</span>
                <span style={{ fontSize: "14px", fontWeight: "500", color: "#333" }}>
                  {trackingNumber}
                </span>
              </div>
            )}
            
            {carrier && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "14px", color: "#666" }}>Carrier:</span>
                <span style={{ fontSize: "14px", fontWeight: "500", color: "#333" }}>
                  {carrier}
                </span>
              </div>
            )}
            
            {estimatedDelivery && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "#666" }}>Est. Delivery:</span>
                <span style={{ fontSize: "14px", fontWeight: "500", color: "#333" }}>
                  {formatDate(estimatedDelivery)}
                </span>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Current Status Card */}
        <Card style={{
          border: "1px solid #e0e0e0",
          borderRadius: "12px",
          boxShadow: "none",
          marginBottom: "20px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff"
        }}>
          <Card.Body style={{ padding: "25px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
              <div style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <FaTruck size={24} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: "14px", opacity: 0.9 }}>Current Status</div>
                <h3 style={{ fontSize: "20px", fontWeight: "600", margin: "5px 0 0 0" }}>
                  {currentStep?.status || orderStatus || "Processing"}
                </h3>
              </div>
            </div>
            
            {currentStep?.description && (
              <p style={{ margin: "10px 0 0 0", fontSize: "14px", opacity: 0.9 }}>
                {currentStep.description}
              </p>
            )}
            
            {currentStep?.date && (
              <p style={{ margin: "5px 0 0 0", fontSize: "12px", opacity: 0.7 }}>
                {formatDate(currentStep.date)}
              </p>
            )}
          </Card.Body>
        </Card>

        {/* Tracking Timeline */}
        <Card style={{
          border: "1px solid #e0e0e0",
          borderRadius: "12px",
          boxShadow: "none",
          marginBottom: "20px"
        }}>
          <Card.Body style={{ padding: "20px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "20px", color: "#333" }}>
              Order Timeline
            </h4>
            
            {steps.map((step, index) => (
              <div key={index} style={{ marginBottom: index === steps.length - 1 ? 0 : "20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  {/* Status Icon */}
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: step.completed ? "#10b981" : "#e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "14px",
                    flexShrink: 0,
                    boxShadow: step.completed ? "0 4px 6px rgba(16, 185, 129, 0.2)" : "none"
                  }}>
                    {step.completed ? <FaCheckCircle size={16} /> : <FaClock size={16} color="#9ca3af" />}
                  </div>
                  
                  {/* Status Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ 
                        fontSize: "15px", 
                        fontWeight: step.completed ? "600" : "500", 
                        color: step.completed ? "#10b981" : "#6b7280" 
                      }}>
                        {step.status}
                      </span>
                      {step.date && (
                        <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                          {formatDate(step.date)}
                        </span>
                      )}
                    </div>
                    
                    {step.description && (
                      <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0 0" }}>
                        {step.description}
                      </p>
                    )}
                    
                    {/* Connector Line (except for last item) */}
                    {index < steps.length - 1 && (
                      <div style={{
                        width: "2px",
                        height: "20px",
                        background: step.completed ? "#10b981" : "#e5e7eb",
                        marginLeft: "15px",
                        marginTop: "8px"
                      }} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>

        {/* Delivery Address (if available) */}
        {displayOrder?.shippingAddress && (
          <Card style={{
            border: "1px solid #e0e0e0",
            borderRadius: "12px",
            boxShadow: "none",
            marginBottom: "20px"
          }}>
            <Card.Body style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <FaMapMarkerAlt size={16} color="#666" />
                <h5 style={{ fontSize: "15px", fontWeight: "600", margin: 0, color: "#333" }}>
                  Delivery Address
                </h5>
              </div>
              <p style={{ fontSize: "14px", color: "#666", margin: 0, lineHeight: "1.6" }}>
                {displayOrder.shippingAddress.name && <><strong>{displayOrder.shippingAddress.name}</strong><br /></>}
                {displayOrder.shippingAddress.addressLine1}<br />
                {displayOrder.shippingAddress.addressLine2 && <>{displayOrder.shippingAddress.addressLine2}<br /></>}
                {displayOrder.shippingAddress.city}, {displayOrder.shippingAddress.state} - {displayOrder.shippingAddress.pincode}<br />
                {displayOrder.shippingAddress.phone && <>Phone: {displayOrder.shippingAddress.phone}</>}
              </p>
            </Card.Body>
          </Card>
        )}

        {/* Product Info */}
        {displayProduct && (
          <Card style={{
            border: "1px solid #e0e0e0",
            borderRadius: "12px",
            boxShadow: "none"
          }}>
            <Card.Body style={{ padding: "20px" }}>
              <h5 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "15px", color: "#333" }}>
                Item in this order
              </h5>
              <div style={{ display: "flex", gap: "15px" }}>
                <img
                  src={displayProduct.image || displayProduct.images?.[0] || "https://via.placeholder.com/80"}
                  alt={displayProduct.name}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    background: "#f8f9fa",
                    padding: "5px",
                    border: "1px solid #f0f0f0"
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/80?text=Product";
                  }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: "500", margin: "0 0 8px 0", color: "#333" }}>
                    {displayProduct.name || "Product Name"}
                  </p>
                  <p style={{ fontSize: "13px", color: "#666", margin: "0 0 5px 0" }}>
                    Quantity: {displayProduct.quantity || 1}
                  </p>
                  <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>
                    Price: {formatCurrency(displayProduct.price || displayProduct.salePrice || displayProduct.discountedPrice || 0)}
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}
      </Container>
    </div>
  );
}

export default TrackOrder;