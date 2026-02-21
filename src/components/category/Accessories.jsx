import React, { useState, useEffect, useRef, useCallback } from "react";
import { Container, Spinner, Row, Col, Card, Alert } from "react-bootstrap";
import { db } from "../../firebase";
import { useTranslation } from "react-i18next";

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import "./Accessories.css"; // Import CSS file for dark mode styles

// 🌈 Utility: Extract Color
const extractColorFromDescription = (description) => {
  if (!description || typeof description !== "string") return "N/A";
  const match = description.match(/color:\s*([a-zA-Z]+)/i);
  return match ? match[1] : "N/A";
};

// 🌙 Utility: Get theme-aware colors
const getThemeAwareColors = () => {
  const isDarkMode = document.body.classList.contains('dark-theme') || 
                     document.documentElement.getAttribute('data-bs-theme') === 'dark';
  
  return {
    textPrimary: isDarkMode ? '#e9ecef' : '#212529',
    textSecondary: isDarkMode ? '#adb5bd' : '#6c757d',
    bgPrimary: isDarkMode ? '#121212' : '#ffffff',
    bgSecondary: isDarkMode ? '#1e1e1e' : '#f8f9fa',
    cardBg: isDarkMode ? '#2d2d2d' : '#ffffff',
    borderColor: isDarkMode ? '#444' : '#dee2e6',
    shadowColor: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
  };
};

