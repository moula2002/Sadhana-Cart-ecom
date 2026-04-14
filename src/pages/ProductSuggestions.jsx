import React, { useState, useEffect, useMemo } from "react";
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
                    const matching = data.filter(p => p.subcategory === subcategory);
                    const others = data.filter(p => p.subcategory !== subcategory);
                    data = [...matching, ...others];
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
                <h3 className="fw-bold mb-0">More from {category}</h3>
            </div>

            {/* Premium Filter Bar */}
            <div className="p-3 mb-4 rounded-4 shadow-sm border-0" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)', border: '1px solid rgba(0,0,0,0.05)' }}>
                <Row className="align-items-center g-3">
                    <Col lg={7}>
                        <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
                            <div className="d-flex align-items-center gap-2 mb-2 mb-sm-0">
                                <div className="p-2 rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }}>
                                    <FaRupeeSign size={14} />
                                </div>
                                <span className="fw-bold text-dark no-wrap" style={{ fontSize: '0.9rem' }}>Budget Range</span>
                            </div>
                            <div className="flex-grow-1 px-2">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-muted small">₹0</span>
                                    <span className="fw-bold text-primary small">Under ₹{filterPrice.toLocaleString()}</span>
                                </div>
                                <Form.Range
                                    min={0}
                                    max={100000}
                                    step={500}
                                    value={filterPrice}
                                    onChange={(e) => setFilterPrice(Number(e.target.value))}
                                    className="custom-premium-range"
                                />
                            </div>
                        </div>
                    </Col>
                    <Col lg={5}>
                        <div className="d-flex align-items-center gap-3 ps-lg-4 border-start-lg">
                            <div className="d-flex align-items-center gap-2">
                                <div className="p-2 rounded-circle bg-dark bg-opacity-5 text-dark d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }}>
                                    <FaEdit size={14} className="opacity-75" />
                                </div>
                                <span className="fw-bold text-dark no-wrap" style={{ fontSize: '0.9rem' }}>Sort By</span>
                            </div>
                            <Form.Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="border-0 bg-white shadow-sm rounded-3 py-2 px-3 fw-semibold text-dark cursor-pointer"
                                style={{ fontSize: '0.85rem' }}
                            >
                                <option value="relevance">🎯 Relevance</option>
                                <option value="rating">⭐ Top Rated</option>
                                <option value="price-asc">📉 Price: Low to High</option>
                                <option value="price-desc">📈 Price: High to Low</option>
                                <option value="name-asc">🔤 Name A-Z</option>
                            </Form.Select>
                        </div>
                    </Col>
                </Row>
            </div>

            {filteredAndSorted.length === 0 ? (
                <Alert variant="info" className="rounded-3 border-0 shadow-sm">
                    No products found matching your current filters in this category.
                </Alert>
            ) : (
                <div 
                    className="d-flex overflow-auto pb-4 gap-4 custom-horizontal-scroller" 
                    style={{ 
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                        paddingLeft: '5px',
                        paddingRight: '5px'
                    }}
                >
                    {filteredAndSorted.map((p) => (
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
                            <Card className="h-100 border-0 shadow-sm hover-premium-card transition-all" style={{ borderRadius: '16px' }}>
                                <Link to={`/product/${p.id}`} className="text-decoration-none text-dark" onClick={() => window.scrollTo(0, 0)}>
                                    <div className="d-flex justify-content-center align-items-center p-3 position-relative" style={{ height: "180px", backgroundColor: '#f0f7ff', borderRadius: '16px 16px 0 0' }}>
                                        <div className="position-absolute top-0 start-0 m-2">
                                            <Badge bg="danger" className="rounded-pill px-2 py-1 shadow-sm" style={{ fontSize: '0.65rem', fontWeight: '800' }}>
                                                {p.offerprice ? 'OFFER' : 'NEW'}
                                            </Badge>
                                        </div>
                                        <Card.Img
                                            src={getFirstImage(p)}
                                            style={{ height: "140px", width: 'auto', objectFit: "contain", filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.05))' }}
                                        />
                                    </div>
                                    <Card.Body className="p-3 bg-white" style={{ borderRadius: '0 0 16px 16px' }}>
                                        <Card.Title className="fw-bold text-truncate mb-1 text-dark" style={{ fontSize: '0.95rem' }}>
                                            {p.name || p.title}
                                        </Card.Title>
                                        
                                        <div className="d-flex align-items-center mb-2">
                                            <div className="bg-success bg-opacity-10 px-2 py-0 rounded d-flex align-items-center me-2">
                                                <span className="fw-bold text-success small me-1">{p.rating?.rate?.toFixed(1) || '4.0'}</span>
                                                <FaStar className="text-success" size={10} />
                                            </div>
                                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>({p.rating?.count || 0})</span>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <div className="d-flex flex-column">
                                                <span className="fw-bold text-primary fs-5">
                                                    <FaRupeeSign size={14} />{p.priceINR}
                                                </span>
                                                <span className="text-success fw-bold" style={{ fontSize: '0.65rem' }}>Special Price</span>
                                            </div>
                                            <Button
                                                variant="warning"
                                                size="sm"
                                                className="rounded-3 shadow-sm px-3 fw-bold border-0 d-flex align-items-center justify-content-center"
                                                style={{ 
                                                    background: 'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)',
                                                    color: '#d63384',
                                                    height: '35px'
                                                }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    dispatch(addToCart({
                                                        id: p.id,
                                                        title: p.name || p.title,
                                                        price: p.priceValue,
                                                        image: getFirstImage(p),
                                                        quantity: 1,
                                                        sellerId: p.sellerId || "default_seller"
                                                    }));
                                                    toast.success(`Added ${p.name || p.title} to cart!`, { position: "bottom-right", autoClose: 2000 });
                                                }}
                                            >
                                                <FaShoppingCart size={13} className="me-1" />
                                                Add
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Link>
                            </Card>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .custom-horizontal-scroller::-webkit-scrollbar {
                    height: 6px;
                }
                .custom-horizontal-scroller::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-horizontal-scroller::-webkit-scrollbar-thumb {
                    background: #ccc;
                    border-radius: 10px;
                }
                .custom-horizontal-scroller::-webkit-scrollbar-thumb:hover {
                    background: #999;
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