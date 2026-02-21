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
import "./HomeFootWearsSection.css"


// 🎨 UPDATED STYLE CONSTANTS (Warm Earthy Theme with Dark Mode)
const PRIMARY_TEXT_COLOR = "#3E2723"; // Deep Coffee Brown
const PRIMARY_TEXT_COLOR_DARK = "#fef3c7"; // Light yellow for dark mode   // Warm Taupe
const ACCENT_COLOR_DARK = "#d6bca9"; // Brighter taupe for dark mode
const EARTH_BROWN = "#8D6E63";       // Medium Terra
const EARTH_BROWN_DARK = "#a78b7f";  // Brighter brown for dark mode     // Old Lace / Light Brown
const DARK_SAND = "#2c241c";         // Dark brown for dark mode
const WHITE_COLOR = "#FFFFFF";
const SALE_COLOR = "#D84315";        // Burnt Orange
const SALE_COLOR_DARK = "#f97316";   // Brighter orange for dark mode
const FOOTWEAR_BG_GRADIENT = "linear-gradient(135deg, #F5F5DC 0%, #FAF9F6 100%)";
const DARK_BG_GRADIENT = "linear-gradient(135deg, #121212 0%, #1c1814 100%)";

const getCustomStyles = (isDarkMode) => ({
  mainWrapper: {
    background: isDarkMode ? "transparent" : FOOTWEAR_BG_GRADIENT,
    padding: "60px 0",
    transition: "background 0.3s ease"
  },
  sectionContainer: {
    backgroundColor: isDarkMode ? "rgba(30, 30, 30, 0.9)" : WHITE_COLOR,
    borderRadius: "30px",
    padding: "3.5rem 1.5rem",
    boxShadow: isDarkMode ?
      "0 20px 40px rgba(62, 39, 35, 0.08)" :
      "0 20px 40px rgba(62, 39, 35, 0.08)",
    border: isDarkMode ?
      "1px solid rgba(255, 255, 255, 0.1)" :
      "1px solid #EFEBE9",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s ease"
  },
  productCard: {
    border: isDarkMode ? "1px solid #2d2d2d" : "none",
    borderRadius: "20px",
    overflow: "hidden",
    backgroundColor: isDarkMode ? "#1a1a1a" : WHITE_COLOR,
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    cursor: "pointer",
    height: "100%",
    position: "relative",
    boxShadow: isDarkMode ?
      "0 5px 15px rgba(0,0,0,0.2)" :
      "0 5px 15px rgba(0,0,0,0.05)",
  },
  imageContainer: (isMobile) => ({
    width: "100%",
    height: isMobile ? "180px" : "240px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDarkMode ? DARK_SAND : "#FAF9F6",
  }),
  productImage: {
    maxWidth: "85%",
    maxHeight: "85%",
    objectFit: "contain",
    transition: "transform 0.5s ease",
  },
  discountBadge: {
    position: "absolute",
    top: "15px",
    left: "15px",
    backgroundColor: isDarkMode ? SALE_COLOR_DARK : SALE_COLOR,
    color: WHITE_COLOR,
    padding: "0.4rem 0.8rem",
    borderRadius: "8px",
    fontSize: "0.75rem",
    fontWeight: "800",
    zIndex: 10,
    boxShadow: isDarkMode ?
      "0 4px 8px rgba(249, 115, 22, 0.3)" :
      "0 4px 8px rgba(216, 67, 21, 0.3)",
  },
  brandText: {
    fontSize: "0.7rem",
    fontWeight: "700",
    color: isDarkMode ? EARTH_BROWN_DARK : EARTH_BROWN,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
  },
  title: {
    fontSize: "1.1rem",
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
    letterSpacing: "-0.5px",
    position: "relative",
  },
  headerUnderline: {
    position: "absolute",
    bottom: "-10px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "120px",
    height: "4px",
    backgroundColor: isDarkMode ? "rgba(214, 188, 169, 0.3)" : "rgba(141, 110, 99, 0.3)",
    borderRadius: "2px",
  },
  viewDealButton: {
    borderRadius: "12px",
    fontSize: "0.9rem",
    fontWeight: "700",
    backgroundColor: isDarkMode ? EARTH_BROWN_DARK : PRIMARY_TEXT_COLOR,
    border: "none",
    padding: "0.7rem",
    transition: "all 0.3s ease",
    color: WHITE_COLOR
  },
  viewDealButtonHover: (isDarkMode) => ({
    backgroundColor: isDarkMode ? "#fff" : EARTH_BROWN,
    color: isDarkMode ? EARTH_BROWN_DARK : WHITE_COLOR,
    transform: "scale(1.05)",
    boxShadow: isDarkMode ?
      "0 4px 12px rgba(255, 255, 255, 0.2)" :
      "0 4px 12px rgba(141, 110, 99, 0.3)",
  }),
  exploreButton: {
    backgroundColor: "transparent",
    color: isDarkMode ? ACCENT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    border: isDarkMode ? `2px solid ${ACCENT_COLOR_DARK}` : `2px solid ${PRIMARY_TEXT_COLOR}`,
    borderRadius: "50px",
    fontSize: "1.1rem",
    padding: "0.8rem 3rem",
    fontWeight: "700",
    transition: "all 0.3s ease",
  },
  exploreButtonHover: (isDarkMode) => ({
    backgroundColor: isDarkMode ? ACCENT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    color: isDarkMode ? "#121212" : WHITE_COLOR,
    transform: "translateY(-2px)",
    boxShadow: isDarkMode ?
      "0 10px 20px rgba(214, 188, 169, 0.3)" :
      "0 10px 20px rgba(62, 39, 35, 0.2)",
  }),
  footwearWatermark: {
    position: "absolute",
    bottom: "-40px",
    right: "-20px",
    fontSize: "10rem",
    fontWeight: "900",
    color: isDarkMode ? "rgba(214, 188, 169, 0.05)" : "rgba(141, 110, 99, 0.05)",
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
  e.currentTarget.style.transform = "translateY(-10px)";
  e.currentTarget.style.boxShadow = isDarkMode ?
    "0 25px 50px rgba(214, 188, 169, 0.15)" :
    "0 25px 50px rgba(62, 39, 35, 0.15)";
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
    boxShadow: "none",
  });

// 🌟 CSS ANIMATIONS
const BrownAnimations = () => (
  <style>{`
    @keyframes slideUpFade {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes walkAnimation {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(5px); }
    }
    .animate-in {
      animation: slideUpFade 0.8s ease-out forwards;
    }
    .footwear-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 25px 50px rgba(62, 39, 35, 0.15) !important;
    }
    .footwear-card:hover img {
      transform: scale(1.1) rotate(2deg);
    }
    .footwear-glow-text {
      animation: walkAnimation 3s ease-in-out infinite;
    }
  `}</style>
);

const calculateDiscount = (p, op) => (op > p ? Math.round(((op - p) / op) * 100) : 0);

function HomeFootWearsSection() {
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
    const fetchFootwears = async () => {
      try {
        const q = query(collection(db, "products"), where("category", "==", "Footwears"));
        const snapshot = await getDocs(q);
        let data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          price: Number(doc.data().price) || 1299,
          originalPrice: Number(doc.data().originalPrice) || 1999,
          image: doc.data().image || doc.data().images?.[0] || `https://picsum.photos/seed/footwear${doc.id}/300/300`
        }));
        setProducts(data.sort(() => 0.5 - Math.random()).slice(0, 4));
      } catch (err) {
        setProducts(Array.from({ length: 4 }, (_, i) => ({
          id: `footwear-dummy-${i}`,
          name: "Classic Loafer",
          brand: "OAK & LEATHER",
          price: 1899,
          originalPrice: 2999,
          image: `https://picsum.photos/seed/footwear${i}/300/300`
        })));
      } finally {
        setLoading(false);
      }
    };
    fetchFootwears();
  }, []);

  const customStyles = getCustomStyles(isDarkMode);

  return (
    <>
      <BrownAnimations />
      <Container
        fluid
        className="category-section footwear"
        style={{
          background: isDarkMode ? DARK_BG_GRADIENT : FOOTWEAR_BG_GRADIENT,
          padding: "60px 0",
          transition: "background 0.3s ease"
        }}
      >
        <Container className="animate-in" style={customStyles.sectionContainer} className="footwear-section-container">

          {/* Header */}
          <div className="text-center mb-5">
            <h3 style={customStyles.header} className="footwear-section-title theme-text footwear-glow-text">
              {t("footwearWalk")}{" "}
              <span style={{ color: isDarkMode ? EARTH_BROWN_DARK : EARTH_BROWN }}>
                {t("footwearConfidence")}
              </span>
              <div style={customStyles.headerUnderline}></div>
            </h3>

            <p className="mt-2" style={customStyles.subtitle}>
              {t("footwearSubtitle")}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: isDarkMode ? EARTH_BROWN_DARK : PRIMARY_TEXT_COLOR }} />
              <p className="mt-3 text-muted theme-text-secondary">{t("footwearLoading")}</p>
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
                          className="footwear-card theme-card"
                          style={customStyles.productCard}
                          onMouseEnter={(e) => handleCardMouseEnter(e, isDarkMode)}
                          onMouseLeave={(e) => handleCardMouseLeave(e, isDarkMode, customStyles)}
                        >
                          {discount > 0 && (
                            <Badge style={customStyles.discountBadge} className="footwear-discount-badge">
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
                            <small style={customStyles.brandText} className="footwear-brand-text">
                              {product.brand || "HANDCRAFTED"}
                            </small>
                            <Card.Title
                              style={customStyles.title}
                              className="text-truncate footwear-card-title theme-text"
                            >
                              {product.name}
                            </Card.Title>
                            <div className="mt-auto">
                              <div className="mb-3">
                                <span style={customStyles.price} className="footwear-price">
                                  ₹{product.price}
                                </span>
                                {product.originalPrice > product.price && (
                                  <small className="ms-2 footwear-original-price theme-text-secondary" style={customStyles.originalPrice}>
                                    ₹{product.originalPrice}
                                  </small>
                                )}
                              </div>
                              <Button
                                style={customStyles.viewDealButton}
                                className="w-100 footwear-view-deal-btn theme-button hover-btn-brown"
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
                <Link to="/footwears">
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

export default HomeFootWearsSection;