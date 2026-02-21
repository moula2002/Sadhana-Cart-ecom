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
import { collection, query, where, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import "./HomeAccessoriesSection.css"
import { useTranslation } from "react-i18next";


// 🎨 UPDATED STYLE CONSTANTS (Nature/Green Theme with Dark Mode)
const PRIMARY_TEXT_COLOR = "#1B3022";
const PRIMARY_TEXT_COLOR_DARK = "#e9ecef";
const ACCENT_COLOR = "#2D6A4F"; // Forest Green
const ACCENT_COLOR_DARK = "#40916c"; // Brighter green for dark mode
const SOFT_GREEN = "#D8F3DC"; // Mint Green
const SOFT_GREEN_DARK = "#2d6a4f"; // Darker green for dark mode
const SALE_COLOR = "#081C15"; // Dark Green for contrast
const SALE_COLOR_DARK = "#1b4332"; // Brighter for dark mode
const WHITE_COLOR = "#FFFFFF";
const PRODUCT_BG_COLOR_DARK = "#1a1a1a"; // Dark mode card background
const GREEN_BG_GRADIENT = "radial-gradient(circle, #f0fff4 0%, #dcfce7 100%)";
const DARK_BG_GRADIENT = "linear-gradient(135deg, #121212 0%, #0d1f13 100%)";

// 🎨 CUSTOM STYLES - Dynamic based on theme
const getCustomStyles = (isDarkMode) => ({
  sectionContainer: {
    backgroundColor: isDarkMode ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    borderRadius: "30px",
    padding: "4rem 1.5rem",
    boxShadow: isDarkMode ? 
      "0 20px 60px rgba(45, 106, 79, 0.1)" : 
      "0 20px 60px rgba(45, 106, 79, 0.1)",
    border: isDarkMode ? 
      "1px solid rgba(255, 255, 255, 0.1)" : 
      "1px solid rgba(255, 255, 255, 0.5)",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s ease"
  },
  productCard: {
    border: isDarkMode ? "1px solid #2d2d2d" : "none",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: isDarkMode ? 
      "0 10px 30px rgba(0, 0, 0, 0.2)" : 
      "0 10px 30px rgba(0, 0, 0, 0.05)",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    backgroundColor: isDarkMode ? PRODUCT_BG_COLOR_DARK : WHITE_COLOR,
    cursor: "pointer",
    height: "100%",
    position: "relative",
  },
  imageContainer: (isMobile) => ({
    width: "100%",
    height: isMobile ? "180px" : "240px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDarkMode ? SOFT_GREEN_DARK : SOFT_GREEN,
    padding: "15px",
  }),
  productImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    transition: "transform 0.5s ease",
  },
  discountBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    backgroundColor: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR,
    color: WHITE_COLOR,
    padding: "0.4rem 0.8rem",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "800",
    zIndex: 10,
    boxShadow: isDarkMode ? 
      "0 4px 10px rgba(64, 145, 108, 0.3)" : 
      "0 4px 10px rgba(45, 106, 79, 0.3)",
  },
  brandText: {
    fontSize: "0.7rem",
    fontWeight: "700",
    color: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR,
    marginBottom: "4px",
    letterSpacing: "1px",
  },
  title: {
    fontSize: "1.05rem",
    fontWeight: "700",
    color: isDarkMode ? PRIMARY_TEXT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    marginBottom: "8px",
    lineHeight: "1.2",
  },
  price: {
    fontSize: "1.3rem",
    fontWeight: "900",
    color: isDarkMode ? ACCENT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    letterSpacing: "-0.5px",
  },
  originalPrice: { 
    fontSize: "0.85rem", 
    color: isDarkMode ? "#95a5a6" : "#95a5a6", 
    marginLeft: "8px",
    textDecoration: "line-through" 
  },
  header: {
    fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
    fontWeight: "900",
    color: isDarkMode ? PRIMARY_TEXT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    letterSpacing: "-1.5px",
    display: "inline-block",
    position: "relative",
    animation: "floatTitle 4s ease-in-out infinite",
  },
  headerUnderline: {
    position: "absolute",
    bottom: "-10px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "100px",
    height: "5px",
    backgroundColor: isDarkMode ? "rgba(64, 145, 108, 0.3)" : "rgba(45, 106, 79, 0.3)",
    borderRadius: "2px",
  },
  viewDealButton: {
    transition: "all 0.3s ease",
    borderRadius: "10px",
    fontSize: "0.85rem",
    fontWeight: "700",
    backgroundColor: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR,
    borderColor: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR,
    padding: "0.6rem",
    marginTop: "10px",
    color: WHITE_COLOR
  },
  viewDealButtonHover: (isDarkMode) => ({
    backgroundColor: isDarkMode ? "#fff" : SALE_COLOR,
    borderColor: isDarkMode ? "#fff" : SALE_COLOR,
    color: isDarkMode ? ACCENT_COLOR_DARK : WHITE_COLOR,
    transform: "scale(1.02)",
    boxShadow: isDarkMode ? 
      "0 4px 12px rgba(255, 255, 255, 0.2)" : 
      "0 4px 12px rgba(0, 0, 0, 0.2)",
  }),
  exploreButton: {
    backgroundColor: isDarkMode ? ACCENT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    color: WHITE_COLOR,
    borderColor: isDarkMode ? ACCENT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    transition: "all 0.3s ease-in-out",
    borderRadius: "50px",
    fontSize: "1rem",
    padding: "0.8rem 3rem",
    boxShadow: isDarkMode ? 
      "0 10px 25px rgba(64, 145, 108, 0.3)" : 
      "0 10px 25px rgba(27, 48, 34, 0.2)",
  },
  exploreButtonHover: (isDarkMode) => ({
    backgroundColor: isDarkMode ? "#fff" : ACCENT_COLOR,
    borderColor: isDarkMode ? "#fff" : ACCENT_COLOR,
    color: isDarkMode ? ACCENT_COLOR_DARK : WHITE_COLOR,
    transform: "translateY(-3px)",
    boxShadow: isDarkMode ? 
      "0 15px 30px rgba(64, 145, 108, 0.4)" : 
      "0 15px 30px rgba(45, 106, 79, 0.3)",
  }),
  greenWatermark: {
    position: "absolute",
    bottom: "-40px",
    right: "-20px",
    fontSize: "10rem",
    fontWeight: "900",
    color: isDarkMode ? "rgba(64, 145, 108, 0.05)" : "rgba(45, 106, 79, 0.05)",
    userSelect: "none",
    pointerEvents: "none",
    opacity: 0.5
  },
  subtitle: {
    color: isDarkMode ? "#adb5bd" : "#6c757d"
  }
});

