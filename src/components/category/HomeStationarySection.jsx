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
import "./HomeStationarySection.css"

// 🎨 UPDATED STYLE CONSTANTS (Stationery/Yellow Theme with Dark Mode)
const PRIMARY_TEXT_COLOR = "#432818"; // Deep Chocolate Brown
const PRIMARY_TEXT_COLOR_DARK = "#fef3c7"; // Light yellow for dark mode
const ACCENT_COLOR = "#F4A261";      // Warm Orange-Yellow
const ACCENT_COLOR_DARK = "#fbbf24"; // Brighter yellow for dark mode
const BANANA_YELLOW = "#FFEFAD";     // Soft Light Yellow
const DARK_YELLOW_BG = "#2d1f00";    // Dark yellow-brown for dark mode
const WHITE_COLOR = "#FFFFFF";
const BORDER_COLOR = "#E9C46A";      // Golden Yellow
const BORDER_COLOR_DARK = "#f59e0b"; // Brighter border for dark mode
const SALE_COLOR = "#E76F51";        // Burnt Sienna
const SALE_COLOR_DARK = "#ef4444";   // Brighter red for dark mode
const STATIONERY_BG_GRADIENT = "linear-gradient(135deg, #FFFDE7 0%, #FFF9C4 100%)";
const DARK_BG_GRADIENT = "linear-gradient(135deg, #121212 0%, #1c180e 100%)";

