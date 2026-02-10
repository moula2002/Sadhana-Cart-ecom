// src/components/HomeMensSection.jsx
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
import "./HomeMensSection.css";

// 🎨 STYLE CONSTANTS (Peach Theme with Dark Mode)
const PRIMARY_TEXT_COLOR = "#2d2d2d";
const PRIMARY_TEXT_COLOR_DARK = "#e9ecef";
const ACCENT_COLOR = "#FF8C69"; // Salmon / Dark Peach
const ACCENT_COLOR_DARK = "#FF9D80"; // Brighter peach for dark mode
const PEACH_COLOR = "#FFDAB9"; // Peach Puff
const PEACH_COLOR_DARK = "#FFE4CC"; // Brighter peach for dark mode
const SALE_COLOR = "#FF7043"; // Coral
const SALE_COLOR_DARK = "#FF8A65"; // Brighter for dark mode
const WHITE_COLOR = "#FFFFFF";
const PRODUCT_BG_COLOR = "#fffaf5"; // Very light peach for cards
const PRODUCT_BG_COLOR_DARK = "#1a1a1a"; // Dark mode card background
const PEACH_BG_GRADIENT = "linear-gradient(135deg, #fff9f0 0%, #fff0e6 100%)";
const DARK_BG_GRADIENT = "linear-gradient(135deg, #121212 0%, #1a1a1a 100%)";

// 🎨 CUSTOM STYLES - Dynamic based on theme
const getCustomStyles = (isDarkMode) => ({
  sectionContainer: {
    backgroundColor: isDarkMode ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(15px)",
    borderRadius: "30px",
    padding: "3.5rem 1.5rem",
    boxShadow: isDarkMode ? 
      "0 20px 60px rgba(255, 140, 105, 0.1)" : 
      "0 20px 60px rgba(255, 140, 105, 0.1)",
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
      "0 10px 25px rgba(0, 0, 0, 0.2)" : 
      "0 10px 25px rgba(255, 140, 105, 0.05)",
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
    backgroundColor: isDarkMode ? "#2d2d2d" : "#FFFAF0",
    padding: "10px",
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
    borderRadius: "50px",
    fontSize: "0.7rem",
    fontWeight: "800",
    zIndex: 10,
    boxShadow: isDarkMode ? 
      "0 4px 12px rgba(255, 157, 128, 0.3)" : 
      "0 4px 12px rgba(255, 140, 105, 0.3)",
    letterSpacing: "0.5px",
  },
  brandText: {
    fontSize: "0.7rem",
    fontWeight: "700",
    color: isDarkMode ? "#FFB08B" : "#C96A47",
    marginBottom: "4px",
    letterSpacing: "1px",
    textTransform: "uppercase"
  },
  title: {
    fontSize: "1rem",
    fontWeight: "700",
    color: isDarkMode ? PRIMARY_TEXT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    marginBottom: "8px",
    lineHeight: "1.3"
  },
  price: {
    fontSize: "1.35rem",
    fontWeight: "900",
    color: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR,
    letterSpacing: "-0.5px",
  },
  originalPrice: { 
    fontSize: "0.85rem", 
    color: isDarkMode ? "#adb5bd" : "#adb5bd",
    marginLeft: "8px",
    textDecoration: "line-through"
  },
  header: {
    fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
    fontWeight: "900",
    color: isDarkMode ? PRIMARY_TEXT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    letterSpacing: "-1px",
    position: "relative",
    zIndex: 2
  },
  headerUnderline: {
    position: "absolute",
    bottom: "8px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "120px",
    height: "15px",
    backgroundColor: isDarkMode ? "rgba(255, 157, 128, 0.2)" : "rgba(255, 140, 105, 0.1)",
    zIndex: -1,
    borderRadius: "4px",
  },
  viewDealButton: {
    transition: "all 0.3s ease",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "700",
    backgroundColor: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR,
    borderColor: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR,
    padding: "0.6rem 1rem",
    marginTop: "12px",
    color: WHITE_COLOR
  },
  viewDealButtonHover: (isDarkMode) => ({
    backgroundColor: isDarkMode ? "#fff" : PRIMARY_TEXT_COLOR,
    borderColor: isDarkMode ? "#fff" : PRIMARY_TEXT_COLOR,
    color: isDarkMode ? ACCENT_COLOR_DARK : WHITE_COLOR,
    transform: "translateY(-2px)",
    boxShadow: isDarkMode ? 
      "0 8px 20px rgba(255, 255, 255, 0.15)" : 
      "0 8px 20px rgba(0, 0, 0, 0.15)",
  }),
  exploreButton: {
    backgroundColor: isDarkMode ? ACCENT_COLOR_DARK : PRIMARY_TEXT_COLOR,
    color: WHITE_COLOR,
    border: "none",
    transition: "all 0.3s ease-in-out",
    borderRadius: "50px",
    fontSize: "1rem",
    padding: "0.8rem 3rem",
    boxShadow: isDarkMode ? 
      "0 10px 30px rgba(255, 157, 128, 0.3)" : 
      "0 10px 30px rgba(0,0,0,0.15)",
  },
  exploreButtonHover: (isDarkMode) => ({
    backgroundColor: isDarkMode ? "#fff" : ACCENT_COLOR,
    color: isDarkMode ? ACCENT_COLOR_DARK : WHITE_COLOR,
    transform: "translateY(-3px)",
    boxShadow: isDarkMode ? 
      `0 10px 25px rgba(255, 157, 128, 0.6)` : 
      `0 10px 25px rgba(255, 140, 105, 0.4)`,
  }),
  peachWatermark: {
    position: "absolute",
    bottom: "-30px",
    left: "-20px",
    fontSize: "12rem",
    fontWeight: "900",
    color: isDarkMode ? "rgba(255, 157, 128, 0.05)" : "rgba(255, 140, 105, 0.03)",
    userSelect: "none",
    pointerEvents: "none"
  },
  subtitle: {
    color: isDarkMode ? "#adb5bd" : "#6c757d"
  }
});

