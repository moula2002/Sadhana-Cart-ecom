import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { Card, Badge, Spinner, Row, Col, Alert, Button } from "react-bootstrap";
import { FaTag, FaUniversity, FaInfoCircle, FaGift, FaCopy } from "react-icons/fa";

function RazorpayOffers() {
  const [offers, setOffers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    alert(`✅ Code "${code}" copied to clipboard! Apply it at checkout.`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const fetchOffers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "razorpay_offers"));

      const offerList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const enabledOffers = offerList.filter(
        (offer) => offer.status === "Enabled"
      );

      const couponsSnapshot = await getDocs(collection(db, "coupons"));
      const couponList = couponsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const enabledCoupons = couponList.filter(
        (coupon) => coupon.status === "Enabled"
      );

      setOffers(enabledOffers);
      setCoupons(enabledCoupons);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching offers:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" variant="primary" />
        <span className="ms-3 fw-semibold fs-5 text-primary">
          Loading special offers...
        </span>
      </div>
    );
  }

  return (
    <Card 
      className="mb-5 border-0 shadow-lg" 
      style={{ 
        borderRadius: "20px", 
        overflow: "hidden", 
        backgroundColor: "#ffffff",
      }}
    >
      <Card.Header 
        className="border-bottom-0 pt-4 pb-3 px-4 px-md-5 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 bg-white"
      >
        <div>
          <h3 className="fw-bold mb-1 d-flex align-items-center text-dark">
            <span className="bg-danger bg-opacity-10 p-2 rounded-circle me-3 d-flex align-items-center justify-content-center">
              <FaGift className="text-danger" size={24} />
            </span>
            Exclusive Bank Offers
          </h3>
          <p className="small mt-2 mb-0 ms-0 ms-md-5 ps-md-3 py-1 text-muted" style={{ borderLeft: "3px solid #0d6efd" }}>
            Maximize your savings with our verified partner banks. Apply these deals at checkout!
          </p>
        </div>
      </Card.Header>

      <Card.Body className="px-4 px-md-5 pb-5 pt-3 bg-white">
        {offers.length === 0 ? (
          <Alert variant="info" className="border-0 rounded-4 text-center mt-3 shadow-sm py-5">
            <FaInfoCircle size={36} className="mb-3 text-info opacity-75" /><br/>
            <span className="fw-semibold fs-5 text-dark">No offers available at the moment.</span>
            <p className="small mt-2 mb-0 text-muted">Please check back later for exciting bank deals!</p>
          </Alert>
        ) : (
          <Row className="g-4 mt-2">
            {offers.map((offer) => (
              <Col md={6} lg={6} xl={4} key={offer.id}>
                <Card 
                  className="h-100 shadow-sm position-relative offer-card glass-effect text-dark"
                  style={{ 
                    borderRadius: "16px", 
                    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    background: "linear-gradient(145deg, #ffffff, #f8f9fa)",
                    border: "1px solid rgba(0,0,0,0.03)",
                    borderTop: "5px solid #0d6efd",
                  }}
                >
                  <Card.Body className="p-4 d-flex flex-column z-1">
                    <div className="d-flex justify-content-between align-items-start mb-4">
                      <Badge bg="primary" className="px-3 py-2 rounded-pill fw-semibold shadow-sm text-uppercase tracking-wide" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                        <FaTag className="me-1" /> {offer.offerName || "Special Deal"}
                      </Badge>
                    </div>

                    <h4 className="fw-bold mb-4 d-flex align-items-center position-relative">
                      <span 
                        className="shadow-sm p-3 rounded-circle me-3 d-flex align-items-center justify-content-center theme-icon-wrapper bg-white" 
                        style={{ width: "55px", height: "55px" }}
                      >
                        <FaUniversity className="text-primary" size={24} />
                      </span>
                      <span style={{ lineHeight: "1.3", fontSize: "1.2rem" }}>{offer.bankName}</span>
                    </h4>

                    <div 
                      className="mt-auto p-3 rounded-4 custom-scrollbar info-box d-flex justify-content-between align-items-center" 
                      style={{ 
                        backgroundColor: "rgba(13, 110, 253, 0.04)", 
                        border: "1px dashed rgba(13, 110, 253, 0.2)",
                      }}
                    >
                      <p className="mb-0" style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#495057" }}>
                        <FaInfoCircle className="text-primary me-2 opacity-75" />
                        {offer.displayText}
                      </p>
                    </div>
                  </Card.Body>
                  <Card.Footer className="bg-transparent border-top-0 pt-0 pb-3 px-4 d-flex justify-content-between align-items-center z-1">
                    <Badge 
                      bg="light" 
                      text="secondary" 
                      className="rounded-2 py-1 px-2 fw-normal border" 
                      style={{ fontSize: "0.65rem", opacity: 0.8, borderColor: "#eee" }}
                    >
                      ID: {offer.id}
                    </Badge>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="fw-bold px-3 rounded-pill"
                      onClick={() => alert("Bank offers are automatically processed at the Razorpay Payment screen. Proceed to checkout to avail this deal!")}
                    >
                      APPLY OFFER
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card.Body>

      {/* Coupons Section */}
      <Card.Header 
        className="border-bottom-0 border-top pt-4 pb-3 px-4 px-md-5 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 bg-white"
      >
        <div>
          <h3 className="fw-bold mb-1 d-flex align-items-center text-dark">
            <span className="bg-success bg-opacity-10 p-2 rounded-circle me-3 d-flex align-items-center justify-content-center">
              <FaTag className="text-success" size={24} />
            </span>
            Available Coupons
          </h3>
          <p className="small mt-2 mb-0 ms-0 ms-md-5 ps-md-3 py-1 text-muted" style={{ borderLeft: "3px solid #198754" }}>
            Add these codes at checkout to get special discounts on your order!
          </p>
        </div>
      </Card.Header>

      <Card.Body className="px-4 px-md-5 pb-5 pt-3 bg-white">
        {coupons.length === 0 ? (
          <Alert variant="info" className="border-0 rounded-4 text-center mt-3 shadow-sm py-5">
            <FaInfoCircle size={36} className="mb-3 text-info opacity-75" /><br/>
            <span className="fw-semibold fs-5 text-dark">No coupons available at the moment.</span>
          </Alert>
        ) : (
          <Row className="g-4 mt-2">
            {coupons.map((coupon) => (
              <Col md={6} lg={6} xl={4} key={coupon.id}>
                <Card 
                  className="h-100 shadow-sm position-relative offer-card glass-effect text-dark"
                  style={{ 
                    borderRadius: "16px", 
                    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    background: "linear-gradient(145deg, #ffffff, #f8f9fa)",
                    border: "1px solid rgba(0,0,0,0.03)",
                    borderTop: "5px solid #198754",
                  }}
                >
                  <Card.Body className="p-4 d-flex flex-column z-1">
                    <div className="d-flex justify-content-between align-items-start mb-4">
                      <Badge bg="success" className="px-3 py-2 rounded-pill fw-semibold shadow-sm tracking-wide" style={{ fontSize: "0.85rem", letterSpacing: "1px", border: "1px dashed white" }}>
                        {coupon.code}
                      </Badge>
                    </div>

                    <h4 className="fw-bold mb-4 d-flex align-items-center position-relative">
                      <span 
                        className="shadow-sm p-3 rounded-circle me-3 d-flex align-items-center justify-content-center bg-white" 
                        style={{ width: "55px", height: "55px" }}
                      >
                        <span style={{ fontSize: "1.2rem", fontWeight: "900", color: "#198754" }}>{coupon.discountPercent}%</span>
                      </span>
                      <span style={{ lineHeight: "1.3", fontSize: "1.2rem" }}>{coupon.title || "Discount on your order"}</span>
                    </h4>

                    <div 
                      className="mt-auto p-3 rounded-4 d-flex justify-content-between align-items-center" 
                      style={{ 
                        backgroundColor: "rgba(25, 135, 84, 0.04)", 
                        border: "1px solid rgba(25, 135, 84, 0.1)",
                      }}
                    >
                      <p className="mb-0 flex-grow-1" style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#495057" }}>
                        <strong className="text-success">₹{coupon.minOrderAmount}</strong> min. order
                      </p>
                      <Button 
                        variant={copiedCode === coupon.code ? "success" : "outline-success"} 
                        size="sm" 
                        className="fw-bold px-3 rounded-pill"
                        onClick={() => handleCopyCode(coupon.code)}
                      >
                        {copiedCode === coupon.code ? "COPIED!" : (
                          <><FaCopy className="me-1" /> COPY</>
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card.Body>

      <style>
        {`
          .offer-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0,0,0, 0.1) !important;
            border-top-color: #00d2ff !important;
          }
          .glass-effect::after {
            content: '';
            position: absolute;
            top: 0; right: 0; bottom: 0; left: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0));
            z-index: 0;
            border-radius: 16px;
            pointer-events: none;
          }
          .theme-icon-wrapper:hover {
            transform: scale(1.1) rotate(5deg);
            transition: transform 0.3s ease;
          }
        `}
      </style>
    </Card>
  );
}

export default RazorpayOffers;