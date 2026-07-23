// Wishlist.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { toast } from "react-toastify";
import {
    FaHeart,
    FaShoppingCart,
    FaTrash,
    FaUser,
    FaShoppingBag,
    FaMapMarkerAlt,
    FaGift,
    FaCreditCard,
    FaCog,
    FaSignOutAlt,
    FaChevronLeft,
    FaChevronRight
} from 'react-icons/fa';
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc, setDoc, query, limit } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useTranslation } from "react-i18next";

import Loading from "./Loading";

const auth = getAuth();

function Wishlist() {
    const [favorites, setFavorites] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const sliderRef = useRef(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (!user) {
                navigate('/login', { state: { from: '/wishlist' } });
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    // Fetch Wishlist Items & Suggestions
    useEffect(() => {
        if (!currentUser) return;

        const fetchData = async () => {
            let favData = [];
            try {
                setLoading(true);

                // Fetch Favorites
                const snapshot = await getDocs(
                    collection(db, "users", currentUser.uid, "favorites")
                );
                favData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setFavorites(favData);
            } catch (error) {
                console.error("Error fetching wishlist data:", error);
                toast.error(t("failedToLoadWishlistItems", "Failed to load wishlist items"));
            } finally {
                setLoading(false);
            }

            // Fetch Suggestions (popular products from database) asynchronously and quickly
            try {
                const prodRef = collection(db, "products");
                const q = query(prodRef, limit(15));
                const prodSnap = await getDocs(q);
                const prodList = prodSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).filter(p => p.isActive !== false);

                // Filter out items already in wishlist
                const favProductIds = new Set(favData.map(f => f.productId));
                const filteredSuggestions = prodList.filter(p => !favProductIds.has(p.id));

                // If suggestions are empty, load standard dummy items
                if (filteredSuggestions.length === 0) {
                    setSuggestions(getDummySuggestions());
                } else {
                    setSuggestions(filteredSuggestions.slice(0, 10));
                }
            } catch (error) {
                console.error("Error fetching suggestions:", error);
                setSuggestions(getDummySuggestions());
            }
        };

        fetchData();
    }, [currentUser]);

    const removeFromWishlist = async (favId, productName) => {
        try {
            await deleteDoc(doc(db, "users", currentUser.uid, "favorites", favId));
            setFavorites(favorites.filter((item) => item.id !== favId));
            toast.success(t("removedFromWishlist", "Removed '{{name}}' from wishlist", { name: productName }).replace("{{name}}", productName), { position: "bottom-right", autoClose: 2000 });
        } catch (error) {
            console.error("Error removing from wishlist:", error);
            toast.error(t("failedToRemoveItem", "Failed to remove item"));
        }
    };

    const addToWishlist = async (product) => {
        if (!currentUser) {
            toast.info(t("loginToWishlist", "Please login to add items to wishlist"));
            navigate('/login', { state: { from: '/wishlist' } });
            return;
        }

        try {
            const newFav = {
                productId: product.id,
                name: product.name || product.title,
                price: product.offerprice || product.price || 0,
                originalPrice: product.price || 0,
                image: (Array.isArray(product.images) && product.images[0]) || product.image || "https://via.placeholder.com/150",
                addedAt: new Date().toISOString()
            };

            await setDoc(doc(db, "users", currentUser.uid, "favorites", product.id), newFav);
            
            // Remove from suggestions and add to favorites list locally to update UI immediately
            setSuggestions(suggestions.filter(s => s.id !== product.id));
            setFavorites([...favorites, { id: product.id, ...newFav }]);
            
            toast.success(t("addedToWishlist", "Added '{{name}}' to wishlist!", { name: product.name || product.title }).replace("{{name}}", product.name || product.title), { position: "bottom-right", autoClose: 2000 });
        } catch (error) {
            console.error("Error adding to wishlist:", error);
            toast.error(t("failedToAddToWishlist", "Failed to add to wishlist"));
        }
    };

    const handleAddToCart = (item) => {
        dispatch(
            addToCart({
                id: item.productId || item.id,
                title: item.name || item.title,
                price: Number(item.price || item.offerprice || 0),
                image: item.image || (Array.isArray(item.images) && item.images[0]) || "https://via.placeholder.com/150",
                quantity: 1,
                size: item.size || null,
                sellerId: item.sellerId || "default_seller"
            })
        );
        toast.success(t("addedToCartMsg", "Added {{name}} to cart!", { name: item.name || item.title }).replace("{{name}}", item.name || item.title), { position: "bottom-right", autoClose: 2000 });
    };

    const handleMoveAllToCart = () => {
        if (favorites.length === 0) return;
        favorites.forEach(item => {
            dispatch(
                addToCart({
                    id: item.productId,
                    title: item.name,
                    price: Number(item.price),
                    image: item.image,
                    quantity: 1,
                    size: item.size || null,
                    sellerId: item.sellerId || "default_seller"
                })
            );
        });
        toast.success(t("movedAllToCart", "Moved all {{count}} items to cart!", { count: favorites.length }).replace("{{count}}", favorites.length), { position: "bottom-right", autoClose: 3000 });
    };

    const handleClearWishlist = async () => {
        if (favorites.length === 0) return;
        try {
            for (const item of favorites) {
                await deleteDoc(doc(db, "users", currentUser.uid, "favorites", item.id));
            }
            setFavorites([]);
            toast.success(t("wishlistCleared", "Wishlist cleared successfully"), { position: "bottom-right", autoClose: 2000 });
        } catch (error) {
            console.error("Error clearing wishlist:", error);
            toast.error(t("failedToClearWishlist", "Failed to clear wishlist"));
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success(t("loggedOutSuccess", "Logged out successfully"));
            navigate("/login");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    // Scroll suggestions slider
    const scrollSuggestions = (direction) => {
        if (sliderRef.current) {
            const scrollAmount = 300;
            sliderRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth"
            });
        }
    };

    if (loading) {
        return <Loading message={t("loadingWishlist", "Loading your wishlist...")} minHeight="400px" />;
    }

    return (
        <Container fluid className="py-4 px-lg-5 mt-3">
            <Row className="g-4 align-items-start">
                {/* Left Sidebar - Account Menu */}
                <Col lg={3}>
                    <div style={{ position: 'sticky', top: '100px' }}>
                        <Card className="border shadow-sm p-4 wishlist-sidebar">
                            <h4 className="fw-bolder mb-4 px-2 wishlist-sidebar-title">{t("myAccount", "My Account")}</h4>
                            <div className="d-flex flex-column gap-2">
                                <Link to="/profile" className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none sidebar-link">
                                    <FaUser size={18} className="sidebar-icon" />
                                    <span className="fw-semibold" style={{ fontSize: '15px' }}>{t("myProfile", "My Profile")}</span>
                                </Link>
                                <Link to="/orders" className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none sidebar-link">
                                    <FaShoppingBag size={18} className="sidebar-icon" />
                                    <span className="fw-semibold" style={{ fontSize: '15px' }}>{t("myOrders", "My Orders")}</span>
                                </Link>
                                <Link to="/wishlist" className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none active-sidebar-link">
                                    <FaHeart size={18} className="sidebar-icon" />
                                    <span className="fw-semibold" style={{ fontSize: '15px' }}>{t("wishlistLabel", "Wishlist")}</span>
                                </Link>
                                <Link to="/address" className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none sidebar-link">
                                    <FaMapMarkerAlt size={18} className="sidebar-icon" />
                                    <span className="fw-semibold" style={{ fontSize: '15px' }}>{t("myAddresses", "My Addresses")}</span>
                                </Link>
                                <Link to="/refercode" className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none sidebar-link">
                                    <FaGift size={18} className="sidebar-icon" />
                                    <span className="fw-semibold" style={{ fontSize: '15px' }}>{t("sadhanaRewards", "Sadhana Rewards")}</span>
                                </Link>
                                <Link to="/wallet" className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none sidebar-link">
                                    <FaCreditCard size={18} className="sidebar-icon" />
                                    <span className="fw-semibold" style={{ fontSize: '15px' }}>{t("paymentMethods", "Payment Methods")}</span>
                                </Link>
                                <Link to="/profile" className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none sidebar-link">
                                    <FaCog size={18} className="sidebar-icon" />
                                    <span className="fw-semibold" style={{ fontSize: '15px' }}>{t("accountSettings", "Account Settings")}</span>
                                </Link>
                                <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '12px 8px' }}></div>
                                <button
                                    onClick={handleLogout}
                                    className="btn d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 text-start w-100 sidebar-link logout-link"
                                >
                                    <FaSignOutAlt size={18} className="sidebar-icon" />
                                    <span className="fw-semibold" style={{ fontSize: '15px' }}>{t("logout", "Logout")}</span>
                                </button>
                            </div>
                        </Card>
                    </div>
                </Col>

                {/* Right Main Content - Wishlist Grid */}
                <Col lg={9}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="fw-bold mb-0 text-dark">
                            {t("myWishlistTitle", "My Wishlist")} <span className="text-muted fs-6 fw-normal">({favorites.length} {t("items", "Items")})</span>
                        </h3>
                        {favorites.length > 0 && (
                            <div className="d-flex gap-2">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="px-3 py-2 fw-semibold"
                                    style={{ fontSize: '13px' }}
                                    onClick={handleMoveAllToCart}
                                >
                                    {t("moveAllToCart", "Move All to Cart")}
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="px-3 py-2 fw-semibold"
                                    style={{ fontSize: '13px' }}
                                    onClick={handleClearWishlist}
                                >
                                    {t("removeAll", "Remove All")}
                                </Button>
                            </div>
                        )}
                    </div>

                    {favorites.length === 0 ? (
                        <Card className="text-center py-5 border shadow-sm rounded-4 mb-5">
                            <Card.Body>
                                <FaHeart className="text-muted mb-3" size={64} />
                                <h4 className="fw-bold mb-2">{t("emptyWishlistTitle", "Your wishlist is empty")}</h4>
                                <p className="text-muted mb-4 small">{t("emptyWishlistSub", "Save your favorite items here to view them later.")}</p>
                                <Button variant="primary" className="rounded-pill px-4" onClick={() => navigate("/")}>
                                    {t("goShopping", "Go Shopping")}
                                </Button>
                            </Card.Body>
                        </Card>
                    ) : (
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '16px',
                            marginBottom: '24px'
                        }}>
                            {favorites.map((item) => {
                                const finalPrice = Number(item.price || 0);
                                const originalPrice = Number(item.originalPrice || Math.round(finalPrice * 1.5));
                                const discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);

                                return (
                                    <div
                                        key={item.id}
                                        className="wishlist-item-card"
                                        style={{
                                            width: '200px',
                                            flexShrink: 0,
                                            borderRadius: '16px',
                                            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        {/* Image */}
                                        <div style={{ position: 'relative', background: 'linear-gradient(135deg,#f8faff,#f0f4ff)', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                                            {discountPercent > 0 && (
                                                <div style={{ position: 'absolute', top: 8, left: 8, background: 'linear-gradient(135deg,#ff6b6b,#ee5a24)', color: '#fff', borderRadius: 7, fontSize: '10px', fontWeight: 700, padding: '2px 7px' }}>
                                                    {discountPercent}% {t("off", "OFF")}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => removeFromWishlist(item.id, item.name)}
                                                style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                                            >
                                                <FaHeart color="#ef4444" size={12} />
                                            </button>
                                            <img
                                                src={item.image || "https://via.placeholder.com/200"}
                                                alt={item.name}
                                                style={{ height: '120px', width: 'auto', maxWidth: '100%', objectFit: 'contain', cursor: 'pointer' }}
                                                onClick={() => navigate(`/product/${item.productId}`)}
                                            />
                                        </div>

                                        {/* Info */}
                                        <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <div>
                                                <div
                                                    className="wishlist-item-title"
                                                    style={{ fontWeight: 600, fontSize: '12.5px', lineHeight: 1.3, marginBottom: 5, cursor: 'pointer', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                                                    onClick={() => navigate(`/product/${item.productId}`)}
                                                >
                                                    {item.name}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                                    <span className="wishlist-item-price" style={{ fontWeight: 800, fontSize: '14px' }}>₹{finalPrice.toLocaleString()}</span>
                                                    <span style={{ fontSize: '11px', color: '#9ca3af', textDecoration: 'line-through' }}>₹{originalPrice.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            {/* Buttons */}
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    onClick={() => { handleAddToCart(item); removeFromWishlist(item.id, item.name); }}
                                                    style={{ flex: 1, padding: '6px 8px', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                                                    className="add-to-cart-btn"
                                                >
                                                    <FaShoppingCart size={10} /> {t("moveToCart", "Move to Cart")}
                                                </button>
                                                <button
                                                    onClick={() => removeFromWishlist(item.id, item.name)}
                                                    style={{ padding: '6px 9px', border: '1.5px solid #fca5a5', borderRadius: 8, background: '#fff5f5', color: '#ef4444', fontWeight: 600, fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.color = '#ef4444'; }}
                                                >
                                                    {t("remove", "Remove")}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Suggestions Section: "You May Also Like" */}
                    {suggestions.length > 0 && (
                        <div className="mt-5 suggestion-slider-container">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="fw-bold mb-0 text-dark">{t("youMayAlsoLike", "You May Also Like")}</h4>
                                <div className="d-flex gap-2">
                                    <button
                                        onClick={() => scrollSuggestions("left")}
                                        className="btn btn-light rounded-circle shadow-sm border d-flex align-items-center justify-content-center"
                                        style={{ width: '36px', height: '36px' }}
                                    >
                                        <FaChevronLeft size={12} />
                                    </button>
                                    <button
                                        onClick={() => scrollSuggestions("right")}
                                        className="btn btn-light rounded-circle shadow-sm border d-flex align-items-center justify-content-center"
                                        style={{ width: '36px', height: '36px' }}
                                    >
                                        <FaChevronRight size={12} />
                                    </button>
                                </div>
                            </div>

                            <div
                                ref={sliderRef}
                                className="d-flex overflow-auto pb-4 gap-4 scrollbar-hidden"
                                style={{
                                    scrollSnapType: 'x mandatory',
                                    WebkitOverflowScrolling: 'touch',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                }}
                            >
                                {suggestions.map((p) => {
                                    const finalPrice = Number(p.offerprice || p.price || 0);
                                    const originalPrice = p.price && p.offerprice ? Number(p.price) : Math.round(finalPrice * 1.5);

                                    return (
                                        <div
                                            key={p.id}
                                            style={{
                                                minWidth: '220px',
                                                maxWidth: '220px',
                                                flex: '0 0 auto',
                                                scrollSnapAlign: 'start'
                                            }}
                                        >
                                            <Card className="h-100 border shadow-sm p-2 product-card-hover wishlist-sug-card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                                                <div className="d-flex justify-content-center align-items-center p-3 position-relative rounded-3 wishlist-sug-img-bg" style={{ height: "160px" }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); addToWishlist(p); }}
                                                        className="suggestion-wishlist-btn"
                                                        style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 2 }}
                                                    >
                                                        <FaHeart className="suggestion-heart-icon" size={12} color="#cbd5e1" />
                                                    </button>
                                                    <Card.Img
                                                        src={(Array.isArray(p.images) && p.images[0]) || p.image || "https://via.placeholder.com/150"}
                                                        style={{ height: "120px", width: 'auto', objectFit: "contain" }}
                                                        className="cursor-pointer"
                                                        onClick={() => navigate(`/product/${p.id}`)}
                                                    />
                                                </div>

                                                <Card.Body className="p-3 bg-white">
                                                    <Card.Title
                                                        className="fw-semibold text-truncate mb-1 text-dark cursor-pointer"
                                                        style={{ fontSize: '0.85rem' }}
                                                        onClick={() => navigate(`/product/${p.id}`)}
                                                    >
                                                        {p.name || p.title}
                                                    </Card.Title>

                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>
                                                            ₹{finalPrice.toLocaleString()}
                                                        </span>
                                                        <span className="text-muted text-decoration-line-through" style={{ fontSize: '11px' }}>
                                                            ₹{originalPrice.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Col>
            </Row>

            <style>{`
                .sidebar-link {
                    transition: all 0.15s ease;
                    color: #4a5568 !important;
                }
                .sidebar-link:hover {
                    background-color: #f7fafc !important;
                    color: #2b6cb0 !important;
                }
                .sidebar-link:hover .sidebar-icon {
                    color: #2b6cb0 !important;
                }
                .active-sidebar-link {
                    background-color: #eff4ff !important;
                    color: #2b6cb0 !important;
                }
                .active-sidebar-link .sidebar-icon {
                    color: #2b6cb0 !important;
                }
                .sidebar-icon {
                    color: #4a5568;
                    transition: color 0.15s ease;
                }
                .logout-link:hover {
                    background-color: #fff5f5 !important;
                    color: #c53030 !important;
                }
                .logout-link:hover .sidebar-icon {
                    color: #c53030 !important;
                }
                .product-card-hover {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .product-card-hover:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 20px -5px rgba(0,0,0,0.08) !important;
                }
                .suggestion-wishlist-btn:hover .suggestion-heart-icon {
                    fill: #ef4444 !important;
                    color: #ef4444 !important;
                }
                .add-to-cart-btn:hover {
                    background-color: #2563eb !important;
                    color: #fff !important;
                }
                .cursor-pointer {
                    cursor: pointer;
                }
                .scrollbar-hidden::-webkit-scrollbar {
                    display: none;
                }
                
                /* Dark Mode Additions */
                .wishlist-sidebar {
                    background-color: #fff;
                }
                .wishlist-sidebar-title {
                    color: #1a202c;
                    font-size: 20px;
                    font-weight: 800;
                }
                .wishlist-item-card {
                    background-color: #fff;
                }
                .wishlist-item-title, .wishlist-item-price {
                    color: #111827;
                }
                .wishlist-sug-card {
                    background-color: #fff;
                }
                .wishlist-sug-img-bg {
                    background-color: #f8fafc;
                }
                
                [data-bs-theme="dark"] .wishlist-sidebar,
                [data-theme="dark"] .wishlist-sidebar,
                .dark-theme .wishlist-sidebar {
                    background-color: #1e293b !important;
                    border-color: #334155 !important;
                }
                [data-bs-theme="dark"] .wishlist-sidebar-title,
                [data-theme="dark"] .wishlist-sidebar-title,
                .dark-theme .wishlist-sidebar-title {
                    color: #f8fafc !important;
                }
                [data-bs-theme="dark"] .sidebar-link,
                [data-theme="dark"] .sidebar-link,
                .dark-theme .sidebar-link {
                    color: #94a3b8 !important;
                }
                [data-bs-theme="dark"] .sidebar-link:hover,
                [data-theme="dark"] .sidebar-link:hover,
                .dark-theme .sidebar-link:hover {
                    background-color: #334155 !important;
                    color: #f8fafc !important;
                }
                [data-bs-theme="dark"] .active-sidebar-link,
                [data-theme="dark"] .active-sidebar-link,
                .dark-theme .active-sidebar-link {
                    background-color: #1e3a8a !important;
                    color: #93c5fd !important;
                }
                [data-bs-theme="dark"] .wishlist-item-card,
                [data-theme="dark"] .wishlist-item-card,
                .dark-theme .wishlist-item-card {
                    background-color: #1e293b !important;
                }
                [data-bs-theme="dark"] .wishlist-item-title,
                [data-theme="dark"] .wishlist-item-title,
                [data-bs-theme="dark"] .wishlist-item-price,
                [data-theme="dark"] .wishlist-item-price,
                .dark-theme .wishlist-item-title,
                .dark-theme .wishlist-item-price {
                    color: #f8fafc !important;
                }
                [data-bs-theme="dark"] .wishlist-sug-card,
                [data-theme="dark"] .wishlist-sug-card,
                .dark-theme .wishlist-sug-card {
                    background-color: #1e293b !important;
                    border-color: #334155 !important;
                }
                [data-bs-theme="dark"] .wishlist-sug-img-bg,
                [data-theme="dark"] .wishlist-sug-img-bg,
                .dark-theme .wishlist-sug-img-bg {
                    background-color: #0f172a !important;
                }
                [data-bs-theme="dark"] .bg-white,
                [data-theme="dark"] .bg-white,
                .dark-theme .bg-white {
                    background-color: transparent !important;
                }
                [data-bs-theme="dark"] .text-dark,
                [data-theme="dark"] .text-dark,
                .dark-theme .text-dark {
                    color: #f8fafc !important;
                }

                @media (max-width: 991px) {
                    .wishlist-sidebar {
                        padding: 12px 16px !important;
                    }
                    .wishlist-sidebar-title {
                        display: none !important;
                    }
                    .wishlist-sidebar .d-flex.flex-column {
                        flex-direction: row !important;
                        overflow-x: auto;
                        overflow-y: hidden;
                        white-space: nowrap;
                        gap: 8px;
                        padding-bottom: 4px;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: none;
                    }
                    .wishlist-sidebar .d-flex.flex-column::-webkit-scrollbar {
                        display: none;
                    }
                    .wishlist-sidebar .sidebar-link,
                    .wishlist-sidebar .active-sidebar-link {
                        display: inline-flex !important;
                        padding: 8px 16px !important;
                        border-radius: 20px !important;
                        font-size: 13px !important;
                        gap: 6px !important;
                        white-space: nowrap;
                    }
                    .wishlist-sidebar .active-sidebar-link {
                        background-color: #eff4ff !important;
                        color: #2b6cb0 !important;
                    }
                    .wishlist-sidebar .logout-link {
                        margin-top: 0 !important;
                    }
                }
            `}</style>
        </Container>
    );
}

const getDummySuggestions = () => {
    return [
        { id: "sug_1", name: "Striped T-Shirt", price: 349, offerprice: 199, image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200" },
        { id: "sug_2", name: "Girls Frock", price: 649, offerprice: 409, image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200" },
        { id: "sug_3", name: "Boys Shirt", price: 449, offerprice: 349, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200" },
        { id: "sug_4", name: "Casual Shoes", price: 999, offerprice: 609, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200" }
    ];
};

export default Wishlist;