import React, { useEffect, useRef, useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { useWishlist } from "../../hooks/useWishlist";
import { useRatings } from "../../hooks/useRatings";
import { db } from "../../firebase";
import {
  collection, query, orderBy, limit, startAfter, getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/cartSlice";
import Loading from "../../pages/Loading";
import { useTranslation } from "react-i18next";

function RecommendedProduct({ showCart = true }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [products, setProducts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const { wishlisted, toggleWishlist } = useWishlist();
  const ratings = useRatings();

  const scrollRef = useRef(null);
  const PAGE_SIZE = 8;

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "products"),
        orderBy("productid"),
        limit(PAGE_SIZE)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(list);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!lastDoc || loading) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "products"),
        orderBy("productid"),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts((prev) => [...prev, ...list]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 60 && !loading) {
      loadMore();
    }
  };

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -360 : 360, behavior: "smooth" });
    }
  };

  const calculateDiscount = (price, offerprice) => {
    if (!price || !offerprice || offerprice >= price) return 0;
    return Math.round(((price - offerprice) / price) * 100);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    dispatch(
      addToCart({
        id: product.id,
        title: product.name || "Product",
        price: product.offerprice || product.price || 0,
        image: product.images?.[0] || "",
        quantity: 1,
      })
    );
  };


  if (products.length === 0 && !loading) return null;

  return (
    <div style={{ position: "relative" }}>
      {/* Left scroll */}
      <button
        onClick={() => scroll("left")}
        style={scrollBtnStyle("left")}
        aria-label="Scroll left"
      >
        ‹
      </button>

      <div ref={scrollRef} onScroll={handleScroll} className="sc-products-row">
        {products.map((product) => {
          const rawName = product.name || "Product";
          const name = rawName.length > 45 ? rawName.substring(0, 45) + "..." : rawName;
          const price = product.price || 0;
          const offerprice = product.offerprice || price;
          const discount = calculateDiscount(price, offerprice);
          const image = product.images?.[0] || product.image || "";

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
                {wishlisted[product.id] ? <Heart size={16} fill="#ff4081" color="#ff4081" /> : <Heart size={16} color="#64748b" />}
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
                <span className="sc-offer">₹{offerprice.toLocaleString()}</span>
                {price !== offerprice && (
                  <span className="sc-mrp">₹{price.toLocaleString()}</span>
                )}
                {discount > 0 && (
                  <span className="sc-off">{discount}% off</span>
                )}
              </div>

              {/* Add to Cart */}
              {showCart && (
                <button
                  className="sc-add-btn"
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  <ShoppingCart size={14} /> {t("addToCart", "Add to Cart")}
                </button>
              )}
            </div>
          );
        })}

        {loading && (
          <>
            <div className="sc-product-card skeleton-card" style={{ height: "280px", minWidth: "180px", flexShrink: 0 }}></div>
            <div className="sc-product-card skeleton-card" style={{ height: "280px", minWidth: "180px", flexShrink: 0 }}></div>
            <div className="sc-product-card skeleton-card" style={{ height: "280px", minWidth: "180px", flexShrink: 0 }}></div>
          </>
        )}
      </div>

      {/* Right scroll */}
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

export default RecommendedProduct;