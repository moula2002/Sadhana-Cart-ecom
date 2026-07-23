import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  addToCart,
  removeFromCart,
  clearCart,
  clearCartError,
} from "../../redux/cartSlice";

import { Container, Row, Col, Toast, ToastContainer } from "react-bootstrap";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

import CartItems from "./CartItems";
import { useTranslation } from "react-i18next";
import { ShoppingBag, ArrowRight, Trash2, ShieldCheck, Truck, Lock } from "lucide-react";
import logoImg from "../../Images/Sadhanacart1.png";
import "./CartPage.css";

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
    const productName = item.title || item.name || "Product";
    toast.success(`${productName} removed from cart!`);
  };

  /* ---------------- Clear cart ---------------- */

  const handleClear = () => {
    dispatch(clearCart());
    toast.success("Shopping cart cleared!");
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
      <div className="cart-page-wrapper">
        <Container className="empty-cart-container py-5">
          <div className="empty-cart-card">
            <div className="empty-cart-icon-wrap">
              <img src={logoImg} alt="Sadhana Cart" style={{ maxWidth: "65px", maxHeight: "65px", objectFit: "contain" }} />
            </div>
            <h2>{t("cart.emptyTitle", "Your Cart is Empty")}</h2>
            <p>{t("cart.emptySubtitle", "Looks like you haven't added anything to your cart yet.")}</p>
            <Link to="/" className="start-shopping-btn">
              {t("cart.startShopping", "Start Shopping")}
              <ArrowRight size={18} />
            </Link>
          </div>
        </Container>
      </div>
    );

  /* ---------------- Cart UI ---------------- */

  return (
    <div className="cart-page-wrapper">
      <Container className="py-4">
        {/* Step Progress Indicator */}
        <div className="checkout-steps-container">
          <div className="step-item active">
            <span className="step-number">1</span>
            <span className="step-title">{t("shoppingCart", "Shopping Cart")}</span>
          </div>
          <div className="step-divider"></div>
          <div className="step-item">
            <span className="step-number">2</span>
            <span className="step-title">{t("checkout", "Checkout")}</span>
          </div>
          <div className="step-divider"></div>
          <div className="step-item">
            <span className="step-number">3</span>
            <span className="step-title">{t("orderComplete", "Order Complete")}</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="cart-header d-flex justify-content-between align-items-center">
          <h1 className="cart-main-title">
            {t("shoppingCart", "Shopping Cart")}
            <span className="cart-title-badge">
              {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
            </span>
          </h1>
        </div>

        {/* Main Content Grid */}
        <Row className="g-4">
          {/* Left Column: Cart Items List */}
          <Col lg={8}>
            <CartItems
              items={cartItems.map((i) => ({
                ...i,
                stock: stockData[i.id] ?? 0,
              }))}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              onRemove={handleRemove}
            />
          </Col>

          {/* Right Column: Order Summary Sidebar */}
          <Col lg={4}>
            <div className="order-summary-sticky">
              <div className="order-summary-card">
                <div className="summary-card-header">
                  <h3>{t("orderSummary", "Order Summary")}</h3>
                </div>

                <div className="summary-card-body">


                  {/* Pricing Breakdown */}
                  <div className="summary-rows">
                    <div className="summary-row-item">
                      <span className="label-title">Subtotal ({cartItems.length} items)</span>
                      <span className="val-amount">{formatPrice(totalPrice)}</span>
                    </div>

                    <div className="summary-row-item">
                      <span className="label-title">{t("deliveryCharges", "Delivery Charges")}</span>
                      <span className="val-amount free-tag">{t("free", "FREE")}</span>
                    </div>

                    <div className="summary-row-item">
                      <span className="label-title">{t("estimatedTax", "Estimated Tax")}</span>
                      <span className="val-amount text-muted">{t("included", "Included")}</span>
                    </div>

                    <div className="summary-divider-line"></div>

                    <div className="summary-total-row">
                      <span className="total-title-text">{t("totalAmount", "Total Amount")}</span>
                      <span className="total-val-amount">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>

                  {/* Primary CTA Buttons */}
                  <div className="summary-actions">
                    <button
                      className="btn-proceed-checkout"
                      onClick={handleCheckout}
                    >
                      <span>{t("proceedToCheckout", "Proceed to Checkout")}</span>
                      <ArrowRight size={20} />
                    </button>

                    <button className="btn-clear-cart-outlined" onClick={handleClear}>
                      <Trash2 size={16} />
                      {t("clearShoppingCart", "Clear Shopping Cart")}
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Trust & Security Badges */}
              <div className="trust-badges-card">
                <div className="trust-item">
                  <Lock size={18} className="text-primary trust-icon" />
                  <span>{t("cart.sslEncrypted", "256-Bit SSL Encrypted Checkout")}</span>
                </div>
                <div className="trust-item">
                  <Truck size={18} className="text-success trust-icon" />
                  <span>{t("cart.freeDelivery", "Free & Express Delivery Available")}</span>
                </div>
                <div className="trust-item">
                  <ShieldCheck size={18} className="text-indigo trust-icon" />
                  <span>{t("cart.authenticGuaranteed", "100% Authentic Products Guaranteed")}</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Stock Toast Notification */}
      <ToastContainer position="bottom-center" className="toast-container-custom">
        <Toast
          show={showToast}
          delay={3000}
          autohide
          onClose={() => setShowToast(false)}
          className="stock-toast-modern"
        >
          <Toast.Header closeButton={false}>
            <strong className="me-auto">{t("cart.stockLimit")}</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default CartPage;