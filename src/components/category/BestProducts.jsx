import React, { useEffect, useState } from "react";
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
import { Toast, ToastContainer } from "react-bootstrap";
import Loading from "../../pages/Loading";

function BestProducts() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [products, setProducts] = useState([]);
  const { wishlisted, toggleWishlist } = useWishlist();
  const ratings = useRatings();
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  const PAGE_SIZE = 24;

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

  /* ─ shuffle ─ */
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ─ fetch ─ */
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "products"), orderBy("productid"), limit(PAGE_SIZE));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(shuffle(list));
      setLastDoc(snap.docs[snap.docs.length - 1]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!lastDoc || loading) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, "products"), orderBy("productid"),
        startAfter(lastDoc), limit(PAGE_SIZE)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts((prev) => {
        const combined = [...prev, ...list];
        const unique = Array.from(new Map(combined.map((i) => [i.id, i])).values());
        return shuffle(unique);
      });
      setLastDoc(snap.docs[snap.docs.length - 1]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Infinite scroll removed in favor of 'View More' button

  const calcDiscount = (p, op) => {
    if (!p || !op || op >= p) return 0;
    return Math.round(((p - op) / p) * 100);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    dispatch(addToCart({
      id: product.id,
      title: product.name || "Product",
      price: product.offerprice || product.price || 0,
      image: product.images?.[0] || "",
      quantity: 1,
    }));
    setToastMsg(`${product.name || "Product"} added to cart ✓`);
    setShowToast(true);
  };


  return (
    <div>
      <div className="best-sellers-grid">
        {products.map((product) => {
          const image = product.images?.[0] || product.image || "https://via.placeholder.com/300";
          const name = product.name || "Product";
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
              <div className="bs-name">{name}</div>

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

      {loading && products.length === 0 && <Loading />}
      {loading && products.length > 0 && (
        <div style={{ textAlign: "center", padding: "16px" }}>
          <div className="spinner-border spinner-border-sm text-secondary" />
        </div>
      )}

      {!loading && lastDoc && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px", paddingBottom: "8px", paddingRight: "16px" }}>
          <button 
            onClick={loadMore} 
            style={{ 
              background: "none", 
              color: "#2874f0", 
              border: "none", 
              fontWeight: "600",
              fontSize: "0.95rem",
              cursor: "pointer",
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
          >
            View More &rarr;
          </button>
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

export default BestProducts;