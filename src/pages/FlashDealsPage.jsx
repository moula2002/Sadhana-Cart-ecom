import React, { useEffect, useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { useWishlist } from "../hooks/useWishlist";
import { useRatings } from "../hooks/useRatings";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../pages/Loading";
import SkeletonGrid from "../components/SkeletonGrid";
import { useTranslation } from "react-i18next";

function FlashDealsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [products, setProducts] = useState([]);
  const { wishlisted, toggleWishlist } = useWishlist();
  const ratings = useRatings();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "bestArrivals"));
        const list = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(list);
      } catch (error) {
        console.error("Error fetching flash deals:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const calculateDiscount = (offer, old) => {
    if (!offer || !old || old <= offer) return 0;
    return Math.round(((old - offer) / old) * 100);
  };

  const handleAddToCart = (e, product, offerprice, image, name) => {
    e.stopPropagation();
    dispatch(
      addToCart({
        id: product.id,
        title: name,
        price: offerprice,
        image: image,
        quantity: 1,
      })
    );
    toast.success(`${name} added to cart!`, {
      position: "bottom-right",
      autoClose: 2000,
    });
  };

  return (
    <div className="fdp-page-wrapper">
      <ToastContainer position="bottom-right" autoClose={2000} hideProgressBar />
      <div className="fdp-inner">
        <div className="fdp-card">
          <div className="fdp-header">
            <h2 className="fdp-title">{t("home.flashDeals", "Flash Deals")}</h2>
          </div>

          {loading ? (
            <div className="py-2 w-100">
               <SkeletonGrid count={6} />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <h3>{t("home.noDeals", "No Flash Deals Available Right Now")}</h3>
            </div>
          ) : (
            <div className="fd-grid">
              {products.map((product) => {
                const info = product.bestArrivalInfo || {};
                const name = info.title || product.name || "Product";

                const rawPrice = Number(product.price || 0);
                const rawOffer = Number(product.offerprice || product.offerPrice || product.discountPrice || 0);
                const rawOld = Number(product.oldPrice || product.mrp || product.originalPrice || 0);

                let offerprice = 0;
                let oldPrice = 0;

                if (rawOffer > 0 && rawOffer < rawPrice) {
                  offerprice = rawOffer;
                  oldPrice = rawPrice;
                } else if (rawOffer > 0) {
                  offerprice = rawOffer;
                  oldPrice = rawOld > rawOffer ? rawOld : Math.round(rawOffer * 1.2);
                } else if (rawOld > rawPrice && rawPrice > 0) {
                  offerprice = rawPrice;
                  oldPrice = rawOld;
                } else if (rawPrice > 0) {
                  offerprice = rawPrice;
                  oldPrice = Math.round(rawPrice * 1.2);
                } else {
                  offerprice = 0;
                  oldPrice = 0;
                }

                const discount = calculateDiscount(offerprice, oldPrice);
                const image = product.images?.[0] || product.image || "";

                return (
                  <div
                    key={product.id}
                    className="fd-item-card"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <button
                      className="wishlist-btn"
                      onClick={(e) => toggleWishlist(e, product)}
                      aria-label="Wishlist"
                    >
                      {wishlisted[product.id] ? (
                        <Heart size={16} fill="#ff4081" color="#ff4081" />
                      ) : (
                        <Heart size={16} color="#64748b" />
                      )}
                    </button>
                    {discount > 0 && (
                      <span className="fd-discount-tag">{discount}% OFF</span>
                    )}

                    <div className="fd-img-wrap">
                      <img src={image} alt={name} loading="lazy" />
                    </div>

                    <div className="fd-name">{name}</div>

                    {ratings[product.id] && (
                      <div className="sc-rating-badge-container">
                        <span className="sc-rating-badge">
                          {ratings[product.id].average} <span className="star-icon">★</span>
                        </span>
                        <span className="sc-rating-count">({ratings[product.id].count})</span>
                      </div>
                    )}

                    <div className="fd-price-row">
                      <span className="fd-offer">₹{offerprice.toLocaleString()}</span>
                      {oldPrice > offerprice && (
                        <span className="fd-mrp">₹{oldPrice.toLocaleString()}</span>
                      )}
                      {discount > 0 && (
                        <span className="fd-off">{discount}% off</span>
                      )}
                    </div>

                    <button
                      className="fd-add-btn"
                      onClick={(e) => handleAddToCart(e, product, offerprice, image, name)}
                    >
                      <ShoppingCart size={14} /> {t("addToCart", "Add to Cart")}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .fdp-page-wrapper {
          min-height: 100vh;
          padding: 40px 20px;
          background: #f8f9fa;
          transition: background 0.3s ease;
        }
        .fdp-inner {
          max-width: 1200px;
          margin: 0 auto;
        }
        .fdp-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          margin-bottom: 30px;
        }
        .fdp-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 30px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 16px;
        }
        .fdp-title {
          margin: 0;
          font-weight: bold;
          color: #1a202c;
          font-size: 24px;
        }

        .fd-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 20px;
        }

        @media (max-width: 1200px) {
          .fd-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @media (max-width: 900px) {
          .fd-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 600px) {
          .fd-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .fdp-card {
            padding: 15px;
          }
        }

        /* Card styles matching Best Products */
        .fd-item-card {
          background: #fff;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 12px;
          position: relative;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
        }
        .fd-item-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.15);
          border-color: #e2e8f0;
        }

        .fd-item-card .wishlist-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #fff;
          border: 1px solid #f1f5f9;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          z-index: 5;
        }
        .fd-item-card .wishlist-btn:hover {
          transform: scale(1.1);
          background: #f8fafc;
        }

        .fd-discount-tag {
          position: absolute;
          top: 10px;
          left: 10px;
          background: #ef4444;
          color: #fff;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);
          z-index: 5;
        }

        .fd-img-wrap {
          aspect-ratio: 1/1;
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          background: #f8fafc;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fd-img-wrap img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transition: transform 0.5s;
        }
        .fd-item-card:hover .fd-img-wrap img {
          transform: scale(1.05);
        }

        .fd-name {
          font-size: 0.8rem;
          font-weight: 500;
          color: #334155;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 2.4em;
          line-height: 1.2;
        }

        .fd-price-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: auto;
          margin-bottom: 10px;
        }
        .fd-offer {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
        }
        .fd-mrp {
          font-size: 0.75rem;
          text-decoration: line-through;
          color: #94a3b8;
        }
        .fd-off {
          font-size: 0.7rem;
          font-weight: 600;
          color: #22c55e;
        }

        .fd-add-btn {
          width: 100%;
          padding: 9px 12px;
          background: #eff6ff;
          border: none;
          border-radius: 10px;
          color: #2563eb;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease-in-out;
        }
        .fd-add-btn:hover {
          background: #2563eb;
          color: #ffffff;
          transform: translateY(-1px);
        }

        .sc-rating-badge-container {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }
        .sc-rating-badge {
          background: #22c55e;
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }
        .sc-rating-count {
          font-size: 0.7rem;
          color: #94a3b8;
          font-weight: 500;
        }

        /* ── Dark mode overrides ── */
        .dark-theme .fdp-page-wrapper,
        [data-bs-theme="dark"] .fdp-page-wrapper,
        [data-theme="dark"] .fdp-page-wrapper {
          background: #0f172a !important;
        }
        .dark-theme .fdp-card,
        [data-bs-theme="dark"] .fdp-card,
        [data-theme="dark"] .fdp-card {
          background: #1e293b !important;
          box-shadow: 0 2px 16px rgba(0,0,0,0.4) !important;
        }
        .dark-theme .fdp-header,
        [data-bs-theme="dark"] .fdp-header,
        [data-theme="dark"] .fdp-header {
          border-bottom-color: #334155 !important;
        }
        .dark-theme .fdp-title,
        [data-bs-theme="dark"] .fdp-title,
        [data-theme="dark"] .fdp-title {
          color: #f1f5f9 !important;
        }
        .dark-theme .fd-item-card,
        [data-bs-theme="dark"] .fd-item-card,
        [data-theme="dark"] .fd-item-card {
          background: #1e293b;
          border-color: #334155;
        }
        .dark-theme .fd-item-card:hover,
        [data-bs-theme="dark"] .fd-item-card:hover,
        [data-theme="dark"] .fd-item-card:hover {
          border-color: #475569;
        }
        .dark-theme .fd-name,
        [data-bs-theme="dark"] .fd-name,
        [data-theme="dark"] .fd-name {
          color: #cbd5e1;
        }
        .dark-theme .fd-offer,
        [data-bs-theme="dark"] .fd-offer,
        [data-theme="dark"] .fd-offer {
          color: #f8fafc;
        }
        .dark-theme .fd-add-btn,
        [data-bs-theme="dark"] .fd-add-btn,
        [data-theme="dark"] .fd-add-btn {
          background: rgba(37, 99, 235, 0.15) !important;
          color: #60a5fa !important;
          border: none !important;
        }
        .dark-theme .fd-add-btn:hover,
        [data-bs-theme="dark"] .fd-add-btn:hover,
        [data-theme="dark"] .fd-add-btn:hover {
          background: rgba(37, 99, 235, 0.25) !important;
          color: #93c5fd !important;
        }
        .dark-theme .wishlist-btn,
        [data-bs-theme="dark"] .wishlist-btn,
        [data-theme="dark"] .wishlist-btn {
          background: #334155 !important;
          border-color: #475569 !important;
        }
      `}</style>
    </div>
  );
}

export default FlashDealsPage;