// 🧠 Utility Functions
const handleCardMouseEnter = (e, isDarkMode) => {
  e.currentTarget.style.transform = "translateY(-12px)";
  e.currentTarget.style.boxShadow = isDarkMode ? 
    "0 25px 50px rgba(255, 157, 128, 0.15)" : 
    "0 25px 50px rgba(255, 140, 105, 0.12)";
  e.currentTarget.querySelector("img").style.transform = "scale(1.08)";
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
    transform: "none",
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

const getProductImageSource = (product) => {
  if (typeof product.image === "string" && product.image.trim() !== "")
    return product.image;
  if (Array.isArray(product.images) && product.images.length > 0)
    return product.images[0];
  return "https://placehold.co/300x380/fffaf5/FF8C69?text=MENS";
};

const calculateDiscount = (price, originalPrice) => {
  if (originalPrice > price)
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  return 0;
};

const generateDummyProduct = (index) => {
  const basePrice = Math.floor(Math.random() * 1500) + 1000;
  const discountFactor = Math.random() * 0.5 + 0.3;
  const finalPrice = Math.floor(basePrice * discountFactor);
  const originalPrice =
    basePrice <= finalPrice
      ? finalPrice + Math.floor(Math.random() * 800) + 500
      : basePrice;
  const mensTypes = [
    "Casual Shirt",
    "Denim Jacket",
    "Chino Pants",
    "Hoodie",
    "Formal Blazer",
    "Sweatshirt"
  ];
  return {
    id: `mens-peach-${index}`,
    name: `Premium ${mensTypes[index % mensTypes.length]} ${index + 1}`,
    brand: "URBAN MAN",
    price: finalPrice,
    originalPrice,
    image: `https://picsum.photos/seed/mens${index}/300/300`,
  };
};

function HomeMensSection() {
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
    const fetchMens = async () => {
      setLoading(true);
      try {
        const cached = localStorage.getItem("mensProductsPeach");
        if (cached) {
          setProducts(JSON.parse(cached));
          setLoading(false);
          return;
        }

        const categoryName = "Mens";
        const productLimit = 4;
        const productsRef = collection(db, "products");
        const q = query(productsRef, where("category", "==", categoryName));
        const snapshot = await getDocs(q);

        let data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          price: doc.data().price ? Number(doc.data().price) : 1299,
          originalPrice: doc.data().originalPrice
            ? Number(doc.data().originalPrice)
            : 1999,
        }));

        while (data.length < productLimit)
          data.push(generateDummyProduct(data.length));

        for (let i = data.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [data[i], data[j]] = [data[j], data[i]];
        }

        data = data.slice(0, productLimit);
        setProducts(data);
        localStorage.setItem("mensProductsPeach", JSON.stringify(data));
      } catch (err) {
        setProducts(
          Array.from({ length: 4 }, (_, i) => generateDummyProduct(i))
        );
      } finally {
        setLoading(false);
      }
    };
    fetchMens();
  }, []);

  const customStyles = getCustomStyles(isDarkMode);

  return (
    <Container 
      fluid 
      className="category-section mens" 
      style={{ 
        background: isDarkMode ? DARK_BG_GRADIENT : PEACH_BG_GRADIENT, 
        padding: "70px 0",
        transition: "background 0.3s ease"
      }}
    >
      <Container style={customStyles.sectionContainer} className="mens-section-container">

        {/* Header */}
        <div className="text-center mb-5">
          <h3 style={customStyles.header} className="mens-section-title theme-text">
            MENS <span style={{ color: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR }}>ESSENTIALS</span>
            <div style={customStyles.headerUnderline}></div>
          </h3>
          <p className="mt-3 fs-6 fw-light d-none d-sm-block" style={customStyles.subtitle}>
            Modern cuts and premium fabrics for the contemporary man.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR }} />
            <p className="mt-3 text-muted theme-text-secondary">Curating essentials...</p>
          </div>
        ) : (
          <>
            <Row xs={2} sm={2} md={3} lg={4} className="g-3 g-lg-4 justify-content-center">
              {products.map((product) => {
                const discountPercent = calculateDiscount(product.price, product.originalPrice);
                return (
                  <Col key={product.id}>
                    <Link to={`/product/${product.id}`} className="text-decoration-none d-block h-100">
                      <Card
                        style={customStyles.productCard}
                        className="mens-card theme-card"
                        onMouseEnter={(e) => handleCardMouseEnter(e, isDarkMode)}
                        onMouseLeave={(e) => handleCardMouseLeave(e, isDarkMode, customStyles)}
                      >
                        {discountPercent > 0 && (
                          <Badge style={customStyles.discountBadge}>
                            -{discountPercent}%
                          </Badge>
                        )}
                        <div style={customStyles.imageContainer(isMobile)}>
                          <LazyLoadImage
                            src={getProductImageSource(product)}
                            alt={product.name}
                            effect="blur"
                            style={customStyles.productImage}
                            onError={(e) => (e.target.src = "https://placehold.co/300x380/fffaf5/FF8C69?text=MENS")}
                          />
                        </div>
                        <Card.Body className="text-start p-3 d-flex flex-column">
                          <p style={customStyles.brandText} className="mens-brand-text">
                            {product.brand}
                          </p>
                          <Card.Title 
                            style={customStyles.title} 
                            className="text-truncate mens-card-title theme-text"
                          >
                            {product.name}
                          </Card.Title>
                          <div className="d-flex align-items-center mt-auto">
                            <span style={customStyles.price} className="mens-price">
                              ₹{product.price}
                            </span>
                            {product.originalPrice > product.price && (
                              <span style={customStyles.originalPrice} className="mens-original-price theme-text-secondary">
                                ₹{product.originalPrice}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="primary"
                            style={customStyles.viewDealButton}
                            className="mens-view-deal-btn theme-button"
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
              <Link to="/mens">
                <Button
                  style={customStyles.exploreButton}
                  className="mens-explore-btn theme-button"
                  onMouseEnter={(e) => handleExploreMouseEnter(e, isDarkMode, customStyles)}
                  onMouseLeave={(e) => handleExploreMouseLeave(e, customStyles)}
                >
                  Explore All Menswear →
                </Button>
              </Link>
            </div>
          </>
        )}
      </Container>
    </Container>
  );
}

export default HomeMensSection;