// ✨ Hover Handlers
const handleCardMouseEnter = (e, isDarkMode) => {
  e.currentTarget.style.transform = "translateY(-12px)";
  e.currentTarget.style.boxShadow = isDarkMode ? 
    "0 30px 50px rgba(64, 145, 108, 0.15)" : 
    "0 30px 50px rgba(45, 106, 79, 0.15)";
  e.currentTarget.querySelector("img").style.transform = "scale(1.1) rotate(2deg)";
};

const handleCardMouseLeave = (e, isDarkMode, customStyles) => {
  e.currentTarget.style.transform = "translateY(0)";
  e.currentTarget.style.boxShadow = customStyles.productCard.boxShadow;
  e.currentTarget.querySelector("img").style.transform = "scale(1) rotate(0)";
};

const handleViewDealMouseEnter = (e, isDarkMode, customStyles) =>
  Object.assign(e.currentTarget.style, customStyles.viewDealButtonHover(isDarkMode));

const handleViewDealMouseLeave = (e, customStyles) =>
  Object.assign(e.currentTarget.style, {
    ...customStyles.viewDealButton,
    transform: "scale(1)",
    boxShadow: "none",
  });

const handleExploreMouseEnter = (e, isDarkMode, customStyles) =>
  Object.assign(e.currentTarget.style, customStyles.exploreButtonHover(isDarkMode));

const handleExploreMouseLeave = (e, customStyles) =>
  Object.assign(e.currentTarget.style, {
    ...customStyles.exploreButton,
    transform: "none",
    boxShadow: customStyles.exploreButton.boxShadow,
  });

// 🧠 Helpers
const getProductImageSource = (product) => {
  if (typeof product.image === "string" && product.image.trim() !== "")
    return product.image;
  if (Array.isArray(product.images) && product.images.length > 0)
    return product.images[0];
  return "https://placehold.co/300x380/d8f3dc/1b3022?text=NO+IMAGE";
};

const calculateDiscount = (price, originalPrice) => {
  if (originalPrice > price)
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  return 0;
};

const generateDummyProduct = (index) => ({
  id: `acc-dummy-${index}`,
  name: `Essential Accessory ${index + 1}`,
  brand: "NATURA LUXE",
  price: 899,
  originalPrice: 1599,
  image: `https://picsum.photos/seed/green${index}/300/300`,
});

// CSS Injection for Animations
const AnimationStyles = () => (
  <style>{`
    @keyframes floatTitle {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .product-card:hover img {
      transform: scale(1.1) rotate(2deg);
    }
    .hover-lift {
      transition: transform 0.3s ease !important;
    }
    .hover-lift:hover {
      transform: translateY(-5px);
    }
  `}</style>
);

