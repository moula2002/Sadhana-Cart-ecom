import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { Card, Badge, Spinner, Row, Col, Alert, Button } from "react-bootstrap";
import { FaTag, FaUniversity, FaInfoCircle, FaGift, FaCopy } from "react-icons/fa";

function RazorpayOffers({ hideApplyButton = false }) {
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
        (offer) => offer.status === "Enabled" || offer.isActive !== false
      );

      const couponsSnapshot = await getDocs(collection(db, "coupons"));
      const couponList = couponsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const enabledCoupons = couponList.filter(
        (coupon) => coupon.status === "Enabled" || coupon.isActive !== false
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
      className="mb-4 border-0 shadow-sm"
      style={{
        borderRadius: "15px",
        overflow: "hidden",
        backgroundColor: "#ffffff",
      }}
    >
      <Card.Header
        className="border-bottom-0 pt-3 pb-2 px-3 px-md-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 bg-white"
      >
        <div>
          <h5 className="fw-bold mb-0 d-flex align-items-center text-dark" style={{ fontSize: "1.2rem" }}>
            <span className="bg-danger bg-opacity-10 p-2 rounded-circle me-2 d-flex align-items-center justify-content-center">
              <FaGift className="text-danger" size={18} />
            </span>
            Exclusive Bank Offers
          </h5>
          <p className="small mt-1 mb-0 ms-0 ms-md-4 ps-md-2 py-0 text-muted" style={{ borderLeft: "2px solid #0d6efd", fontSize: "0.8rem" }}>
            Maximize your savings with our verified partner banks.
          </p>
        </div>
      </Card.Header>

      <Card.Body className="px-3 px-md-4 pb-4 pt-2 bg-white">
        {offers.length === 0 ? (
          <Alert variant="info" className="border-0 rounded-3 text-center mt-2 shadow-sm py-4">
            <FaInfoCircle size={24} className="mb-2 text-info opacity-75" /><br />
            <span className="fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>No offers available at the moment.</span>
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
                  <Card.Body className="p-3 d-flex flex-column z-1">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <Badge bg="primary" className="px-2 py-1 rounded-pill fw-semibold shadow-sm text-uppercase tracking-wide" style={{ fontSize: "0.65rem", letterSpacing: "0.5px" }}>
                        <FaTag className="me-1" /> {offer.offerName || "Special Deal"}
                      </Badge>
                    </div>

                    <h6 className="fw-bold mb-3 d-flex align-items-center position-relative">
                      <span
                        className="shadow-sm p-2 rounded-circle me-2 d-flex align-items-center justify-content-center bg-white"
                        style={{ width: "40px", height: "40px" }}
                      >
                        <FaUniversity className="text-primary" size={18} />
                      </span>
                      <span style={{ lineHeight: "1.3", fontSize: "0.95rem" }}>{offer.bankName || offer.bank_name || offer.bank || "Partner Bank"}</span>
                    </h6>

                    <div
                      className="mt-auto p-2 rounded-3 info-box d-flex justify-content-between align-items-center"
                      style={{
                        backgroundColor: "rgba(13, 110, 253, 0.04)",
                        border: "1px dashed rgba(13, 110, 253, 0.2)",
                      }}
                    >
                      <p className="mb-0" style={{ fontSize: "0.85rem", lineHeight: "1.4", color: "#495057" }}>
                        <FaInfoCircle className="text-primary me-2 opacity-75" />
                        {offer.displayText1}
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
                    {!hideApplyButton && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="fw-bold px-3 rounded-pill"
                        onClick={() => alert("Bank offers are automatically processed at the Razorpay Payment screen. Proceed to checkout to avail this deal!")}
                      >
                        APPLY OFFER
                      </Button>
                    )}
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card.Body>

      {/* Coupons Section */}
      <Card.Header
        className="border-bottom-0 border-top pt-3 pb-2 px-3 px-md-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 bg-white"
      >
        <div>
          <h5 className="fw-bold mb-0 d-flex align-items-center text-dark" style={{ fontSize: "1.2rem" }}>
            <span className="bg-success bg-opacity-10 p-2 rounded-circle me-2 d-flex align-items-center justify-content-center">
              <FaTag className="text-success" size={18} />
            </span>
            Available Coupons
          </h5>
          <p className="small mt-1 mb-0 ms-0 ms-md-4 ps-md-2 py-0 text-muted" style={{ borderLeft: "2px solid #198754", fontSize: "0.8rem" }}>
            Get special discounts on your order!
          </p>
        </div>
      </Card.Header>

      <Card.Body className="px-3 px-md-4 pb-4 pt-2 bg-white">
        {coupons.length === 0 ? (
          <Alert variant="info" className="border-0 rounded-3 text-center mt-2 shadow-sm py-4">
            <FaInfoCircle size={24} className="mb-2 text-info opacity-75" /><br />
            <span className="fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>No coupons available at the moment.</span>
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
                  <Card.Body className="p-3 d-flex flex-column z-1">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <Badge bg="success" className="px-2 py-1 rounded-pill fw-semibold shadow-sm tracking-wide" style={{ fontSize: "0.7rem", letterSpacing: "1px", border: "1px dashed white" }}>
                        {coupon.code}
                      </Badge>
                    </div>

                    <h6 className="fw-bold mb-3 d-flex align-items-center position-relative">
                      <span
                        className="shadow-sm p-2 rounded-circle me-2 d-flex align-items-center justify-content-center bg-white"
                        style={{ width: "40px", height: "40px" }}
                      >
                        <span style={{ fontSize: "0.9rem", fontWeight: "900", color: "#198754" }}>
                          {coupon.discountType === "flat" ? "₹" : ""}{coupon.discountValue || coupon.discountPercent || 0}{coupon.discountType !== "flat" ? "%" : ""}
                        </span>
                      </span>
                      <span style={{ lineHeight: "1.3", fontSize: "0.95rem" }}>{coupon.title || coupon.description || "Discount on your order"}</span>
                    </h6>

                    <div
                      className="mt-auto p-2 rounded-3 d-flex justify-content-between align-items-center"
                      style={{
                        backgroundColor: "rgba(25, 135, 84, 0.04)",
                        border: "1px solid rgba(25, 135, 84, 0.1)",
                      }}
                    >
                      <p className="mb-0 flex-grow-1" style={{ fontSize: "0.85rem", lineHeight: "1.4", color: "#495057" }}>
                        <strong className="text-success">₹{coupon.minOrderAmount}</strong> min.
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