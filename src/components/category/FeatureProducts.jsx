import React, { useEffect, useRef, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function FeatureProducts() {
  const [products, setProducts] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  // 🌙 THEME STATE (Navbar-oda sync aagum)
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  // Sync logic for theme changes
  useEffect(() => {
    const checkTheme = () => {
      const currentTheme = localStorage.getItem("theme") === "dark" || 
                           document.documentElement.getAttribute("data-bs-theme") === "dark";
      setDarkMode(currentTheme);
    };

    // Navbar toggle pannumpothu storage event trigger aagum
    window.addEventListener("storage", checkTheme);

    // Attribute changes-ah track panna observer
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true });

    return () => {
      window.removeEventListener("storage", checkTheme);
      observer.disconnect();
    };
  }, []);

  // Theme-based Styles
  const themeStyles = {
    containerBg: darkMode 
      ? "linear-gradient(135deg, #1a1a1a 0%, #333333 100%)" 
      : "linear-gradient(135deg, #0f52ba 0%, #4169e1 100%)",
    cardBg: darkMode ? "#252525" : "white",
    titleColor: darkMode ? "#ffffff" : "#333",
    descColor: darkMode ? "#bbb" : "#666",
    priceColor: darkMode ? "#5d64ff" : "#2c3e50",
    shadow: darkMode ? "0 10px 30px rgba(0,0,0,0.5)" : "0 20px 40px rgba(0,0,0,0.1)",
  };

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "featuredProducts"));
      const list = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(list);
    } catch (error) {
      console.error("Error fetching featured products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const calculateDiscount = (price, oldPrice) => {
    if (!price || !oldPrice) return 0;
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  };

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (direction === "left") {
      current.scrollBy({ left: -300, behavior: "smooth" });
    } else {
      current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const goToProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div
      style={{
        padding: "40px 30px",
        background: themeStyles.containerBg,
        borderRadius: "30px",
        marginTop: "40px",
        boxShadow: themeStyles.shadow,
        transition: "all 0.5s ease", // Smooth background transition
      }}
    >
      <style>
        {`
        .featured-scroll::-webkit-scrollbar {
          display: none;
        }
        `}
      </style>

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h2 style={{ color: "white", fontWeight: "800" }}>
          Featured Deals
        </h2>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => scroll("left")} style={navButtonStyle}>
            ❮
          </button>

          <button onClick={() => scroll("right")} style={navButtonStyle}>
            ❯
          </button>
        </div>
      </div>

      {/* PRODUCT LIST */}
      <div
        ref={scrollRef}
        className="featured-scroll"
        style={{
          display: "flex",
          gap: "20px",
          overflowX: "auto",
          paddingBottom: "20px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          alignItems: "flex-start",
        }}
      >
        {products.map((product) => {
          const info = product.featuredProductInfo || {};
          const price = product.price || 0;
          const oldPrice = product.oldPrice || 0;
          const discount = calculateDiscount(price, oldPrice);
          const image = product.images?.[0] || "";
          const isHovered = hoveredId === product.id;

          return (
            <div
              key={product.id}
              onClick={() => goToProduct(product.id)}
              onMouseEnter={() => setHoveredId(product.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                minWidth: "260px",
                maxWidth: "260px",
                height: "320px",
                background: themeStyles.cardBg,
                borderRadius: "15px",
                padding: "15px",
                position: "relative",
                flexShrink: 0,
                boxShadow: isHovered ? "0 12px 25px rgba(0,0,0,0.2)" : "0 8px 20px rgba(0,0,0,0.1)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                transform: isHovered ? "translateY(-8px)" : "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {/* DISCOUNT */}
              {discount > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    background: "#ff4757",
                    color: "white",
                    padding: "5px 8px",
                    borderRadius: "15px",
                    fontWeight: "600",
                    fontSize: "12px",
                    zIndex: 2,
                  }}
                >
                  {discount}% OFF
                </div>
              )}

              {/* IMAGE */}
              <div
                style={{
                  width: "100%",
                  height: "150px",
                  overflow: "hidden",
                  borderRadius: "10px",
                  background: darkMode ? "#1a1a1a" : "#f9f9f9",
                }}
              >
                <img
                  src={image}
                  alt={info.title}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    transform: isHovered ? "scale(1.1)" : "scale(1)",
                    transition: "transform 0.4s ease",
                  }}
                />
              </div>

              {/* NAME */}
              <h4
                style={{
                  fontSize: "0.95rem",
                  marginTop: "12px",
                  color: themeStyles.titleColor,
                  fontWeight: "600",
                  transition: "color 0.3s ease",
                }}
              >
                {info.title}
              </h4>

              {/* DESCRIPTION */}
              <p
                style={{
                  fontSize: "0.85rem",
                  color: themeStyles.descColor,
                  marginTop: "6px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                Limited Offer
              </p>

              {/* PRICE */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "auto",
                }}
              >
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "1.1rem",
                    color: themeStyles.priceColor,
                  }}
                >
                  ₹{price.toLocaleString()}
                </span>

                <span
                  style={{
                    textDecoration: "line-through",
                    color: "#999",
                    fontSize: "0.9rem",
                  }}
                >
                  ₹{oldPrice.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const navButtonStyle = {
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  border: "none",
  background: "rgba(255,255,255,0.25)",
  color: "white",
  fontSize: "16px",
  cursor: "pointer",
  transition: "background 0.3s ease",
};

export default FeatureProducts;