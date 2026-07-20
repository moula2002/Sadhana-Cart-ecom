import React, { useEffect, useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { useWishlist } from "../../hooks/useWishlist";
import { useRatings } from "../../hooks/useRatings";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/cartSlice";
import { Toast, ToastContainer } from "react-bootstrap";
import "../../pages/Home.css";

function RecentlyViewedProducts({ showCart = true }) {
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

  useEffect(() => {
    const onStorage = () => setDarkMode(localStorage.getItem("theme") === "dark");
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentlyViewed");
      if (stored) {
        setProducts(JSON.parse(stored).slice(0, 8)); // Show max 8 on home
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


  if (products.length === 0) return null;

  return (
    <>
      <section className="sc-section home-section-animated">
        <div className="sc-header">
          <h2 className="sc-title">Recently Viewed</h2>
          <button 
            className="sc-view-all" 
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onClick={() => navigate('/recently-viewed')}
          >
            View All →
          </button>
        </div>
        
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

                <div className="bs-price-row">
                  <span className="bs-offer">₹{offerprice.toLocaleString()}</span>
                  {price !== offerprice && (
                    <span className="bs-mrp">₹{price.toLocaleString()}</span>
                  )}
                </div>

                {showCart && (
                  <button
                    className="bs-add-btn"
                    onClick={(e) => handleAddToCart(e, product)}
                  >
                    <ShoppingCart size={15} color="#94a3b8" /> Add to Cart
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

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
    </>
  );
}

export default RecentlyViewedProducts;
