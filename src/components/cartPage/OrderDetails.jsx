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

const formatOrderDate = (dateValue) => {
  if (!dateValue) return "N/A";

  try {
    if (dateValue?.toDate && typeof dateValue.toDate === "function") {
      return dateValue.toDate().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    if (dateValue instanceof Date) {
      return dateValue.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    if (typeof dateValue === "string" || typeof dateValue === "number") {
      return new Date(dateValue).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    return "N/A";
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
};

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

  const products = orderData?.items || orderData?.products || [];
  const firstProduct = products[0];

  const [orderStatus, setOrderStatus] = useState(null);
  const [returnStatus, setReturnStatus] = useState(null);
  const [loadingReturn, setLoadingReturn] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [firebaseOrderData, setFirebaseOrderData] = useState(null);
  const [productImage, setProductImage] = useState(null);
  const [formattedDate, setFormattedDate] = useState("N/A");

  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  useEffect(() => {
    if (!auth.currentUser || !orderData || !firstProduct) {
      setLoadingReturn(false);
      setLoadingOrder(false);
      return;
    }

    const getProductImage = () => {
      if (firstProduct?.image) return firstProduct.image;
      if (firstProduct?.images?.[0]) return firstProduct.images[0];
      if (firstProduct?.productImage) return firstProduct.productImage;
      if (firstProduct?.thumbnail) return firstProduct.thumbnail;

      if (orderData?.productImage) return orderData.productImage;
      if (orderData?.images?.[0]) return orderData.images[0];

      return null;
    };

    setProductImage(getProductImage());

    const userId = orderData.userId;
    const orderId = orderData.orderId || orderData.id;

    const productId =
      firstProduct.id ||
      firstProduct.productId ||
      firstProduct.productid ||
      firstProduct.product_id;

    if (!userId || !orderId) {
      console.warn("Missing userId or orderId");
      setLoadingReturn(false);
      setLoadingOrder(false);
      return;
    }

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
        }
      } catch (error) {
        console.error("Error fetching order data:", error);
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrderData();

    const q = query(
      collection(db, "users", userId, "return_requests"),
      where("orderId", "==", orderId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latestReturn = snapshot.docs[0].data();
        setReturnStatus(latestReturn.status);
      }
      setLoadingReturn(false);
    });

    return () => unsubscribe();
  }, [orderData, firstProduct]);

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

  if (!products.length) {
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

  const finalStatus = returnStatus
    ? returnStatus
    : orderStatus || displayOrderData.orderStatus || displayOrderData.status || "pending";

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

  const handleTrackOrder = (product) => {
    navigate("/track-order", {
      state: {
        order: displayOrderData,
        product: product,
        orderStatus: displayStatus,
        orderId: displayOrderData.orderId || displayOrderData.id,
      },
    });
  };

  return (
    <div
      style={{
        background: isDark ? "#0f172a" : "#ffffff",
        minHeight: "100vh",
        color: isDark ? "#ffffff" : "#212529",
      }}
    >
      <div
        style={{
          padding: "20px 16px",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <FaArrowLeft
          style={{ fontSize: "20px", cursor: "pointer" }}
          onClick={() => navigate(-1)}
        />
        <h1 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>
          Order Details
        </h1>
      </div>

      <Container className="py-4" style={{ maxWidth: "600px" }}>

        {products.map((product, index) => (

          <Card
            key={index}
            style={{
              borderRadius: "12px",
              marginBottom: "25px",
            }}
          >

            <Card.Body style={{ padding: "20px" }}>

              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <Image
                  src={
                    product?.image ||
                    product?.images?.[0] ||
                    "https://via.placeholder.com/300"
                  }
                  fluid
                  style={{
                    maxHeight: "250px",
                    objectFit: "contain",
                    borderRadius: "10px",
                  }}
                />
              </div>

              <h3 style={{ fontSize: "18px", marginBottom: "20px" }}>
                {product.name}
              </h3>

              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>
                  {formatCurrency(product.price * (product.quantity || 1))}
                </span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>Quantity</span>
                <span>{product.quantity || 1}</span>
              </div>

              <div className="d-flex justify-content-between mb-3">
                <span>Order Date</span>
                <span>{formattedDate}</span>
              </div>

              <div className="text-center mb-3">
                <Badge
                  style={{
                    padding: "8px 20px",
                    borderRadius: "30px",
                  }}
                >
                  {loadingReturn ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    displayStatus
                  )}
                </Badge>
              </div>

              <Button
                variant="outline-primary"
                className="w-100 mb-2"
                onClick={() => handleTrackOrder(product)}
              >
                Track Order
              </Button>

              {isCancelled ? (
                <Button disabled variant="danger" className="w-100">
                  Order Cancelled
                </Button>
              ) : isRefundCompleted ? (
                <Button disabled variant="success" className="w-100">
                  Refund Completed
                </Button>
              ) : isReturnRequested ? (
                <Button disabled variant="primary" className="w-100">
                  Return Requested
                </Button>
              ) : isReturnApproved ? (
                <Button disabled variant="info" className="w-100">
                  Return Approved
                </Button>
              ) : isDelivered ? (
                <Button
                  variant="outline-warning"
                  className="w-100"
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
              ) : (
                <Button
                  variant="outline-danger"
                  className="w-100"
                  onClick={() =>
                    navigate("/cancel-order", {
                      state: {
                        order: displayOrderData,
                        product: product,
                      },
                    })
                  }
                >
                  Cancel Order
                </Button>
              )}

            </Card.Body>

          </Card>

        ))}

      </Container>
    </div>
  );
}

export default OrderDetails;