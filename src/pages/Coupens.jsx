import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Card, Button, Form, Alert, Row, Col, Spinner, Badge } from "react-bootstrap";
import { FaTag, FaCheckCircle, FaArrowLeft, FaGift, FaUniversity, FaInfoCircle } from "react-icons/fa";

function Coupens() {
  const [coupons, setCoupons] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState("");
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Safe extraction of previous state passed from Checkout
  const passedState = location.state || {};
  const orderTotal = passedState.totalPrice || 0;

  // ✅ Fetch all coupons
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "coupons"));
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCoupons(list);

      const offersSnapshot = await getDocs(collection(db, "razorpay_offers"));
      const offerList = offersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOffers(offerList);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchCoupons();
  }, []);

  const handleApply = (couponToApply) => {
    let found;
    
    // Check if it's the manual string input or a coupon object click
    if (typeof couponToApply === "string") {
      if (!couponToApply.trim()) return;
      found = coupons.find(
        (c) =>
          c.code?.toLowerCase() === couponToApply.toLowerCase() &&
          c.status === "Enabled"
      );
    } else {
      found = couponToApply;
    }

    if (!found || found.status !== "Enabled") {
      alert("❌ Invalid or Expired Coupon");
      return;
    }

    // Only strictly validate minimum order if coming from checkout meaning orderTotal > 0
    if (orderTotal > 0 && orderTotal < Number(found.minOrderAmount)) {
      alert(`Minimum order ₹${found.minOrderAmount} required`);
      return;
    }

    alert(`✅ Coupon ${found.code} Applied Successfully`);
    
    // Navigate back to checkout with the applied coupon
    // Preserving all state including checkoutState
    navigate("/checkout", { 
      state: { 
        ...passedState, 
        appliedCouponCode: found.code 
      } 
    });
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="warning" />
        <p className="mt-3">Fetching Coupons...</p>
      </Container>
    );
  }

  const enabledCoupons = coupons.filter(c => c.status === "Enabled");
  const enabledOffers = offers.filter(o => o.status === "Enabled");

  return (
    <Container className="py-5" style={{ maxWidth: "800px" }}>
      <Button 
        variant="link" 
        className="text-decoration-none mb-3 px-0 text-dark" 
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="me-2" /> Back
      </Button>

      <h3 className="fw-bold mb-4 border-bottom pb-3">Available Coupons</h3>

      {/* Manual Input Box */}
      <Card className="shadow-sm border-0 mb-4 p-4">
        <h5 className="mb-3">Enter Coupon Code</h5>
        <div className="d-flex gap-2">
          <Form.Control
            type="text"
            placeholder="Type your code here"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            className="flex-grow-1"
          />
          <Button variant="warning" className="fw-bold px-4" onClick={() => handleApply(inputCode)}>
            APPLY
          </Button>
        </div>
      </Card>

      {/* Razorpay Offers Section */}
      <h5 className="fw-bold mb-3 d-flex align-items-center">
        <FaGift className="text-danger me-2" /> Exclusive Bank Offers
      </h5>
      {enabledOffers.length === 0 ? (
        <Alert variant="info" className="mb-4">No bank offers available at the moment.</Alert>
      ) : (
        <Row className="g-3 mb-5">
          {enabledOffers.map((offer) => (
            <Col md={6} key={offer.id}>
              <Card 
                className="h-100 shadow-sm border-0"
                style={{ borderTop: "4px solid #0d6efd", borderRadius: "12px" }}
              >
                <Card.Body className="d-flex flex-column p-4">
                  <Badge bg="primary" className="align-self-start py-2 px-3 rounded-pill mb-3 text-uppercase">
                    {offer.offerName || "Special Deal"}
                  </Badge>
                  
                  <h5 className="fw-bold mb-3 d-flex align-items-center">
                    <span 
                      className="shadow-sm p-2 rounded-circle me-3 d-flex align-items-center justify-content-center bg-white" 
                      style={{ width: "45px", height: "45px" }}
                    >
                      <FaUniversity className="text-primary" size={20} />
                    </span>
                    {offer.bankName || offer.bank_name || offer.bank || "Bank Offer"}
                  </h5>

                  <div 
                    className="mt-auto p-3 rounded-3" 
                    style={{ backgroundColor: "rgba(13, 110, 253, 0.05)" }}
                  >
                    <p className="mb-0 small text-muted">
                      <FaInfoCircle className="text-primary me-2" />
                      {offer.displayText}
                    </p>
                  </div>
                </Card.Body>
                
                <Card.Footer className="bg-white border-0 pb-4 px-4 pt-0 text-end">
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="fw-bold px-4 rounded-pill w-100"
                    onClick={() => {
                      alert(`✅ Bank offer from ${offer.bankName} applied!`);
                      navigate("/checkout", { state: { ...passedState, appliedRazorpayOffer: offer } });
                    }}
                  >
                    APPLY OFFER
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* List Active Coupons */}
      <h5 className="fw-bold mb-3 d-flex align-items-center">
        <FaTag className="text-success me-2" /> Store Coupons
      </h5>
      {enabledCoupons.length === 0 ? (
        <Alert variant="info">No active coupons available at the moment.</Alert>
      ) : (
        <Row className="g-3">
          {enabledCoupons.map((coupon) => {
            const isEligible = orderTotal === 0 || orderTotal >= Number(coupon.minOrderAmount);
            
            return (
              <Col xs={12} key={coupon.id}>
                <Card 
                  className={`border-0 shadow-sm h-100 ${!isEligible ? "opacity-75" : ""}`}
                  style={{ borderLeft: "5px solid #ffc107" }}
                >
                  <Card.Body className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="d-flex align-items-center mb-2">
                        <FaTag className="text-warning me-2" />
                        <h5 className="fw-bold mb-0 text-success">{coupon.code}</h5>
                      </div>
                      <Card.Title className="fs-6">{coupon.title}</Card.Title>
                      <Card.Text className="text-muted small mb-1">
                        Get {coupon.discountPercent}% OFF on your purchase.
                      </Card.Text>
                      <Card.Text className="text-muted small">
                        Minimum Order: ₹{coupon.minOrderAmount}
                      </Card.Text>
                    </div>

                    <Button 
                      variant={isEligible ? "outline-success" : "outline-secondary"}
                      disabled={!isEligible && orderTotal > 0} 
                      onClick={() => handleApply(coupon)}
                      className="rounded-pill px-4"
                    >
                      {isEligible ? "APPLY" : "NOT ELIGIBLE"}
                    </Button>
                  </Card.Body>
                  
                  {!isEligible && orderTotal > 0 && (
                    <Card.Footer className="bg-light text-danger text-center small py-1 border-0">
                      Add items worth ₹{(Number(coupon.minOrderAmount) - orderTotal).toFixed(2)} more to unlock!
                    </Card.Footer>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Container>
  );
}

export default Coupens;