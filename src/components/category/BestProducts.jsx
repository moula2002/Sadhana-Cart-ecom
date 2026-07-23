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
import SkeletonGrid from "../SkeletonGrid";
import { useTranslation } from "react-i18next";

function BestProducts() {
  const { t } = useTranslation();
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
                {wishlisted[product.id] ? <Heart size={16} fill="#ff4081" color="#ff4081" /> : <Heart size={16} color="#64748b" />}
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
                {price > offerprice && (
                  <span className="bs-mrp">₹{price.toLocaleString()}</span>
                )}
                {discount > 0 && (
                  <span className="bs-off">{discount}% off</span>
                )}
              </div>

              <button
                className="bs-add-btn"
                onClick={(e) => handleAddToCart(e, product)}
              >
                <ShoppingCart size={14} /> {t("addToCart", "Add to Cart")}
              </button>
            </div>
          );
        })}
      </div>

      {loading && products.length === 0 && <SkeletonGrid count={8} wrapperClass="mt-2" />}
      {loading && products.length > 0 && (
        <div style={{ textAlign: "center", padding: "16px" }}>
          <Loading small inline />
        </div>
      )}

      {!loading && lastDoc && (
        <div className="d-flex flex-column align-items-end mt-1 mb-0 px-1 position-relative ms-auto" style={{ width: 'fit-content' }}>
          {/* Animated Popup Tooltip Badge */}
          <div className="view-more-tooltip-badge me-1">
            <span>Discover More Products!</span>
          </div>

          {/* View All Button matching user screenshot */}
          <button 
            onClick={loadMore} 
            className="view-all-link-btn d-flex align-items-center gap-1"
          >
            <span>{t("home.viewAll", "View All")}</span>
            <span className="view-all-arrow">→</span>
          </button>
        </div>
      )}

      <style>{`
        .view-more-tooltip-badge {
          position: relative;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 0.68rem;
          padding: 3px 10px;
          border-radius: 6px;
          box-shadow: 0 4px 14px rgba(217, 70, 239, 0.35);
          margin-bottom: 3px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          animation: tooltipShake 3.2s infinite cubic-bezier(0.36, 0.07, 0.19, 0.97);
          transform-origin: center bottom;
          white-space: nowrap;
          letter-spacing: 0.02em;
        }

        .view-more-tooltip-badge::after {
          content: "";
          position: absolute;
          bottom: -5px;
          right: 20px;
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid #d946ef;
        }

        @keyframes tooltipShake {
          0%, 80%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          85% {
            transform: translateY(-2px) rotate(-3deg);
          }
          90% {
            transform: translateY(-2px) rotate(3deg);
          }
          95% {
            transform: translateY(-1px) rotate(-1.5deg);
          }
        }

        .view-all-link-btn {
          background: transparent !important;
          color: #8b5cf6 !important;
          border: none !important;
          font-weight: 700 !important;
          font-size: 0.85rem !important;
          cursor: pointer !important;
          padding: 2px 4px !important;
          transition: all 0.2s ease-in-out !important;
          display: flex !important;
          align-items: center !important;
          gap: 3px !important;
        }

        .view-all-link-btn:hover {
          color: #7c3aed !important;
        }

        .view-all-link-btn:hover .view-all-arrow {
          transform: translateX(3px);
        }

        .view-all-arrow {
          font-size: 0.95rem;
          font-weight: 700;
          transition: transform 0.2s ease;
        }
      `}</style>

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