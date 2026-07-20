import React, { useEffect, useRef, useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { useWishlist } from "../../hooks/useWishlist";
import { useRatings } from "../../hooks/useRatings";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function FeatureProducts({ showCart = false }) {
  const [products, setProducts] = useState([]);
  const { wishlisted, toggleWishlist } = useWishlist();
  const ratings = useRatings();
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
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
    fetchProducts();
  }, []);

  const calculateDiscount = (price, oldPrice) => {
    if (!price || !oldPrice || oldPrice <= price) return 0;
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  };

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -360 : 360, behavior: "smooth" });
    }
  };


  if (products.length === 0) return null;

  return (
    <div style={{ position: "relative" }}>
      {/* Scroll buttons */}
      <button
        onClick={() => scroll("left")}
        style={scrollBtnStyle("left")}
        aria-label="Scroll left"
      >
        ‹
      </button>

      <div ref={scrollRef} className="sc-products-row">
        {products.map((product) => {
          const info = product.featuredProductInfo || {};
          const name = info.title || product.name || "Product";
          const price = product.price || 0;
          const oldPrice = product.oldPrice || 0;
          const discount = calculateDiscount(price, oldPrice);
          const image = product.images?.[0] || "";

          return (
            <div
              key={product.id}
              className="sc-product-card"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              {/* Wishlist */}
              <button
                className="wishlist-btn"
                onClick={(e) => toggleWishlist(e, product)}
                aria-label="Wishlist"
              >
                {wishlisted[product.id] ? <Heart size={20} fill="#ff4081" color="#ff4081" /> : <Heart size={20} strokeWidth={2.5} color="#555" />}
              </button>

              {/* Discount tag */}
              {discount > 0 && (
                <span className="sc-discount-tag">{discount}% OFF</span>
              )}

              {/* Image */}
              <div className="img-box">
                <img src={image} alt={name} loading="lazy" />
              </div>

              {/* Name */}
              <div className="sc-name">{name}</div>

              {/* Rating */}
              {ratings[product.id] && (
                <div className="sc-rating-badge-container">
                  <span className="sc-rating-badge">
                    {ratings[product.id].average} <span className="star-icon">★</span>
                  </span>
                  <span className="sc-rating-count">({ratings[product.id].count})</span>
                </div>
              )}

              {/* Price */}
              <div className="sc-price-row">
                <span className="sc-offer">₹{price.toLocaleString()}</span>
                {oldPrice > price && (
                  <span className="sc-mrp">₹{oldPrice.toLocaleString()}</span>
                )}
                {discount > 0 && (
                  <span className="sc-off">{discount}% off</span>
                )}
              </div>

              {/* Add to Cart — only if showCart=true */}
              {showCart && (
                <button
                  className="sc-add-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    // dispatch handled in parent or can add here
                  }}
                >
                  <ShoppingCart size={15} color="#94a3b8" /> Add to Cart
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => scroll("right")}
        style={scrollBtnStyle("right")}
        aria-label="Scroll right"
      >
        ›
      </button>
    </div>
  );
}

const scrollBtnStyle = (side) => ({
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  [side === "left" ? "left" : "right"]: "-14px",
  zIndex: 10,
  width: "28px",
  height: "60px",
  background: "rgba(255,255,255,0.95)",
  border: "1px solid #e0e0e0",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "1.2rem",
  color: "#555",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  transition: "background 0.2s",
});

export default FeatureProducts;