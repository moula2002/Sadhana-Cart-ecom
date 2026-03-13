import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  addToCart,
  removeFromCart,
  clearCart,
  clearCartError,
} from "../../redux/cartSlice";

import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Toast,
  ToastContainer,
} from "react-bootstrap";

import { useNavigate, Link } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

import CartItems from "./CartItems";
import { useTranslation } from "react-i18next";

const CartPage = () => {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = getAuth();

  const cartItems = useSelector((state) => state.cart.items || []);
  const errorId = useSelector((state) => state.cart.errorId);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [stockData, setStockData] = useState({});

  /* ---------------- Scroll to top ---------------- */

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* ---------------- Detect login state ---------------- */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, [auth]);

  /* ---------------- Fetch stock from Firestore ---------------- */

  useEffect(() => {
    const fetchStocks = async () => {
      const newStockData = {};

      for (const item of cartItems) {
        try {
          const docRef = doc(db, "products", item.id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();

            let stockValue = 0;

            if (
              Array.isArray(data.sizevariants) &&
              data.sizevariants.length > 0
            ) {
              stockValue = data.sizevariants[0].stock ?? 0;
            } else {
              stockValue = data.stock ?? 0;
            }

            newStockData[item.id] = stockValue;
          } else {
            newStockData[item.id] = 0;
          }
        } catch (error) {
          console.error(`Error fetching stock for ${item.id}:`, error);
          newStockData[item.id] = 0;
        }
      }

      setStockData(newStockData);
    };

    if (cartItems.length > 0) fetchStocks();
  }, [cartItems]);

  /* ---------------- Stock limit toast ---------------- */

  useEffect(() => {
    if (errorId) {
      const item = cartItems.find((i) => i.id === errorId);

      if (item) {
        setToastMessage(
          `You've reached the maximum stock limit for "${item.title}".`
        );

        setShowToast(true);
        dispatch(clearCartError());
      }
    }
  }, [errorId, cartItems, dispatch]);

  /* ---------------- Increase quantity ---------------- */

  const handleIncrease = (item) => {
    const stock = stockData[item.id] ?? 0;

    if (item.quantity >= stock) {
      setToastMessage(
        `Only ${stock} unit${stock > 1 ? "s" : ""} available for "${
          item.title
        }".`
      );

      setShowToast(true);
      return;
    }

    dispatch(addToCart({ ...item, quantity: 1 }));
  };

  /* ---------------- Decrease quantity ---------------- */

  const handleDecrease = (item) => {
    if (item.quantity > 1) {
      dispatch(removeFromCart({ id: item.id, size: item.size, quantity: 1 }));
    }
  };

  /* ---------------- Remove item ---------------- */

  const handleRemove = (item) => {
    dispatch(removeFromCart({ id: item.id, size: item.size }));
  };

  /* ---------------- Clear cart ---------------- */

  const handleClear = () => {
    dispatch(clearCart());
  };

  /* ---------------- Total price ---------------- */

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  /* ---------------- Checkout ---------------- */

  const handleCheckout = () => {
    if (isLoggedIn) {
      navigate("/checkout");
    } else {
      navigate("/login", { state: { from: "/checkout" } });
    }
  };

  /* ---------------- Empty cart view ---------------- */

  if (cartItems.length === 0)
    return (
      <Container className="empty-cart-container py-5">
        <div className="empty-cart-wrapper">
          <div className="empty-cart-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.70711 15.2929C4.07714 15.9229 4.52331 17 5.41421 17H17M17 17C15.8954 17 15 17.8954 15 19C15 20.1046 15.8954 21 17 21C18.1046 21 19 20.1046 19 19C19 17.8954 18.1046 17 17 17ZM9 19C9 20.1046 8.10457 21 7 21C5.89543 21 5 20.1046 5 19C5 17.8954 5.89543 17 7 17C8.10457 17 9 17.8954 9 19Z" 
              stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="empty-cart-title">{t("cart.emptyTitle")}</h2>
          <p className="empty-cart-subtitle">{t("cart.emptySubtitle")}</p>
          <Link to="/" className="shop-now-btn">
            {t("cart.startShopping")}
          </Link>
        </div>
      </Container>
    );

  /* ---------------- Cart UI ---------------- */

  return (
    <div className="cart-page-wrapper">
      <Container className="py-5">
        {/* Header with gradient */}
        <div className="cart-header text-center mb-5">
          <h1 className="cart-main-title">
            <span className="cart-icon">🛒</span> 
            {t("cart.heading")}
          </h1>
        </div>

        {/* Main Content */}
        <Row className="g-4">
          {/* Cart Items Section */}
          <Col lg={8}>
            <div className="cart-items-container">
              <CartItems
                items={cartItems.map((i) => ({
                  ...i,
                  stock: stockData[i.id] ?? 0,
                }))}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                onRemove={handleRemove}
              />
            </div>
          </Col>

          {/* Order Summary Section */}
          <Col lg={4}>
            <div className="order-summary-sticky">
              <Card className="order-summary-card">
                <Card.Header className="summary-header">
                  <h3>Order Summary</h3>
                </Card.Header>
                <Card.Body>
                  <div className="summary-details">
                    <div className="summary-row">
                      <span>Subtotal ({cartItems.length} items)</span>
                      <span className="amount">{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Shipping</span>
                      <span className="amount free-shipping">Free</span>
                    </div>
                    <div className="summary-row">
                      <span>Tax</span>
                      <span className="amount">Calculated at checkout</span>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-row total">
                      <span>Total Amount</span>
                      <span className="total-amount">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>

                  <div className="checkout-section">
                    <Button 
                      className="checkout-btn-modern" 
                      onClick={handleCheckout}
                    >
                      <span>Proceed to Checkout</span>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M4.16666 10H15.8333M15.8333 10L11.6667 5.83337M15.8333 10L11.6667 14.1667" 
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Button>

                    <Button className="clear-cart-modern" onClick={handleClear}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M2.25 4.5H3.75H15.75M6 4.5V3C6 2.60218 6.15804 2.22064 6.43934 1.93934C6.72064 1.65804 7.10218 1.5 7.5 1.5H10.5C10.8978 1.5 11.2794 1.65804 11.5607 1.93934C11.842 2.22064 12 2.60218 12 3V4.5M14.25 4.5V15C14.25 15.3978 14.092 15.7794 13.8107 16.0607C13.5294 16.342 13.1478 16.5 12.75 16.5H5.25C4.85218 16.5 4.47064 16.342 4.18934 16.0607C3.90804 15.7794 3.75 15.3978 3.75 15V4.5H14.25Z" 
                        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Clear Cart
                    </Button>
                  </div>
                </Card.Body>
              </Card>

          
            </div>
          </Col>
        </Row>
      </Container>

      {/* Toast message */}
      <ToastContainer position="bottom-center" className="toast-container-custom">
        <Toast
          show={showToast}
          delay={3000}
          autohide
          onClose={() => setShowToast(false)}
          className="stock-toast-modern"
        >
          <Toast.Header closeButton={false}>
            <div className="toast-icon">⚠️</div>
            <strong className="me-auto">{t("cart.stockLimit")}</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default CartPage;