// 🎨 CUSTOM STYLES - Dynamic based on theme
const getCustomStyles = (isDarkMode) => ({
  mainWrapper: {
    background: isDarkMode ? "transparent" : STATIONERY_BG_GRADIENT,
    padding: "50px 0",
    transition: "background 0.3s ease"
  },
  sectionContainer: {
    backgroundColor: isDarkMode ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.6)",
    backdropFilter: "blur(10px)",
    borderRadius: "30px",
    padding: "3rem 1.5rem",
    boxShadow: isDarkMode ? 
      "0 15px 40px rgba(245, 158, 11, 0.2)" : 
      "0 15px 40px rgba(233, 196, 106, 0.2)",
    border: isDarkMode ? 
      `1px solid rgba(255, 255, 255, 0.1)` : 
      `1px solid ${WHITE_COLOR}`,
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s ease"
  },
  productCard: {
    border: isDarkMode ? `2px solid ${BORDER_COLOR_DARK}` : `2px solid ${BANANA_YELLOW}`,
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: isDarkMode ? 
      "0 8px 15px rgba(0, 0, 0, 0.2)" : 
      "0 8px 15px rgba(0, 0, 0, 0.04)",
    transition: "all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)",
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
    backgroundColor: isDarkMode ? DARK_YELLOW_BG : "#FFFDF0",
    padding: "10px",
  }),
  productImage: {
    maxWidth: "90%",
    maxHeight: "90%",
    objectFit: "contain",
    transition: "transform 0.4s ease",
  },
  discountBadge: {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: isDarkMode ? SALE_COLOR_DARK : SALE_COLOR,
    color: WHITE_COLOR,
    padding: "0.4rem 0.6rem",
    borderRadius: "10px",
    fontSize: "0.75rem",
    fontWeight: "800",
    zIndex: 10,
    boxShadow: isDarkMode ? 
      "0 4px 8px rgba(239, 68, 68, 0.3)" : 
      "0 4px 8px rgba(231, 111, 81, 0.3)",
  },
  brandText: {
    fontSize: "0.7rem",
    fontWeight: "700",
    color: isDarkMode ? "#fbbf24" : "#B08968",
    letterSpacing: "1px",
  },
  title: {
    fontSize: "1rem",
    fontWeight: "700",
    color: isDarkMode ? PRIMARY_TEXT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    lineHeight: "1.3",
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
    fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
    fontWeight: "900",
    color: isDarkMode ? PRIMARY_TEXT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    display: "inline-block",
    position: "relative",
    animation: "headerWiggle 5s ease-in-out infinite",
  },
  headerUnderline: {
    position: "absolute",
    bottom: "-8px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "100px",
    height: "4px",
    backgroundColor: isDarkMode ? "rgba(245, 158, 11, 0.3)" : "rgba(233, 196, 106, 0.3)",
    borderRadius: "2px",
  },
  viewDealButton: {
    transition: "all 0.3s ease",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "700",
    backgroundColor: isDarkMode ? ACCENT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    color: WHITE_COLOR,
    border: "none",
    padding: "0.6rem",
  },
  viewDealButtonHover: (isDarkMode) => ({
    backgroundColor: isDarkMode ? "#fff" : BORDER_COLOR,
    color: isDarkMode ? ACCENT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    transform: "scale(1.05)",
    boxShadow: isDarkMode ? 
      "0 4px 12px rgba(255, 255, 255, 0.2)" : 
      "0 4px 12px rgba(233, 196, 106, 0.3)",
  }),
  exploreButton: {
    backgroundColor: isDarkMode ? "transparent" : WHITE_COLOR,
    color: isDarkMode ? ACCENT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    border: isDarkMode ? `2px solid ${ACCENT_COLOR_DARK}` : `2px solid ${PRIMARY_TEXT_COLOR}`,
    borderRadius: "50px",
    fontSize: "1rem",
    padding: "0.7rem 2.5rem",
    fontWeight: "700",
    transition: "all 0.3s ease",
  },
  exploreButtonHover: (isDarkMode) => ({
    backgroundColor: isDarkMode ? ACCENT_COLOR_DARK : BORDER_COLOR,
    color: isDarkMode ? "#121212" : PRIMARY_TEXT_COLOR,
    transform: "translateY(-2px)",
    boxShadow: isDarkMode ? 
      "0 10px 20px rgba(245, 158, 11, 0.3)" : 
      "0 10px 20px rgba(233, 196, 106, 0.3)",
  }),
  stationaryWatermark: {
    position: "absolute",
    bottom: "-40px",
    right: "-20px",
    fontSize: "10rem",
    fontWeight: "900",
    color: isDarkMode ? "rgba(245, 158, 11, 0.05)" : "rgba(233, 196, 106, 0.05)",
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
    "0 20px 40px rgba(245, 158, 11, 0.4)" : 
    "0 20px 40px rgba(233, 196, 106, 0.4)";
  e.currentTarget.style.borderColor = isDarkMode ? BORDER_COLOR_DARK : BORDER_COLOR;
  e.currentTarget.querySelector("img").style.transform = "scale(1.08) rotate(2deg)";
};

