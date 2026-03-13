import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Image,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { useTranslation } from "react-i18next";

const CartItems = ({ items, onIncrease, onDecrease, onRemove }) => {
  const { t } = useTranslation();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  const handleIncreaseClick = (item) => {
    const isMaxQuantity =
      item.stock !== undefined && item.quantity >= item.stock;

    if (isMaxQuantity) {
      setToastMessage(
        t("cart.stockLimitMessage", {
          stock: item.stock,
          title: item.title,
        })
      );
      setShowToast(true);
      return;
    }

    onIncrease(item);
  };

  // Clean, professional styles for e-commerce
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },

    card: {
      border: '1px solid #eaeaea',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
    },

    cardBody: {
      padding: '20px',
    },

    imageWrapper: {
      width: '100px',
      height: '100px',
      margin: '0 auto',
      borderRadius: '8px',
      border: '1px solid #f0f0f0',
      padding: '8px',
      backgroundColor: '#fafafa',
    },

    image: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    },

    lowStockBadge: {
      display: 'inline-block',
      backgroundColor: '#fff3e0',
      color: '#ed6c02',
      fontSize: '0.7rem',
      fontWeight: 500,
      padding: '2px 8px',
      borderRadius: '4px',
      marginTop: '4px',
    },

    title: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#1a1a1a',
      marginBottom: '4px',
      lineHeight: 1.4,
    },

    size: {
      fontSize: '0.85rem',
      color: '#666666',
      marginBottom: '8px',
    },

    price: {
      fontSize: '1.1rem',
      fontWeight: 600,
      color: '#2e7d32',
      marginBottom: '4px',
    },

    quantitySection: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },

    quantityLabel: {
      fontSize: '0.75rem',
      color: '#666666',
      marginBottom: '6px',
      textTransform: 'uppercase',
      letterSpacing: '0.3px',
    },

    quantityControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },

    quantityBtn: {
      width: '32px',
      height: '32px',
      borderRadius: '6px',
      border: '1px solid #e0e0e0',
      backgroundColor: '#ffffff',
      color: '#333333',
      fontSize: '1rem',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.1s ease',
    },

    quantityBtnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },

    quantityDisplay: {
      fontSize: '0.95rem',
      fontWeight: 500,
      color: '#333333',
      minWidth: '24px',
      textAlign: 'center',
    },

    maxStockText: {
      fontSize: '0.7rem',
      color: '#d32f2f',
      marginTop: '4px',
    },

    subtotal: {
      textAlign: 'right',
    },

    subtotalLabel: {
      fontSize: '0.75rem',
      color: '#666666',
      display: 'block',
      marginBottom: '2px',
    },

    subtotalValue: {
      fontSize: '1.1rem',
      fontWeight: 600,
      color: '#1a1a1a',
    },

    removeBtn: {
      backgroundColor: 'transparent',
      border: '1px solid #ffcdd2',
      color: '#d32f2f',
      padding: '6px 16px',
      borderRadius: '6px',
      fontSize: '0.85rem',
      fontWeight: 500,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      cursor: 'pointer',
      transition: 'all 0.1s ease',
      marginTop: '8px',
    },

    stockBar: {
      marginTop: '12px',
      height: '4px',
      backgroundColor: '#f0f0f0',
      borderRadius: '2px',
      overflow: 'hidden',
    },

    stockFill: {
      height: '100%',
      backgroundColor: '#4caf50',
      borderRadius: '2px',
      transition: 'width 0.2s ease',
    },

    stockFillWarning: {
      backgroundColor: '#ff9800',
    },

    // Toast styles
    toastContainer: {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
    },

    toast: {
      backgroundColor: '#ffffff',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      minWidth: '320px',
    },

    toastContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
    },

    toastIcon: {
      color: '#ed6c02',
    },

    toastText: {
      flex: 1,
    },

    toastTitle: {
      margin: '0 0 2px 0',
      fontSize: '0.9rem',
      fontWeight: 600,
      color: '#1a1a1a',
    },

    toastMessage: {
      margin: '0',
      fontSize: '0.85rem',
      color: '#666666',
    },

    toastClose: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#999999',
      cursor: 'pointer',
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  };

  return (
    <>
      <div style={styles.container}>
        {items.map((item) => {
          const isMaxQuantity =
            item.stock !== undefined && item.quantity >= item.stock;
          const stockPercentage = item.stock 
            ? (item.quantity / item.stock) * 100 
            : 0;

          return (
            <Card key={`${item.id}_${item.size}`} style={styles.card}>
              <Card.Body style={styles.cardBody}>
                <Row className="align-items-center g-3">
                  {/* Product Image */}
                  <Col xs={12} md={2} className="text-center">
                    <div style={styles.imageWrapper}>
                      <Image
                        src={
                          item.image || "https://via.placeholder.com/100x100?text=Product"
                        }
                        alt={item.title}
                        fluid
                        style={styles.image}
                      />
                    </div>
                  </Col>

                  {/* Product Info */}
                  <Col xs={12} md={3}>
                    <h6 style={styles.title}>{item.title}</h6>
                    <div style={styles.size}>
                      {t("cart.size")}: <span style={{ fontWeight: 500 }}>{item.size}</span>
                    </div>
                    <div style={styles.price}>{formatPrice(item.price)}</div>
                    {item.stock <= 5 && item.stock > 0 && (
                      <span style={styles.lowStockBadge}>
                        Only {item.stock} left in stock
                      </span>
                    )}
                  </Col>

                  {/* Quantity */}
                  <Col xs={6} md={3}>
                    <div style={styles.quantitySection}>
                      <span style={styles.quantityLabel}>Quantity</span>
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
                              e.currentTarget.style.backgroundColor = '#f5f5f5';
                              e.currentTarget.style.borderColor = '#999999';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#e0e0e0';
                          }}
                        >
                          −
                        </button>
                        <span style={styles.quantityDisplay}>{item.quantity}</span>
                        <button
                          style={{
                            ...styles.quantityBtn,
                            ...(isMaxQuantity ? styles.quantityBtnDisabled : {}),
                          }}
                          onClick={() => handleIncreaseClick(item)}
                          disabled={isMaxQuantity}
                          onMouseEnter={(e) => {
                            if (!isMaxQuantity) {
                              e.currentTarget.style.backgroundColor = '#f5f5f5';
                              e.currentTarget.style.borderColor = '#999999';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#e0e0e0';
                          }}
                        >
                          +
                        </button>
                      </div>
                      {isMaxQuantity && (
                        <span style={styles.maxStockText}>Max stock reached</span>
                      )}
                    </div>
                  </Col>

                  {/* Subtotal & Remove */}
                  <Col xs={6} md={4}>
                    <div style={styles.subtotal}>
                      <span style={styles.subtotalLabel}>Subtotal</span>
                      <span style={styles.subtotalValue}>
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      <button
                        style={styles.removeBtn}
                        onClick={() => onRemove(item)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#d32f2f';
                          e.currentTarget.style.borderColor = '#d32f2f';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderColor = '#ffcdd2';
                          e.currentTarget.style.color = '#d32f2f';
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                        {t("cart.remove")}
                      </button>
                    </div>
                  </Col>
                </Row>

                {/* Stock Progress (subtle indicator) */}
                {item.stock > 0 && item.stock <= 10 && (
                  <div style={styles.stockBar}>
                    <div
                      style={{
                        ...styles.stockFill,
                        width: `${stockPercentage}%`,
                        ...(stockPercentage >= 80 ? styles.stockFillWarning : {}),
                      }}
                    />
                  </div>
                )}
              </Card.Body>
            </Card>
          );
        })}
      </div>

      {/* Clean Toast Notification */}
      <ToastContainer style={styles.toastContainer}>
        <Toast
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={3000}
          autohide
          style={styles.toast}
        >
          <div style={styles.toastContent}>
            <div style={styles.toastIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <div style={styles.toastText}>
              <div style={styles.toastTitle}>{t("cart.stockLimitTitle")}</div>
              <div style={styles.toastMessage}>{toastMessage}</div>
            </div>
            <button style={styles.toastClose} onClick={() => setShowToast(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default CartItems;