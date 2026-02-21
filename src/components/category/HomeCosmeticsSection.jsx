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
import "./HomeCosmeticsSection.css"

/* 🎨 COSMETICS THEME COLORS WITH DARK MODE */
const PRIMARY_TEXT_COLOR = "#4A1D4A"; // Deep Plum
const PRIMARY_TEXT_COLOR_DARK = "#f3e8ff"; // Light lavender for dark mode
const ACCENT_COLOR = "#C084FC";       // Soft Lavender
const ACCENT_COLOR_DARK = "#d8b4fe";  // Brighter lavender for dark mode
const ROSE_PINK = "#E11D48";          // Rose Red
const ROSE_PINK_DARK = "#fb7185";     // Brighter pink for dark mode
const LIGHT_PINK_BG = "#FDF2F8";      // Blush background
const DARK_PINK_BG = "#2d1b2d";       // Dark plum background
const WHITE_COLOR = "#FFFFFF";
const PRODUCT_BG_COLOR_DARK = "#1a1a1a"; // Dark mode card background
const COSMETICS_BG_GRADIENT = "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)";
const DARK_BG_GRADIENT = "linear-gradient(135deg, #121212 0%, #1a0f1a 100%)";

/* 🎨 CUSTOM STYLES - Dynamic based on theme */
const getCustomStyles = (isDarkMode) => ({
  mainWrapper: {
    backgroundColor: isDarkMode ? "transparent" : "#FDF2F8",
    padding: "60px 0",
    transition: "background-color 0.3s ease"
  },
  sectionContainer: {
    backgroundColor: isDarkMode ? "rgba(30, 30, 30, 0.9)" : WHITE_COLOR,
    borderRadius: "30px",
    padding: "3.5rem 1.5rem",
    boxShadow: isDarkMode ? 
      "0 20px 40px rgba(168, 85, 247, 0.1)" : 
      "0 20px 40px rgba(88, 28, 135, 0.08)",
    border: isDarkMode ? 
      "1px solid rgba(255, 255, 255, 0.1)" : 
      "1px solid #F3E8FF",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s ease"
  },
  productCard: {
    border: isDarkMode ? "1px solid #2d2d2d" : "none",
    borderRadius: "20px",
    overflow: "hidden",
    backgroundColor: isDarkMode ? PRODUCT_BG_COLOR_DARK : WHITE_COLOR,
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    cursor: "pointer",
    height: "100%",
    position: "relative",
    boxShadow: isDarkMode ? 
      "0 5px 15px rgba(0,0,0,0.2)" : 
      "0 5px 15px rgba(0,0,0,0.06)",
  },
  imageContainer: (isMobile) => ({
    width: "100%",
    height: isMobile ? "180px" : "240px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDarkMode ? DARK_PINK_BG : LIGHT_PINK_BG,
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
    backgroundColor: isDarkMode ? ROSE_PINK_DARK : ROSE_PINK,
    color: WHITE_COLOR,
    padding: "0.4rem 0.8rem",
    borderRadius: "8px",
    fontSize: "0.75rem",
    fontWeight: "800",
    zIndex: 10,
    boxShadow: isDarkMode ? 
      "0 4px 10px rgba(251, 113, 133, 0.3)" : 
      "0 4px 10px rgba(225, 29, 72, 0.3)",
  },
  brandText: {
    fontSize: "0.7rem",
    fontWeight: "700",
    color: isDarkMode ? "#fb7185" : "#9D174D",
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
    backgroundColor: isDarkMode ? "rgba(216, 180, 254, 0.3)" : "rgba(192, 132, 252, 0.3)",
    borderRadius: "2px",
  },
  shopButton: {
    borderRadius: "14px",
    fontSize: "0.9rem",
    fontWeight: "700",
    background: isDarkMode ? 
      "linear-gradient(135deg, #fb7185, #d8b4fe)" : 
      "linear-gradient(135deg, #EC4899, #A855F7)",
    border: "none",
    padding: "0.7rem",
    color: WHITE_COLOR,
    transition: "all 0.3s ease"
  },
  shopButtonHover: (isDarkMode) => ({
    opacity: "0.9",
    transform: "scale(1.05)",
    boxShadow: isDarkMode ? 
      "0 8px 20px rgba(216, 180, 254, 0.4)" : 
      "0 8px 20px rgba(168, 85, 247, 0.4)",
  }),
  exploreButton: {
    backgroundColor: "transparent",
    color: isDarkMode ? PRIMARY_TEXT_COLOR_DARK : PRIMARY_TEXT_COLOR,
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
      "0 10px 25px rgba(216, 180, 254, 0.3)" : 
      "0 10px 25px rgba(74, 29, 74, 0.2)",
  }),
  cosmeticsWatermark: {
    position: "absolute",
    bottom: "-40px",
    right: "-20px",
    fontSize: "10rem",
    fontWeight: "900",
    color: isDarkMode ? "rgba(216, 180, 254, 0.05)" : "rgba(192, 132, 252, 0.05)",
    userSelect: "none",
    pointerEvents: "none",
    opacity: 0.5
  },
  subtitle: {
    color: isDarkMode ? "#adb5bd" : "#6c757d"
  }
});