const handleCardMouseLeave = (e, isDarkMode, customStyles) => {
  e.currentTarget.style.transform = "translateY(0)";
  e.currentTarget.style.boxShadow = customStyles.productCard.boxShadow;
  e.currentTarget.style.borderColor = isDarkMode ? BORDER_COLOR_DARK : "#FFEFAD";
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

// Animation Injection
const AnimationStyles = () => (
  <style>{`
    @keyframes headerWiggle {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(1deg); }
      75% { transform: rotate(-1deg); }
    }
    .stationary-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 20px 40px rgba(233, 196, 106, 0.4) !important;
      border-color: #E9C46A !important;
    }
    .stationary-card:hover img {
      transform: scale(1.08) rotate(2deg);
    }
    .btn-hover-grow:hover {
      transform: scale(1.05);
    }
    .stationery-glow-text {
      text-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
    }
  `}</style>
);

const calculateDiscount = (p, op) => (op > p ? Math.round(((op - p) / op) * 100) : 0);

function HomeStationarySection() {
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
    const fetchStationary = async () => {
      try {
        const q = query(collection(db, "products"), where("category", "==", "Stationery"));
        const snapshot = await getDocs(q);
        let data = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            price: Number(doc.data().price) || 299,
            originalPrice: Number(doc.data().originalPrice) || 599,
            image: doc.data().image || doc.data().images?.[0] || `https://picsum.photos/seed/stationery${doc.id}/300/300`
        }));
        
        // Use local shuffle for variety
        data = data.sort(() => 0.5 - Math.random()).slice(0, 4);
        setProducts(data);
      } catch (err) {
        setProducts(Array.from({ length: 4 }, (_, i) => ({
            id: `stationery-dummy-${i}`,
            name: "Premium Notebook",
            brand: "STUDIO", 
            price: 499, 
            originalPrice: 899,
            image: `https://picsum.photos/seed/stationery${i}/300/300`
        })));
      } finally {
        setLoading(false);
      }
    };
    fetchStationary();
  }, []);

  const customStyles = getCustomStyles(isDarkMode);

  return (
    <>
      <AnimationStyles />
      <Container 
        fluid 
        className="category-section stationary" 
        style={{ 
          background: isDarkMode ? DARK_BG_GRADIENT : STATIONERY_BG_GRADIENT, 
          padding: "50px 0",
          transition: "background 0.3s ease"
        }}
      >
        <Container style={customStyles.sectionContainer} className="stationary-section-container">

          {/* Creative Header */}
          <div className="text-center mb-5">
            <h3 style={customStyles.header} className="stationary-section-title theme-text stationery-glow-text">
              CREATIVE <span style={{ color: isDarkMode ? ACCENT_COLOR_DARK : BORDER_COLOR }}>STATIONERY</span>
              <div style={customStyles.headerUnderline}></div>
            </h3>
            <p className="mt-2 fw-light" style={customStyles.subtitle}>
              Organize your thoughts with our curated premium collection.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="grow" variant="warning" style={{ color: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR }} />
              <p className="mt-3 text-muted theme-text-secondary">Loading stationery...</p>
            </div>
          ) : (
            <>
              <Row xs={2} sm={2} md={3} lg={4} className="g-3">
                {products.map((product) => {
                  const discount = calculateDiscount(product.price, product.originalPrice);
                  return (
                    <Col key={product.id}>
                      <Link to={`/product/${product.id}`} className="text-decoration-none d-block h-100">
                        <Card 
                          className="stationary-card stationary-card theme-card" 
                          style={customStyles.productCard}
                          onMouseEnter={(e) => handleCardMouseEnter(e, isDarkMode)}
                          onMouseLeave={(e) => handleCardMouseLeave(e, isDarkMode, customStyles)}
                        >
                          {discount > 0 && (
                            <Badge style={customStyles.discountBadge} className="stationary-discount-badge">
                              {discount}% OFF
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

                          <Card.Body className="p-3 d-flex flex-column">
                            <small style={customStyles.brandText} className="text-uppercase mb-1 stationary-brand-text">
                              {product.brand || "ESSENTIALS"}
                            </small>
                            <Card.Title 
                              style={customStyles.title} 
                              className="text-truncate mb-2 stationary-card-title theme-text"
                            >
                              {product.name}
                            </Card.Title>
                            <div className="mt-auto">
                              <div className="d-flex align-items-center mb-2">
                                <span style={customStyles.price} className="stationary-price">
                                  ₹{product.price}
                                </span>
                                {product.originalPrice > product.price && (
                                  <small className="ms-2 stationary-original-price theme-text-secondary" style={customStyles.originalPrice}>
                                    ₹{product.originalPrice}
                                  </small>
                                )}
                              </div>
                              <Button 
                                style={customStyles.viewDealButton} 
                                className="w-100 stationary-view-deal-btn theme-button btn-hover-grow"
                                onMouseEnter={(e) => handleViewDealMouseEnter(e, isDarkMode, customStyles)}
                                onMouseLeave={(e) => handleViewDealMouseLeave(e, customStyles)}
                              >
                                SHOP NOW
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
                       <Link to="/stationary">
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

export default HomeStationarySection;