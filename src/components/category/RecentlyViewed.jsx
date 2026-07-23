import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/cartSlice";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getRecentlyViewed } from "../../services/recentlyViewedService";
import { useWishlist } from "../../hooks/useWishlist";
import { useRatings } from "../../hooks/useRatings";
import Loading from "../../pages/Loading";
import { Clock, ChevronLeft, ChevronRight, Heart, ShoppingCart, Star } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import "./RecentlyViewed.css";

const RecentlyViewed = ({ currentProductId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const scrollRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { wishlisted, toggleWishlist } = useWishlist();
  const ratings = useRatings();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        const cached = sessionStorage.getItem("sadhana_rv_cache");
        if (cached) {
          const cachedFiltered = currentProductId
            ? JSON.parse(cached).filter((item) => item.id !== currentProductId && item.productId !== currentProductId)
            : JSON.parse(cached);
          setProducts(cachedFiltered);
          setLoading(false);
        } else {
          setLoading(true);
        }
        
        const items = await getRecentlyViewed(user);

        // Filter out current product if on ProductDetailPage
        const filtered = currentProductId
          ? items.filter((item) => item.id !== currentProductId && item.productId !== currentProductId)
          : items;

        setProducts(filtered);
        sessionStorage.setItem("sadhana_rv_cache", JSON.stringify(items));
      } catch (err) {
        console.error("Error loading recently viewed products:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentProductId]);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    const finalPrice = product.offerprice || product.price || 0;

    dispatch(
      addToCart({
        id: product.id || product.productId,
        title: product.name || "Product",
        price: finalPrice,
        image: product.image || "",
        quantity: 1,
      })
    );

    toast.success(`${product.name || "Product"} added to cart!`, {
      position: "bottom-right",
      autoClose: 2000,
    });
  };

  const calcDiscount = (price, offerprice) => {
    if (!price || !offerprice || offerprice >= price) return 0;
    return Math.round(((price - offerprice) / price) * 100);
  };

  if (loading) {
    return <Loading small inline message="Loading Recently Viewed..." />;
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="recently-viewed-container">
      <div className="recently-viewed-header">
        <h3 className="recently-viewed-title">
          <Clock size={22} className="text-primary" />
          {t("home.recentlyViewed", "Recently Viewed Products")}
        </h3>

        {products.length > 3 && (
          <div className="recently-viewed-scroll-controls">
            <button
              className="rv-scroll-btn"
              onClick={() => handleScroll("left")}
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="rv-scroll-btn"
              onClick={() => handleScroll("right")}
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="rv-products-grid" ref={scrollRef}>
        {products.map((product) => {
          const pId = product.id || product.productId;
          const price = Number(product.price || 0);
          const offerprice = Number(product.offerprice || price);
          const discount = calcDiscount(price, offerprice);
          const ratingData = ratings[pId];

          return (
            <div
              key={pId}
              className="rv-card"
              onClick={() => navigate(`/product/${pId}`)}
            >
              {discount > 0 && <span className="rv-discount-tag">{discount}% OFF</span>}

              <button
                className="rv-wishlist-btn"
                onClick={(e) => toggleWishlist(e, { id: pId, ...product })}
                aria-label="Wishlist"
              >
                {wishlisted[pId] ? (
                  <Heart size={16} fill="#ff4081" color="#ff4081" />
                ) : (
                  <Heart size={16} color="#64748b" />
                )}
              </button>

              <div className="rv-img-box">
                <img
                  src={product.image || "https://placehold.jp/200x200.png?text=Product"}
                  alt={product.name}
                />
              </div>

              <div className="rv-name">{product.name}</div>

              {ratingData && (
                <div className="rv-rating-row">
                  <Star size={13} fill="#d97706" color="#d97706" />
                  <span>{ratingData.average}</span>
                  <span className="text-muted ms-1" style={{ fontSize: "0.72rem" }}>({ratingData.count})</span>
                </div>
              )}

              <div className="rv-price-row">
                <span className="rv-offer-price">₹{offerprice.toLocaleString()}</span>
                {price > offerprice && (
                  <span className="rv-original-price">₹{price.toLocaleString()}</span>
                )}
                {discount > 0 && (
                  <span className="rv-discount-off" style={{ fontSize: "0.78rem", color: "#059669", fontWeight: 700 }}>{discount}% off</span>
                )}
              </div>

              <button
                className="rv-add-btn"
                onClick={(e) => handleAddToCart(e, product)}
              >
                <ShoppingCart size={14} /> {t("addToCart", "Add to Cart")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentlyViewed;
