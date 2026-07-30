import React, { useState, useEffect, useMemo, useRef } from "react";
import { Row, Col, Card, Spinner, Alert, Badge, Form, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FaStar, FaShoppingCart, FaEye, FaRupeeSign, FaEdit } from "react-icons/fa";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { db } from "../firebase";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useWishlist } from "../hooks/useWishlist";
import { useRatings } from "../hooks/useRatings";
import Loading from "./Loading";
import SkeletonGrid from "../components/SkeletonGrid";
import HoverImageCarousel from "../components/HoverImageCarousel";
import "../components/category/RecentlyViewed.css";

// Helper to get the first valid image URL (consistent with CategoryProducts.jsx)
const getFirstImage = (product) => {
    if (!product) return "https://placehold.jp/300x300.png?text=No+Data";
    const imageKeys = [
        "images", "image", "imageUrl", "imgUrl", "image_url", "img_url",
        "thumbnail", "thumb", "productImage", "product_image",
        "mainImage", "main_image", "cover", "photo", "img", "pic", "picture",
        "displayImage", "src", "url"
    ];
    const isValidUrl = (url) => typeof url === "string" && url.trim().length > 0 &&
        (url.startsWith("http") || url.startsWith("https") || url.startsWith("data:image"));
    const extract = (val, depth = 0) => {
        if (depth > 4) return null;
        if (typeof val === "string") return isValidUrl(val) ? val.trim() : null;
        if (Array.isArray(val)) {
            for (const item of val.flat(Infinity)) {
                const res = extract(item, depth + 1);
                if (res) return res;
            }
            return null;
        }
        if (typeof val === "object" && val !== null) {
            for (const k of imageKeys) {
                const res = extract(val[k], depth + 1);
                if (res) return res;
            }
            for (const k in val) {
                const res = extract(val[k], depth + 1);
                if (res) return res;
            }
        }
        return null;
    };
    for (const key of imageKeys) {
        const result = extract(product[key]);
        if (result) return result;
    }
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|avif|svg|bmp|emf|wmf|eps|tiff|tif|heic|heif|psd|ai|pdf|ico)(\?.*)?$/i;
    for (const key in product) {
        const val = product[key];
        if (typeof val === "string" && isValidUrl(val)) {
            const trimmed = val.trim();
            if (trimmed.match(imageExtensions) || trimmed.startsWith("data:image")) return trimmed;
        }
    }
    return "https://placehold.jp/300x300.png?text=Empty";
};

