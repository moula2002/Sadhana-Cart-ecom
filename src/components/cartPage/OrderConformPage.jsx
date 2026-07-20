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
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

function OrderConformPage() {
  const { t } = useTranslation();
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
        email: billingDetails.email || "",
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
        <Alert variant="danger">{t("orderConfirm.notFound")}</Alert>
        <Button variant="primary" onClick={() => navigate("/")}>
          {t("orderConfirm.goHome")}
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-2 d-flex justify-content-center">
      <Card className="shadow-sm border-0" style={{ maxWidth: '500px', width: '100%', borderRadius: '15px' }}>
        <div className="bg-primary text-white p-2 text-center" style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <span className="fw-bold fs-6">Order Success Page</span>
        </div>
        
        <Card.Body className="p-3 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
            
            <div className="position-relative d-inline-block mb-3 mt-1">
               {/* Confetti decoration bits */}
               <div className="position-absolute" style={{ top: '-10px', left: '-20px', color: '#ffd700', fontSize: '10px' }}>▼</div>
               <div className="position-absolute" style={{ top: '20px', right: '-30px', color: '#00d2ff', fontSize: '14px', transform: 'rotate(45deg)' }}>▮</div>
               <div className="position-absolute" style={{ bottom: '-10px', left: '0px', color: '#ff6b6b', fontSize: '12px' }}>●</div>
               <div className="position-absolute" style={{ bottom: '10px', right: '-15px', color: '#32cd32', fontSize: '14px' }}>▲</div>
               
               <div className="bg-success text-white rounded-circle d-flex justify-content-center align-items-center mx-auto shadow-sm" style={{ width: '65px', height: '65px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" className="bi bi-check-lg" viewBox="0 0 16 16">
                    <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                  </svg>
               </div>
            </div>

            <h2 className="fw-bold text-dark mb-1" style={{ color: '#002060', fontSize: '1.4rem' }}>Thank You!</h2>
            <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>Your order has been placed successfully.</p>
            
            <p className="fw-bold mb-2" style={{ fontSize: '1rem' }}>
              Order ID: <span className="text-success">{orderInfo.orderId}</span>
            </p>

            <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
              We have sent the order details to<br/>
              <span className="text-primary fw-medium">{initialBillingDetails.email || "your registered email"}</span>
            </p>

            <div className="d-flex flex-column align-items-center gap-2 mb-0">
              <Button 
                variant="primary" 
                className="w-100 py-1 fw-bold" 
                style={{ maxWidth: '280px', backgroundColor: '#0047b3', border: 'none', fontSize: '0.9rem' }}
                onClick={() => navigate("/orders")}
              >
                View Order Details
              </Button>
              <Button 
                variant="outline-primary" 
                className="w-100 py-1 fw-bold bg-white" 
                style={{ maxWidth: '280px', color: '#0047b3', borderColor: '#0047b3', fontSize: '0.9rem' }}
                onClick={() => navigate("/")}
              >
                Continue Shopping
              </Button>
            </div>
            
            {coinEquivalent > 0 && (
              <div className="mt-2">
                <Badge bg="warning" className="fs-6 px-3 py-1 text-dark shadow-sm">
                  <i className="fas fa-coins me-2" />
                  {formatCoinValue(coinEquivalent)} credited
                </Badge>
              </div>
            )}
          </motion.div>
        </Card.Body>
        
        <div className="bg-light p-3" style={{ borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px', borderTop: '1px solid #eaeaea' }}>
           <Row className="text-center align-items-center">
             <Col xs={4} className="d-flex flex-column align-items-center px-1">
                <div className="text-primary mb-1 bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', fontSize: '0.8rem' }}>
                  <i className="fas fa-truck"></i>
                </div>
                <span className="fw-bold" style={{ fontSize: '0.8rem', color: '#1a1a2e', lineHeight: '1.2' }}>Free Delivery</span>
                <span className="text-muted" style={{ fontSize: '0.7rem', lineHeight: '1.2', marginTop: '2px' }}>On orders above ₹5000</span>
             </Col>
             <Col xs={4} className="d-flex flex-column align-items-center px-1 border-start border-end">
                <div className="text-primary mb-1 bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', fontSize: '0.8rem' }}>
                  <i className="fas fa-undo"></i>
                </div>
                <span className="fw-bold" style={{ fontSize: '0.8rem', color: '#1a1a2e', lineHeight: '1.2' }}>Easy Returns</span>
                <span className="text-muted" style={{ fontSize: '0.7rem', lineHeight: '1.2', marginTop: '2px' }}>Return within 7 days</span>
             </Col>
             <Col xs={4} className="d-flex flex-column align-items-center px-1">
                <div className="text-primary mb-1 bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px', fontSize: '0.8rem' }}>
                  <i className="fas fa-headset"></i>
                </div>
                <span className="fw-bold" style={{ fontSize: '0.8rem', color: '#1a1a2e', lineHeight: '1.2' }}>Support</span>
                <span className="text-muted" style={{ fontSize: '0.7rem', lineHeight: '1.2', marginTop: '2px' }}>We are here to help</span>
             </Col>
           </Row>
        </div>
      </Card>
    </Container>
  );
}

export default OrderConformPage;