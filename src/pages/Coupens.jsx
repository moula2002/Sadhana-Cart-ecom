import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Card, Button, Form, Alert, Row, Col, Spinner, Badge } from "react-bootstrap";
import { FaTag, FaArrowLeft, FaGift, FaUniversity, FaInfoCircle } from "react-icons/fa";

function Coupens() {
  const [coupons, setCoupons] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const orderTotal = location.state?.totalPrice || 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const couponSnap = await getDocs(collection(db, "coupons"));
        const couponList = couponSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const offerSnap = await getDocs(collection(db, "razorpay_offers"));
        const offerList = offerSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setCoupons(couponList);
        setOffers(offerList);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApplyCoupon = (code) => {
    const found = coupons.find(
      c =>
        c.code?.toLowerCase() === code.toLowerCase() &&
        c.isActive === true
    );

    if (!found) {
      alert("❌ Invalid Coupon");
      return;
    }

    if (orderTotal < Number(found.minOrderAmount)) {
      alert(`Minimum order ₹${found.minOrderAmount} required`);
      return;
    }

    alert(`✅ Coupon ${found.code} Applied`);

    navigate("/checkout", {
      state: {
        ...location.state,
        appliedCoupon: found
      }
    });
  };

  const handleApplyOffer = (offer) => {
    alert(`✅ ${offer.bankName} offer applied`);

    navigate("/checkout", {
      state: {
        ...location.state,
        appliedRazorpayOffer: offer
      }
    });
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner />
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: "800px" }}>

      <Button onClick={() => navigate(-1)} className="mb-3">
        <FaArrowLeft /> Back
      </Button>

      <Card className="p-3 mb-4">
        <Form.Control
          placeholder="Enter coupon code"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
        />
        <Button className="mt-2" onClick={() => handleApplyCoupon(inputCode)}>
          APPLY
        </Button>
      </Card>

      <h5 className="mb-3">
        <FaGift className="text-danger me-2" />
        Bank Offers
      </h5>

      {offers.filter(o => o.isActive !== false).length === 0 ? (
        <Alert>No offers available</Alert>
      ) : (
        <Row className="mb-4">
          {offers.map(offer => (
            <Col md={6} key={offer.id}>
              <Card className="p-3 shadow-sm mb-3">
                <Badge bg="primary" className="mb-2">
                  {offer.offerName || "Bank Offer"}
                </Badge>

                <h6>
                  <FaUniversity className="me-2" />
                  {offer.bankName}
                </h6>

                <p className="small text-muted">
                  <FaInfoCircle className="me-1" />
                  {offer.displayText}
                </p>

                <Button onClick={() => handleApplyOffer(offer)}>
                  APPLY OFFER
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <h5 className="mb-3">
        <FaTag className="text-success me-2" />
        Coupons
      </h5>

      {coupons.filter(c => c.isActive).length === 0 ? (
        <Alert>No coupons available</Alert>
      ) : (
        coupons
          .filter(c => c.isActive)
          .map(coupon => (
            <Card key={coupon.id} className="mb-3 p-3 shadow-sm">
              <div className="d-flex justify-content-between">

                <div>
                  <h5 className="text-success">{coupon.code}</h5>

                  <p className="text-muted mb-1">
                    {coupon.description}
                  </p>

                  <p className="text-warning mb-1">
                    {coupon.discountType === "percentage"
                      ? `${coupon.discountValue}% OFF`
                      : `₹${coupon.discountValue} OFF`}
                  </p>

                  <small>
                    Min Order ₹{coupon.minOrderAmount}
                  </small>
                </div>

                <Button onClick={() => handleApplyCoupon(coupon.code)}>
                  APPLY
                </Button>

              </div>
            </Card>
          ))
      )} 

    </Container>
  );
}

export default Coupens;