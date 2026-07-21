import { useTranslation } from "react-i18next";
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, ShoppingCart } from "lucide-react";
import { useWishlist } from "../../hooks/useWishlist";
import { useRatings } from "../../hooks/useRatings";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/cartSlice";
import { toast } from "react-toastify";

function FeatureProducts({ showCart = false }) { 
  const { t } = useTranslation();
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

  const calculateDiscount = (offer, old) => {
    if (!offer || !old || old <= offer) return 0;
    return Math.round(((old - offer) / old) * 100);
  };

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -360 : 360, behavior: "smooth" });
    }
  };

  const dispatch = useDispatch();

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
          const info = product.featuredProductInfo || {};
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