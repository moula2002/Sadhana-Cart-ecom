import React, { useState, useEffect, useMemo, useRef } from "react";
import { Row, Col, Card, Spinner, Alert, Badge, Form, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaStar, FaShoppingCart, FaEye, FaRupeeSign, FaEdit } from "react-icons/fa";
import { db } from "../firebase";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";

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
    const dispatch = useDispatch();
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
                <p className="mt-3 text-muted">Finding similar products...</p>
            </div>
        );
    }

    if (error || suggestions.length === 0) {
        return null;
    }

    return (
        <div className="mt-5 mb-5 similar-products-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0">Similar Products</h3>
            </div>

            {filteredAndSorted.length === 0 ? (
                <Alert variant="info" className="rounded-3 border-0 shadow-sm">
                    No products found matching your current filters in this category.
                </Alert>
            ) : (
                <div className="position-relative">
                    {/* Left Scroll Arrow */}
                    <button
                        onClick={scrollLeft}
                        type="button"
                        className="btn btn-light rounded-circle shadow-sm border position-absolute start-0 top-50 translate-middle-y d-flex align-items-center justify-content-center"
                        style={{ width: '40px', height: '40px', zIndex: 10, left: '-20px' }}
                    >
                        <i className="fas fa-chevron-left" style={{ fontSize: '14px', color: '#333' }}></i>
                    </button>

                    {/* Right Scroll Arrow */}
                    <button
                        onClick={scrollRight}
                        type="button"
                        className="btn btn-light rounded-circle shadow-sm border position-absolute end-0 top-50 translate-middle-y d-flex align-items-center justify-content-center"
                        style={{ width: '40px', height: '40px', zIndex: 10, right: '-20px' }}
                    >
                        <i className="fas fa-chevron-right" style={{ fontSize: '14px', color: '#333' }}></i>
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

                            // Randomize promotional tags to match mockup
                            let promoText = "";
                            let promoColor = "";
                            if (idx % 3 === 0) {
                                promoText = "Lowest price in the year";
                                promoColor = "#15803d"; // Green
                            } else if (idx % 3 === 1) {
                                promoText = "Hot Deal";
                                promoColor = "#b91c1c"; // Red
                            } else {
                                const offersCount = (idx % 2) + 2;
                                const discountAmt = Math.round(finalPrice * 0.1);
                                promoText = `₹${discountAmt} with ${offersCount} offers`;
                                promoColor = "#1d4ed8"; // Blue
                            }

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
                                    <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                                        <Link to={`/product/${p.id}`} className="text-decoration-none text-dark" onClick={() => window.scrollTo(0, 0)}>
                                            {/* Image Container with Badges */}
                                            <div className="d-flex justify-content-center align-items-center p-3 position-relative" style={{ height: "200px", backgroundColor: '#f3f4f6' }}>
                                                {/* Bestseller Badge */}
                                                {p.rating?.rate >= 4.0 && (
                                                    <Badge bg="primary" className="position-absolute top-0 start-0 m-2 px-2 py-1 rounded" style={{ fontSize: '0.65rem', fontWeight: '800' }}>
                                                        Bestseller
                                                    </Badge>
                                                )}
                                                {/* Circular/Square Rating Badge at bottom-left */}
                                                <div className="position-absolute bottom-0 start-0 m-2 px-2 py-0.5 rounded bg-white border d-flex align-items-center gap-1 shadow-sm" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                    <span>{(p.rating?.rate || 4.1).toFixed(1)}</span>
                                                    <FaStar className="text-success" size={10} />
                                                </div>
                                                <Card.Img
                                                    src={getFirstImage(p)}
                                                    style={{ height: "160px", width: 'auto', objectFit: "contain" }}
                                                />
                                            </div>

                                            {/* Card Details */}
                                            <Card.Body className="p-3 bg-white">
                                                <Card.Title className="fw-semibold text-truncate mb-1 text-dark" style={{ fontSize: '0.9rem', color: '#333' }}>
                                                    {p.name || p.title}
                                                </Card.Title>

                                                <div className="d-flex flex-column mb-2">
                                                    {/* Discount percentage */}
                                                    <span className="fw-bold text-success" style={{ fontSize: '13px' }}>
                                                        {discountPercent}% OFF
                                                    </span>

                                                    {/* Pricing row */}
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="text-muted text-decoration-line-through" style={{ fontSize: '13px' }}>
                                                            ₹{originalPrice.toLocaleString()}
                                                        </span>
                                                        <span className="fw-bold text-dark" style={{ fontSize: '15px' }}>
                                                            ₹{finalPrice.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Highlight offer promo text */}
                                                <div className="fw-bold" style={{ fontSize: '12px', color: promoColor }}>
                                                    {promoText}
                                                </div>
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