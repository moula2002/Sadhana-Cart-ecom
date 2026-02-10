// src/pages/OrderConformPage.jsx
import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Alert,
  Button,
  Modal,
  Table,
  Badge
} from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function OrderConformPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Coin price related data from Checkout
  const { 
    paymentMethod, 
    total, 
    coinEquivalent = 0, 
    coinPrice = 1, 
    itemsCount, 
    billingDetails, 
    cartItems = [], 
    sellerid 
  } = location.state || {};

  const defaultBillingDetails = {
    fullName: "N/A",
    address: "Details not available",
    city: "N/A",
    pincode: "N/A",
    phone: "N/A",
  };

  const initialBillingDetails = billingDetails
    ? {
        fullName: billingDetails.fullName || defaultBillingDetails.fullName,
        address: billingDetails.address || defaultBillingDetails.address,
        city: billingDetails.city || defaultBillingDetails.city,
        pincode: billingDetails.pincode || defaultBillingDetails.pincode,
        phone: billingDetails.phone || defaultBillingDetails.phone,
      }
    : defaultBillingDetails;

  // Generate order ID
  const [orderInfo] = useState({
    orderId: `ORD-${Date.now()}`,
    billingDetails: initialBillingDetails,
    expectedDeliveryDate: (() => {
      const today = new Date();
      const deliveryDays = Math.floor(Math.random() * 2) + 3;
      today.setDate(today.getDate() + deliveryDays);
      return today.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    })(),
    coinEquivalent: coinEquivalent,
    coinPrice: coinPrice
  });

  const [showModal, setShowModal] = useState(false);

  // Currency formatter
  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(val || 0));

  // Format coin value
  const formatCoinValue = (val) => {
    return `${Number(val || 0).toFixed(4)} COINS`;
  };

  // Save to localStorage with coin data
  useEffect(() => {
    window.scrollTo(0, 0);

    if (paymentMethod && total !== undefined) {
      const newOrder = {
        id: orderInfo.orderId,
        date: new Date().toLocaleString("en-IN"),
        total: Number(total),
        formattedTotal: formatCurrency(total),
        coinEquivalent: Number(coinEquivalent),
        coinPrice: Number(coinPrice),
        paymentMethod,
        itemsCount: itemsCount || cartItems.length || 0,
        shippingAddress: orderInfo.billingDetails,
        expectedDeliveryDate: orderInfo.expectedDeliveryDate,
        sellerid: sellerid ?? null,
        products: cartItems.map(item => ({
          ...item,
          coinEquivalent: item.coinEquivalent || (item.price / coinPrice) * (item.quantity || 1),
          coinPrice: coinPrice
        })),
      };

      try {
        const existingOrders = JSON.parse(localStorage.getItem("userOrders")) || [];
        const exists = existingOrders.some((o) => o.id === newOrder.id);
        if (!exists) {
          existingOrders.unshift(newOrder);
          localStorage.setItem("userOrders", JSON.stringify(existingOrders));
        }

        setShowModal(true);
      } catch (error) {
        console.error("Error saving order:", error);
      }
    }
  }, [paymentMethod, total, orderInfo, coinEquivalent, coinPrice, itemsCount, cartItems, sellerid]);

  if (!paymentMethod) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">Order details not found.</Alert>
        <Button variant="primary" onClick={() => navigate("/")}>
          Go to Homepage
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={9}>
          {/* Success Modal */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" size="md" className="text-center">
            <Modal.Body>
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
                <i className="fas fa-check-circle mb-3" style={{ fontSize: "4rem", color: "#28a745" }} />
                <h4 className="fw-bold text-success">Order Placed Successfully!</h4>
                <p className="text-muted mb-3">
                  {coinEquivalent > 0 && (
                    <>
                      <Badge bg="warning" className="fs-6 mb-2">
                        {formatCoinValue(coinEquivalent)} credited
                      </Badge>
                      <br />
                    </>
                  )}
                  Thank you for shopping with us 🎁
                </p>
                <div className="d-flex justify-content-center">
                  <Button
                    variant="success"
                    className="me-2"
                    onClick={() => {
                      setShowModal(false);
                      navigate("/orders");
                    }}
                  >
                    View My Orders
                  </Button>
                  <Button
                    variant="outline-dark"
                    onClick={() => {
                      setShowModal(false);
                      navigate("/");
                    }}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </motion.div>
            </Modal.Body>
          </Modal>

          {/* Order Summary Card */}
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
            <Card className="shadow-lg mb-4 border-success">
              <Card.Header className="bg-light py-3 border-success">
                <div className="d-flex align-items-center">
                  <i className="fas fa-check-circle me-3" style={{ color: "#28a745", fontSize: "1.8rem" }} />
                  <div>
                    <h4 className="mb-0 text-success fw-bold">ORDER CONFIRMATION</h4>
                    <small className="text-muted">Your order has been successfully placed.</small>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <Row className="text-center mb-3">
                  <Col md={4} className="border-end">
                    <p className="mb-1 fw-semibold text-secondary">Order ID</p>
                    <h5 className="fw-bold text-dark">{orderInfo.orderId}</h5>
                  </Col>
                  <Col md={4} className="border-end">
                    <p className="mb-1 fw-semibold text-secondary">Total Amount</p>
                    <h5 className="fw-bold text-danger">{formatCurrency(total)}</h5>
                  </Col>
                  <Col md={4}>
                    <p className="mb-1 fw-semibold text-secondary">Payment Mode</p>
                    <h5 className="fw-bold text-primary">{paymentMethod}</h5>
                  </Col>
                </Row>
                
                {/* Coin Price Section */}
                {coinEquivalent > 0 && (
                  <Card className="border-warning mb-0">
                    <Card.Body className="py-2 bg-warning bg-opacity-10">
                      <Row className="align-items-center">
                        <Col md={6}>
                          <p className="mb-0 fw-bold">
                            <i className="fas fa-coins me-2 text-warning" />
                            Coin Equivalent:
                          </p>
                        </Col>
                        <Col md={6} className="text-end">
                          <Badge bg="warning" className="fs-5">
                            {formatCoinValue(coinEquivalent)}
                          </Badge>
                          <small className="text-muted d-block">
                            @ {formatCurrency(coinPrice)} per coin
                          </small>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}
              </Card.Body>
            </Card>

          
          </motion.div>
        </Col>
      </Row>
    </Container>
  );
}

export default OrderConformPage;