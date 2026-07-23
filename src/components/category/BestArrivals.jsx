import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, ShoppingCart } from "lucide-react";
import { useWishlist } from "../../hooks/useWishlist";
import { useRatings } from "../../hooks/useRatings";
import { db } from "../../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/cartSlice";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

function BestArrivals({ showCart = false }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const { wishlisted, toggleWishlist } = useWishlist();
  const ratings = useRatings();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let timer = null;

    const fetchTimerConfig = async () => {
      try {
        const timerDoc = await getDoc(doc(db, 'settings', 'bestArrivalsConfig'));
        if (timerDoc.exists() && timerDoc.data().targetDate) {
          const targetDate = new Date(timerDoc.data().targetDate);
          
          timer = setInterval(() => {
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();
            
            if (diff <= 0) {
              clearInterval(timer);
              setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            } else {
              setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60),
              });
            }
          }, 1000);
        }
      } catch (err) {
        console.error('Error fetching timer config:', err);
      }
    };
    fetchTimerConfig();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      const cached = sessionStorage.getItem("sadhana_flash_deals");
      if (cached) {
        setProducts(JSON.parse(cached));
      }

      try {
        const querySnapshot = await getDocs(collection(db, "bestArrivals"));
        const list = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(list);
        sessionStorage.setItem("sadhana_flash_deals", JSON.stringify(list));
      } catch (error) {
        console.error("Error fetching best arrivals:", error);
      }
    };
    fetchProducts();
  }, []);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -360 : 360, behavior: "smooth" });
    }
  };

  const dispatch = useDispatch();

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

  if (products.length === 0) return null;

  return (
    <section className="sc-section home-section-animated position-relative">
      <div className="sc-header">
        <div className="sc-title-row">
          <h2 className="sc-title">{t("home.flashDeals", "Flash Deals")}</h2>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small fw-semibold">{t("home.endsIn", "Ends in")}</span>
            <div className="countdown-timer">
              <div style={redTimerBox}>{String(timeLeft.hours).padStart(2, '0')}</div>
              <span style={{ fontWeight: 'bold', color: '#ff2222' }}>:</span>
              <div style={redTimerBox}>{String(timeLeft.minutes).padStart(2, '0')}</div>
              <span style={{ fontWeight: 'bold', color: '#ff2222' }}>:</span>
              <div style={redTimerBox}>{String(timeLeft.seconds).padStart(2, '0')}</div>
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center gap-3">
          <a className="sc-view-all" href="#" onClick={(e) => { e.preventDefault(); navigate("/flash-deals"); }}>{t("home.viewAllDeals", "View All Deals →")}</a>
        </div>
      </div>

      <div className="position-relative">
        {products.length > 3 && (
          <>
            <button
              className="btn btn-light rounded-circle shadow-sm border position-absolute start-0 top-50 translate-middle-y d-flex align-items-center justify-content-center"
              style={{
                width: '38px',
                height: '38px',
                zIndex: 10,
                left: '-10px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                cursor: 'pointer'
              }}
              onClick={() => scroll("left")}
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="btn btn-light rounded-circle shadow-sm border position-absolute end-0 top-50 translate-middle-y d-flex align-items-center justify-content-center"
              style={{
                width: '38px',
                height: '38px',
                zIndex: 10,
                right: '-10px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                cursor: 'pointer'
              }}
              onClick={() => scroll("right")}
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        <div ref={scrollRef} className="sc-products-row">
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
                <img src={image} alt={name} />
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
                {oldPrice > offerprice && (
                  <span className="sc-mrp">₹{oldPrice.toLocaleString()}</span>
                )}
                {discount > 0 && (
                  <span className="sc-off">{discount}% off</span>
                )}
              </div>
              
              {/* Add to Cart */}
              {showCart && (
                <button
                  className="sc-add-btn"
                  onClick={(e) => handleAddToCart(e, product, offerprice, image, name)}
                >
                  <ShoppingCart size={14} /> {t("addToCart", "Add to Cart")}
                </button>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </section>
  );
}

const scrollBtnStyle = (side) => ({
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  [side === "left" ? "left" : "right"]: "10px",
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

const redTimerBox = {
  background: '#ff1a1a',
  color: 'white',
  padding: '4px 6px',
  borderRadius: '4px',
  fontSize: '0.85rem',
  fontWeight: 'bold',
  lineHeight: '1',
  minWidth: '24px',
  textAlign: 'center'
};

export default BestArrivals;
