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

  const PAGE_SIZE = 5;

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
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "30px",
        marginTop: "40px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      }}
    >
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

        <button
          onClick={fetchProducts}
          style={{
            background: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "25px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {/* PRODUCT LIST */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: "flex",
          gap: "20px",
          overflowX: "auto",
          paddingBottom: "20px",
        }}
      >
        {products.map((product) => {
          const image =
            product.images?.[0] ||
            product.image ||
            "https://via.placeholder.com/260x180";

          const name = product.name || "Product";

          const price = product.price || 0;

          const offerprice = product.offerprice || price;

          const discount = calculateDiscount(price, offerprice);

          return (
            <div
              key={product.id}
              onClick={() => navigate(`/product/${product.id}`)}
              style={{
                minWidth: "220px",
                background: "white",
                borderRadius: "15px",
                padding: "15px",
                position: "relative",
                flexShrink: 0,
                boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                cursor: "pointer",
                transform:
                  hoveredCard === product.id ? "translateY(-5px)" : "none",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={() => setHoveredCard(product.id)}
              onMouseLeave={() => setHoveredCard(null)}
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
                }}
              >
                <img
                  src={image}
                  alt={name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>

              {/* NAME */}
              <h4
                style={{
                  fontSize: "0.95rem",
                  marginTop: "12px",
                  color: "#333",
                }}
              >
                {name}
              </h4>

              {/* PRICE */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "1.1rem",
                    color: "#2c3e50",
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

              {/* ADD CART BUTTON */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  alert("Add to Cart clicked");
                }}
                style={{
                  width: "100%",
                  background: "#667eea",
                  border: "none",
                  color: "white",
                  padding: "10px",
                  borderRadius: "8px",
                  marginTop: "12px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                }}
              >
                Add to Cart
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RecommendedProduct;