import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Button,
  Badge,
} from "react-bootstrap";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useTranslation } from "react-i18next";
import "react-lazy-load-image-component/src/effects/blur.css";
import "./HomeBookSection.css"

/* 📚 BOOK THEME COLORS WITH DARK MODE */
const PRIMARY_TEXT_COLOR = "#1E293B";
const PRIMARY_TEXT_COLOR_DARK = "#fef3c7"; // Light yellow for dark mode
const ACCENT_COLOR = "#F59E0B"; // Amber
const ACCENT_COLOR_DARK = "#fbbf24"; // Brighter amber for dark mode
const SALE_RED = "#DC2626"; // Red
const SALE_RED_DARK = "#ef4444"; // Brighter red for dark mode
const LIGHT_BG = "#FFFBEB"; // Amber 50
const DARK_BG = "#1c1917"; // Dark brown for dark mode
const WHITE = "#FFFFFF";
const PRODUCT_BG_COLOR_DARK = "#1a1a1a"; // Dark mode card background
const BOOKS_BG_GRADIENT = "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)";
const DARK_BG_GRADIENT = "linear-gradient(135deg, #121212 0%, #1c1917 100%)";

/* 🎨 CUSTOM STYLES - Dynamic based on theme */
const getCustomStyles = (isDarkMode) => ({
  mainWrapper: {
    background: isDarkMode ? "transparent" : BOOKS_BG_GRADIENT,
    padding: "60px 0",
  },
  sectionContainer: {
    backgroundColor: isDarkMode ? "rgba(30, 30, 30, 0.9)" : WHITE,
    borderRadius: "30px",
    padding: "3.5rem 1.5rem",
    boxShadow: isDarkMode ? 
      "0 20px 40px rgba(251, 191, 36, 0.1)" : 
      "0 20px 40px rgba(30, 41, 59, 0.08)",
    border: isDarkMode ? 
      "1px solid rgba(255, 255, 255, 0.1)" : 
      "1px solid #FEF3C7",
    position: "relative",
    overflow: "hidden",
  },
  productCard: {
    border: isDarkMode ? "1px solid #2d2d2d" : "none",
    borderRadius: "20px",
    overflow: "hidden",
    backgroundColor: isDarkMode ? PRODUCT_BG_COLOR_DARK : WHITE,
    height: "100%",
    position: "relative",
    boxShadow: isDarkMode ? 
      "0 5px 15px rgba(0, 0, 0, 0.2)" : 
      "0 5px 15px rgba(0,0,0,0.06)",
  },
  imageContainer: (isMobile) => ({
    width: "100%",
    height: isMobile ? "180px" : "240px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDarkMode ? DARK_BG : "#FEFCE8",
  }),
  productImage: {
    maxWidth: "85%",
    maxHeight: "85%",
    objectFit: "contain",
  },
  discountBadge: {
    position: "absolute",
    top: "15px",
    left: "15px",
    backgroundColor: isDarkMode ? SALE_RED_DARK : SALE_RED,
    color: WHITE,
    padding: "0.4rem 0.8rem",
    borderRadius: "8px",
    fontSize: "0.75rem",
    fontWeight: "800",
    zIndex: 10,
    boxShadow: isDarkMode ? 
      "0 4px 8px rgba(239, 68, 68, 0.3)" : 
      "0 4px 8px rgba(220, 38, 38, 0.3)",
  },
  brandText: {
    fontSize: "0.7rem",
    fontWeight: "700",
    color: isDarkMode ? "#fbbf24" : "#92400E",
    letterSpacing: "1.2px",
    textTransform: "uppercase",
  },
  title: {
    fontSize: "1.05rem",
    fontWeight: "700",
    color: isDarkMode ? PRIMARY_TEXT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    marginBottom: "8px",
  },
  price: {
    fontSize: "1.4rem",
    fontWeight: "800",
    color: isDarkMode ? ACCENT_COLOR_DARK : PRIMARY_TEXT_COLOR,
  },
  originalPrice: {
    fontSize: "0.85rem",
    color: isDarkMode ? "#adb5bd" : "#6c757d",
    marginLeft: "8px",
    textDecoration: "line-through"
  },
  header: {
    fontSize: "clamp(2rem, 5vw, 2.5rem)",
    fontWeight: "900",
    color: isDarkMode ? PRIMARY_TEXT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    letterSpacing: "-1px",
    position: "relative",
  },
  headerUnderline: {
    position: "absolute",
    bottom: "-10px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "100px",
    height: "4px",
    backgroundColor: isDarkMode ? "rgba(251, 191, 36, 0.3)" : "rgba(245, 158, 11, 0.3)",
    borderRadius: "2px",
  },
  shopButton: {
    borderRadius: "14px",
    fontSize: "0.9rem",
    fontWeight: "700",
    background: isDarkMode ? 
      "linear-gradient(135deg, #fbbf24, #f59e0b)" : 
      "linear-gradient(135deg, #F59E0B, #D97706)",
    border: "none",
    padding: "0.7rem",
    color: WHITE,
  },
  exploreButton: {
    backgroundColor: "transparent",
    color: isDarkMode ? ACCENT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    border: isDarkMode ? `2px solid ${ACCENT_COLOR_DARK}` : `2px solid ${PRIMARY_TEXT_COLOR}`,
    borderRadius: "50px",
    fontSize: "1.1rem",
    padding: "0.8rem 3rem",
    fontWeight: "700",
  },
  booksWatermark: {
    position: "absolute",
    bottom: "-40px",
    right: "-20px",
    fontSize: "10rem",
    fontWeight: "900",
    color: isDarkMode ? "rgba(251, 191, 36, 0.05)" : "rgba(245, 158, 11, 0.05)",
    userSelect: "none",
    pointerEvents: "none",
    opacity: 0.5
  },
  subtitle: {
    color: isDarkMode ? "#adb5bd" : "#6c757d"
  }
});

