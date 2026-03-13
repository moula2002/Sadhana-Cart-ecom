import React, { useEffect, useRef, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function RecommendedProduct() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  const scrollRef = useRef(null);

  // 🌙 THEME STATE (Synced with Navbar/LocalStorage)
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  const PAGE_SIZE = 5;

  // Sync with Navbar's theme changes
  useEffect(() => {
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem("theme") === "dark");
    };

    window.addEventListener("storage", handleStorageChange);
    
    const observer = new MutationObserver(() => {
        const isDark = document.documentElement.getAttribute("data-bs-theme") === "dark" || 
                       document.body.classList.contains("dark-theme");
        setDarkMode(isDark);
    });

    observer.observe(document.documentElement, { attributes: true });
    observer.observe(document.body, { attributes: true });

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      observer.disconnect();
    };
  }, []);

  // Theme Colors Configuration
  const themeColors = {
    containerBg: darkMode 
      ? "linear-gradient(135deg, #2d1b4e 0%, #1a1a2e 100%)" 
      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    cardBg: darkMode ? "#1e1e1e" : "white",
    titleColor: darkMode ? "#ffffff" : "#333",
    descColor: darkMode ? "#bbb" : "#666",
    priceColor: darkMode ? "#fff" : "#2c3e50",
    shadow: darkMode ? "0 8px 25px rgba(0,0,0,0.5)" : "0 8px 20px rgba(0,0,0,0.1)"
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "products"),
        orderBy("productid"),
        limit(PAGE_SIZE)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(list);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  const loadMore = async () => {
    if (!lastDoc || loading) return;
    setLoading(true);
    const q = query(
      collection(db, "products"),
      orderBy("productid"),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setProducts((prev) => [...prev, ...list]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 50 && !loading) {
      loadMore();
    }
    if (el.scrollLeft > 0 && showScrollHint) {
      setShowScrollHint(false);
    }
  };

  const calculateDiscount = (price, offerprice) => {
    if (!price || !offerprice) return 0;
    return Math.round(((price - offerprice) / price) * 100);
  };

  return (
    <div
      style={{
        padding: "40px 30px",
        background: themeColors.containerBg,
        borderRadius: "30px",
        marginTop: "40px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        transition: "background 0.5s ease"
      }}
    >
      <style>
        {`
        .recommended-scroll::-webkit-scrollbar {
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
          Recommended For You
        </h2>
      </div>

      {/* PRODUCT LIST */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="recommended-scroll"
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
          const image =
            product.images?.[0] ||
            product.image ||
            "https://via.placeholder.com/260x180";

          const name = product.name || "Product";
          const description = product.description || "";
          const price = product.price || 0;
          const offerprice = product.offerprice || price;
          const discount = calculateDiscount(price, offerprice);

          return (
            <div
              key={product.id}
              onClick={() => navigate(`/product/${product.id}`)}
              onMouseEnter={() => setHoveredCard(product.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                minWidth: "260px",
                maxWidth: "260px",
                height: "320px",
                background: themeColors.cardBg,
                borderRadius: "15px",
                padding: "15px",
                position: "relative",
                flexShrink: 0,
                boxShadow: themeColors.shadow,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                transform: hoveredCard === product.id ? "translateY(-8px)" : "none",
                transition: "all 0.3s ease",
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
                    zIndex: 2
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
                  background: darkMode ? "#2a2a2a" : "transparent"
                }}
              >
                <img
                  src={image}
                  alt={name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    transition: "transform 0.5s ease",
                    transform: hoveredCard === product.id ? "scale(1.08)" : "scale(1)"
                  }}
                />
              </div>

              {/* NAME */}
              <h4
                style={{
                  fontSize: "0.95rem",
                  marginTop: "12px",
                  color: themeColors.titleColor,
                  fontWeight: "700"
                }}
              >
                {name}
              </h4>

              {/* DESCRIPTION */}
              <p
                style={{
                  fontSize: "0.85rem",
                  color: themeColors.descColor,
                  marginTop: "6px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {description}
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
                    fontWeight: "800",
                    fontSize: "1.2rem",
                    color: themeColors.priceColor,
                  }}
                >
                  ₹{offerprice.toLocaleString()}
                </span>

                <span
                  style={{
                    textDecoration: "line-through",
                    color: "#999",
                    fontSize: "0.9rem",
                  }}
                >
                  ₹{price.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RecommendedProduct;