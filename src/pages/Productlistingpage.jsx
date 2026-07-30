import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge, Offcanvas, Dropdown } from "react-bootstrap";
import { FaStar, FaHeart, FaRegHeart, FaChevronRight, FaThLarge, FaShoppingCart, FaFilter } from "react-icons/fa";
import { db, collection, getDocs, query, where, auth, addDoc, deleteDoc, doc } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { toast } from "react-toastify";
import Loading from "./Loading";
import SkeletonGrid from "../components/SkeletonGrid";
import HoverImageCarousel from "../components/HoverImageCarousel";
import { useTranslation } from "react-i18next";

const ProductListingPage = () => {
    const { t } = useTranslation();
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryName, setCategoryName] = useState("");
    const [subcategories, setSubcategories] = useState([]);

    // Filters States
    const [selectedSubcategories, setSelectedSubcategories] = useState([]);
    const [selectedAgeGroups, setSelectedAgeGroups] = useState([]);
    const [priceRange, setPriceRange] = useState(200000);
    const [appliedPriceRange, setAppliedPriceRange] = useState(200000);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [sortBy, setSortBy] = useState("popularity");
    const [currentPage, setCurrentPage] = useState(1);
    const [currentUser, setCurrentUser] = useState(null);
    const itemsPerPage = 12;

    // Mobile Filter Drawer State
    const [showMobileFilter, setShowMobileFilter] = useState(false);

    const EXCHANGE_RATE = 1;

    // Helper to get image
    const getProductImage = (p) => {
        if (!p) return "https://via.placeholder.com/300";
        if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
        if (p.image) return p.image;
        return "https://via.placeholder.com/300";
    };

    // Fetch products & categories
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            let currentCategory = "";

            if (categoryId) {
                const catRef = collection(db, "category");
                const catQ = query(catRef, where("__name__", "==", categoryId));
                const snap = await getDocs(catQ);
                if (!snap.empty) {
                    currentCategory = snap.docs[0].data().name;
                } else {
                    const nameToTry = categoryId.replace(/-/g, ' ');
                    const catQByName = query(catRef, where("name", "==", nameToTry));
                    const snapByName = await getDocs(catQByName);
                    if (!snapByName.empty) {
                        currentCategory = snapByName.docs[0].data().name;
                    }
                }
            }

            if (!currentCategory) {
                currentCategory = categoryId ? categoryId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : "Kids Fashion";
            }

            setCategoryName(currentCategory);

            // Fetch products using merged strategies (categoryId vs Category Name)
            const prodRef = collection(db, "products");
            let list = [];

            if (categoryId) {
                const q1 = query(prodRef, where("categoryId", "==", categoryId));
                const s1 = await getDocs(q1);
                list = s1.docs.map((d) => ({ id: d.id, ...d.data() }));

                if (currentCategory) {
                    const q2 = query(prodRef, where("category", "==", currentCategory));
                    const s2 = await getDocs(q2);
                    const listByName = s2.docs.map((d) => ({ id: d.id, ...d.data() }));

                    const existingIds = new Set(list.map(p => p.id));
                    listByName.forEach(p => {
                        if (!existingIds.has(p.id)) list.push(p);
                    });
                }
            } else {
                const qDefault = query(prodRef);
                const sDefault = await getDocs(qDefault);
                list = sDefault.docs.map((d) => ({ id: d.id, ...d.data() }));
            }

            // Map details & format
            let formattedList = list.map(doc => {
                const priceValue = (doc.price || 0) * EXCHANGE_RATE;
                return {
                    id: doc.id,
                    ...doc,
                    priceINR: priceValue.toFixed(0),
                    priceValue,
                    rating: doc.rating || { rate: 4.5, count: 128 }
                };
            }).filter(p => p.isActive !== false);

            setProducts(formattedList);

            // Get subcategories
            const uniqueSub = [...new Set(formattedList.map(p => p.subcategory || p.subCategory).filter(Boolean))];
            setSubcategories(uniqueSub);

        } catch (err) {
            console.error("Error fetching listing products:", err);
        } finally {
            setLoading(false);
        }
    }, [categoryId]);

    useEffect(() => {
        fetchData();
        setCurrentPage(1);
    }, [categoryId, fetchData]);

    // Scroll to top when page changes, but only if not just mounted/restoring
    useEffect(() => {
        // Prevent scrolling to top if we are just loading or restoring scroll
        if (!loading && sessionStorage.getItem('categoryScrollPosition') === null) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [currentPage]);

    // Handle authentication state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    // Scroll Position Restoration Logic
    useEffect(() => {
        const savedScrollPos = sessionStorage.getItem('categoryScrollPosition');
        if (savedScrollPos) {
            const targetY = parseInt(savedScrollPos, 10);
            const maxAttempts = 20;
            let attempts = 0;
            
            const scrollInterval = setInterval(() => {
                attempts++;
                if (document.documentElement.scrollHeight >= targetY || attempts >= maxAttempts) {
                    window.scrollTo({ top: targetY, behavior: 'instant' });
                    if (document.documentElement.scrollTop >= targetY - 100 || attempts >= maxAttempts) {
                        clearInterval(scrollInterval);
                    }
                }
            }, 100);
            
            return () => clearInterval(scrollInterval);
        }
    }, [categoryId]);

    useEffect(() => {
        const handleScroll = () => {
            sessionStorage.setItem('categoryScrollPosition', window.scrollY.toString());
        };
        
        const timeoutId = setTimeout(() => {
            window.addEventListener('scroll', handleScroll, { passive: true });
        }, 500);
        
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Fetch user wishlist mapping from Firestore
    useEffect(() => {
        if (!currentUser) {
            setWishlist({});
            return;
        }

        const fetchUserWishlist = async () => {
            try {
                const snapshot = await getDocs(
                    collection(db, "users", currentUser.uid, "favorites")
                );
                const mapping = {};
                snapshot.docs.forEach((doc) => {
                    const data = doc.data();
                    if (data.productId) {
                        mapping[data.productId] = doc.id;
                    }
                });
                setWishlist(mapping);
            } catch (error) {
                console.error("Error fetching user wishlist:", error);
            }
        };

        fetchUserWishlist();
    }, [currentUser]);

    // Handle checkboxes
    const handleSubcategoryChange = (sub) => {
        setSelectedSubcategories(prev =>
            prev.includes(sub) ? prev.filter(x => x !== sub) : [...prev, sub]
        );
        setCurrentPage(1);
    };

    const handleAgeGroupChange = (age) => {
        setSelectedAgeGroups(prev =>
            prev.includes(age) ? prev.filter(x => x !== age) : [...prev, age]
        );
        setCurrentPage(1);
    };

    const handleBrandChange = (brand) => {
        setSelectedBrands(prev =>
            prev.includes(brand) ? prev.filter(x => x !== brand) : [...prev, brand]
        );
        setCurrentPage(1);
    };

    // Filter & Sort products
    const filteredAndSortedProducts = useMemo(() => {
        let result = [...products];

        // Filter by Subcategories
        if (selectedSubcategories.length > 0) {
            result = result.filter(p => selectedSubcategories.includes(p.subcategory || p.subCategory));
        }

        // Filter by Age Groups
        if (selectedAgeGroups.length > 0) {
            result = result.filter(p => selectedAgeGroups.includes(p.ageGroup || "4-8 Years"));
        }

        // Filter by Price
        result = result.filter(p => Number(p.offerprice || p.price || 0) <= appliedPriceRange);

        // Filter by Brands
        if (selectedBrands.length > 0) {
            result = result.filter(p => selectedBrands.includes(p.brand || "Generic"));
        }

        // Sorting
        if (sortBy === "popularity") {
            result.sort((a, b) => (b.rating?.count || 0) - (a.rating?.count || 0));
        } else if (sortBy === "price_low_high") {
            result.sort((a, b) => Number(a.offerprice || a.price || 0) - Number(b.offerprice || b.price || 0));
        } else if (sortBy === "price_high_low") {
            result.sort((a, b) => Number(b.offerprice || b.price || 0) - Number(a.offerprice || a.price || 0));
        } else if (sortBy === "customer_rating") {
            result.sort((a, b) => (b.rating?.rate || 0) - (a.rating?.rate || 0));
        }

        return result;
    }, [products, selectedSubcategories, selectedAgeGroups, appliedPriceRange, selectedBrands, sortBy]);

    // Pagination logic
    const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

    const getVisiblePages = () => {
        const pages = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 3) {
                end = 4;
            }
            if (currentPage >= totalPages - 2) {
                start = totalPages - 3;
            }

            if (start > 2) {
                pages.push("...");
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < totalPages - 1) {
                pages.push("...");
            }

            pages.push(totalPages);
        }

        return pages;
    };

    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedProducts.slice(start, start + itemsPerPage);
    }, [filteredAndSortedProducts, currentPage]);

    // Unique dynamic brands list
    const allBrands = useMemo(() => {
        return [...new Set(products.map(p => p.brand || "Generic"))];
    }, [products]);

    // Wishlist Toggle Integration with Firestore
    const [wishlist, setWishlist] = useState({});

    const toggleWishlist = async (p) => {
        if (!currentUser) {
            toast.error(t("loginToWishlist", "Please log in to add items to your wishlist."), { position: "top-center" });
            navigate("/login", { state: { from: window.location.pathname } });
            return;
        }

        const pid = p.id;
        const isFavorited = !!wishlist[pid];
        const finalPrice = Number(p.offerprice || p.price || 0);
        const originalPrice = p.price && p.offerprice ? Number(p.price) : Math.round(finalPrice * 1.5);

        if (isFavorited) {
            const favId = wishlist[pid];
            try {
                await deleteDoc(doc(db, "users", currentUser.uid, "favorites", favId));
                setWishlist(prev => {
                    const copy = { ...prev };
                    delete copy[pid];
                    return copy;
                });
                toast.success(t("removedFromWishlist", "Removed '{{name}}' from wishlist", { name: p.name || p.title }).replace("{{name}}", p.name || p.title));
            } catch (error) {
                console.error("Error removing from wishlist:", error);
                toast.error(t("failedToRemoveFromWishlist", "Failed to remove from wishlist"));
            }
        } else {
            try {
                const favRef = collection(db, "users", currentUser.uid, "favorites");
                const newDoc = await addDoc(favRef, {
                    productId: pid,
                    name: p.name || p.title,
                    price: finalPrice,
                    originalPrice: originalPrice,
                    image: p.image || (Array.isArray(p.images) && p.images[0]) || "https://via.placeholder.com/150",
                    category: p.category || "",
                    sellerId: p.sellerId || "default_seller",
                    createdAt: new Date().toISOString()
                });
                setWishlist(prev => ({
                    ...prev,
                    [pid]: newDoc.id
                }));
                toast.success(t("addedToWishlist", "Added '{{name}}' to wishlist!", { name: p.name || p.title }).replace("{{name}}", p.name || p.title));
            } catch (error) {
                console.error("Error adding to wishlist:", error);
                toast.error(t("failedToAddToWishlist", "Failed to add to wishlist"));
            }
        }
    };

    // Shared filter UI for both desktop sidebar and mobile offcanvas
    const filterUI = (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                <h5 className="fw-bold mb-0 text-dark d-none d-lg-block">{t("filters", "Filters")}</h5>
                <button
                    className="btn btn-sm btn-link text-primary text-decoration-none p-0 fw-bold"
                    onClick={() => {
                        setSelectedSubcategories([]);
                        setSelectedAgeGroups([]);
                        setPriceRange(200000);
                        setAppliedPriceRange(200000);
                        setSelectedBrands([]);
                    }}
                >
                    {t("clearAll", "Clear All")}
                </button>
            </div>

            {/* Category/Subcategory Filter */}
            <div className="mb-4">
                <h6 className="fw-bold text-dark mb-3">{t("categoryLabel", "Category")}</h6>
                {subcategories.map((sub, idx) => (
                    <Form.Check
                        key={idx}
                        type="checkbox"
                        id={`sub-${idx}`}
                        label={`${sub}`}
                        checked={selectedSubcategories.includes(sub)}
                        onChange={() => handleSubcategoryChange(sub)}
                        className="mb-2 text-muted small cursor-pointer"
                    />
                ))}
            </div>

            {/* Age Group Filter */}
            <div className="mb-4">
                <h6 className="fw-bold text-dark mb-3">{t("ageGroup", "Age Group")}</h6>
                {["0-2 Years", "2-4 Years", "4-8 Years", "8-12 Years", "12+ Years"].map((age, idx) => (
                    <Form.Check
                        key={idx}
                        type="checkbox"
                        id={`age-${idx}`}
                        label={age}
                        checked={selectedAgeGroups.includes(age)}
                        onChange={() => handleAgeGroupChange(age)}
                        className="mb-2 text-muted small cursor-pointer"
                    />
                ))}
            </div>

            {/* Price Slider */}
            <div className="mb-4">
                <h6 className="fw-bold text-dark mb-2">{t("price", "Price")}</h6>
                <div className="text-muted small mb-2 d-flex justify-content-between">
                    <span>₹0</span>
                    <span>₹{priceRange.toLocaleString()}</span>
                </div>
                <Form.Range
                    min={0}
                    max={200000}
                    step={5000}
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="mb-3"
                />
                <Button
                    variant="outline-primary"
                    size="sm"
                    className="w-100 rounded-pill fw-bold"
                    onClick={() => setAppliedPriceRange(priceRange)}
                >
                    {t("apply", "Apply")}
                </Button>
            </div>

            {/* Brand Filter */}
            <div className="mb-3">
                <h6 className="fw-bold text-dark mb-3">{t("brand", "Brand")}</h6>
                {allBrands.slice(0, 6).map((brand, idx) => (
                    <Form.Check
                        key={idx}
                        type="checkbox"
                        id={`brand-${idx}`}
                        label={brand}
                        checked={selectedBrands.includes(brand)}
                        onChange={() => handleBrandChange(brand)}
                        className="mb-2 text-muted small cursor-pointer"
                    />
                ))}
                {allBrands.length > 6 && (
                    <span className="text-primary small fw-bold cursor-pointer mt-2 d-block">+ {t("viewMore", "View More")}</span>
                )}
            </div>
        </>
    );

    return (
        <Container fluid className="py-4 px-lg-5 mt-3">
            <div className="d-flex align-items-center mb-4 small" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                <Link to="/" className="text-decoration-none text-secondary custom-breadcrumb-link" style={{ transition: 'color 0.3s' }}>
                    {t("homeLabel", "Home")}
                </Link>
                <FaChevronRight className="mx-2 text-muted opacity-50" size={10} />
                {categoryName && categoryName.toLowerCase().includes("fashion") && categoryName.toLowerCase() !== "fashion" && (
                    <>
                        <span className="text-secondary">{t("fashionTitle", "Fashion")}</span>
                        <FaChevronRight className="mx-2 text-muted opacity-50" size={10} />
                    </>
                )}
                <span className="text-primary fw-semibold px-3 py-1 rounded-pill shadow-sm" style={{ background: 'rgba(13, 110, 253, 0.1)', color: '#0d6efd' }}>
                    {categoryName}
                </span>
            </div>

            <Row className="g-4">
                {/* Left Sidebar Filter Section - Desktop Only */}
                <Col lg={3} className="d-none d-lg-block">
                    <Card className="border shadow-sm p-3" style={{ borderRadius: '16px', position: 'sticky', top: '100px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {filterUI}
                    </Card>
                </Col>

                {/* Mobile Filter Offcanvas */}
                <Offcanvas show={showMobileFilter} onHide={() => setShowMobileFilter(false)} placement="start" className="d-lg-none">
                    <Offcanvas.Header closeButton>
                        <Offcanvas.Title className="fw-bold">{t("filters", "Filters")}</Offcanvas.Title>
                    </Offcanvas.Header>
                    <Offcanvas.Body>
                        {filterUI}
                    </Offcanvas.Body>
                </Offcanvas>

                {/* Right Product Grid & Sorting Section */}
                <Col lg={9} xs={12}>
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                        <div>
                            <h2 className="fw-bold text-dark mb-1">{categoryName}</h2>
                            <p className="text-muted small mb-0">
                                {t("showingProducts", "Showing {{start}}-{{end}} of {{total}} products", {
                                    start: filteredAndSortedProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0,
                                    end: Math.min(currentPage * itemsPerPage, filteredAndSortedProducts.length),
                                    total: filteredAndSortedProducts.length
                                }).replace("{{start}}", filteredAndSortedProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0)
                                    .replace("{{end}}", Math.min(currentPage * itemsPerPage, filteredAndSortedProducts.length))
                                    .replace("{{total}}", filteredAndSortedProducts.length)}
                            </p>
                        </div>

                        {/* Mobile Filter Button & Sort Dropdown */}
                        <div className="d-flex align-items-center gap-3 w-100-mobile justify-content-between">
                            <Button
                                variant="outline-primary"
                                className="d-lg-none d-flex align-items-center gap-2 rounded-3 fw-bold"
                                onClick={() => setShowMobileFilter(true)}
                                size="sm"
                            >
                                <FaFilter /> {t("filters", "Filters")}
                            </Button>

                            <div className="d-flex align-items-center gap-2 ms-auto">
                                <span className="text-muted small no-wrap d-none d-sm-inline">{t("sortBy", "Sort by:")}</span>
                                <Dropdown align="end">
                                    <Dropdown.Toggle
                                        variant="white"
                                        size="sm"
                                        className="rounded-3 border shadow-sm px-3 d-flex align-items-center justify-content-between"
                                        style={{ minWidth: '140px', fontWeight: '500' }}
                                    >
                                        {sortBy === "popularity" ? t("popularity", "Popularity") :
                                            sortBy === "price_low_high" ? t("priceLowToHigh", "Price: Low to High") :
                                                sortBy === "price_high_low" ? t("priceHighToLow", "Price: High to Low") :
                                                    t("customerRating", "Customer Rating")}
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu className="border-0 shadow-lg rounded-3" style={{ minWidth: '160px' }}>
                                        <Dropdown.Item onClick={() => setSortBy("popularity")} className={sortBy === "popularity" ? "fw-bold text-primary" : ""}>
                                            {t("popularity", "Popularity")}
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => setSortBy("price_low_high")} className={sortBy === "price_low_high" ? "fw-bold text-primary" : ""}>
                                            {t("priceLowToHigh", "Price: Low to High")}
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => setSortBy("price_high_low")} className={sortBy === "price_high_low" ? "fw-bold text-primary" : ""}>
                                            {t("priceHighToLow", "Price: High to Low")}
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => setSortBy("customer_rating")} className={sortBy === "customer_rating" ? "fw-bold text-primary" : ""}>
                                            {t("customerRating", "Customer Rating")}
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-2 w-100">
                            <SkeletonGrid count={8} />
                        </div>
                    ) : filteredAndSortedProducts.length === 0 ? (
                        <Alert variant="info" className="rounded-3 border-0 shadow-sm p-4 text-center">
                            {t("noProductsMatchFilters", "No products match your selected filters. Please try clearing some filters.")}
                        </Alert>
                    ) : (
                        <>
                            {/* Product Grid - Responsive via CSS */}
                            <div className="product-listing-grid">
                                {paginatedProducts.map((p) => {
                                    const finalPrice = Number(p.offerprice || p.price || 0);
                                    const originalPrice = p.price && p.offerprice ? Number(p.price) : Math.round(finalPrice * 1.5);
                                    const discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);

                                    return (
                                        <div key={p.id}>
                                            <Card className="h-100 border shadow-sm p-2 product-card-hover" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                                                {/* Image Container with Badges */}
                                                <div className="d-flex justify-content-center align-items-center p-3 position-relative rounded-3 product-img-wrapper" style={{ height: "200px" }}>
                                                    {/* Discount Badge */}
                                                    {discountPercent > 0 && (
                                                        <Badge bg="danger" className="position-absolute top-0 start-0 m-2 px-2.5 py-1 rounded" style={{ fontSize: '0.7rem', fontWeight: '700', zIndex: 10 }}>
                                                            {discountPercent}% {t("off", "OFF")}
                                                        </Badge>
                                                    )}
                                                    {/* Heart/Wishlist Button */}
                                                    <button
                                                        onClick={() => toggleWishlist(p)}
                                                        className="btn bg-white rounded-circle shadow-sm position-absolute top-0 end-0 m-2 d-flex align-items-center justify-content-center border-0"
                                                        style={{ width: '32px', height: '32px', zIndex: 10 }}
                                                    >
                                                        {wishlist[p.id] ? <FaHeart className="text-danger" size={14} /> : <FaRegHeart className="text-secondary" size={14} />}
                                                    </button>

                                                    <HoverImageCarousel
                                                        images={p.images}
                                                        fallbackImage={getProductImage(p)}
                                                        alt={p.name || p.title || "Product"}
                                                        style={{ height: "160px", width: 'auto', objectFit: "contain" }}
                                                        onClick={() => navigate(`/product/${p.id}`)}
                                                    />
                                                </div>

                                                {/* Details */}
                                                <Card.Body className="d-flex flex-column p-2 p-md-3">
                                                    <Card.Title className="fw-bold mb-2 product-title" style={{ fontSize: '0.95rem', minHeight: '2.8rem' }} onClick={() => navigate(`/product/${p.id}`)}>
                                                        {p.name || p.title || t("productNameFallback", "Product Name")}
                                                    </Card.Title>

                                                    <div className="d-flex align-items-center flex-wrap mb-3">
                                                        <span className="fw-bold product-price fs-5 me-2">₹{finalPrice.toLocaleString()}</span>
                                                        {discountPercent > 0 && (
                                                            <>
                                                                <span className="text-muted text-decoration-line-through small me-2">₹{originalPrice.toLocaleString()}</span>
                                                                <span className="fw-bold" style={{ color: '#059669', fontSize: '0.85rem' }}>{discountPercent}% off</span>
                                                            </>
                                                        )}
                                                    </div>

                                                    <button
                                                        className="bs-add-btn w-100 mt-auto"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            dispatch(addToCart({
                                                                id: p.id,
                                                                title: p.name || p.title,
                                                                price: finalPrice,
                                                                image: getProductImage(p),
                                                                quantity: 1,
                                                            }));
                                                            toast.success(t("addedToCartMsg", "Added {{name}} to cart!", { name: p.name || p.title }).replace("{{name}}", p.name || p.title));
                                                        }}
                                                    >
                                                        <FaShoppingCart className="me-2" size={14} /> <span className="d-none d-sm-inline">{t("addToCart", "Add to Cart")}</span><span className="d-sm-none">{t("add", "Add")}</span>
                                                    </button>
                                                </Card.Body>
                                            </Card>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination Row */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-5 mb-4">
                                    <nav>
                                        <ul className="pagination gap-1 gap-md-2 border-0 flex-wrap justify-content-center">
                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                <button className="page-link rounded-circle border d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                                                    &lt;
                                                </button>
                                            </li>
                                            {getVisiblePages().map((p, i) => {
                                                if (p === "...") {
                                                    return (
                                                        <li key={`ellipsis-${i}`} className="page-item disabled">
                                                            <span className="page-link rounded-circle border-0 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', backgroundColor: 'transparent', color: '#6b7280' }}>
                                                                ...
                                                            </span>
                                                        </li>
                                                    );
                                                }
                                                return (
                                                    <li key={p} className={`page-item ${currentPage === p ? 'active' : ''}`}>
                                                        <button
                                                            className="page-link rounded-circle border d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: '40px',
                                                                height: '40px',
                                                                backgroundColor: currentPage === p ? '#2563eb' : '#fff',
                                                                color: currentPage === p ? '#fff' : '#4b5563',
                                                                borderColor: currentPage === p ? '#2563eb' : '#e5e7eb'
                                                            }}
                                                            onClick={() => setCurrentPage(p)}
                                                        >
                                                            {p}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                <button className="page-link rounded-circle border d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
                                                    &gt;
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            )}
                        </>
                    )}
                </Col>
            </Row>

            <style>{`
                .product-card-hover {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .product-card-hover:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important;
                }
                .cursor-pointer {
                    cursor: pointer;
                }
                .pagination .page-link:focus {
                    box-shadow: none;
                }
                
                /* Responsive Grid for Product Listing */
                .product-listing-grid {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 1rem;
                }
                
                @media (max-width: 1400px) {
                    .product-listing-grid {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }
                
                @media (max-width: 1200px) {
                    .product-listing-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }
                
                @media (max-width: 992px) {
                    .product-listing-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }
                
                @media (max-width: 768px) {
                    .product-listing-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 0.75rem;
                    }
                }

                @media (max-width: 480px) {
                    .w-100-mobile {
                        width: 100%;
                    }
                }
                
                /* Dark Mode Product Card Polishing */
                .product-img-wrapper {
                    background-color: #f8fafc;
                }
                .product-title {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .product-title, .product-price {
                    color: #212529;
                }

                .dark-theme .product-img-wrapper,
                [data-theme="dark"] .product-img-wrapper {
                    background-color: #ffffff !important; /* Keep white for product images */
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .dark-theme .product-title,
                [data-theme="dark"] .product-title,
                .dark-theme .product-price,
                [data-theme="dark"] .product-price {
                    color: #f1f5f9 !important;
                }
                .dark-theme .card,
                [data-theme="dark"] .card {
                    background-color: #1e293b !important;
                    border-color: rgba(255,255,255,0.1) !important;
                }
            `}</style>
        </Container>
    );
};

export default ProductListingPage;