/* ✨ Hover Handlers */
const handleCardMouseEnter = (e, isDarkMode) => {
  e.currentTarget.style.transform = "translateY(-10px)";
  e.currentTarget.style.boxShadow = isDarkMode ? 
    "0 25px 50px rgba(216, 180, 254, 0.2)" : 
    "0 25px 50px rgba(168, 85, 247, 0.2)";
  e.currentTarget.querySelector("img").style.transform = "scale(1.1)";
};

const handleCardMouseLeave = (e, isDarkMode, customStyles) => {
  e.currentTarget.style.transform = "translateY(0)";
  e.currentTarget.style.boxShadow = customStyles.productCard.boxShadow;
  e.currentTarget.querySelector("img").style.transform = "scale(1)";
};

const handleShopButtonMouseEnter = (e, isDarkMode, customStyles) =>
  Object.assign(e.currentTarget.style, customStyles.shopButtonHover(isDarkMode));

const handleShopButtonMouseLeave = (e, customStyles) =>
  Object.assign(e.currentTarget.style, {
    ...customStyles.shopButton,
    transform: "scale(1)",
    opacity: "1",
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

/* 🔢 Discount Calculator */
const calculateDiscount = (p, op) =>
  op > p ? Math.round(((op - p) / op) * 100) : 0;

/* ✨ ANIMATIONS */
const CosmeticAnimations = () => (
  <style>{`
    @keyframes slideUpFade {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes floatGlow {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .animate-in {
      animation: slideUpFade 0.8s ease-out forwards;
    }
    .cosmetics-glow-text {
      animation: floatGlow 4s ease-in-out infinite;
    }
    .cosmetic-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 25px 50px rgba(168, 85, 247, 0.2) !important;
    }
    .cosmetic-card:hover img {
      transform: scale(1.1);
    }
  `}</style>
);

/* 💄 HOME COSMETICS SECTION */
function HomeCosmeticsSection() {
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
    const fetchCosmetics = async () => {
      try {
        const q = query(
          collection(db, "products"),
          where("category", "==", "Cosmetics")
        );
        const snapshot = await getDocs(q);
        let data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          price: Number(doc.data().price) || 699,
          originalPrice: Number(doc.data().originalPrice) || 1299,
        }));
        setProducts(data.sort(() => 0.5 - Math.random()).slice(0, 4));
      } catch (err) {
        setProducts(
          Array.from({ length: 4 }, (_, i) => ({
            id: `cosmetic-dummy-${i}`,
            name: "Luxury Lipstick",
            brand: "PURE GLOW",
            price: 899,
            originalPrice: 1499,
            image: `https://picsum.photos/seed/cosmetic${i}/300/300`,
          }))
        );
      } finally {
        setLoading(false);
      }
    };
    fetchCosmetics();
  }, []);

  const customStyles = getCustomStyles(isDarkMode);

  return (
    <>
      <CosmeticAnimations />
      <Container 
        fluid 
        className="category-section cosmetics" 
        style={{ 
          background: isDarkMode ? DARK_BG_GRADIENT : COSMETICS_BG_GRADIENT, 
          padding: "60px 0",
          transition: "background 0.3s ease"
        }}
      >
        <Container style={customStyles.sectionContainer} className="cosmetics-section-container animate-in">

          {/* Header */}
          <div className="text-center mb-5">
            <h3 style={customStyles.header} className="cosmetics-section-title theme-text cosmetics-glow-text">
  {t("cosmeticsTitle")}{" "}
  <span style={{ color: isDarkMode ? ACCENT_COLOR_DARK : ACCENT_COLOR }}>
    {t("cosmeticsGlow")}
  </span>
  <div style={customStyles.headerUnderline}></div>
</h3>

            <p className="mt-2" style={customStyles.subtitle}>
              {t("cosmeticsSubtitle")}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: isDarkMode ? ACCENT_COLOR_DARK : PRIMARY_TEXT_COLOR }} />
              <p className="mt-3 text-muted theme-text-secondary">{t("cosmeticsLoading")}</p>
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
                          className="cosmetics-card theme-card cosmetic-card"
                          style={customStyles.productCard}
                          onMouseEnter={(e) => handleCardMouseEnter(e, isDarkMode)}
                          onMouseLeave={(e) => handleCardMouseLeave(e, isDarkMode, customStyles)}
                        >
                          {discount > 0 && (
                            <Badge style={customStyles.discountBadge} className="cosmetics-discount-badge">
                              {discount}% {t("off")}
                            </Badge>
                          )}

                          <div style={customStyles.imageContainer(isMobile)}>
                            <LazyLoadImage
                              src={product.image || product.images?.[0] || `https://picsum.photos/seed/cosmetic${product.id}/300/300`}
                              alt={product.name}
                              effect="blur"
                              style={customStyles.productImage}
                            />
                          </div>

                          <Card.Body className="p-3 d-flex flex-column text-center">
                            <small style={customStyles.brandText} className="cosmetics-brand-text">
                              {product.brand || "PURE BEAUTY"}
                            </small>
                            <Card.Title
                              style={customStyles.title}
                              className="text-truncate cosmetics-card-title theme-text"
                            >
                              {product.name}
                            </Card.Title>

                            <div className="mt-auto">
                              <div className="mb-3">
                                <span style={customStyles.price} className="cosmetics-price">
                                  ₹{product.price}
                                </span>
                                {product.originalPrice > product.price && (
                                  <small className="ms-2 cosmetics-original-price theme-text-secondary" style={customStyles.originalPrice}>
                                    ₹{product.originalPrice}
                                  </small>
                                )}
                              </div>

                              <Button
                                style={customStyles.shopButton}
                                className="w-100 cosmetics-shop-btn theme-button"
                                onMouseEnter={(e) => handleShopButtonMouseEnter(e, isDarkMode, customStyles)}
                                onMouseLeave={(e) => handleShopButtonMouseLeave(e, customStyles)}
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

              {/* CTA */}
              <div className="text-center mt-5">
                <Link to="/cosmetics">
                  <Button
                    style={customStyles.exploreButton}
                    className="cosmetics-explore-btn theme-button"
                    onMouseEnter={(e) => handleExploreMouseEnter(e, isDarkMode, customStyles)}
                    onMouseLeave={(e) => handleExploreMouseLeave(e, customStyles)}
                  >
                    {t("exploreCosmetics")} →
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

export default HomeCosmeticsSection;