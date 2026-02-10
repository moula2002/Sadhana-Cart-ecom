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

/* ------------------------------------------------ */
/* 🌈 Extract Color */
const extractColorFromDescription = (description) => {
  if (!description || typeof description !== "string") return "N/A";
  const match = description.match(/color:\s*([a-zA-Z]+)/i);
  return match ? match[1] : "N/A";
};

/* ------------------------------------------------ */
/* 🎨 Color Map */
const getColorValue = (colorName) => {
  const colorMap = {
    black: "#212529",
    silver: "#c0c0c0",
    gray: "#6c757d",
    grey: "#6c757d",
    blue: "#0d6efd",
    white: "#ffffff",
    gold: "#ffd700",
    red: "#dc3545",
    green: "#198754",
    purple: "#6f42c1",
    orange: "#fd7e14",
  };

  return colorMap[colorName?.toLowerCase()] || "#e9ecef";
};

/* ------------------------------------------------ */
/* 💻 Product Card (SAME AS COSMETICS STYLE) */
const ProductCard = ({ product }) => {
  const [hover, setHover] = useState(false);

  const productColor =
    product.color || extractColorFromDescription(product.description);

  const borderColor = getColorValue(productColor);

  return (
    <Col>
      <Link
        to={`/product/${product.id}`}
        style={{ textDecoration: "none", color: "inherit" }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <Card
          className="h-100"
          style={{
            border: `3px solid ${borderColor}`,
            borderRadius: "18px",
            overflow: "hidden",
            background: "#ffffff",
            transform: hover ? "translateY(-8px) scale(1.03)" : "scale(1)",
            boxShadow: hover
              ? `0 12px 28px ${borderColor}40`
              : `0 6px 14px ${borderColor}20`,
            transition: "all 0.3s ease",
          }}
        >
          {/* Image */}
          <div
            style={{
              height: "240px",
              background: "#f8f9fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
            <Card.Title className="fs-6 fw-semibold text-truncate">
              {product.name || "Electronic Product"}
            </Card.Title>

            <p className="small text-secondary mb-1">
              Color:{" "}
              <strong style={{ color: borderColor }}>{productColor}</strong>
            </p>

            <div className="fw-bold fs-5 text-danger">
              ₹{product.price || "N/A"}
            </div>
          </Card.Body>
        </Card>
      </Link>
    </Col>
  );
};

/* ------------------------------------------------ */
/* 💻 Electronics Page */
function Electronics() {
  const categoryName = "Electronics";
  const PAGE_SIZE = 8;

  const [products, setProducts] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef();

  /* Initial Fetch */
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setLoading(true);
        setProducts([]);
        setHasMore(true);

        const productsRef = collection(db, "products");

        const countSnap = await getDocs(
          query(productsRef, where("category", "==", categoryName))
        );

        if (countSnap.empty) {
          setHasMore(false);
          return;
        }

        const q = query(
          productsRef,
          where("category", "==", categoryName),
          orderBy("name"),
          limit(PAGE_SIZE)
        );

        const snap = await getDocs(q);

        setProducts(
          snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );

        setLastVisible(snap.docs[snap.docs.length - 1]);
        if (snap.docs.length < PAGE_SIZE) setHasMore(false);
      } catch (err) {
        console.error("Electronics fetch error:", err);
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
      console.error("Load more electronics error:", err);
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
    <Container className="my-5 text-center">
      <h2 className="fw-bold mb-3">💻 Electronics Collection</h2>
      <p className="text-muted mb-5">
        Discover latest gadgets & smart devices ⚡
      </p>

      {loading ? (
        <div className="my-5">
          <Spinner animation="border" variant="info" />
          <p className="text-muted mt-3">Loading electronics...</p>
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
              <Spinner animation="grow" />
            </div>
          )}

          {!hasMore && (
            <p className="text-muted mt-4">
              No more electronics available
            </p>
          )}
        </>
      ) : (
        <Alert variant="info">No electronics found</Alert>
      )}
    </Container>
  );
}
export default Electronics;
