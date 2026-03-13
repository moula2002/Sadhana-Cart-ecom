import React from "react";
import { Card, Row, Col, Image } from "react-bootstrap";
import { useTranslation } from "react-i18next";

const CartItem = ({ item, onIncrease, onDecrease, onRemove }) => {
  const { t } = useTranslation();
  
  const formatPrice = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  // Premium styles object
  const styles = {
    card: {
      border: 'none',
      background: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease',
      marginBottom: '16px',
      overflow: 'hidden',
    },
    cardBody: {
      padding: '24px',
    },
    imageWrapper: {
      width: '110px',
      height: '110px',
      margin: '0 auto',
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #f8f9fa, #f1f3f5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
    },
    image: {
      maxHeight: '90px',
      width: 'auto',
      objectFit: 'contain' as const,
      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))',
    },
    title: {
      fontSize: '1.2rem',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '8px',
      letterSpacing: '-0.02em',
    },
    priceTag: {
      fontSize: '1.3rem',
      fontWeight: '700',
      color: '#059669',
      marginBottom: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    currencySymbol: {
      fontSize: '1rem',
      fontWeight: '500',
      color: '#10b981',
      marginTop: '2px',
    },
    subtotal: {
      fontSize: '0.95rem',
      color: '#64748b',
      marginBottom: '0',
    },
    subtotalValue: {
      color: '#0f172a',
      fontWeight: '600',
      fontSize: '1.1rem',
    },
    quantitySection: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '8px',
    },
    quantityLabel: {
      fontSize: '0.75rem',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      color: '#94a3b8',
      fontWeight: '500',
    },
    quantityControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: '#f8fafc',
      padding: '4px',
      borderRadius: '50px',
      border: '1px solid #eef2f6',
    },
    quantityBtn: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      border: 'none',
      background: '#ffffff',
      color: '#334155',
      fontSize: '1.2rem',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
    },
    quantityBtnHover: {
      background: '#f1f5f9',
      color: '#0f172a',
    },
    quantityBtnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
      background: '#f1f5f9',
    },
    quantityDisplay: {
      minWidth: '32px',
      textAlign: 'center' as const,
      fontSize: '1rem',
      fontWeight: '600',
      color: '#1e293b',
    },
    removeBtn: {
      background: 'transparent',
      border: '1.5px solid #fee2e2',
      color: '#ef4444',
      padding: '10px 24px',
      borderRadius: '40px',
      fontSize: '0.9rem',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.05)',
    },
    divider: {
      height: '1px',
      background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)',
      margin: '16px 0 0 0',
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Body style={styles.cardBody}>
        <Row className="align-items-center g-4">
          {/* Product Image with Premium Frame */}
          <Col xs={12} md={2} className="text-center text-md-start">
            <div style={styles.imageWrapper}>
              <Image
                src={item.image || "https://via.placeholder.com/100?text=Premium"}
                alt={item.title}
                fluid
                style={styles.image}
              />
            </div>
          </Col>

          {/* Product Info with Premium Typography */}
          <Col xs={12} md={4}>
            <h5 style={styles.title}>{item.title}</h5>
            <div style={styles.priceTag}>
              <span style={styles.currencySymbol}>₹</span>
              <span>{formatPrice(item.price).replace('₹', '')}</span>
            </div>
            <p style={styles.subtotal}>
              {t("cart.subtotal")}:{' '}
              <span style={styles.subtotalValue}>
                {formatPrice(item.price * item.quantity)}
              </span>
            </p>
          </Col>

          {/* Premium Quantity Controls */}
          <Col xs={12} md={3} className="text-center">
            <div style={styles.quantitySection}>
              <span style={styles.quantityLabel}>QUANTITY</span>
              <div style={styles.quantityControls}>
                <button
                  style={{
                    ...styles.quantityBtn,
                    ...(item.quantity <= 1 ? styles.quantityBtnDisabled : {}),
                  }}
                  onClick={() => onDecrease(item)}
                  disabled={item.quantity <= 1}
                  onMouseEnter={(e) => {
                    if (item.quantity > 1) {
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.color = '#0f172a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.color = '#334155';
                  }}
                >
                  −
                </button>
                <span style={styles.quantityDisplay}>{item.quantity}</span>
                <button
                  style={styles.quantityBtn}
                  onClick={() => onIncrease(item)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#0f172a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.color = '#334155';
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </Col>

          {/* Premium Remove Button */}
          <Col xs={12} md={3} className="text-md-end text-center">
            <button
              style={styles.removeBtn}
              onClick={() => onRemove(item)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.borderColor = '#ef4444';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#fee2e2';
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.05)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              {t("cart.remove")}
            </button>
          </Col>
        </Row>

        {/* Subtle Divider for Visual Separation */}
        <div style={styles.divider} />
      </Card.Body>
    </Card>
  );
};

export default CartItem;