import React, { useState, useEffect, useRef, useCallback } from "react";
import { Container, Spinner, Row, Col, Card, Alert } from "react-bootstrap";
import { db } from "../../firebase";
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
import "./Books.css"; // Import CSS file for dark mode styles

/* ------------------------------------------------ */
/* 🌈 Extract Color */
const extractColorFromDescription = (description) => {
  if (!description || typeof description !== "string") return "N/A";
  const match = description.match(/color:\s*([a-zA-Z]+)/i);
  return match ? match[1] : "N/A";
};

/* ------------------------------------------------ */
/* 🎨 Theme-aware Color Map */
const getColorValue = (colorName, isDarkMode = false) => {
  const colorMap = {
    red: "#dc3545",
    blue: "#0d6efd",
    green: "#198754",
    yellow: "#ffc107",
    black: isDarkMode ? "#e9ecef" : "#212529",
    white: isDarkMode ? "#2d2d2d" : "#ffffff",
    purple: "#6f42c1",
    brown: "#795548",
    gold: "#ffd700",
    grey: "#6c757d",
    gray: "#6c757d",
  };
  return colorMap[colorName?.toLowerCase()] || (isDarkMode ? "#444" : "#e9ecef");
};

/* ------------------------------------------------ */
/* 🌙 Theme-aware Colors Utility */
const getThemeAwareColors = () => {
  const isDarkMode = document.body.classList.contains('dark-theme') || 
                     document.documentElement.getAttribute('data-bs-theme') === 'dark';
  
  return {
    textPrimary: isDarkMode ? '#e9ecef' : '#212529',
    textSecondary: isDarkMode ? '#adb5bd' : '#6c757d',
    textSuccess: isDarkMode ? '#75b798' : '#198754',
    bgPrimary: isDarkMode ? '#121212' : '#ffffff',
    bgSecondary: isDarkMode ? '#1e1e1e' : '#f8f9fa',
    cardBg: isDarkMode ? '#2d2d2d' : '#ffffff',
    borderColor: isDarkMode ? '#444' : '#dee2e6',
    shadowColor: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
    accentColor: isDarkMode ? '#4dabf7' : '#0d6efd',
  };
};

/* ------------------------------------------------ */
/* 📚 Product Card */
const ProductCard = ({ product }) => {
  const [hover, setHover] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
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

  const productColor = product.color || extractColorFromDescription(product.description);
  const borderColor = getColorValue(productColor, isDarkMode);
  const colors = getThemeAwareColors();

  return (
    <Col>
      <Link
        to={`/product/${product.id}`}
        style={{ textDecoration: "none", color: "inherit" }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <Card
          className="h-100 book-card theme-card"
          style={{
            border: `3px solid ${borderColor}`,
            borderRadius: "18px",
            overflow: "hidden",
            background: colors.cardBg,
            transform: hover ? "translateY(-8px) scale(1.03)" : "scale(1)",
            boxShadow: hover
              ? `0 12px 28px ${borderColor}${isDarkMode ? '33' : '40'}`
              : `0 6px 14px ${borderColor}${isDarkMode ? '20' : '20'}`,
            transition: "all 0.3s ease",
          }}
        >
          {/* Image */}
          <div
            className="book-image-container"
            style={{
              height: "240px",
              background: colors.bgSecondary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.3s ease",
            }}
          >
            <img
              src={
                product.images ||
                product.image ||
                "https://via.placeholder.com/250x300?text=No+Image"
              }
              alt={product.name}
              style={{
                height: "100%",
                width: "100%",
                objectFit: "contain",
                transform: hover ? "scale(1.1)" : "scale(1)",
                transition: "transform 0.4s ease",
              }}
            />
          </div>

          {/* Content */}
          <Card.Body className="text-center p-3">
            <Card.Title className="fs-6 fw-semibold text-truncate theme-text">
              {product.name || "Book"}
            </Card.Title>

            <p className="small mb-1 theme-text-secondary">
              Author:{" "}
              <strong style={{ color: borderColor }} className="theme-accent">
                {product.author || product.brand || "Unknown"}
              </strong>
            </p>

            <div className="fw-bold fs-5 theme-success">
              ₹{product.price || "N/A"}
            </div>
          </Card.Body>
        </Card>
      </Link>
    </Col>
  );
};

/* ------------------------------------------------ */
/* 📚 Book Page */
function Book() {
  const categoryName = "Books";
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

  /* Initial Fetch */
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setLoading(true);
        setProducts([]);
        setHasMore(true);

        const productsRef = collection(db, "products");

        const q = query(
          productsRef,
          where("category", "==", categoryName),
          orderBy("name"),
          limit(PAGE_SIZE)
        );

        const snap = await getDocs(q);

        if (snap.empty) {
          setHasMore(false);
          return;
        }

        setProducts(
          snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );

        setLastVisible(snap.docs[snap.docs.length - 1]);
        if (snap.docs.length < PAGE_SIZE) setHasMore(false);
      } catch (err) {
        console.error("Book fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();
  }, []);

  /* Load More */
  const loadMore = useCallback(async () => {
    if (!lastVisible || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);

      const q = query(
        collection(db, "products"),
        where("category", "==", categoryName),
        orderBy("name"),
        startAfter(lastVisible),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (data.length === 0) {
        setHasMore(false);
        return;
      }

      setProducts((prev) => [...prev, ...data]);
      setLastVisible(snap.docs[snap.docs.length - 1]);

      if (snap.docs.length < PAGE_SIZE) setHasMore(false);
    } catch (err) {
      console.error("Load more books error:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [lastVisible, loadingMore, hasMore]);

  /* Intersection Observer */
  const lastProductRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) loadMore();
      });

      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore, loadMore]
  );

  return (
    <Container className="my-5 text-center books-container">
      <h2 className="fw-bold mb-3 theme-text">📚 Books Collection</h2>
      <p className="mb-5 theme-text-secondary">
        Discover knowledge, stories & inspiration 📖
      </p>

      {loading ? (
        <div className="my-5">
          <Spinner animation="border" variant={isDarkMode ? "light" : "primary"} />
          <p className="mt-3 theme-text-secondary">Loading books...</p>
        </div>
      ) : products.length > 0 ? (
        <>
          <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {products.map((product, index) => {
              const isLast = index === products.length - 1;
              return (
                <div ref={isLast ? lastProductRef : null} key={product.id}>
                  <ProductCard product={product} />
                </div>
              );
            })}
          </Row>

          {loadingMore && (
            <div className="text-center my-4">
              <Spinner animation="grow" variant={isDarkMode ? "light" : "secondary"} />
              <p className="theme-text-secondary">Loading more books...</p>
            </div>
          )}

          {!hasMore && (
            <p className="mt-4 theme-text-secondary">No more books available</p>
          )}
        </>
      ) : (
        <Alert variant={isDarkMode ? "dark" : "warning"} className="theme-alert">
          <p className="mb-0 theme-text">No books found</p>
        </Alert>
      )}
    </Container>
  );
}

export default Book;