function ProductSuggestions({ currentProductId, category, subcategory }) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const { wishlisted, toggleWishlist } = useWishlist();
    const ratings = useRatings();
    const sliderRef = useRef(null);

    const scrollLeft = () => {
        if (sliderRef.current) {
            sliderRef.current.scrollBy({ left: -264, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (sliderRef.current) {
            sliderRef.current.scrollBy({ left: 264, behavior: 'smooth' });
        }
    };

    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterPrice, setFilterPrice] = useState(50000);
    const [sortBy, setSortBy] = useState("relevance");

    const EXCHANGE_RATE = 1;

    useEffect(() => {
        if (!category) return;

        const fetchSuggestions = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch more to allow for filtering/sorting/prioritizing
                const q = query(
                    collection(db, "products"),
                    where("category", "==", category),
                    limit(40)
                );

                const querySnapshot = await getDocs(q);
                let data = querySnapshot.docs.map((d) => {
                    const productData = d.data();
                    const priceValue = (productData.price || 0) * EXCHANGE_RATE;
                    return {
                        id: d.id,
                        ...productData,
                        priceINR: priceValue.toFixed(0),
                        priceValue,
                        rating: productData.rating || { rate: 4.0, count: 100 },
                    };
                }).filter((p) => p.id !== currentProductId);

                // Prioritize matching subcategory
                if (subcategory) {
                    const matching = data.filter(p => p.subcategory === subcategory || p.subCategory === subcategory || p.sub_category === subcategory);
                    const others = data.filter(p => p.subcategory !== subcategory && p.subCategory !== subcategory && p.sub_category !== subcategory);
                    if (matching.length >= 3) {
                        data = matching;
                    } else {
                        data = [...matching, ...others];
                    }
                }

                setSuggestions(data);
            } catch (err) {
                console.error("🔥 Error fetching category products:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [category, currentProductId, subcategory]);

    const filteredAndSorted = useMemo(() => {
        let list = [...suggestions];
        list = list.filter((p) => p.priceValue <= filterPrice);

        switch (sortBy) {
            case "relevance":
                // Preserve the subcategory priority applied during fetch
                break;
            case "price-asc":
                list.sort((a, b) => a.priceValue - b.priceValue);
                break;
            case "price-desc":
                list.sort((a, b) => b.priceValue - a.priceValue);
                break;
            case "name-asc":
                list.sort((a, b) => (a.name || a.title || "").localeCompare(b.name || b.title || ""));
                break;
            case "rating":
                list.sort((a, b) => (b.rating?.rate || 0) - (a.rating?.rate || 0));
                break;
            default:
                break;
        }
        return list.slice(0, 15);
    }, [suggestions, sortBy, filterPrice]);

    if (loading) {
        return (
            <div className="py-2 w-100">
                <SkeletonGrid count={4} />
            </div>
        );
    }

    if (error || suggestions.length === 0) {
        return null;
    }

    return (
        <div className="mt-5 mb-5 similar-products-container p-4 rounded-4" style={{ background: isDark ? '#1e293b' : 'linear-gradient(135deg, #FFF6E9 0%, #F4F7FF 30%, #EAF8FF 65%, #F3EEFF 100%)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0" style={{ color: isDark ? '#f8fafc' : '#111' }}>{t("similarProducts", "Similar Products")}</h3>
            </div>

            {filteredAndSorted.length === 0 ? (
                <Alert variant="info" className="rounded-3 border-0 shadow-sm">
                    {t("noProductsFoundMatchingFilters", "No products found matching your current filters in this category.")}
                </Alert>
            ) : (
                <div className="position-relative">
                    {/* Left Scroll Arrow */}
                    <button
                        onClick={scrollLeft}
                        type="button"
                        style={{
                            position: "absolute",
                            top: "55%",
                            transform: "translateY(-50%)",
                            left: "-12px",
                            zIndex: 10,
                            width: "28px",
                            height: "60px",
                            background: isDark ? "#1e293b" : "rgba(255,255,255,0.95)",
                            border: isDark ? "1px solid #334155" : "1px solid #e0e0e0",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "1.2rem",
                            color: isDark ? "#f8fafc" : "#555",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            transition: "background 0.2s",
                        }}
                        aria-label="Scroll left"
                    >
                        ‹
                    </button>

                    {/* Right Scroll Arrow */}
                    <button
                        onClick={scrollRight}
                        type="button"
                        style={{
                            position: "absolute",
                            top: "55%",
                            transform: "translateY(-50%)",
                            right: "-12px",
                            zIndex: 10,
                            width: "28px",
                            height: "60px",
                            background: isDark ? "#1e293b" : "rgba(255,255,255,0.95)",
                            border: isDark ? "1px solid #334155" : "1px solid #e0e0e0",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "1.2rem",
                            color: isDark ? "#f8fafc" : "#555",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            transition: "background 0.2s",
                        }}
                        aria-label="Scroll right"
                    >
                        ›
                    </button>

                    <div
                        ref={sliderRef}
                        className="d-flex overflow-auto pb-4 gap-4 custom-horizontal-scroller"
                        style={{
                            scrollSnapType: 'x mandatory',
                            WebkitOverflowScrolling: 'touch',
                            paddingLeft: '5px',
                            paddingRight: '5px'
                        }}
                    >
                        {filteredAndSorted.map((p, idx) => {
                            const finalPrice = Number(p.offerprice || p.price || 0);
                            const originalPrice = p.price && p.offerprice ? Number(p.price) : Math.round(finalPrice * 1.5);
                            const discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
                            const ratingData = ratings[p.id];

                            return (
                                <div
                                    key={p.id}
                                    className="rv-card"
                                    style={{
                                        minWidth: '240px',
                                        maxWidth: '240px',
                                        flex: '0 0 auto',
                                        scrollSnapAlign: 'start'
                                    }}
                                    onClick={() => navigate(`/product/${p.id}`)}
                                >
                                    {discountPercent > 0 && <span className="rv-discount-tag">{discountPercent}% OFF</span>}

                                    <button
                                        className="rv-wishlist-btn"
                                        onClick={(e) => toggleWishlist(e, { id: p.id, ...p })}
                                        aria-label="Wishlist"
                                    >
                                        {wishlisted[p.id] ? (
                                            <Heart size={16} fill="#ff4081" color="#ff4081" />
                                        ) : (
                                            <Heart size={16} color="#64748b" />
                                        )}
                                    </button>

                                    <div className="rv-img-box" style={{ aspectRatio: "1 / 1", height: "auto" }}>
                                        <HoverImageCarousel
                                            images={p.images}
                                            fallbackImage={getFirstImage(p)}
                                            alt={p.name || p.title || "Product"}
                                            style={{ width: "100%", height: '100%', objectFit: "contain" }}
                                        />
                                    </div>

                                    <div className="rv-name">{p.name || p.title}</div>

                                    {ratingData && ratingData.count > 0 && (
                                        <div className="rv-rating-row">
                                            <Star size={13} fill="#d97706" color="#d97706" />
                                            <span>{ratingData.average}</span>
                                            <span className="text-muted ms-1" style={{ fontSize: "0.72rem" }}>({ratingData.count})</span>
                                        </div>
                                    )}

                                    <div className="rv-price-row">
                                        <span className="rv-offer-price">₹{finalPrice.toLocaleString()}</span>
                                        {originalPrice > finalPrice && (
                                            <span className="rv-original-price">₹{originalPrice.toLocaleString()}</span>
                                        )}
                                        {discountPercent > 0 && (
                                            <span className="rv-discount-off" style={{ fontSize: "0.78rem", color: "#059669", fontWeight: 700 }}>{discountPercent}% off</span>
                                        )}
                                    </div>

                                    <button
                                        className="rv-add-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dispatch(addToCart({
                                                id: p.id,
                                                title: p.name || p.title,
                                                price: finalPrice,
                                                image: getFirstImage(p),
                                                quantity: 1,
                                            }));
                                            toast.success(t("addedToCartMsg", "Added {{name}} to cart!", { name: p.name || p.title }).replace("{{name}}", p.name || p.title), { position: "bottom-right", autoClose: 2000 });
                                        }}
                                    >
                                        <ShoppingCart size={14} /> {t("addToCart", "Add to Cart")}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <style>{`
                .custom-horizontal-scroller::-webkit-scrollbar {
                    display: none;
                }
                .custom-horizontal-scroller {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .hover-premium-card:hover {
                    transform: translateY(-10px) scale(1.02);
                    box-shadow: 0 25px 50px -12px rgba(13, 110, 253, 0.25) !important;
                }
                .transition-all {
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .no-wrap {
                    white-space: nowrap;
                }
                @media (min-width: 992px) {
                    .border-start-lg {
                        border-left: 1px solid rgba(0,0,0,0.1) !important;
                    }
                }
            `}</style>
        </div>
    );
}

export default ProductSuggestions;