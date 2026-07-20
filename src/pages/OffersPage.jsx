import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { FaTag } from "react-icons/fa";
import { HiLightningBolt } from "react-icons/hi";
import { AiOutlineBank } from "react-icons/ai";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const allOffers = [];

        // Fetch Coupons
        const couponsSnapshot = await getDocs(collection(db, "coupons"));
        couponsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.isActive) {
            allOffers.push({
              id: doc.id,
              type: 'coupon',
              title: data.code,
              description: data.description || `Special Discount`,
              minOrder: data.minOrderAmount ? `Min order ₹${data.minOrderAmount}` : '',
              isBankOffer: data.isBankOffer || false
            });
          }
        });

        // Fetch Razorpay Offers
        const razorpaySnapshot = await getDocs(collection(db, "razorpay_offers"));
        razorpaySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === "Enabled" || data.status === "active") {
            // Extract the discount percent from terms if available, or just use the name
            // Looking at the screenshot, terms says "12%...". For simplicity we'll show a summary.
            const discountMatch = data.terms ? data.terms.match(/(\d+%)/) : null;
            const discountAmount = discountMatch ? discountMatch[0] : '';
            const bankMatch = data.terms ? data.terms.match(/([a-zA-Z\s]+ Bank)/i) : null;
            const bankName = bankMatch ? bankMatch[0].toUpperCase() : '';
            
            allOffers.push({
              id: doc.id,
              type: 'razorpay',
              title: data.offerName,
              description: discountAmount && bankName ? `${discountAmount} OFF ON ${bankName} CARDS` : data.terms?.substring(0, 50) + '...',
              minOrder: data.minPayment ? `Min order ₹${data.minPayment}` : '',
              isBankOffer: true // Usually Razorpay offers are bank offers
            });
          }
        });

        setOffers(allOffers);
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  return (
    <Container className="py-5" style={{ minHeight: '60vh' }}>
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <div style={{ 
            border: '1px solid #e2e8f0', 
            borderRadius: '12px', 
            padding: '24px', 
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            {/* Header */}
            <div className="d-flex align-items-center mb-4" style={{ gap: '10px' }}>
              <FaTag style={{ color: '#3b82f6', fontSize: '20px' }} />
              <h4 className="fw-bold m-0" style={{ fontSize: '18px', color: '#1a202c' }}>Available Offers</h4>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : offers.length === 0 ? (
              <p className="text-muted text-center py-4">No offers available at the moment.</p>
            ) : (
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {/* Offers Grid */}
                {offers.map((offer) => (
                  <div key={offer.id} style={{ 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    padding: '16px', 
                    flex: '1 1 300px',
                    minWidth: '280px'
                  }}>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <span style={{ 
                        backgroundColor: '#e0f2fe', 
                        color: '#0369a1', 
                        fontSize: '11px', 
                        fontWeight: 'bold', 
                        padding: '4px 10px', 
                        borderRadius: '4px' 
                      }}>
                        {offer.title}
                      </span>
                      <div style={{ color: '#fbbf24', fontSize: '16px', display: 'flex', gap: '8px' }}>
                        <HiLightningBolt />
                        {offer.isBankOffer && <AiOutlineBank style={{ color: '#64748b' }} />}
                      </div>
                    </div>
                    <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '14px', lineHeight: '1.4' }}>
                      {offer.description}
                    </h6>
                    {offer.minOrder && (
                      <p className="m-0 mt-2" style={{ color: '#64748b', fontSize: '12px' }}>{offer.minOrder}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default OffersPage;
