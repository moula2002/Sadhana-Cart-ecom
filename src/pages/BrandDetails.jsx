import React, { useEffect, useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { useWishlist } from "../hooks/useWishlist";
import { useRatings } from "../hooks/useRatings";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { toast } from "react-toastify";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import "./BrandDetails.css";
import Loading from "./Loading";
import { useTranslation } from "react-i18next";

function BrandDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { wishlisted, toggleWishlist } = useWishlist();
  const ratings = useRatings();

  useEffect(() => {
    const fetchBrandAndProducts = async () => {
      try {
        setLoading(true);
        // Fetch brand details
        const brandDocRef = doc(db, "brands", id);
        const brandSnap = await getDoc(brandDocRef);
        
        if (brandSnap.exists()) {
          const brandData = { id: brandSnap.id, ...brandSnap.data() };
          setBrand(brandData);
          
          // Fetch products for this brand
          const productsRef = collection(db, "products");
          // Assuming products have a 'brand' field that matches the brand name
          const q = query(productsRef, where("brand", "==", brandData.name));
          const querySnapshot = await getDocs(q);
          
          const productsList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setProducts(productsList);
        } else {
          console.error("No such brand!");
        }
      } catch (error) {
        console.error("Error fetching brand details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchBrandAndProducts();
    }
  }, [id]);

  if (loading) return <Loading />;
  if (!brand) return <div className="no-brand-found">{t("brandNotFound", "Brand not found")}</div>;

  const calculateDiscount = (price, oldPrice) => {
    if (!price || !oldPrice || oldPrice <= price) return 0;
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  };

  const filteredProducts = selectedCategory === "All" 
    ? products 
    : products.filter(p => p.category === selectedCategory || p.subcategory === selectedCategory);


  return (
    <div className="brand-details-page">
      {/* Brand Banner */}
      {brand.bannerImage && (
        <div className="brand-banner-container">
          <img src={brand.bannerImage} alt={`${brand.name} Banner`} className="brand-banner-image" />
          <div className="brand-banner-overlay">
            <img src={brand.image} alt={brand.name} className="brand-banner-logo" />
            <h1 className="brand-banner-title">{brand.name}</h1>
          </div>
        </div>
      )}

      <div className="brand-content-wrapper">
        {/* Subcategories (if any) */}
        {brand.subCategories && brand.subCategories.length > 0 && (
          <div className="brand-subcategories">
            <h3 className="subcats-title">{t("categories", "Categories")}</h3>
            <div className="subcats-chips">
              <span 
                className={`subcat-chip ${selectedCategory === "All" ? "active" : ""}`}
                onClick={() => setSelectedCategory("All")}
              >
                {t("all", "All")}
              </span>
              {brand.subCategories.map((subcat, idx) => (
                <span 
                  key={idx} 
                  className={`subcat-chip ${selectedCategory === subcat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(subcat)}
                >
                  {subcat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Brand Products */}
        <div className="brand-products-section">
          <h2 className="brand-section-title">{t("productsBy", "Products by {{name}}", { name: brand.name }).replace("{{name}}", brand.name)}</h2>
          
          {filteredProducts.length === 0 ? (
            <div className="no-products-msg">
              <p>{t("noProductsFoundForCategory", "No products found for this category.")}</p>
            </div>
          ) : (
            <div className="brand-products-grid">
              {filteredProducts.map((product) => {
                const info = product.featuredProductInfo || {};
                const name = info.title || product.name || "Product";
                const price = product.price || 0;
                const oldPrice = product.oldPrice || 0;
                const discount = calculateDiscount(price, oldPrice);
                const image = product.images?.[0] || null;

                return (
                  <div 
                    key={product.id} 
                    className="sc-product-card"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <button
                      className="wishlist-btn"
                      onClick={(e) => toggleWishlist(e, product)}
                      aria-label={t("wishlistLabel", "Wishlist")}
                    >
                      {wishlisted[product.id] ? <Heart size={16} fill="#ff4081" color="#ff4081" /> : <Heart size={16} color="#64748b" />}
                    </button>
                    {discount > 0 && <span className="sc-discount-tag">{discount}% {t("off", "OFF")}</span>}
                    <div className="img-box">
                      {image ? (
                        <img src={image} alt={name} loading="lazy" />
                      ) : (
                        <div className="sc-product-placeholder-img d-flex align-items-center justify-content-center h-100 bg-light rounded text-muted">
                          <i className="fas fa-image fa-2x"></i>
                        </div>
                      )}
                    </div>
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

                    <div className="sc-price-row">
                      <span className="sc-offer">₹{price.toLocaleString()}</span>
                      {oldPrice > price && <span className="sc-mrp">₹{oldPrice.toLocaleString()}</span>}
                      {discount > 0 && <span className="sc-off">{discount}% {t("off", "off")}</span>}
                    </div>

                    <button
                      className="sc-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(addToCart({
                          id: product.id,
                          title: name,
                          price: price,
                          image: image,
                          quantity: 1,
                        }));
                        toast.success(t("addedToCartMsg", "{{name}} added to cart!", { name }).replace("{{name}}", name), { position: "bottom-right", autoClose: 2000 });
                      }}
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
    </div>
  );
}

export default BrandDetails;
