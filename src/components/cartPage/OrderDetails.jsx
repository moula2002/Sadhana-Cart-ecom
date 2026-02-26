import React, { useState, useEffect } from "react";
import { Container, Card, Button, Image, Badge, Spinner } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(val || 0));

// Helper function to safely format date
const formatOrderDate = (dateValue) => {
  if (!dateValue) return "N/A";
  
  try {
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
    
    if (dateValue instanceof Date) {
      return dateValue.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
    
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

// Helper function to map database status to display text
const getDisplayStatusFromDbStatus = (status) => {
  if (!status) return "Order Placed";
  
  const statusLower = status.toLowerCase();
  
  if (statusLower === "request_completed") return "Return Requested";
  if (statusLower === "return_approved") return "Return Approved";
  if (statusLower === "refund_completed" || statusLower === "refunded") return "Refund Completed";
  if (statusLower === "cancelled") return "Order Cancelled";
  if (statusLower === "delivered") return "Order Delivered";
  if (statusLower === "shipped") return "Shipped";
  if (statusLower === "processing") return "Processing";
  if (statusLower === "pending") return "Order Placed";
  
  return status;
};

function OrderDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state;

  const [orderStatus, setOrderStatus] = useState(null);
  const [returnStatus, setReturnStatus] = useState(null); 
  const [loadingReturn, setLoadingReturn] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [firebaseOrderData, setFirebaseOrderData] = useState(null);
  const [productImage, setProductImage] = useState(null);
  const [formattedDate, setFormattedDate] = useState("N/A");

  // Get the first product safely with image fallback
  const product = orderData?.items?.[0] || orderData?.products?.[0];

  useEffect(() => {
    if (!auth.currentUser || !orderData || !product) {
      setLoadingReturn(false);
      setLoadingOrder(false);
      return;
    }

    const getProductImage = () => {
      if (product?.image) return product.image;
      if (product?.images?.[0]) return product.images[0];
      if (product?.productImage) return product.productImage;
      if (product?.thumbnail) return product.thumbnail;
      
      if (orderData?.productImage) return orderData.productImage;
      if (orderData?.images?.[0]) return orderData.images[0];
      
      return null;
    };

    setProductImage(getProductImage());

    const userId = orderData.userId;
    const orderId = orderData.orderId || orderData.id;
    const productId =
      product.id || product.productId || product.productid || product.product_id;

    if (!userId || !orderId) {
      console.warn("Missing userId or orderId");
      setLoadingReturn(false);
      setLoadingOrder(false);
      return;
    }

    // Fetch fresh order data from Firebase
    const fetchOrderData = async () => {
      try {
        const orderRef = doc(db, "users", userId, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
          const freshOrderData = orderSnap.data();
          setFirebaseOrderData(freshOrderData);
          setOrderStatus(freshOrderData.orderStatus || "Pending");
          
          if (freshOrderData.orderDate) {
            setFormattedDate(formatOrderDate(freshOrderData.orderDate));
          } else if (orderData.orderDate) {
            setFormattedDate(formatOrderDate(orderData.orderDate));
          }
          
          const freshProduct = freshOrderData.products?.find(p => 
            p.id === productId || p.productId === productId || p.productid === productId
          );
          
          if (freshProduct) {
            if (freshProduct.image) setProductImage(freshProduct.image);
            else if (freshProduct.images?.[0]) setProductImage(freshProduct.images[0]);
        
          }
        } else {
          const mainOrderRef = doc(db, "orders", orderId);
          const mainOrderSnap = await getDoc(mainOrderRef);
          
          if (mainOrderSnap.exists()) {
            const freshOrderData = mainOrderSnap.data();
            setFirebaseOrderData(freshOrderData);
            setOrderStatus(freshOrderData.orderStatus || "Pending");
            
            if (freshOrderData.orderDate) {
              setFormattedDate(formatOrderDate(freshOrderData.orderDate));
            } else if (orderData.orderDate) {
              setFormattedDate(formatOrderDate(orderData.orderDate));
            }
          } else {
            console.warn("Order not found in Firebase");
            setOrderStatus(orderData.orderStatus || orderData.status || "Pending");
            if (orderData.orderDate) {
              setFormattedDate(formatOrderDate(orderData.orderDate));
            }
          }
        }
      } catch (error) {
        console.error("Error fetching order data:", error);
        setOrderStatus(orderData.orderStatus || orderData.status || "Pending");
        if (orderData.orderDate) {
          setFormattedDate(formatOrderDate(orderData.orderDate));
        }
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrderData();

    // Real-time Listener for return_requests
    const q = query(
      collection(db, "users", userId, "return_requests"),
      where("orderId", "==", orderId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("SNAPSHOT SIZE:", snapshot.size);

      if (!snapshot.empty) {
        const latestReturn = snapshot.docs[0].data();
        console.log("RETURN DOC:", latestReturn);
        setReturnStatus(latestReturn.status);
      } else {
        console.log("NO RETURN DOC FOUND");
      }

      setLoadingReturn(false);
    });
    return () => unsubscribe();
  }, [orderData, product]);

  if (!orderData) {
    return (
      <div className="text-center py-5">
        <h3>No Order Found</h3>
        <Button variant="primary" onClick={() => navigate("/orders")}>
          Go Back to Orders
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-5">
        <h3>No Product Found in Order</h3>
        <Button variant="primary" onClick={() => navigate("/orders")}>
          Go Back to Orders
        </Button>
      </div>
    );
  }

  if (loadingOrder) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading order details...</p>
      </div>
    );
  }

  const displayOrderData = firebaseOrderData || orderData;
  
  // FINAL STATUS (Return status has priority)
  const finalStatus = returnStatus
    ? returnStatus
    : (orderStatus || displayOrderData.orderStatus || displayOrderData.status || "pending");

  const displayStatus = getDisplayStatusFromDbStatus(finalStatus);

  const isCancelled = finalStatus.toLowerCase() === "cancelled";
  const isDelivered = finalStatus.toLowerCase() === "delivered";

  const isRefundCompleted =
    finalStatus.toLowerCase() === "refund_completed" ||
    finalStatus.toLowerCase() === "refunded";

  const isReturnRequested =
    finalStatus.toLowerCase() === "return_requested";

  const isReturnApproved =
    finalStatus.toLowerCase() === "return_approved";

  // Function to handle track order
  const handleTrackOrder = () => {
    navigate("/track-order", {
      state: {
        order: displayOrderData,
        product: product,
        orderStatus: displayStatus,
        orderId: displayOrderData.orderId || displayOrderData.id,
        estimatedDelivery: displayOrderData.estimatedDelivery,
        trackingNumber: displayOrderData.trackingNumber,
        carrier: displayOrderData.carrier
      }
    });
  };

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
        <h1
          style={{
            fontSize: "20px",
            fontWeight: "600",
            margin: 0,
            color: "#333"
          }}
        >
          Order Details
        </h1>
      </div>

      <Container className="py-4" style={{ maxWidth: "600px" }}>
        <div
          style={{
            textAlign: "center",
            marginBottom: "24px"
          }}
        >
          <Image
            src={
              productImage ||
              product?.image ||
              product?.images?.[0] ||
              displayOrderData?.productImage ||
              "https://via.placeholder.com/300x300?text=Product+Image"
            }
            fluid
            style={{
              maxHeight: "300px",
              objectFit: "contain",
              borderRadius: "12px",
              backgroundColor: "#f8f9fa",
              padding: "10px"
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/300x300?text=Image+Not+Available";
            }}
          />
        </div>

        <Card
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "12px",
            boxShadow: "none",
            marginBottom: "20px"
          }}
        >
          <Card.Body style={{ padding: "20px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "500",
                color: "#333",
                marginBottom: "20px",
                lineHeight: "1.4"
              }}
            >
              {product.name || "Product Name Not Available"}
            </h3>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                paddingBottom: "12px",
                borderBottom: "1px solid #f0f0f0"
              }}
            >
              <span style={{ fontSize: "16px", color: "#666" }}>
                Subtotal:
              </span>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#333"
                }}
              >
                {formatCurrency(displayOrderData.payableAmount || displayOrderData.total || orderData.total)}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px"
              }}
            >
              <span style={{ fontSize: "16px", color: "#666" }}>
                Quantity:
              </span>
              <span style={{ fontSize: "16px", color: "#333" }}>
                {product.quantity || 1}
              </span>
            </div>

            {(formattedDate !== "N/A" || displayOrderData.orderDate) && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid #f0f0f0"
                }}
              >
                <span style={{ fontSize: "16px", color: "#666" }}>
                  Order Date:
                </span>
                <span style={{ fontSize: "16px", color: "#333" }}>
                  {formattedDate}
                </span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "20px"
              }}
            >
              <Badge
                style={{
                  backgroundColor:
                    displayStatus.includes("Return") || displayStatus.includes("Refund")
                      ? "#e2e3ff" 
                      : isCancelled
                      ? "#f8d7da"
                      : "#fff3cd",
                  color:
                    displayStatus.includes("Return") || displayStatus.includes("Refund")
                      ? "#4050b5"
                      : isCancelled
                      ? "#842029"
                      : "#856404",
                  fontWeight: "500",
                  fontSize: "16px",
                  padding: "8px 24px",
                  borderRadius: "30px",
                  border: "none"
                }}
              >
                {loadingReturn ? <Spinner animation="border" size="sm" /> : displayStatus}
              </Badge>
            </div>

            {/* Track Order Button */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
              <Button
                variant="outline-primary"
                onClick={handleTrackOrder}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontWeight: "500",
                  borderRadius: "8px"
                }}
              >
                Track Order
              </Button>
            </div>

            {isCancelled ? (
              <div style={{ textAlign: "center" }}>
                <Button disabled variant="danger">
                  Order Cancelled
                </Button>
              </div>
            ) : isRefundCompleted ? (
              <div style={{ textAlign: "center" }}>
                <Button disabled variant="success">
                  Refund Completed
                </Button>
              </div>
            ) : isReturnRequested ? (
              <div style={{ textAlign: "center" }}>
                <Button disabled variant="primary">
                  Return Requested
                </Button>
              </div>
            ) : isReturnApproved ? (
              <div style={{ textAlign: "center" }}>
                <Button disabled variant="info">
                  Return Approved
                </Button>
              </div>
            ) : isDelivered ? (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Button
                  variant="outline-warning"
                  onClick={() =>
                    navigate("/return-order", {
                      state: {
                        order: displayOrderData,
                        product: product,
                      },
                    })
                  }
                >
                  Return Order
                </Button>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Button
                  variant="outline-danger"
                  onClick={() =>
                    navigate("/cancel-order", {
                      state: displayOrderData,
                    })
                  }
                >
                  Cancel Order
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default OrderDetails;