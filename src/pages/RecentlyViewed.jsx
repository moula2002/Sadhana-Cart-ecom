import React, { useEffect, useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { useWishlist } from "../hooks/useWishlist";
import { useRatings } from "../hooks/useRatings";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { Toast, ToastContainer } from "react-bootstrap";
import "./Home.css"; // Reuse the card styling from Home.css

function RecentlyViewed() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [products, setProducts] = useState([]);
  const { wishlisted, toggleWishlist } = useWishlist();
  const ratings = useRatings();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  /* ─ theme sync ─ */
  useEffect(() => {
    const onStorage = () => setDarkMode(localStorage.getItem("theme") === "dark");
    window.addEventListener("storage", onStorage);
    const obs = new MutationObserver(() => {
      setDarkMode(
        document.documentElement.getAttribute("data-bs-theme") === "dark" ||
        document.body.classList.contains("dark-theme")
      );
    });
    obs.observe(document.documentElement, { attributes: true });
    obs.observe(document.body, { attributes: true });
    return () => { window.removeEventListener("storage", onStorage); obs.disconnect(); };
  }, []);

  /* ─ fetch from localStorage ─ */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentlyViewed");
      if (stored) {
        setProducts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error reading recentlyViewed from localStorage", e);
    }
  }, []);

  const calcDiscount = (p, op) => {
    if (!p || !op || op >= p) return 0;
    return Math.round(((p - op) / p) * 100);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    dispatch(addToCart({
      id: product.id,
      title: product.name || product.title || "Product",
      price: product.offerprice || product.price || 0,
      image: product.images?.[0] || product.image || "",
      quantity: 1,
    }));
    setToastMsg(`${product.name || product.title || "Product"} added to cart ✓`);
    setShowToast(true);
  };


  return (
    <div className="container my-5" style={{ minHeight: "60vh" }}>
      <h2 className="mb-4" style={{ fontWeight: "700", color: "var(--text-dark, #333)" }}>
        Recently Viewed
      </h2>
      
      {products.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted" style={{ fontSize: "1.1rem" }}>You haven't viewed any products yet.</p>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => navigate('/')}
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="best-sellers-grid">
          {products.map((product) => {
            const image = product.images?.[0] || product.image || "https://via.placeholder.com/300";
            const name = product.name || product.title || "Product";
            const price = product.price || 0;
            const offerprice = product.offerprice || price;
            const discount = calcDiscount(price, offerprice);
            const rating = product.rating || 4.2;
            const reviews = product.reviewCount || Math.floor(Math.random() * 3000 + 100);

            return (
              <div
                key={product.id}
                className="bs-card"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <button
                  className="wishlist-btn"
                  onClick={(e) => toggleWishlist(e, product)}
                  aria-label="Wishlist"
                >
                  {wishlisted[product.id] ? <Heart size={20} fill="#ff4081" color="#ff4081" /> : <Heart size={20} strokeWidth={2.5} color="#555" />}
                </button>
                {discount > 0 && <span className="bs-discount-tag">{discount}% OFF</span>}

                <div className="bs-img-wrap">
                  <img src={image} alt={name} loading="lazy" />
                </div>

                {/* Name */}
                <div className="bs-name">{product.name || product.title}</div>

                {/* Rating */}
                {ratings[product.id] && (
                  <div className="sc-rating-badge-container">
                    <span className="sc-rating-badge">
                      {ratings[product.id].average} <span className="star-icon">★</span>
                    </span>
                    <span className="sc-rating-count">({ratings[product.id].count})</span>
                  </div>
                )}

                {/* Price Info */}
                <div className="bs-price-row">
                  <span className="bs-offer">₹{offerprice.toLocaleString()}</span>
                  {price !== offerprice && (
                    <span className="bs-mrp">₹{price.toLocaleString()}</span>
                  )}
                </div>

                <button
                  className="bs-add-btn"
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  <ShoppingCart size={15} color="#94a3b8" /> Add to Cart
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg={darkMode ? "dark" : "light"}
        >
          <Toast.Body style={{ color: darkMode ? "white" : "black" }}>
            {toastMsg}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}

export default RecentlyViewed;
