import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { Heart, ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./BrowseCategory.css";
import HoverImageCarousel from "../components/HoverImageCarousel";
import DynamicRating from "../components/DynamicRating";
import Loading from "./Loading";
import { useRatings } from "../hooks/useRatings";

// Use sessionStorage cache to make Browse Categories lightning fast across hard reloads
const getCachedCats = () => { try { return JSON.parse(sessionStorage.getItem("sc_browse_cats")); } catch { return null; } };
const getCachedData = (name) => { try { return JSON.parse(sessionStorage.getItem("sc_browse_data_" + name)); } catch { return null; } };

const BrowseCategory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const selectedCatFromState = location.state?.selectedCategory;

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubCat, setSelectedSubCat] = useState("All");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProds, setLoadingProds] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const ratings = useRatings();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Scroll Position Restoration Logic
  useEffect(() => {
    const savedScrollPos = sessionStorage.getItem('browseScrollPosition');
    if (savedScrollPos) {
      const targetY = parseInt(savedScrollPos, 10);
      const maxAttempts = 20;
      let attempts = 0;

      const scrollInterval = setInterval(() => {
        attempts++;
        if (document.documentElement.scrollHeight >= targetY || attempts >= maxAttempts) {
          window.scrollTo({ top: targetY, behavior: 'auto' });
          if (document.documentElement.scrollTop >= targetY - 100 || attempts >= maxAttempts) {
            clearInterval(scrollInterval);
          }
        }
      }, 100);

      return () => clearInterval(scrollInterval);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('browseScrollPosition', window.scrollY.toString());
    };

    const timeoutId = setTimeout(() => {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 1. Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCats(true);

        const cachedCategories = getCachedCats();
        if (cachedCategories) {
          setCategories(cachedCategories);
          if (cachedCategories.length > 0) {
            if (selectedCatFromState) {
              const found = cachedCategories.find(c => c.name === selectedCatFromState);
              setActiveCategory(found || cachedCategories[0]);
            } else {
              setActiveCategory(cachedCategories[0]);
            }
          }
          setLoadingCats(false);
          // Don't return, allow background fetch to silently update
        }

        const catRef = collection(db, "category");
        const snap = await getDocs(catRef);
        const catList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort categories logically if needed
        catList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        // Cache it
        try { sessionStorage.setItem("sc_browse_cats", JSON.stringify(catList)); } catch (e) { }
        setCategories(catList);
        if (catList.length > 0) {
          if (selectedCatFromState) {
            const found = catList.find(c => c.name === selectedCatFromState);
            setActiveCategory(found || catList[0]);
          } else {
            setActiveCategory(catList[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoadingCats(false);
      }
    };

    fetchCategories();
  }, [selectedCatFromState]);

  // 2. Fetch Products and Subcategories when Active Category changes
  useEffect(() => {
    if (!activeCategory) return;

    const fetchCategoryData = async () => {
      setLoadingProds(true);
      setSelectedSubCat("All");
      setCurrentPage(1);
      try {
        const cached = getCachedData(activeCategory.name);
        // Use cached data if available
        if (cached) {
          setSubcategories(cached.subcategories);
          setProducts(cached.products);
          setFilteredProducts(cached.products);
          setLoadingProds(false);
          // Don't return, allow background fetch to silently update
        }

        // Fetch Subcategories and Products in parallel for faster loading
        const subCatRef = collection(db, "subcategory");
        const subQ = query(subCatRef, where("category", "==", activeCategory.name));

        const prodRef = collection(db, "products");
        const prodQ = query(prodRef, where("category", "==", activeCategory.name));

        const [subSnap, prodSnap] = await Promise.all([
          getDocs(subQ),
          getDocs(prodQ)
        ]);

        const subList = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        let prodList = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filter out inactive products
        prodList = prodList.filter((p) => p.isActive !== false);

        // Update Cache
        try {
          sessionStorage.setItem("sc_browse_data_" + activeCategory.name, JSON.stringify({ subcategories: subList, products: prodList }));
        } catch (e) { }

        setSubcategories(subList);
        setProducts(prodList);
        setFilteredProducts(prodList);
      } catch (err) {
        console.error("Error fetching category data:", err);
      } finally {
        setLoadingProds(false);
      }
    };

    fetchCategoryData();
  }, [activeCategory]);

  // Handle Subcategory Filter
  const handleSubCatClick = (subName) => {
    setSelectedSubCat(subName);
    setCurrentPage(1);
    if (subName === "All") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.subcategory === subName));
    }
  };

  // Helper to extract a valid image from a product
  const getProductImage = (product) => {
    if (!product) return "https://placehold.jp/300x300.png?text=No+Image";
    const imageKeys = ["images", "image", "imageUrl", "thumbnail", "photo"];
    for (const key of imageKeys) {
      if (typeof product[key] === "string" && product[key].startsWith("http")) return product[key];
      if (Array.isArray(product[key]) && product[key][0]?.startsWith("http")) return product[key][0];
    }
    for (const key in product) {
      if (typeof product[key] === "string" && product[key].startsWith("http")) return product[key];
    }
    return "https://placehold.jp/300x300.png?text=No+Image";
  };

  const handleAddToWishlist = async (e, prod) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error(t("pleaseLoginWishlist", "Please login to add to wishlist"), { position: "top-right", autoClose: 3000 });
      navigate('/login', { state: { from: '/browse-categories' } });
      return;
    }

    try {
      const wishlistRef = collection(db, "users", currentUser.uid, "favorites");
      const q = query(wishlistRef, where("productId", "==", prod.id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.info(t("alreadyInWishlist", "Product is already in your wishlist"), { position: "top-right", autoClose: 3000 });
        return;
      }

      const offerPrice = prod.offerprice || prod.price || 0;
      const originalPrice = prod.price || 0;

      const wishlistItem = {
        productId: prod.id,
        name: prod.name || prod.title || "Product",
        image: getProductImage(prod),
        price: Number(offerPrice),
        originalPrice: Number(originalPrice),
        category: prod.category || "",
        createdAt: serverTimestamp(),
        size: null,
        sellerId: prod.sellerId || "default_seller"
      };

      await addDoc(wishlistRef, wishlistItem);
      const productName = prod.name || prod.title || "Product";
      toast.success(`${productName} added to wishlist!`);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Failed to add to wishlist");
    }
  };

  if (loadingCats) {
    return <Loading />;
  }

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

      if (currentPage <= 3) end = 4;
      if (currentPage >= totalPages - 2) start = totalPages - 3;

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="browse-category-page-wrapper">

      {/* Mobile Header (Hidden on Desktop) */}
      <div className="mobile-browse-header d-lg-none">
        <button className="back-button" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 className="header-title">{activeCategory?.name || t("categories", "Categories")}</h2>
      </div>

      {/* Desktop Breadcrumb (Hidden on Mobile) */}
      <div className="desktop-breadcrumb d-none d-lg-flex container mt-3 mb-2">
        <Link to="/" className="text-decoration-none text-secondary"><i className="fas fa-home"></i> {t("homeLabel", "Home")}</Link>
        <i className="fas fa-chevron-right mx-2 text-secondary" style={{ fontSize: '0.8rem', marginTop: '4px' }}></i>
        <span className="text-secondary">{t("categories", "Categories")}</span>
        <i className="fas fa-chevron-right mx-2 text-secondary" style={{ fontSize: '0.8rem', marginTop: '4px' }}></i>
        <span className="fw-bold text-dark">{activeCategory?.name}</span>
      </div>

      <div className="browse-content-container container">
        {/* Left Sidebar - Categories */}
        <div className="category-sidebar-scroll">
          {categories.map((cat) => {
            const isActive = activeCategory?.id === cat.id;
            return (
              <div
                key={cat.id}
                className={`sidebar-cat-item ${isActive ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                <div className="cat-img-wrapper">
                  <img
                    src={cat.image || "https://placehold.jp/100x100.png?text=Cat"}
                    alt={cat.name}
                  />
                </div>
                <span className="cat-name">{cat.name}</span>
              </div>
            );
          })}
        </div>

        {/* Right Content - Products & Chips */}
        <div className="products-main-area">
          {/* Subcategory Chips */}
          {(subcategories.length > 0 || products.length > 0) && (
            <div className="subcat-chips-container">
              <button
                className={`subcat-chip ${selectedSubCat === "All" ? "active" : ""}`}
                onClick={() => handleSubCatClick("All")}
              >
                {selectedSubCat === "All" && <i className="fas fa-check"></i>} {t("all", "All")}
              </button>
              {subcategories.map(sub => (
                <button
                  key={sub.id}
                  className={`subcat-chip ${selectedSubCat === sub.name ? "active" : ""}`}
                  onClick={() => handleSubCatClick(sub.name)}
                >
                  {selectedSubCat === sub.name && <i className="fas fa-check"></i>} {sub.name}
                </button>
              ))}
            </div>
          )}

          {/* Scrollable Area for Products & Pagination */}
          <div className="products-scroll-area" style={{ overflowY: 'auto', flex: 1, paddingBottom: '20px' }}>
            {/* Products Grid */}
            <div className="browse-products-grid" style={{ overflowY: 'visible', paddingBottom: '0', display: 'grid' }}>
            {loadingProds ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="skeleton-card"></div>
              ))
            ) : paginatedProducts.length > 0 ? (
              paginatedProducts.map((prod) => {
                const price = Number(prod.price || 0);
                const offerPrice = Number(prod.offerprice || price);
                const discount = (price > offerPrice && price > 0) ? Math.round(((price - offerPrice) / price) * 100) : 0;

                const handleCart = (e) => {
                  e.stopPropagation();
                  dispatch(addToCart({
                    id: prod.id,
                    title: prod.name || "Product",
                    price: offerPrice,
                    image: getProductImage(prod),
                    quantity: 1,
                  }));
                  toast.success(`${prod.name || "Product"} ${t("addedToCart", "added to cart!")}`, {
                    position: "bottom-right",
                    autoClose: 2000,
                  });
                };

                return (
                  <div
                    key={prod.id}
                    className="browse-prod-card"
                    onClick={() => navigate(`/product/${prod.id}`)}
                  >
                    {discount > 0 && <span className="sc-discount-tag">{discount}% {t("off", "OFF")}</span>}
                    <div className="prod-img-box">
                      <HoverImageCarousel
                        images={prod.images}
                        fallbackImage={getProductImage(prod)}
                        alt={prod.name || "Product"}
                        style={{ height: "100%", width: '100%', objectFit: "contain" }}
                      />
                      <button
                        className="browse-wishlist-btn"
                        onClick={(e) => handleAddToWishlist(e, prod)}
                      >
                        <Heart size={16} color="#64748b" />
                      </button>
                    </div>
                    <div className="prod-info-box">
                      <h4 className="prod-title">{prod.name}</h4>
                      <DynamicRating 
                        productId={prod.id} 
                        initialRating={ratings[prod.id]?.average} 
                        initialReviews={ratings[prod.id]?.count} 
                      />
                      <div className="prod-price-row">
                        <span className="prod-offer-price">₹{offerPrice.toLocaleString()}</span>
                        {price > offerPrice && (
                          <span className="prod-original-price">₹{price.toLocaleString()}</span>
                        )}
                        {discount > 0 && (
                          <span className="sc-off">{discount}% {t("off", "OFF")}</span>
                        )}
                      </div>
                      <button
                        className="sc-add-btn"
                        onClick={handleCart}
                      >
                        <ShoppingCart size={14} /> {t("addToCart", "Add to Cart")}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-prods-found">
                <p>{t("noProductsFoundInCategory", "No products found in this category.")}</p>
              </div>
            )}
          </div>

          {/* Pagination Row */}
          {!loadingProds && totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4 mb-2 w-100">
              <nav>
                <ul className="pagination gap-1 gap-md-2 border-0 flex-wrap justify-content-center m-0">
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

          </div> {/* End of products-scroll-area */}

        </div>
      </div>
    </div>
  );
};

export default BrowseCategory;
