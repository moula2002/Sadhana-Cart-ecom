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
import { useTranslation } from "react-i18next";
import "./HomePhotoFrameSection.css"

// 🎨 UPDATED STYLE CONSTANTS (Lavender Theme with Dark Mode)
const PRIMARY_TEXT_COLOR = "#2D1B4D"; // Deep Plum
const PRIMARY_TEXT_COLOR_DARK = "#f3e8ff"; // Light lavender for dark mode
const ACCENT_COLOR = "#7B61FF";      // Soft Purple/Lavender
const ACCENT_COLOR_DARK = "#a78bfa"; // Brighter purple for dark mode
const SALE_COLOR = "#FF5C8D";        // Soft Rose
const SALE_COLOR_DARK = "#f472b6";   // Brighter pink for dark mode
const WHITE_COLOR = "#FFFFFF";
const LAVENDER_BG_GRADIENT = "linear-gradient(180deg, #F3E5F5 0%, #E8EAF6 100%)";
const DARK_BG_GRADIENT = "linear-gradient(135deg, #121212 0%, #1e1b4b 100%)";

// 🎨 CUSTOM STYLES - Dynamic based on theme
const getCustomStyles = (isDarkMode) => ({
  mainWrapper: {
    background: isDarkMode ? "transparent" : LAVENDER_BG_GRADIENT,
    padding: "60px 0",
    transition: "background 0.3s ease"
  },
  sectionContainer: {
    backgroundColor: isDarkMode ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.5)",
    backdropFilter: "blur(15px)",
    borderRadius: "30px",
    padding: "3.5rem 1.5rem",
    boxShadow: isDarkMode ? 
      "0 20px 60px rgba(123, 97, 255, 0.1)" : 
      "0 20px 60px rgba(123, 97, 255, 0.1)",
    border: isDarkMode ? 
      "1px solid rgba(255, 255, 255, 0.1)" : 
      "1px solid rgba(255, 255, 255, 0.8)",
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
    transition: "all 0.4s ease-in-out",
    backgroundColor: isDarkMode ? "#1a1a1a" : WHITE_COLOR,
    cursor: "pointer",
    height: "100%",
    position: "relative",
  },
  imageContainer: (isMobile) => ({
    width: "100%",
    height: isMobile ? "180px" : "220px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDarkMode ? "#2d1b69" : "#F9F7FF",
    padding: "10px",
  }),
  productImage: {
    maxWidth: "95%",
    maxHeight: "95%",
    objectFit: "contain",
    transition: "transform 0.6s ease",
  },
  discountBadge: {
    position: "absolute",
    top: "12px",
    left: "12px",
    backgroundColor: isDarkMode ? SALE_COLOR_DARK : SALE_COLOR,
    color: WHITE_COLOR,
    padding: "0.4rem 0.7rem",
    borderRadius: "50px",
    fontSize: "0.75rem",
    fontWeight: "800",
    zIndex: 10,
    boxShadow: isDarkMode ? 
      "0 4px 12px rgba(244, 114, 182, 0.3)" : 
      "0 4px 12px rgba(255, 92, 141, 0.3)",
  },
  brandText: {
    fontSize: "0.7rem",
    fontWeight: "700",
    color: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
  },
  title: {
    fontSize: "1.05rem",
    fontWeight: "600",
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
    fontSize: "clamp(2rem, 5vw, 2.8rem)",
    fontWeight: "800",
    color: isDarkMode ? PRIMARY_TEXT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    letterSpacing: "-0.5px",
    animation: "softPulse 4s infinite ease-in-out",
    position: "relative",
  },
  headerUnderline: {
    position: "absolute",
    bottom: "-10px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "120px",
    height: "4px",
    backgroundColor: isDarkMode ? "rgba(167, 139, 250, 0.3)" : "rgba(123, 97, 255, 0.3)",
    borderRadius: "2px",
  },
  viewDealButton: {
    transition: "all 0.3s ease",
    borderRadius: "12px",
    fontSize: "0.9rem",
    fontWeight: "700",
    backgroundColor: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR,
    borderColor: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR,
    padding: "0.6rem",
    color: WHITE_COLOR
  },
  viewDealButtonHover: (isDarkMode) => ({
    backgroundColor: isDarkMode ? "#fff" : PRIMARY_TEXT_COLOR,
    borderColor: isDarkMode ? "#fff" : PRIMARY_TEXT_COLOR,
    color: isDarkMode ? ACCENT_COLOR_DARK : WHITE_COLOR,
    transform: "translateY(-3px) scale(1.02)",
    filter: "brightness(1.1)",
    boxShadow: isDarkMode ? 
      "0 4px 12px rgba(255, 255, 255, 0.2)" : 
      "0 4px 12px rgba(0, 0, 0, 0.2)",
  }),
  exploreButton: {
    backgroundColor: isDarkMode ? ACCENT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    color: WHITE_COLOR,
    border: "none",
    borderRadius: "50px",
    fontSize: "1.1rem",
    padding: "0.8rem 3rem",
    boxShadow: isDarkMode ? 
      "0 10px 25px rgba(167, 139, 250, 0.3)" : 
      "0 10px 25px rgba(45, 27, 77, 0.2)",
    transition: "transform 0.3s ease",
  },
  exploreButtonHover: (isDarkMode) => ({
    backgroundColor: isDarkMode ? "#fff" : ACCENT_COLOR,
    color: isDarkMode ? ACCENT_COLOR_DARK : WHITE_COLOR,
    transform: "translateY(-2px)",
    boxShadow: isDarkMode ? 
      "0 15px 30px rgba(167, 139, 250, 0.4)" : 
      "0 15px 30px rgba(123, 97, 255, 0.3)",
  }),
  photoFrameWatermark: {
    position: "absolute",
    bottom: "-40px",
    right: "-20px",
    fontSize: "10rem",
    fontWeight: "900",
    color: isDarkMode ? "rgba(167, 139, 250, 0.05)" : "rgba(123, 97, 255, 0.05)",
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
    "0 25px 50px rgba(167, 139, 250, 0.15)" : 
    "0 25px 50px rgba(123, 97, 255, 0.15)";
  e.currentTarget.querySelector("img").style.transform = "scale(1.1)";
};

const handleCardMouseLeave = (e, isDarkMode, customStyles) => {
  e.currentTarget.style.transform = "translateY(0)";
  e.currentTarget.style.boxShadow = customStyles.productCard.boxShadow;
  e.currentTarget.querySelector("img").style.transform = "scale(1)";
};

const handleViewDealMouseEnter = (e, isDarkMode, customStyles) =>
  Object.assign(e.currentTarget.style, customStyles.viewDealButtonHover(isDarkMode));

const handleViewDealMouseLeave = (e, customStyles) =>
  Object.assign(e.currentTarget.style, {
    ...customStyles.viewDealButton,
    transform: "scale(1)",
    filter: "brightness(1)",
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

// Injection of Animation Keyframes
const LavenderAnimations = () => (
  <style>{`
    @keyframes softPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.02); opacity: 0.9; }
    }
    .frame-card:hover {
      transform: translateY(-12px);
      box-shadow: 0 25px 50px rgba(123, 97, 255, 0.15) !important;
    }
    .frame-card:hover img {
      transform: scale(1.1);
    }
    .btn-hover-effect:hover {
      transform: translateY(-3px) scale(1.02);
      filter: brightness(1.1);
    }
    .photo-frame-glow-text {
      text-shadow: 0 0 20px rgba(123, 97, 255, 0.3);
    }
  `}</style>
);

const calculateDiscount = (p, op) => (op > p ? Math.round(((op - p) / op) * 100) : 0);

function HomePhotoFrameSection() {
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
    const fetchFrames = async () => {
      try {
        const q = query(collection(db, "products"), where("category", "==", "Home"));
        const snapshot = await getDocs(q);
        let data = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          price: Number(doc.data().price) || 599,
          originalPrice: Number(doc.data().originalPrice) || 999,
          image: doc.data().image || doc.data().images?.[0] || `https://picsum.photos/seed/photoframe${doc.id}/300/300`
        }));
        setProducts(data.sort(() => 0.5 - Math.random()).slice(0, 4));
      } catch (err) {
        setProducts(Array.from({ length: 4 }, (_, i) => ({ 
          id: `photo-frame-dummy-${i}`, 
          name: "Luxury Frame", 
          brand: "MEMORIES", 
          price: 799, 
          originalPrice: 1299,
          image: `https://picsum.photos/seed/photoframe${i}/300/300`
        })));
      } finally {
        setLoading(false);
      }
    };
    
    fetchFrames();
    const handleResize = () => setIsMobile(window.innerWidth <= 576);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const customStyles = getCustomStyles(isDarkMode);

  return (
    <>
      <LavenderAnimations />
      <Container 
        fluid 
        className="category-section photo-frames" 
        style={{ 
          background: isDarkMode ? DARK_BG_GRADIENT : LAVENDER_BG_GRADIENT, 
          padding: "60px 0",
          transition: "background 0.3s ease"
        }}
      >
        <Container style={customStyles.sectionContainer} className="photo-frames-section-container">

          {/* Elegant Header */}
          <div className="text-center mb-5">
            <h3 style={customStyles.header} className="photo-frames-section-title theme-text photo-frame-glow-text">
  {t("photoPreserve")}{" "}
  <span style={{ color: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR }}>
    {t("photoMemories")}
  </span>
  <div style={customStyles.headerUnderline}></div>
</h3>

            <p className="mt-2" style={customStyles.subtitle}>
              {t("photoSubtitle")}

            </p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR }} />
              <p className="mt-3 text-muted theme-text-secondary">{t("photoLoading")}</p>
            </div>
          ) : (
            <>
              <Row xs={2} sm={2} md={3} lg={4} className="g-3 g-md-4">
                {products.map((product) => {
                  const discount = calculateDiscount(product.price, product.originalPrice);
                  return (
                    <Col key={product.id}>
                      <Link to={`/product/${product.id}`} className="text-decoration-none d-block h-100">
                        <Card 
                          className="photo-frames-card theme-card frame-card" 
                          style={customStyles.productCard}
                          onMouseEnter={(e) => handleCardMouseEnter(e, isDarkMode)}
                          onMouseLeave={(e) => handleCardMouseLeave(e, isDarkMode, customStyles)}
                        >
                          {discount > 0 && (
                            <Badge style={customStyles.discountBadge} className="photo-frames-discount-badge">
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
                          <Card.Body className="p-3 d-flex flex-column text-center">
                            <small style={customStyles.brandText} className="photo-frames-brand-text">
                              {product.brand}
                            </small>
                            <Card.Title 
                              style={customStyles.title} 
                              className="text-truncate photo-frames-card-title theme-text"
                            >
                              {product.name}
                            </Card.Title>
                            <div className="mt-auto">
                              <div className="mb-2">
                                <span style={customStyles.price} className="photo-frames-price">
                                  ₹{product.price}
                                </span>
                                {product.originalPrice > product.price && (
                                  <small className="ms-2 photo-frames-original-price theme-text-secondary" style={customStyles.originalPrice}>
                                    ₹{product.originalPrice}
                                  </small>
                                )}
                              </div>
                              <Button 
                                style={customStyles.viewDealButton} 
                                className="w-100 photo-frames-view-deal-btn theme-button btn-hover-effect"
                                onMouseEnter={(e) => handleViewDealMouseEnter(e, isDarkMode, customStyles)}
                                onMouseLeave={(e) => handleViewDealMouseLeave(e, customStyles)}
                              >
                                {t("shopNow")}
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Link>
                    </Col>
                  );
                })}
              </Row>

              <div className="text-center mt-5">
                <Link to="/photoframe">
                  <Button 
                    style={customStyles.exploreButton} 
                    className="photo-frames-explore-btn theme-button btn-hover-effect"
                    onMouseEnter={(e) => handleExploreMouseEnter(e, isDarkMode, customStyles)}
                    onMouseLeave={(e) => handleExploreMouseLeave(e, customStyles)}
                  >
                    {t("browseCollections")} →
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

export default HomePhotoFrameSection;