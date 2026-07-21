import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { FaTag } from "react-icons/fa";
import { HiLightningBolt } from "react-icons/hi";
import { AiOutlineBank } from "react-icons/ai";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useTranslation } from "react-i18next";

const OffersPage = () => {
  const { t } = useTranslation();
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
              description: data.description || t("specialDiscount", "Special Discount"),
              minOrder: data.minOrderAmount ? `${t("minOrderAmount", "Min order")} ₹${data.minOrderAmount}` : '',
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
              description: discountAmount && bankName ? `${discountAmount} ${t("offOn", "OFF ON")} ${bankName} ${t("cards", "CARDS")}` : data.terms?.substring(0, 50) + '...',
              minOrder: data.minPayment ? `${t("minOrderAmount", "Min order")} ₹${data.minPayment}` : '',
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
    <Container className="py-5 offers-page-container" style={{ minHeight: '60vh' }}>
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <div className="offers-main-card">
            {/* Header */}
            <div className="d-flex align-items-center mb-4" style={{ gap: '10px' }}>
              <FaTag style={{ color: '#3b82f6', fontSize: '20px' }} />
              <h4 className="fw-bold m-0 offers-header-title">{t("availableOffers", "Available Offers")}</h4>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : offers.length === 0 ? (
              <p className="text-muted text-center py-4 offers-empty-text">{t("noOffersAvailable", "No offers available at the moment.")}</p>
            ) : (
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {/* Offers Grid */}
                {offers.map((offer) => (
                  <div key={offer.id} className="offer-item-card">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <span className="offer-badge">
                        {offer.title}
                      </span>
                      <div style={{ color: '#fbbf24', fontSize: '16px', display: 'flex', gap: '8px' }}>
                        <HiLightningBolt />
                        {offer.isBankOffer && <AiOutlineBank className="offer-bank-icon" />}
                      </div>
                    </div>
                    <h6 className="fw-bold mb-1 offer-desc">
                      {offer.description}
                    </h6>
                    {offer.minOrder && (
                      <p className="m-0 mt-2 offer-min-order">{offer.minOrder}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Col>
      </Row>

      <style>{`
        .offers-main-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          background-color: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }
        .offers-header-title {
          font-size: 18px;
          color: #1a202c;
        }
        .offers-empty-text {
          color: #64748b;
        }
        .offer-item-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          flex: 1 1 300px;
          min-width: 280px;
          background-color: #ffffff;
          transition: all 0.3s ease;
        }
        .offer-badge {
          background-color: #e0f2fe;
          color: #0369a1;
          font-size: 11px;
          font-weight: bold;
          padding: 4px 10px;
          border-radius: 4px;
        }
        .offer-bank-icon {
          color: #64748b;
        }
        .offer-desc {
          font-size: 14px;
          line-height: 1.4;
          color: #1a202c;
        }
        .offer-min-order {
          color: #64748b;
          font-size: 12px;
        }

        /* ── Dark Mode ── */
        .dark-theme .offers-main-card,
        [data-bs-theme="dark"] .offers-main-card,
        [data-theme="dark"] .offers-main-card {
          background-color: #1e293b;
          border-color: #334155;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        .dark-theme .offers-header-title,
        [data-bs-theme="dark"] .offers-header-title,
        [data-theme="dark"] .offers-header-title {
          color: #f8fafc;
        }
        .dark-theme .offers-empty-text,
        [data-bs-theme="dark"] .offers-empty-text,
        [data-theme="dark"] .offers-empty-text {
          color: #94a3b8;
        }
        .dark-theme .offer-item-card,
        [data-bs-theme="dark"] .offer-item-card,
        [data-theme="dark"] .offer-item-card {
          background-color: #0f172a;
          border-color: #334155;
        }
        .dark-theme .offer-badge,
        [data-bs-theme="dark"] .offer-badge,
        [data-theme="dark"] .offer-badge {
          background-color: #1e3a8a;
          color: #93c5fd;
        }
        .dark-theme .offer-bank-icon,
        [data-bs-theme="dark"] .offer-bank-icon,
        [data-theme="dark"] .offer-bank-icon {
          color: #94a3b8;
        }
        .dark-theme .offer-desc,
        [data-bs-theme="dark"] .offer-desc,
        [data-theme="dark"] .offer-desc {
          color: #f1f5f9;
        }
        .dark-theme .offer-min-order,
        [data-bs-theme="dark"] .offer-min-order,
        [data-theme="dark"] .offer-min-order {
          color: #94a3b8;
        }
      `}</style>
    </Container>
  );
};

export default OffersPage;
