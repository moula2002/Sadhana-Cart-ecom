import React, { useEffect, useRef, useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { useWishlist } from "../../hooks/useWishlist";
import { useRatings } from "../../hooks/useRatings";
import { db } from "../../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function BestArrivals({ showCart = false }) {
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
      try {
        const querySnapshot = await getDocs(collection(db, "bestArrivals"));
        const list = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(list);
      } catch (error) {
        console.error("Error fetching best arrivals:", error);
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
    <section className="sc-section home-section-animated" style={{ position: "relative" }}>
      <div className="sc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e0e0e0' }}>
        <div className="sc-title-row" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 className="sc-title" style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: '#212121' }}>Flash Deals</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Ends in</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={redTimerBox}>{String(timeLeft.hours).padStart(2, '0')}</div>
              <span style={{ fontWeight: 'bold', color: '#ff2222' }}>:</span>
              <div style={redTimerBox}>{String(timeLeft.minutes).padStart(2, '0')}</div>
              <span style={{ fontWeight: 'bold', color: '#ff2222' }}>:</span>
              <div style={redTimerBox}>{String(timeLeft.seconds).padStart(2, '0')}</div>
            </div>
          </div>
        </div>
        <a className="sc-view-all" href="#" style={{ color: '#0b65c2', fontWeight: '700', fontSize: '0.9rem', textDecoration: 'none' }}>View All →</a>
      </div>

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
          const info = product.bestArrivalInfo || {};
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
                <span className="sc-discount-tag" style={{ background: '#ff1a1a', borderRadius: '4px', padding: '3px 6px', fontSize: '0.65rem' }}>{discount}% OFF</span>
              )}

              {/* Image */}
              <div className="img-box" style={{ height: '140px', padding: '10px' }}>
                <img src={image} alt={name} loading="lazy" style={{ objectFit: 'contain' }} />
              </div>

              {/* Name */}
              <div className="sc-name" style={{ fontSize: '0.85rem', fontWeight: '500', margin: '8px 0 4px 0', textAlign: 'center', color: '#333' }}>{name}</div>

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
              <div className="sc-price-row" style={{ flexDirection: 'column', alignItems: 'center', gap: '2px', margin: '0 0 10px 0' }}>
                <span className="sc-offer" style={{ fontSize: '1.05rem', fontWeight: '800' }}>₹{price.toLocaleString()}</span>
                {oldPrice > price && (
                  <span className="sc-mrp" style={{ fontSize: '0.75rem', color: '#888', textDecoration: 'line-through' }}>₹{oldPrice.toLocaleString()}</span>
                )}
              </div>
              
              {/* Add to Cart */}
              {showCart && (
                <button
                  className="sc-add-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{ marginTop: 'auto' }}
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
