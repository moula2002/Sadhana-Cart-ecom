import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from "react-bootstrap";
import { FaStar, FaHeart, FaRegHeart, FaChevronRight, FaThLarge } from "react-icons/fa";
import { db, collection, getDocs, query, where, auth, addDoc, deleteDoc, doc } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { toast } from "react-toastify";
import Loading from "./Loading";
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

    // Scroll to top when page changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentPage]);

    // Handle authentication state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
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
    const [wishlist, setWishlist] = useState({}); // { [productId]: favDocId }

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
                toast.success(t("removedFromWishlist", "Removed '{{name}}' from wishlist", { name: p.name || p.title }).replace("{{name}}", p.name || p.title), { position: "bottom-right", autoClose: 2000 });
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
                toast.success(t("addedToWishlist", "Added '{{name}}' to wishlist!", { name: p.name || p.title }).replace("{{name}}", p.name || p.title), { position: "bottom-right", autoClose: 2000 });
            } catch (error) {
                console.error("Error adding to wishlist:", error);
                toast.error(t("failedToAddToWishlist", "Failed to add to wishlist"));
            }
        }
    };

    return (
        <Container fluid className="py-4 px-lg-5 mt-3">
            <div className="d-flex align-items-center mb-4 text-muted small">
                <Link to="/" className="text-decoration-none text-muted">{t("homeLabel", "Home")}</Link>
                <FaChevronRight className="mx-2" size={10} />
                {categoryName && categoryName.toLowerCase().includes("fashion") && categoryName.toLowerCase() !== "fashion" && (
                    <>
                        <span className="text-muted">{t("fashion", "Fashion")}</span>
                        <FaChevronRight className="mx-2" size={10} />
                    </>
                )}
                <span className="text-dark fw-semibold">{categoryName}</span>
            </div>

            <Row className="g-4">
                {/* Left Sidebar Filter Section */}
                <Col lg={3}>
                    <Card className="border shadow-sm p-3" style={{ borderRadius: '16px', position: 'sticky', top: '100px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                            <h5 className="fw-bold mb-0 text-dark">{t("filters", "Filters")}</h5>
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
                    </Card>
                </Col>

                {/* Right Product Grid & Sorting Section */}
                <Col lg={9}>
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

                        {/* Sort Dropdown */}
                        <div className="d-flex align-items-center gap-2">
                            <span className="text-muted small no-wrap">{t("sortBy", "Sort by:")}</span>
                            <Form.Select
                                size="sm"
                                className="rounded-3 border shadow-sm px-3"
                                style={{ width: '180px', fontWeight: '500' }}
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="popularity">{t("popularity", "Popularity")}</option>
                                <option value="price_low_high">{t("priceLowToHigh", "Price: Low to High")}</option>
                                <option value="price_high_low">{t("priceHighToLow", "Price: High to Low")}</option>
                                <option value="customer_rating">{t("customerRating", "Customer Rating")}</option>
                            </Form.Select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <Loading minHeight="200px" message={t("loadingProducts", "Loading products...")} />
                        </div>
                    ) : filteredAndSortedProducts.length === 0 ? (
                        <Alert variant="info" className="rounded-3 border-0 shadow-sm p-4 text-center">
                            {t("noProductsMatchFilters", "No products match your selected filters. Please try clearing some filters.")}
                        </Alert>
                    ) : (
                        <>
                            {/* Product Grid */}
                            <Row className="g-4 row-cols-2 row-cols-sm-2 row-cols-md-3 row-cols-lg-4">
                                {paginatedProducts.map((p) => {
                                    const finalPrice = Number(p.offerprice || p.price || 0);
                                    const originalPrice = p.price && p.offerprice ? Number(p.price) : Math.round(finalPrice * 1.5);
                                    const discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);

                                    return (
                                        <Col key={p.id}>
                                            <Card className="h-100 border shadow-sm p-2 product-card-hover" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                                                {/* Image Container with Badges */}
                                                <div className="d-flex justify-content-center align-items-center p-3 position-relative rounded-3" style={{ height: "200px", backgroundColor: '#f8fafc' }}>
                                                    {/* Discount Badge */}
                                                    {discountPercent > 0 && (
                                                        <Badge bg="danger" className="position-absolute top-0 start-0 m-2 px-2.5 py-1 rounded" style={{ fontSize: '0.7rem', fontWeight: '700' }}>
                                                            {discountPercent}% {t("off", "OFF")}
                                                        </Badge>
                                                    )}
                                                    {/* Heart/Wishlist Button */}
                                                    <button
                                                        onClick={() => toggleWishlist(p)}
                                                        className="btn bg-white rounded-circle shadow-sm position-absolute top-0 end-0 m-2 d-flex align-items-center justify-content-center border-0"
                                                        style={{ width: '32px', height: '32px' }}
                                                    >
                                                        {wishlist[p.id] ? <FaHeart className="text-danger" size={14} /> : <FaRegHeart className="text-secondary" size={14} />}
                                                    </button>

                                                    <Card.Img
                                                        src={getProductImage(p)}
                                                        style={{ height: "160px", width: 'auto', objectFit: "contain" }}
                                                        className="cursor-pointer"
                                                        onClick={() => navigate(`/product/${p.id}`)}
                                                    />
                                                </div>

                                                {/* Details */}
                                                <Card.Body className="p-3 bg-white d-flex flex-column justify-content-between">
                                                    <div>
                                                        <Card.Title
                                                            className="fw-bold mb-1 text-dark cursor-pointer"
                                                            style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: '800', lineHeight: '1.35', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.5em' }}
                                                            onClick={() => navigate(`/product/${p.id}`)}
                                                        >
                                                            {p.name || p.title}
                                                        </Card.Title>

                                                        {/* Pricing */}
                                                        <div className="d-flex align-items-baseline gap-2 mb-2">
                                                            <span className="fw-bold" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                                                                ₹{finalPrice.toLocaleString()}
                                                            </span>
                                                            {originalPrice > finalPrice && (
                                                                <span className="text-muted text-decoration-line-through" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                                    ₹{originalPrice.toLocaleString()}
                                                                </span>
                                                            )}
                                                            {discountPercent > 0 && (
                                                                <span className="fw-bold" style={{ fontSize: '0.78rem', color: '#059669' }}>
                                                                    {discountPercent}% {t("off", "off")}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Rating */}
                                                        <div className="d-flex align-items-center gap-1.5 mb-3 text-warning" style={{ fontSize: '12px', fontWeight: '600' }}>
                                                            <FaStar />
                                                            <span className="text-dark">{(p.rating?.rate || 4.5).toFixed(1)}</span>
                                                            <span className="text-muted font-normal">({p.rating?.count || 128})</span>
                                                        </div>
                                                    </div>

                                                    {/* Add to Cart button */}
                                                    <button
                                                        className="sc-add-btn"
                                                        onClick={() => {
                                                            dispatch(addToCart({
                                                                id: p.id,
                                                                title: p.name || p.title,
                                                                price: finalPrice,
                                                                image: getProductImage(p),
                                                                quantity: 1,
                                                            sellerId: p.sellerId || "default_seller"
                                                                }));
                                                                toast.success(t("addedToCartMsg", "Added {{name}} to cart!", { name: p.name || p.title }).replace("{{name}}", p.name || p.title), { position: "bottom-right", autoClose: 2000 });
                                                            }}
                                                        >
                                                            <i className="fas fa-shopping-cart me-1"></i> {t("addToCart", "Add to Cart")}
                                                        </button>
                                                    </Card.Body>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>

                            {/* Pagination Row */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-5 mb-4">
                                    <nav>
                                        <ul className="pagination gap-2 border-0">
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

            <style jsx>{`
                .product-card-hover {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .product-card-hover:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important;
                }
                .add-to-cart-btn:hover {
                    background-color: #2563eb !important;
                    color: #fff !important;
                }
                .cursor-pointer {
                    cursor: pointer;
                }
                .pagination .page-link:focus {
                    box-shadow: none;
                }
            `}</style>
        </Container>
    );
};



export default ProductListingPage;