function HomeAccessoriesSection() {
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
    const fetchAccessories = async () => {
      setLoading(true);
      try {
        const cached = localStorage.getItem("accessoriesProducts");
        if (cached) {
          setProducts(JSON.parse(cached));
          setLoading(false);
          return;
        }

        const productsRef = collection(db, "products");
        const q = query(productsRef, where("category", "==", "Accessories"));
        const snapshot = await getDocs(q);

        let data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          price: Number(doc.data().price) || 499,
          originalPrice: Number(doc.data().originalPrice) || 999,
        }));

        while (data.length < 4) data.push(generateDummyProduct(data.length));

        data = data.sort(() => 0.5 - Math.random()).slice(0, 4);
        setProducts(data);
        localStorage.setItem("accessoriesProducts", JSON.stringify(data));
      } catch (err) {
        setProducts(Array.from({ length: 4 }, (_, i) => generateDummyProduct(i)));
      } finally {
        setLoading(false);
      }
    };
    fetchAccessories();
  }, []);

  const customStyles = getCustomStyles(isDarkMode);

  return (
    <>
      <AnimationStyles />
      <Container 
        fluid 
        className="category-section accessories" 
        style={{ 
          background: isDarkMode ? DARK_BG_GRADIENT : GREEN_BG_GRADIENT, 
          padding: "60px 0",
          transition: "background 0.3s ease"
        }}
      >
        <Container style={customStyles.sectionContainer} className="accessories-section-container">

          {/* Header */}
          <div className="text-center mb-5">
            <h3 style={customStyles.header} className="accessories-section-title theme-text">
  {t("accessoriesTitle")}{" "}
  <span style={{ color: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR }}>
    {t("accessoriesCollection")}
  </span>
  <div style={customStyles.headerUnderline}></div>
</h3>

            <p className="mt-2 fw-light" style={customStyles.subtitle}>
  {t("accessoriesSubtitle")}
</p>

          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="grow" variant="success" style={{ color: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR }} />
              <p className="mt-3 text-muted theme-text-secondary">
  {t("accessoriesLoading")}
</p>

            </div>
          ) : (
            <>
              <Row xs={2} sm={2} md={3} lg={4} className="g-3 g-md-4 justify-content-center">
                {products.map((product) => {
                  const discount = calculateDiscount(product.price, product.originalPrice);
                  return (
                    <Col key={product.id}>
                      <Link to={`/product/${product.id}`} className="text-decoration-none d-block h-100">
                        <Card
                          style={customStyles.productCard}
                          className="accessories-card theme-card"
                          onMouseEnter={(e) => handleCardMouseEnter(e, isDarkMode)}
                          onMouseLeave={(e) => handleCardMouseLeave(e, isDarkMode, customStyles)}
                        >
                          {discount > 0 && (
                            <Badge style={customStyles.discountBadge} className="accessories-discount-badge">
                              -{discount}%
                            </Badge>
                          )}
                          <div style={customStyles.imageContainer(isMobile)}>
                            <LazyLoadImage
                              src={getProductImageSource(product)}
                              alt={product.name}
                              effect="blur"
                              style={customStyles.productImage}
                            />
                          </div>
                          <Card.Body className="text-start p-3 d-flex flex-column">
                            <p style={customStyles.brandText} className="accessories-brand-text">
                              {product.brand}
                            </p>
                            <Card.Title 
                              style={customStyles.title} 
                              className="text-truncate accessories-card-title theme-text"
                            >
                              {product.name}
                            </Card.Title>
                            <div className="d-flex align-items-center mt-auto">
                              <span style={customStyles.price} className="accessories-price">
                                ₹{product.price}
                              </span>
                              {product.originalPrice > product.price && (
                                <span style={customStyles.originalPrice} className="accessories-original-price theme-text-secondary">
                                  ₹{product.originalPrice}
                                </span>
                              )}
                            </div>
                            <Button
                              variant="primary"
                              style={customStyles.viewDealButton}
                              className="accessories-view-deal-btn theme-button"
                              onMouseEnter={(e) => handleViewDealMouseEnter(e, isDarkMode, customStyles)}
                              onMouseLeave={(e) => handleViewDealMouseLeave(e, customStyles)}
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
                <Link to="/accessories">
                  <Button
                    style={customStyles.exploreButton}
                    className="accessories-explore-btn theme-button hover-lift"
                    onMouseEnter={(e) => handleExploreMouseEnter(e, isDarkMode, customStyles)}
                    onMouseLeave={(e) => handleExploreMouseLeave(e, customStyles)}
                  >
                    {t("exploreAccessories")} →
                  </Button>
                </Link>
              </div>
            </>
          )}
        </Container>
      </Container>
    </>
  );
}

export default HomeAccessoriesSection;