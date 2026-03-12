import React, { useEffect, useRef, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function FeatureProducts() {
  const [products, setProducts] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

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
      current.scrollBy({ left: -400, behavior: "smooth" });
    } else {
      current.scrollBy({ left: 400, behavior: "smooth" });
    }
  };

  const goToProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div
      style={{
        padding: "40px 20px",
        background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
        borderRadius: "30px",
        marginTop: "40px",
        position: "relative",
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          padding: "0 10px",
        }}
      >
        <div>
          <h2
            style={{
              color: "white",
              fontSize: "28px",
              fontWeight: "800",
              margin: 0,
            }}
          >
            Featured Deals
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.7)",
              margin: "5px 0 0 0",
              fontSize: "14px",
            }}
          >
            Handpicked bestsellers just for you
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => scroll("left")} style={navButtonStyle}>
            ❮
          </button>

          <button onClick={() => scroll("right")} style={navButtonStyle}>
            ❯
          </button>
        </div>
      </div>

      {/* PRODUCTS */}
      <div
        ref={scrollRef}
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: "25px",
          overflowX: "auto",
          scrollBehavior: "smooth",
          padding: "10px 5px 30px 5px",
        }}
      >
        <style>
          {`.no-scrollbar::-webkit-scrollbar { display: none; }`}
        </style>

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
                minWidth: "280px",
                maxWidth: "280px",
                background: "white",
                borderRadius: "24px",
                padding: "15px",
                position: "relative",
                flexShrink: 0,
                transition: "all 0.3s ease",
                transform: isHovered ? "translateY(-10px)" : "translateY(0)",
                boxShadow: isHovered
                  ? "0 20px 25px rgba(0,0,0,0.2)"
                  : "0 4px 6px rgba(0,0,0,0.1)",
                cursor: "pointer",
              }}
            >
              {/* DISCOUNT */}
              <div
                style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  background: "#ef4444",
                  color: "white",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                {discount}% OFF
              </div>

              {/* IMAGE */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "18px",
                  overflow: "hidden",
                  marginBottom: "15px",
                }}
              >
                <img
                  src={image}
                  alt={info.title}
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "contain",
                    transition: "transform 0.5s ease",
                    transform: isHovered ? "scale(1.1)" : "scale(1)",
                  }}
                />
              </div>

              {/* CONTENT */}
              <div style={{ padding: "0 5px" }}>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    fontWeight: "600",
                    margin: "0 0 5px 0",
                  }}
                >
                  Limited Offer
                </p>

                <h4
                  style={{
                    fontSize: "17px",
                    margin: "0 0 12px 0",
                    color: "#1e293b",
                    height: "42px",
                    overflow: "hidden",
                  }}
                >
                  {info.title}
                </h4>

                <div style={{ display: "flex", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "22px",
                      fontWeight: "800",
                      color: "#1e3a8a",
                    }}
                  >
                    ₹{price.toLocaleString()}
                  </span>

                  <span
                    style={{
                      textDecoration: "line-through",
                      color: "#94a3b8",
                      fontSize: "14px",
                    }}
                  >
                    ₹{oldPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const navButtonStyle = {
  width: "45px",
  height: "45px",
  borderRadius: "50%",
  border: "none",
  background: "rgba(255,255,255,0.2)",
  color: "#1e3a8a",
  fontSize: "18px",
  cursor: "pointer",
};

export default FeatureProducts;