/* 🔢 Discount Calculator */
const calculateDiscount = (price, originalPrice) =>
  originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

/* 📚 HOME BOOK SECTION */
function HomeBookSection() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.body.classList.contains('dark-theme') || 
                    document.documentElement.getAttribute('data-bs-theme') === 'dark';
      setIsDarkMode(isDark);
    };

    // Initial check
    checkDarkMode();

    // Observe theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 576);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const q = query(
          collection(db, "products"),
          where("category", "==", "Books"),
          limit(4)
        );

        const snap = await getDocs(q);

        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          price: Number(doc.data().price) || 499,
          originalPrice: Number(doc.data().originalPrice) || 799,
          image: doc.data().image || doc.data().images?.[0] || `https://picsum.photos/seed/book${doc.id}/300/300`
        }));

        setProducts(data);
      } catch (error) {
        console.error("Book fetch error:", error);
        // Dummy data for fallback
        setProducts(Array.from({ length: 4 }, (_, i) => ({
          id: `book-dummy-${i}`,
          name: `Inspirational Book ${i + 1}`,
          brand: "BOOK HOUSE",
          price: 499,
          originalPrice: 799,
          image: `https://picsum.photos/seed/book${i}/300/300`
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const customStyles = getCustomStyles(isDarkMode);

  return (
    <Container 
      fluid 
      className="category-section books" 
      style={{ 
        background: isDarkMode ? DARK_BG_GRADIENT : BOOKS_BG_GRADIENT, 
        padding: "60px 0"
      }}
    >
      <Container style={customStyles.sectionContainer} className="books-section-container">

        {/* HEADER */}
        <div className="text-center mb-5">
          <h3 style={customStyles.header} className="books-section-title theme-text">
            {t("booksRead")} &{" "}
            <span style={{ color: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR }}>
              {t("booksGrow")}
            </span>
            <div style={customStyles.headerUnderline}></div>
          </h3>
          <p className="mt-2" style={customStyles.subtitle}>
            {t("booksSubtitle")}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR }} />
            <p className="mt-3 text-muted theme-text-secondary">{t("booksLoading")}</p>
          </div>
        ) : (
          <>
            <Row xs={2} sm={2} md={3} lg={4} className="g-3 g-md-4">
              {products.map((product) => {
                const discount = calculateDiscount(
                  product.price,
                  product.originalPrice
                );

                return (
                  <Col key={product.id}>
                    <Link
                      to={`/product/${product.id}`}
                      className="text-decoration-none d-block h-100"
                    >
                      <Card 
                        style={customStyles.productCard} 
                        className="books-card theme-card"
                      >
                        {discount > 0 && (
                          <Badge style={customStyles.discountBadge} className="books-discount-badge">
                            {discount}% {t("off")}
                          </Badge>
                        )}

                        <div style={customStyles.imageContainer(isMobile)}>
                          <LazyLoadImage
                            src={product.image}
                            alt={product.name}
                            effect="blur"
                            style={customStyles.productImage}
                          />
                        </div>

                        <Card.Body className="p-3 text-center">
                          <small style={customStyles.brandText} className="books-brand-text">
                            {product.brand || "BOOK HOUSE"}
                          </small>

                          <Card.Title
                            style={customStyles.title}
                            className="text-truncate books-card-title theme-text"
                          >
                            {product.name}
                          </Card.Title>

                          <div>
                            <span style={customStyles.price} className="books-price">
                              ₹{product.price}
                            </span>
                            {product.originalPrice > product.price && (
                              <span className="ms-2 books-original-price theme-text-secondary" style={customStyles.originalPrice}>
                                ₹{product.originalPrice}
                              </span>
                            )}
                          </div>

                          <Button
                            style={customStyles.shopButton}
                            className="w-100 mt-3 books-shop-btn theme-button"
                          >
                            {t("shopNow")}
                          </Button>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                );
              })}
            </Row>

            <div className="text-center mt-5">
              <Link to="/book">
                <Button 
                  style={customStyles.exploreButton} 
                  className="photo-frames-explore-btn theme-button"
                >
                  {t("browseCollections")} →
                </Button>
              </Link>
            </div>
          </>
        )}
      </Container>
    </Container>
  );
}

export default HomeBookSection;