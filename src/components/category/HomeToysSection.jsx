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
import "./HomeToysSection.css"

// 🎨 UPDATED STYLE CONSTANTS (Playful Blue Theme with Dark Mode)
const PRIMARY_TEXT_COLOR = "#0D3B66"; // Deep Navy Blue
const PRIMARY_TEXT_COLOR_DARK = "#e3f2fd"; // Light blue for dark mode
const ACCENT_COLOR = "#0077B6";      // Bright Sky Blue
const ACCENT_COLOR_DARK = "#4da8da"; // Brighter blue for dark mode
const SALE_COLOR = "#FF4D6D";        // Playful Pink/Red for Sale
const SALE_COLOR_DARK = "#ff8fa3";   // Softer pink for dark mode
const WHITE_COLOR = "#FFFFFF";
const LIGHT_BLUE_BG = "#E0F2F1";
const DARK_BLUE_BG = "#0d1b2a"; // Dark navy for dark mode
const TOYS_BG_GRADIENT = "linear-gradient(180deg, #F0F9FF 0%, #B9E6FF 100%)";
const DARK_BG_GRADIENT = "linear-gradient(135deg, #121212 0%, #0d1b2a 100%)";

// 🎨 CUSTOM STYLES - Dynamic based on theme
const getCustomStyles = (isDarkMode) => ({
  mainWrapper: {
    background: isDarkMode ? "transparent" : TOYS_BG_GRADIENT,
    padding: "60px 0",
    transition: "background 0.3s ease"
  },
  sectionContainer: {
    backgroundColor: isDarkMode ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(12px)",
    borderRadius: "35px",
    padding: "3.5rem 1.5rem",
    boxShadow: isDarkMode ? 
      "0 20px 50px rgba(77, 168, 218, 0.1)" : 
      "0 20px 50px rgba(0, 119, 182, 0.1)",
    border: isDarkMode ? 
      "2px solid rgba(255, 255, 255, 0.1)" : 
      "2px solid #FFFFFF",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s ease"
  },
  productCard: {
    border: isDarkMode ? "1px solid #2d2d2d" : "none",
    borderRadius: "25px",
    overflow: "hidden",
    boxShadow: isDarkMode ? 
      "0 10px 25px rgba(0, 0, 0, 0.2)" : 
      "0 10px 25px rgba(0, 0, 0, 0.05)",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
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
    backgroundColor: isDarkMode ? DARK_BLUE_BG : "#F0F8FF",
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
    left: "12px",
    backgroundColor: isDarkMode ? SALE_COLOR_DARK : SALE_COLOR,
    color: WHITE_COLOR,
    padding: "0.5rem 0.8rem",
    borderRadius: "15px",
    fontSize: "0.8rem",
    fontWeight: "800",
    zIndex: 10,
    boxShadow: isDarkMode ? 
      "0 4px 10px rgba(255, 143, 163, 0.3)" : 
      "0 4px 10px rgba(255, 77, 109, 0.3)",
    transform: "rotate(-5deg)",
  },
  brandText: {
    fontSize: "0.7rem",
    fontWeight: "800",
    color: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR,
    marginBottom: "4px",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  title: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: isDarkMode ? PRIMARY_TEXT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    marginBottom: "8px",
  },
  price: {
    fontSize: "1.5rem",
    fontWeight: "900",
    color: isDarkMode ? ACCENT_COLOR_DARK : PRIMARY_TEXT_COLOR,
  },
  originalPrice: {
    fontSize: "0.85rem",
    color: isDarkMode ? "#adb5bd" : "#6c757d",
    marginLeft: "8px",
    textDecoration: "line-through"
  },
  header: {
    fontSize: "clamp(2rem, 5vw, 3rem)",
    fontWeight: "900",
    color: isDarkMode ? PRIMARY_TEXT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    letterSpacing: "-1px",
    animation: "floatHeader 3s ease-in-out infinite",
    position: "relative",
  },
  headerUnderline: {
    position: "absolute",
    bottom: "-10px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "120px",
    height: "5px",
    backgroundColor: isDarkMode ? "rgba(77, 168, 218, 0.3)" : "rgba(0, 119, 182, 0.3)",
    borderRadius: "2px",
  },
  viewDealButton: {
    transition: "all 0.3s ease",
    borderRadius: "14px",
    fontSize: "0.9rem",
    fontWeight: "700",
    backgroundColor: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR,
    borderColor: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR,
    padding: "0.7rem",
    marginTop: "10px",
    color: WHITE_COLOR
  },
  viewDealButtonHover: (isDarkMode) => ({
    backgroundColor: isDarkMode ? "#fff" : PRIMARY_TEXT_COLOR,
    borderColor: isDarkMode ? "#fff" : PRIMARY_TEXT_COLOR,
    color: isDarkMode ? ACCENT_COLOR_DARK : WHITE_COLOR,
    transform: "scale(1.05)",
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
    padding: "0.8rem 3.5rem",
    boxShadow: isDarkMode ? 
      "0 10px 20px rgba(77, 168, 218, 0.3)" : 
      "0 10px 20px rgba(13, 59, 102, 0.2)",
    transition: "all 0.3s ease",
  },
  exploreButtonHover: (isDarkMode) => ({
    backgroundColor: isDarkMode ? "#fff" : ACCENT_COLOR,
    borderColor: isDarkMode ? "#fff" : ACCENT_COLOR,
    color: isDarkMode ? ACCENT_COLOR_DARK : WHITE_COLOR,
    transform: "translateY(-2px)",
    boxShadow: isDarkMode ? 
      "0 15px 30px rgba(77, 168, 218, 0.4)" : 
      "0 15px 30px rgba(0, 119, 182, 0.3)",
  }),
  toysWatermark: {
    position: "absolute",
    bottom: "-40px",
    right: "-20px",
    fontSize: "10rem",
    fontWeight: "900",
    color: isDarkMode ? "rgba(77, 168, 218, 0.05)" : "rgba(0, 119, 182, 0.05)",
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
  e.currentTarget.style.transform = "translateY(-15px) rotate(1deg)";
  e.currentTarget.style.boxShadow = isDarkMode ? 
    "0 30px 60px rgba(77, 168, 218, 0.2)" : 
    "0 30px 60px rgba(0, 119, 182, 0.2)";
  e.currentTarget.querySelector("img").style.transform = "scale(1.15) rotate(-2deg)";
};

const handleCardMouseLeave = (e, isDarkMode, customStyles) => {
  e.currentTarget.style.transform = "translateY(0) rotate(0)";
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

// Injecting Keyframe Animations
const AnimationGlobalStyles = () => (
  <style>{`
    @keyframes floatHeader {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    .toy-card:hover {
      transform: translateY(-15px) rotate(1deg) !important;
      box-shadow: 0 30px 60px rgba(0, 119, 182, 0.2) !important;
    }
    .toy-card:hover img {
      transform: scale(1.15) rotate(-2deg);
    }
    .btn-bounce:hover {
      transform: scale(1.05);
    }
    .toys-glow-text {
      text-shadow: 0 0 20px rgba(0, 119, 182, 0.3);
    }
  `}</style>
);

const calculateDiscount = (p, op) => (op > p ? Math.round(((op - p) / op) * 100) : 0);

const generateDummyProduct = (index) => ({
  id: `toy-blue-${index}`,
  name: `Adventure Set ${index + 1}`,
  brand: "SKY PLAY",
  price: 1299,
  originalPrice: 1999,
  image: `https://picsum.photos/seed/toyblue${index}/300/300`,
});

function HomeToysSection() {
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
    
    const fetchToys = async () => {
      try {
        const q = query(collection(db, "products"), where("category", "==", "Toys"));
        const snapshot = await getDocs(q);
        let data = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          price: Number(doc.data().price) || 1299,
          originalPrice: Number(doc.data().originalPrice) || 1999,
        }));
        while (data.length < 4) data.push(generateDummyProduct(data.length));
        setProducts(data.slice(0, 4));
      } catch (err) {
        setProducts(Array.from({ length: 4 }, (_, i) => generateDummyProduct(i)));
      } finally {
        setLoading(false);
      }
    };
    
    fetchToys();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const customStyles = getCustomStyles(isDarkMode);

  return (
    <>
      <AnimationGlobalStyles />
      <Container 
        fluid 
        className="category-section toys" 
        style={{ 
          background: isDarkMode ? DARK_BG_GRADIENT : TOYS_BG_GRADIENT, 
          padding: "60px 0",
          transition: "background 0.3s ease"
        }}
      >
        <Container style={customStyles.sectionContainer} className="toys-section-container">

          {/* Playful Header */}
          <div className="text-center mb-5">
            <h3 style={customStyles.header} className="toys-section-title theme-text toys-glow-text">
              TOYS & <span style={{ color: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR }}>GAMES</span>
              <div style={customStyles.headerUnderline}></div>
            </h3>
            <p className="mt-2" style={customStyles.subtitle}>
              Unlock a world of imagination and endless fun!
            </p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR }} />
              <p className="mt-3 text-muted theme-text-secondary">Loading fun toys...</p>
            </div>
          ) : (
            <>
              <Row xs={2} sm={2} md={3} lg={4} className="g-3 g-md-4">
                {products.map((product) => {
                  const discount = calculateDiscount(product.price, product.originalPrice);
                  return (
                    <Col key={product.id}>
                      <Link to={`/product/${product.id}`} className="text-decoration-none h-100 d-block">
                        <Card 
                          style={customStyles.productCard} 
                          className="toys-card theme-card toy-card"
                          onMouseEnter={(e) => handleCardMouseEnter(e, isDarkMode)}
                          onMouseLeave={(e) => handleCardMouseLeave(e, isDarkMode, customStyles)}
                        >
                          {discount > 0 && (
                            <Badge style={customStyles.discountBadge} className="toys-discount-badge">
                              -{discount}%
                            </Badge>
                          )}
                          <div style={customStyles.imageContainer(isMobile)}>
                            <LazyLoadImage
                              src={product.image || product.images?.[0] || `https://picsum.photos/seed/toyblue${product.id}/300/300`}
                              alt={product.name}
                              effect="blur"
                              style={customStyles.productImage}
                            />
                          </div>
                          <Card.Body className="p-3">
                            <p style={customStyles.brandText} className="toys-brand-text">
                              {product.brand || "KIDS ZONE"}
                            </p>
                            <Card.Title 
                              style={customStyles.title} 
                              className="text-truncate toys-card-title theme-text"
                            >
                              {product.name}
                            </Card.Title>
                            <div className="d-flex align-items-center mb-2">
                              <span style={customStyles.price} className="toys-price">
                                ₹{product.price}
                              </span>
                              {product.originalPrice > product.price && (
                                <small className="ms-2 toys-original-price theme-text-secondary" style={customStyles.originalPrice}>
                                  ₹{product.originalPrice}
                                </small>
                              )}
                            </div>
                            <Button 
                              className="w-100 border-0 toys-view-deal-btn theme-button" 
                              style={customStyles.viewDealButton}
                              onMouseEnter={(e) => handleViewDealMouseEnter(e, isDarkMode, customStyles)}
                              onMouseLeave={(e) => handleViewDealMouseLeave(e, customStyles)}
                            >
                              SHOP NOW
                            </Button>
                          </Card.Body>
                        </Card>
                      </Link>
                    </Col>
                  );
                })}
              </Row>

              <div className="text-center mt-5">
                <Link to="/toys">
                  <Button 
                    style={customStyles.exploreButton} 
                    className="toys-explore-btn theme-button btn-bounce"
                    onMouseEnter={(e) => handleExploreMouseEnter(e, isDarkMode, customStyles)}
                    onMouseLeave={(e) => handleExploreMouseLeave(e, customStyles)}
                  >
                    See All Adventures →
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

export default HomeToysSection;