import React, { useState, useEffect, useMemo, useRef } from "react";
import { Row, Col, Card, Spinner, Alert, Badge, Form, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaStar, FaShoppingCart, FaEye, FaRupeeSign, FaEdit } from "react-icons/fa";
import { db } from "../firebase";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";

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
    const { isDark } = useTheme();
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
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">{t("findingSimilarProducts", "Finding similar products...")}</p>
            </div>
        );
    }

    if (error || suggestions.length === 0) {
        return null;
    }

    return (
        <div className="mt-5 mb-5 similar-products-container">
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
                        className="btn rounded-circle shadow-sm border position-absolute start-0 top-50 translate-middle-y d-flex align-items-center justify-content-center"
                        style={{
                            width: '40px',
                            height: '40px',
                            zIndex: 10,
                            left: '-20px',
                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                            borderColor: isDark ? '#334155' : '#e2e8f0',
                            color: isDark ? '#f8fafc' : '#333'
                        }}
                    >
                        <i className="fas fa-chevron-left" style={{ fontSize: '14px' }}></i>
                    </button>

                    {/* Right Scroll Arrow */}
                    <button
                        onClick={scrollRight}
                        type="button"
                        className="btn rounded-circle shadow-sm border position-absolute end-0 top-50 translate-middle-y d-flex align-items-center justify-content-center"
                        style={{
                            width: '40px',
                            height: '40px',
                            zIndex: 10,
                            right: '-20px',
                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                            borderColor: isDark ? '#334155' : '#e2e8f0',
                            color: isDark ? '#f8fafc' : '#333'
                        }}
                    >
                        <i className="fas fa-chevron-right" style={{ fontSize: '14px' }}></i>
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

                            return (
                                <div
                                    key={p.id}
                                    className="similar-product-card-wrapper"
                                    style={{
                                        minWidth: '240px',
                                        maxWidth: '240px',
                                        flex: '0 0 auto',
                                        scrollSnapAlign: 'start'
                                    }}
                                >
                                    <Card className="h-100 border shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden', backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb' }}>
                                        <Link to={`/product/${p.id}`} className="text-decoration-none" onClick={() => window.scrollTo(0, 0)}>
                                            {/* Image Container with Badges */}
                                            <div className="d-flex justify-content-center align-items-center p-3 position-relative" style={{ height: "200px", backgroundColor: '#ffffff', borderRadius: '12px 12px 0 0' }}>
                                                {/* Bestseller Badge */}
                                                {p.rating?.rate >= 4.0 && (
                                                    <Badge bg="primary" className="position-absolute top-0 start-0 m-2 px-2 py-1 rounded" style={{ fontSize: '0.65rem', fontWeight: '800' }}>
                                                        {t("bestseller", "Bestseller")}
                                                    </Badge>
                                                )}
                                                {/* Circular/Square Rating Badge at bottom-left */}
                                                <div className="position-absolute bottom-0 start-0 m-2 px-2 py-0.5 rounded border d-flex align-items-center gap-1 shadow-sm" style={{ fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#334155' : '#dee2e6', color: isDark ? '#f8fafc' : '#212529' }}>
                                                    <span>{(p.rating?.rate || 4.1).toFixed(1)}</span>
                                                    <FaStar className="text-success" size={10} />
                                                </div>
                                                <Card.Img
                                                    src={getFirstImage(p)}
                                                    style={{ height: "160px", width: 'auto', objectFit: "contain" }}
                                                />
                                            </div>

                                            {/* Card Details */}
                                            <Card.Body className="p-3 d-flex flex-column justify-content-between" style={{ backgroundColor: isDark ? '#1e293b' : '#ffffff' }}>
                                                 <Card.Title className="fw-bold mb-1" style={{ fontSize: '0.92rem', color: isDark ? '#f8fafc' : '#0f172a', fontWeight: '800', lineHeight: '1.35', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.5em' }}>
                                                     {p.name || p.title}
                                                 </Card.Title>

                                                 {/* Pricing row */}
                                                 <div className="d-flex align-items-baseline gap-2 mb-2">
                                                     <span className="fw-bold" style={{ fontSize: '1.1rem', fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a' }}>
                                                         ₹{finalPrice.toLocaleString()}
                                                     </span>
                                                     {originalPrice > finalPrice && (
                                                         <span className="text-decoration-line-through" style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                                             ₹{originalPrice.toLocaleString()}
                                                         </span>
                                                     )}
                                                     {discountPercent > 0 && (
                                                         <span className="fw-bold" style={{ fontSize: '0.78rem', color: isDark ? '#34d399' : '#059669' }}>
                                                             {discountPercent}% {t("off", "off")}
                                                         </span>
                                                     )}
                                                 </div>

                                                 <button
                                                     className="sc-add-btn mt-2"
                                                     onClick={(e) => {
                                                         e.preventDefault();
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
                                                     <i className="fas fa-shopping-cart me-1"></i> {t("addToCart", "Add to Cart")}
                                                 </button>
                                             </Card.Body>
                                        </Link>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <style jsx>{`
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