// 💎 Product Card
const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Check for dark mode on mount and changes
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.body.classList.contains('dark-theme') || 
                     document.documentElement.getAttribute('data-bs-theme') === 'dark';
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });

    return () => observer.disconnect();
  }, []);

  const productColor =
    product.color || extractColorFromDescription(product.description);

  // Define color mapping for common colors
  const getColorValue = (colorName) => {
    const colorMap = {
      red: "#dc3545",
      blue: "#0d6efd",
      green: "#198754",
      yellow: "#ffc107",
      black: isDarkMode ? "#e9ecef" : "#212529",
      white: isDarkMode ? "#121212" : "#ffffff",
      pink: "#d63384",
      purple: "#6f42c1",
      orange: "#fd7e14",
      grey: "#6c757d",
      gray: "#6c757d",
      brown: "#795548",
      navy: "#001f3f",
      teal: "#20c997",
      cyan: "#0dcaf0",
      indigo: "#6610f2",
      maroon: "#800000",
      olive: "#808000",
      lime: "#84cc16",
      gold: "#ffd700",
      silver: "#c0c0c0",
      violet: "#8a2be2",
      magenta: "#ff00ff",
      coral: "#ff7f50",
      turquoise: "#40e0d0",
      beige: "#f5f5dc",
      lavender: "#e6e6fa",
      mint: "#98ff98",
      peach: "#ffdab9",
      rose: "#ff007f",
      skyblue: "#87ceeb",
      chocolate: "#d2691e",
      ivory: "#fffff0",
      khaki: "#f0e68c",
      plum: "#dda0dd",
      salmon: "#fa8072",
      tan: "#d2b48c",
      wine: "#722f37",
    };

    const normalizedColor = colorName.toLowerCase().trim();
    return colorMap[normalizedColor] || (isDarkMode ? "#444" : "#e9ecef");
  };

  const borderColor = getColorValue(productColor);
  const colors = getThemeAwareColors();

  const cardStyle = {
    border: `3px solid ${borderColor}`,
    borderRadius: "16px",
    overflow: "hidden",
    backgroundColor: colors.cardBg,
    boxShadow: isHovered
      ? `0 10px 25px ${borderColor}${isDarkMode ? '33' : '40'}`
      : `0 4px 12px ${borderColor}${isDarkMode ? '20' : '20'}`,
    transform: isHovered ? "translateY(-8px) scale(1.03)" : "scale(1)",
    transition: "all 0.3s ease",
  };

  const imageContainer = {
    height: "250px",
    backgroundColor: colors.bgSecondary,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  };

  const imageStyle = {
    height: "100%",
    width: "100%",
    objectFit: "contain",
    transition: "transform 0.4s ease",
    transform: isHovered ? "scale(1.1)" : "scale(1)",
  };

  return (
    <Col>
      <Link
        to={`/product/${product.id}`}
        style={{ textDecoration: "none", color: "inherit" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card style={cardStyle} className="h-100 theme-card accessories-card">
          <div style={imageContainer} className="accessories-image-container">
            <Card.Img
              variant="top"
              src={
                product.images ||
                product.image ||
                `https://via.placeholder.com/250x300.png?text=No+Image`
              }
              alt={product.name}
              style={imageStyle}
            />
          </div>
          <Card.Body className="p-3 text-center">
            <Card.Title className="fs-6 fw-semibold text-truncate theme-text">
              {product.name || t("common.unnamedProduct")
}
            </Card.Title>
            <Card.Text className="small mb-2 theme-text-secondary">
              Color:{" "}
              <strong style={{ color: borderColor }}>
                {productColor}
              </strong>
            </Card.Text>
            <Card.Text className="fw-bold fs-5 theme-accent">
              ₹{product.price || t("common.notAvailable")}
            </Card.Text>
          </Card.Body>
        </Card>
      </Link>
    </Col>
  );
};

// -------------------------------------------------------------
function Accessories() {
  const { t } = useTranslation();
  const categoryName = "Accessories";
  const PAGE_SIZE = 8;
  const [products, setProducts] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const observer = useRef();

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.body.classList.contains('dark-theme') || 
                     document.documentElement.getAttribute('data-bs-theme') === 'dark';
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });

    return () => observer.disconnect();
  }, []);

  // 🧠 Initial Fetch (with random start)
  useEffect(() => {
    const fetchInitialProducts = async () => {
      try {
        setLoading(true);
        setProducts([]);
        setHasMore(true);

        const productsRef = collection(db, "products");
        const countQuery = query(
          productsRef,
          where("category", "==", categoryName)
        );
        const countSnapshot = await getDocs(countQuery);
        const totalProducts = countSnapshot.docs.length;

        if (totalProducts === 0) {
          setLoading(false);
          setHasMore(false);
          return;
        }

        const maxSkip = totalProducts - PAGE_SIZE;
        const skipCount =
          totalProducts > PAGE_SIZE ? Math.floor(Math.random() * maxSkip) : 0;

        let startDoc = null;
        if (skipCount > 0) {
          const startDocQuery = query(
            productsRef,
            where("category", "==", categoryName),
            orderBy("name"),
            limit(skipCount)
          );
          const startDocSnapshot = await getDocs(startDocQuery);
          startDoc = startDocSnapshot.docs[startDocSnapshot.docs.length - 1];
        }

        let initialQuery = query(
          productsRef,
          where("category", "==", categoryName),
          orderBy("name"),
          limit(PAGE_SIZE)
        );

        if (startDoc) {
          initialQuery = query(
            productsRef,
            where("category", "==", categoryName),
            orderBy("name"),
            startAfter(startDoc),
            limit(PAGE_SIZE)
          );
        }

        const snapshot = await getDocs(initialQuery);
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(fetched);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        if (snapshot.docs.length < PAGE_SIZE || totalProducts <= PAGE_SIZE)
          setHasMore(false);
      } catch (err) {
        console.error("🔥 Error fetching accessories:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialProducts();
  }, [categoryName]);

  // 🌀 Load More
  const loadMore = useCallback(async () => {
    if (!lastVisible || loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const productsRef = collection(db, "products");
      const nextQuery = query(
        productsRef,
        where("category", "==", categoryName),
        orderBy("name"),
        startAfter(lastVisible),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(nextQuery);
      const newProducts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (newProducts.length === 0) {
        setHasMore(false);
        return;
      }

      setProducts((prev) => [...prev, ...newProducts]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      if (snapshot.docs.length < PAGE_SIZE) setHasMore(false);
    } catch (err) {
      console.error("Error loading more accessories:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [lastVisible, loadingMore, hasMore, categoryName]);

  // 👁️ Infinite Scroll
  const lastProductRef = useCallback(
    (node) => {
      if (loadingMore || loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) loadMore();
      });

      if (node) observer.current.observe(node);
    },
    [loadMore, hasMore, loadingMore, loading]
  );

  // 🧩 Render
  return (
    <Container className="my-5 text-center accessories-container">
      <h2
        className="fw-bold mb-3 theme-text"
        style={{
          fontSize: "2rem",
          letterSpacing: "1px",
        }}
      >
        👜 {t("accessories.collectionTitle", { category: categoryName })}
      </h2>
      <p className="mb-5 theme-text-secondary">
  {t("accessories.description", { category: categoryName })}
</p>


      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant={isDarkMode ? "light" : "warning"} />
          <p className="mt-3 theme-text-secondary">{t("accessories.loading")}</p>
        </div>
      ) : products.length > 0 ? (
        <>
          <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {products.map((product, index) => {
              const isLastElement = index === products.length - 1;
              const ref = isLastElement ? lastProductRef : null;

              return (
                <div ref={ref} key={product.id}>
                  <ProductCard product={product} />
                </div>
              );
            })}
          </Row>

          {loadingMore && (
            <div className="text-center my-4">
              <Spinner animation="grow" variant={isDarkMode ? "light" : "secondary"} />
              <p className="theme-text-secondary">{t("common.loadingMore")}</p>
            </div>
          )}

          {!hasMore && (
            <p className="mt-4 theme-text-secondary">{t("common.refresh")}</p>
          )}
        </>
      ) : (
        <Alert variant={isDarkMode ? "dark" : "warning"} className="p-4 theme-alert">
          <p className="mb-0 theme-text">
            {t("accessories.noProducts", { category: categoryName })}
          </p>
        </Alert>
      )}
    </Container>
  );
}

export default Accessories;